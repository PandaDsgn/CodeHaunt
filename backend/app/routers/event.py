from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.db import get_db
from app.models import EventConfig, Role, User
from app.schemas import EventConfigOut, EventConfigUpdate

router = APIRouter(prefix="/event", tags=["event"])


def _get_or_create(db: Session) -> EventConfig:
    config = db.get(EventConfig, 1)
    if config is None:
        config = EventConfig(id=1, starts_at=None)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("", response_model=EventConfigOut)
def get_event(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return _get_or_create(db)


@router.put("", response_model=EventConfigOut)
def update_event(
    payload: EventConfigUpdate,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    config = _get_or_create(db)
    config.starts_at = payload.starts_at
    db.commit()
    db.refresh(config)
    return config
