import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    participant = "participant"
    organizer = "organizer"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class SubmissionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    wrong_answer = "wrong_answer"
    compile_error = "compile_error"
    runtime_error = "runtime_error"
    tle = "tle"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    disqualified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    statement: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[Difficulty] = mapped_column(String(10))
    base_score: Mapped[int] = mapped_column()
    time_limit_ms: Mapped[int] = mapped_column(default=5000)
    memory_limit_kb: Mapped[int] = mapped_column(default=256000)
    allowed_languages: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

    test_cases: Mapped[list["TestCase"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    input: Mapped[str] = mapped_column(Text)
    expected_output: Mapped[str] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(default=False)
    order_index: Mapped[int] = mapped_column(default=0)

    question: Mapped["Question"] = relationship(back_populates="test_cases")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    code: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(50))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[SubmissionStatus] = mapped_column(String(20), default=SubmissionStatus.pending)
    public_pass_count: Mapped[int] = mapped_column(default=0)
    public_total: Mapped[int] = mapped_column(default=0)
    private_pass_count: Mapped[int] = mapped_column(default=0)
    private_total: Mapped[int] = mapped_column(default=0)
    # Per-test-case breakdown: [{"test_case_id", "order_index", "is_public", "passed"}, ...]
    test_case_results: Mapped[list[dict]] = mapped_column(JSON, default=list)


class AiMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    role: Mapped[ChatRole] = mapped_column(String(10))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EventConfig(Base):
    """Single-row table (id is always 1) holding the contest start time."""

    __tablename__ = "event_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
