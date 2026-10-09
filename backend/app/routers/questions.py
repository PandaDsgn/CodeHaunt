from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.db import get_db
from app.models import Question, Role, TestCase, User
from app.schemas import (
    DeadlineUpdate,
    QuestionCreate,
    QuestionDetailOut,
    QuestionOut,
    QuestionParticipantOut,
    TestCaseIn,
    TestCaseOut,
    TestCasePublicOut,
)

router = APIRouter(prefix="/questions", tags=["questions"])


def _get_question_or_404(db: Session, question_id: int) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


@router.post("", response_model=QuestionDetailOut)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    organizer: User = Depends(require_role(Role.organizer)),
):
    question = Question(
        title=payload.title,
        statement=payload.statement,
        difficulty=payload.difficulty,
        base_score=payload.base_score,
        time_limit_ms=payload.time_limit_ms,
        memory_limit_kb=payload.memory_limit_kb,
        allowed_languages=payload.allowed_languages,
        ends_at=payload.ends_at,
        created_by=organizer.id,
    )
    question.test_cases = [TestCase(**tc.model_dump()) for tc in payload.test_cases]
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("")
def list_questions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    questions = db.query(Question).order_by(Question.id).all()
    if user.role == Role.organizer:
        return [QuestionDetailOut.model_validate(q) for q in questions]
    return [_to_participant_view(q) for q in questions]


@router.get("/{question_id}")
def get_question(
    question_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    question = _get_question_or_404(db, question_id)
    if user.role == Role.organizer:
        return QuestionDetailOut.model_validate(question)
    return _to_participant_view(question)


@router.put("/{question_id}", response_model=QuestionDetailOut)
def update_question(
    question_id: int,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    question = _get_question_or_404(db, question_id)
    for field in ("title", "statement", "difficulty", "base_score", "time_limit_ms",
                  "memory_limit_kb", "allowed_languages", "ends_at"):
        setattr(question, field, getattr(payload, field))
    question.test_cases = [TestCase(**tc.model_dump()) for tc in payload.test_cases]
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}/deadline", response_model=QuestionOut)
def update_deadline(
    question_id: int,
    payload: DeadlineUpdate,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    """Sets just ends_at, without touching test cases like the full PUT above would."""
    question = _get_question_or_404(db, question_id)
    question.ends_at = payload.ends_at
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    question = _get_question_or_404(db, question_id)
    db.delete(question)
    db.commit()


@router.post("/{question_id}/test-cases", response_model=TestCaseOut)
def add_test_case(
    question_id: int,
    payload: TestCaseIn,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    _get_question_or_404(db, question_id)
    test_case = TestCase(question_id=question_id, **payload.model_dump())
    db.add(test_case)
    db.commit()
    db.refresh(test_case)
    return test_case


def _to_participant_view(question: Question) -> QuestionParticipantOut:
    base = QuestionOut.model_validate(question).model_dump()
    public_cases = [
        TestCasePublicOut.model_validate(tc) for tc in question.test_cases if tc.is_public
    ]
    return QuestionParticipantOut(**base, public_test_cases=public_cases)
