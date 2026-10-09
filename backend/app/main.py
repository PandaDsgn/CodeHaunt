from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.routers import ai_chat, auth, event, leaderboard, questions, submissions

app = FastAPI(title="CodeHaunt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(submissions.router)
app.include_router(ai_chat.router)
app.include_router(leaderboard.router)
app.include_router(event.router)


@app.get("/health")
def health():
    return {"status": "ok"}
