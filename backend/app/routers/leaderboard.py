from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Question, Submission, SubmissionStatus, User
from app.schemas import LeaderboardRow
from app.scoring import score_for_question

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardRow])
def leaderboard(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    questions = {q.id: q for q in db.query(Question).all()}
    participants = db.query(User).filter(User.role == "participant").all()

    rows = []
    for participant in participants:
        submissions = (
            db.query(Submission)
            .filter(Submission.user_id == participant.id)
            .order_by(Submission.submitted_at)
            .all()
        )
        by_question: dict[int, list[Submission]] = {}
        for s in submissions:
            by_question.setdefault(s.question_id, []).append(s)

        per_question_score: dict[int, float] = {}
        for question_id, subs in by_question.items():
            question = questions.get(question_id)
            if question is None:
                continue
            wrong_attempts = 0
            solved = False
            for s in subs:
                if s.status == SubmissionStatus.accepted:
                    solved = True
                    break
                wrong_attempts += 1
            per_question_score[question_id] = score_for_question(
                question.base_score, wrong_attempts, solved
            )

        rows.append(
            LeaderboardRow(
                user_id=participant.id,
                name=participant.name,
                total_score=sum(per_question_score.values()),
                per_question=per_question_score,
            )
        )

    rows.sort(key=lambda r: r.total_score, reverse=True)
    return rows
