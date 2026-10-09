FROM python:3.12-slim

# Compilers/interpreters baked into the image itself for app/sandbox.py —
# no Docker-in-Docker, no separate judge service. python3 is already this
# base image's own runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Dedicated low-privilege user submissions actually run as (uid/gid 1001,
# matching SANDBOX_UID/SANDBOX_GID defaults in app/sandbox.py). nologin
# shell means this account can never be used to log in interactively, only
# to run the one-off spawned processes the app hands it.
RUN groupadd -g 1001 sandbox \
 && useradd -m -u 1001 -g 1001 -s /usr/sbin/nologin sandbox

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The uvicorn process itself stays root so it CAN chown temp dirs to
# `sandbox` and spawn as that uid.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
