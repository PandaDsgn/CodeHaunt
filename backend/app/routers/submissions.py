from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.db import get_db
from app.sandbox import overall_status, run_against_test_cases
from app.models import Question, Role, Submission, User
from app.schemas import SubmissionCreate, SubmissionOut, SubmissionParticipantOut, TestCaseResultOut

router = APIRouter(tags=["submissions"])


def _participant_out(submission: Submission, question_title: str) -> SubmissionParticipantOut:
    public_results = [r for r in submission.test_case_results if r["is_public"]]
    return SubmissionParticipantOut(
        id=submission.id,
        question_id=submission.question_id,
        question_title=question_title,
        language=submission.language,
        submitted_at=submission.submitted_at,
        status=submission.status,
        test_case_results=[
            TestCaseResultOut(order_index=r["order_index"], passed=r["passed"]) for r in public_results
        ],
        public_pass_count=submission.public_pass_count,
        public_total=submission.public_total,
    )


@router.post("/questions/{question_id}/submit", response_model=SubmissionParticipantOut)
def submit_solution(
    question_id: int,
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.participant)),
):
    if user.disqualified_at is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Contest has ended for you")
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    if payload.language not in question.allowed_languages:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Language must be one of {question.allowed_languages}",
        )

    ordered_test_cases = sorted(question.test_cases, key=lambda tc: tc.order_index)
    test_cases = [
        {"id": tc.id, "input": tc.input, "expected_output": tc.expected_output}
        for tc in ordered_test_cases
    ]
    results = run_against_test_cases(
        source_code=payload.code,
        language=payload.language,
        test_cases=test_cases,
        time_limit_ms=question.time_limit_ms,
        memory_limit_kb=question.memory_limit_kb,
    )

    tc_by_id = {tc.id: tc for tc in ordered_test_cases}
    test_case_results = [
        {
            "test_case_id": r["test_case_id"],
            "order_index": tc_by_id[r["test_case_id"]].order_index,
            "is_public": tc_by_id[r["test_case_id"]].is_public,
            "passed": r["passed"],
        }
        for r in results
    ]
    public_results = [r for r in test_case_results if r["is_public"]]
    private_results = [r for r in test_case_results if not r["is_public"]]

    submission = Submission(
        user_id=user.id,
        question_id=question.id,
        code=payload.code,
        language=payload.language,
        status=overall_status(results),
        test_case_results=test_case_results,
        public_pass_count=sum(r["passed"] for r in public_results),
        public_total=len(public_results),
        private_pass_count=sum(r["passed"] for r in private_results),
        private_total=len(private_results),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return _participant_out(submission, question.title)


@router.get("/submissions/mine", response_model=list[SubmissionParticipantOut])
def my_submissions(db: Session = Depends(get_db), user: User = Depends(require_role(Role.participant))):
    submissions = (
        db.query(Submission)
        .filter(Submission.user_id == user.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    titles = {q.id: q.title for q in db.query(Question).all()}
    return [_participant_out(s, titles.get(s.question_id, "Unknown question")) for s in submissions]


@router.get("/submissions", response_model=list[SubmissionOut])
def all_submissions(db: Session = Depends(get_db), _organizer: User = Depends(require_role(Role.organizer))):
    submissions = db.query(Submission).order_by(Submission.submitted_at.desc()).all()
    titles = {q.id: q.title for q in db.query(Question).all()}
    names = {u.id: u.name for u in db.query(User).all()}
    return [
        SubmissionOut(
            id=s.id,
            question_id=s.question_id,
            question_title=titles.get(s.question_id, "Unknown question"),
            language=s.language,
            submitted_at=s.submitted_at,
            status=s.status,
            test_case_results=[
                TestCaseResultOut(order_index=r["order_index"], passed=r["passed"])
                for r in s.test_case_results
            ],
            public_pass_count=s.public_pass_count,
            public_total=s.public_total,
            participant_name=names.get(s.user_id, "Unknown participant"),
            private_pass_count=s.private_pass_count,
            private_total=s.private_total,
        )
        for s in submissions
    ]
