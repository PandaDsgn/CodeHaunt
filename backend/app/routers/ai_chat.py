from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai_guard import ask_tutor
from app.auth import require_role
from app.db import get_db
from app.models import AiMessage, Question, Role, User
from app.schemas import AiMessageIn, AiMessageOut

router = APIRouter(prefix="/questions/{question_id}/ai-chat", tags=["ai-chat"])


@router.get("", response_model=list[AiMessageOut])
def get_chat_history(
    question_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.participant)),
):
    return (
        db.query(AiMessage)
        .filter(AiMessage.user_id == user.id, AiMessage.question_id == question_id)
        .order_by(AiMessage.created_at)
        .all()
    )


@router.post("", response_model=AiMessageOut)
def send_chat_message(
    question_id: int,
    payload: AiMessageIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.participant)),
):
    if user.disqualified_at is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Contest has ended for you")
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    return ask_tutor(db, user, question, payload.content)
