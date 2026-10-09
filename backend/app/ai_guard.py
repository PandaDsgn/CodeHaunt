import random
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AiMessage, ChatRole, Difficulty, Question, User

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 2

NO_MORE_HINTS_MESSAGE = (
    "No more hints are available for this question. Use what you've got — you're on your own from here."
)

_BASE_RULES = (
    "You are a coding-competition tutor. The participant must write every line of the "
    "solution themselves. You must NEVER provide source code, pseudocode, or name a "
    "specific algorithm or data structure to use. Do not give step-by-step procedures. "
    "Respond only with short Socratic questions or pointers toward what to notice about "
    "the problem — never toward how to implement it."
)

DIFFICULTY_CONFIG = {
    Difficulty.easy: {
        "turn_cap": 20,
        "system_prompt": (
            f"{_BASE_RULES} This is an EASY question: you may be reasonably generous — ask "
            "clarifying questions, point at what part of the problem statement they might be "
            "missing, and encourage them to test edge cases. Still no code, pseudocode, or "
            "algorithm/data-structure names."
        ),
    },
    Difficulty.medium: {
        "turn_cap": 5,
        "system_prompt": (
            f"{_BASE_RULES} This is a MEDIUM question: be terser than you would for an easy "
            "one. One short nudge per reply, no restating the problem, no multi-part "
            "explanations."
        ),
    },
    Difficulty.hard: {
        "turn_cap": 2,
        "system_prompt": (
            f"{_BASE_RULES} This is a HARD question: you get almost nothing from me. Reply "
            "in one short sentence, at most a single Socratic question. No elaboration."
        ),
    },
}


def _rate_limited(db: Session, user_id: int) -> bool:
    since = datetime.now(timezone.utc) - timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)
    count = (
        db.query(func.count(AiMessage.id))
        .filter(
            AiMessage.user_id == user_id,
            AiMessage.role == ChatRole.user,
            AiMessage.created_at >= since,
        )
        .scalar()
    )
    return count >= RATE_LIMIT_MAX_REQUESTS


def _turns_used(db: Session, user_id: int, question_id: int) -> int:
    return (
        db.query(func.count(AiMessage.id))
        .filter(
            AiMessage.user_id == user_id,
            AiMessage.question_id == question_id,
            AiMessage.role == ChatRole.assistant,
        )
        .scalar()
    )


def _call_grok(system_prompt: str, history: list[AiMessage], new_message: str) -> str:
    key = random.choice(settings.grok_keys)
    messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        messages.append({"role": m.role.value, "content": m.content})
    messages.append({"role": "user", "content": new_message})

    resp = httpx.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": settings.grok_model, "messages": messages, "max_tokens": 150},
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def ask_tutor(db: Session, user: User, question: Question, content: str) -> AiMessage:
    if _rate_limited(db, user.id):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Max {RATE_LIMIT_MAX_REQUESTS} AI messages per {RATE_LIMIT_WINDOW_SECONDS}s. Slow down.",
        )

    user_msg = AiMessage(
        user_id=user.id, question_id=question.id, role=ChatRole.user, content=content
    )
    db.add(user_msg)
    db.flush()

    config = DIFFICULTY_CONFIG[question.difficulty]
    if _turns_used(db, user.id, question.id) >= config["turn_cap"]:
        reply = NO_MORE_HINTS_MESSAGE
    else:
        history = (
            db.query(AiMessage)
            .filter(AiMessage.user_id == user.id, AiMessage.question_id == question.id)
            .order_by(AiMessage.created_at)
            .all()[:-1]  # exclude the just-inserted user message, it's passed separately
        )
        reply = _call_grok(config["system_prompt"], history, content)

    assistant_msg = AiMessage(
        user_id=user.id, question_id=question.id, role=ChatRole.assistant, content=reply
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
