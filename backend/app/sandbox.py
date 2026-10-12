"""Sandboxed code execution, ported from HonorRoll's lib/sandbox.js.

No Docker-in-Docker, no cgroups/isolate — runs the submission as a plain
subprocess in this same container, fenced in by shell `ulimit` (memory/CPU/
process caps) plus an unprivileged OS user when running as root. Weaker
filesystem/network isolation than a real container-per-submission judge
(Judge0), but it has no cgroup-version dependency, which is what broke
Judge0 under Docker Desktop's cgroup-v2-only VM. Good enough for
contest-level submissions; not a defense against a deliberately adversarial
sandbox-escape attempt.
"""

import os
import shlex
import shutil
import subprocess
import sys
import tempfile
import threading
import uuid
from pathlib import Path

from app.models import SubmissionStatus

TEMP_DIR = Path(tempfile.gettempdir()) / "codehaunt-sandbox"
TEMP_DIR.mkdir(exist_ok=True)

IS_MAC = sys.platform == "darwin"
IS_WINDOWS = os.name == "nt"

# Dedicated low-privilege user submissions actually run as, when this
# process is root (true inside the deployed container, never true for local
# `uvicorn` run as your own user) — see Dockerfile's `sandbox` user.
SANDBOX_UID = int(os.environ.get("SANDBOX_UID", 1001))
SANDBOX_GID = int(os.environ.get("SANDBOX_GID", 1001))
_CAN_DROP_PRIVILEGES = hasattr(os, "getuid") and os.getuid() == 0

# Caps how many submissions run at once on this instance, so a burst of
# submissions doesn't spawn dozens of compilers/interpreters simultaneously
# and starve the box.
_SANDBOX_CONCURRENCY = int(os.environ.get("SANDBOX_CONCURRENCY", 4))
_sandbox_semaphore = threading.Semaphore(_SANDBOX_CONCURRENCY)

LANGUAGE_CONFIG = {
    "python3": {
        "filename": "main.py",
        "build_cmd": None,
        "run_cmd": ["python3", "main.py"],
    },
    "c": {
        "filename": "main.c",
        "build_cmd": ["gcc", "main.c", "-o", "program"],
        "run_cmd": ["./program"],
    },
    "cpp": {
        "filename": "main.cpp",
        "build_cmd": ["g++", "main.cpp", "-o", "program"],
        "run_cmd": ["./program"],
    },
    "java": {
        "filename": "Main.java",
        # -Xmx caps the JVM's actual heap directly — ulimit -v (virtual
        # address space) is NOT used for Java: the JVM reserves huge virtual
        # address ranges on startup regardless of real usage, so a tight -v
        # limit kills it before it can even print an error.
        "build_cmd": ["javac", "-J-Xmx256m", "Main.java"],
        "run_cmd": ["java", "-Xmx256m", "Main"],
        "no_virtual_mem_limit": True,
    },
}


def normalize_output(text: str | None) -> str:
    return (text or "").replace("\r\n", "\n").strip()


def _windows_argv(cwd: Path, cmd: list[str]) -> list[str]:
    """No `sh`/`ulimit` on native Windows: run the command directly, using this
    interpreter for python3 and the .exe that gcc/g++ emit for ./program."""
    if cmd[0] == "python3":
        return [sys.executable, *cmd[1:]]
    if cmd[0] == "./program":
        return [str(cwd / "program.exe")]
    return cmd


