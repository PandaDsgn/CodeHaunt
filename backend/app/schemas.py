from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import ChatRole, Difficulty, Role, SubmissionStatus


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role


class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str
    role: Role


class MeOut(UserOut):
    disqualified_at: datetime | None


class EventConfigOut(BaseModel):
    starts_at: datetime | None


class EventConfigUpdate(BaseModel):
    starts_at: datetime | None


class TestCaseIn(BaseModel):
    input: str
    expected_output: str
    is_public: bool = False
    order_index: int = 0


class TestCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    input: str
    expected_output: str
    is_public: bool
    order_index: int


class TestCasePublicOut(BaseModel):
    """What participants get: public cases only, never the expected output of private ones."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    input: str
    expected_output: str
    order_index: int


class QuestionCreate(BaseModel):
    title: str
    statement: str
    difficulty: Difficulty
    base_score: int
    time_limit_ms: int = 5000
    memory_limit_kb: int = 256000
    allowed_languages: list[str]
    ends_at: datetime | None = None
    test_cases: list[TestCaseIn] = []


class DeadlineUpdate(BaseModel):
    ends_at: datetime | None


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    statement: str
    difficulty: Difficulty
    base_score: int
    time_limit_ms: int
    memory_limit_kb: int
    allowed_languages: list[str]
    ends_at: datetime | None


class QuestionDetailOut(QuestionOut):
    test_cases: list[TestCaseOut]


class QuestionParticipantOut(QuestionOut):
    public_test_cases: list[TestCasePublicOut]


class SubmissionCreate(BaseModel):
    code: str
    language: str


class TestCaseResultOut(BaseModel):
    order_index: int
    passed: bool


class SubmissionParticipantOut(BaseModel):
    """What the participant sees: public test results only, not the private breakdown."""

    id: int
    question_id: int
    question_title: str
    language: str
    submitted_at: datetime
    status: SubmissionStatus
    test_case_results: list[TestCaseResultOut]
    public_pass_count: int
    public_total: int


class SubmissionOut(SubmissionParticipantOut):
    """Organizer view: adds who submitted it and the private test-case breakdown."""

    participant_name: str
    private_pass_count: int
    private_total: int


class LeaderboardRow(BaseModel):
    user_id: int
    name: str
    total_score: float
    per_question: dict[int, float]


class AiMessageIn(BaseModel):
    content: str


class AiMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: ChatRole
    content: str
    created_at: datetime
