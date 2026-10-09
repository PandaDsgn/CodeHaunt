from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.auth import create_access_token, get_current_user, require_role, verify_password
from app.db import get_db
from app.models import Role, User
from app.schemas import MeOut, TokenOut, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenOut(access_token=create_access_token(user), role=user.role)


@router.post("/participants", response_model=UserOut)
def create_participant(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _organizer: User = Depends(require_role(Role.organizer)),
):
    """Organizer provisions a participant account for the event roster."""
    from app.auth import hash_password

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
        role=Role.participant,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=MeOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/disqualify", response_model=MeOut)
def disqualify_self(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.participant)),
):
    """Called by the frontend the instant it detects fullscreen was exited
    after the event started. Idempotent: a second call doesn't push the
    timestamp later, the first violation is what stands."""
    if user.disqualified_at is None:
        user.disqualified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    return user
