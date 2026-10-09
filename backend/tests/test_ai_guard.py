from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.ai_guard import DIFFICULTY_CONFIG, _rate_limited, _turns_used
from app.db import Base
from app.models import AiMessage, ChatRole, Difficulty


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_rate_limit_blocks_after_two_requests_in_a_minute():
    db = make_session()
    now = datetime.now(timezone.utc)
    for _ in range(2):
        db.add(AiMessage(user_id=1, question_id=1, role=ChatRole.user, content="hi", created_at=now))
    db.commit()
    assert _rate_limited(db, user_id=1) is True


def test_rate_limit_allows_after_window_passes():
    db = make_session()
    old = datetime.now(timezone.utc) - timedelta(seconds=120)
    for _ in range(2):
        db.add(AiMessage(user_id=1, question_id=1, role=ChatRole.user, content="hi", created_at=old))
    db.commit()
    assert _rate_limited(db, user_id=1) is False


def test_turn_cap_counts_only_assistant_messages_for_that_question():
    db = make_session()
    cap = DIFFICULTY_CONFIG[Difficulty.hard]["turn_cap"]
    for _ in range(cap):
        db.add(AiMessage(user_id=1, question_id=1, role=ChatRole.assistant, content="hint"))
    db.add(AiMessage(user_id=1, question_id=2, role=ChatRole.assistant, content="hint for other q"))
    db.commit()
    assert _turns_used(db, user_id=1, question_id=1) == cap
    assert _turns_used(db, user_id=1, question_id=2) == 1