def _run_limited(cwd: Path, mem_kb: int, cpu_sec: float, cmd: list[str], stdin_data: str, skip_vmem: bool):
    kwargs = {}
    if IS_WINDOWS:
        # Dev-only path: no memory/process caps are available here, only the timeout below.
        argv = _windows_argv(cwd, cmd)
    else:
        quoted = " ".join(shlex.quote(a) for a in cmd)
        mem_line = "" if (IS_MAC or skip_vmem) else f"ulimit -v {mem_kb} 2>/dev/null || true;"
        proc_line = "" if IS_MAC else "ulimit -u 32 2>/dev/null || true;"
        shell_line = f"{mem_line} ulimit -t {int(cpu_sec)} 2>/dev/null || true; {proc_line} exec {quoted}"
        argv = ["sh", "-c", shell_line]
        if _CAN_DROP_PRIVILEGES:
            kwargs["user"] = SANDBOX_UID
            kwargs["group"] = SANDBOX_GID

    try:
        result = subprocess.run(
            argv,
            cwd=cwd,
            input=stdin_data or "",
            capture_output=True,
            text=True,
            timeout=cpu_sec + 3,
            **kwargs,
        )
        return {"code": result.returncode, "stdout": result.stdout, "stderr": result.stderr, "timed_out": False}
    except subprocess.TimeoutExpired as exc:
        return {"code": 1, "stdout": exc.stdout or "", "stderr": exc.stderr or "", "timed_out": True}
    except FileNotFoundError:
        # Toolchain (gcc, javac, ...) isn't installed here: report it as a
        # failed build/run instead of letting it surface as a 500.
        return {"code": 127, "stdout": "", "stderr": f"{argv[0]} not found", "timed_out": False}


def _execute_one(language: str, code: str, stdin: str, mem_kb: int, cpu_sec: float) -> dict:
    config = LANGUAGE_CONFIG[language]
    skip_vmem = config.get("no_virtual_mem_limit", False)
    execution_dir = TEMP_DIR / str(uuid.uuid4())
    execution_dir.mkdir(parents=True)

    try:
        source_path = execution_dir / config["filename"]
        source_path.write_text(code)
        if _CAN_DROP_PRIVILEGES:
            os.chown(execution_dir, SANDBOX_UID, SANDBOX_GID)
            os.chown(source_path, SANDBOX_UID, SANDBOX_GID)

        if config["build_cmd"]:
            build = _run_limited(execution_dir, mem_kb, cpu_sec, config["build_cmd"], "", skip_vmem)
            if build["code"] != 0:
                return {"status": SubmissionStatus.compile_error, "stdout": ""}

        run = _run_limited(execution_dir, mem_kb, cpu_sec, config["run_cmd"], stdin, skip_vmem)
        if run["timed_out"]:
            return {"status": SubmissionStatus.tle, "stdout": ""}
        if run["code"] != 0:
            return {"status": SubmissionStatus.runtime_error, "stdout": run["stdout"]}
        return {"status": None, "stdout": run["stdout"]}
    finally:
        shutil.rmtree(execution_dir, ignore_errors=True)


def run_against_test_cases(
    *,
    source_code: str,
    language: str,
    test_cases: list[dict],
    time_limit_ms: int,
    memory_limit_kb: int,
) -> list[dict]:
    """test_cases: [{"id": int, "input": str, "expected_output": str}, ...]
    Returns one result dict per test case, in the same order:
    {"test_case_id": int, "status": SubmissionStatus, "passed": bool, "stdout": str}
    """
    cpu_sec = max(1, time_limit_ms / 1000)

    output = []
    for tc in test_cases:
        with _sandbox_semaphore:
            result = _execute_one(language, source_code, tc["input"], memory_limit_kb, cpu_sec)

        if result["status"] is None:
            passed = normalize_output(result["stdout"]) == normalize_output(tc["expected_output"])
            status = SubmissionStatus.accepted if passed else SubmissionStatus.wrong_answer
        else:
            status = result["status"]
            passed = False

        output.append(
            {
                "test_case_id": tc["id"],
                "status": status,
                "passed": passed,
                "stdout": result["stdout"],
            }
        )
    return output


def overall_status(results: list[dict]) -> SubmissionStatus:
    statuses = {r["status"] for r in results}
    if statuses == {SubmissionStatus.accepted}:
        return SubmissionStatus.accepted
    for status in (
        SubmissionStatus.compile_error,
        SubmissionStatus.runtime_error,
        SubmissionStatus.tle,
    ):
        if status in statuses:
            return status
    return SubmissionStatus.wrong_answer
