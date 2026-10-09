"""Seed one organizer + 6 contest questions (2 easy/medium/hard) with test cases.
Run inside the backend container/venv: python seed.py
"""

from app.auth import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Difficulty, Question, Role, TestCase, User

BASE_SCORE = {Difficulty.easy: 100, Difficulty.medium: 150, Difficulty.hard: 200}

QUESTIONS = [
    (Difficulty.easy, "Sum of Two Numbers", "Read two integers a and b, print a + b.",
     [("3 4", "7", True), ("10 20", "30", True), ("-5 5", "0", False)]),
    (Difficulty.easy, "Reverse a String", "Read a line, print it reversed.",
     [("hello", "olleh", True), ("abc", "cba", True), ("racecar", "racecar", False)]),
    (Difficulty.medium, "Is Prime", "Read an integer n, print 'yes' if prime else 'no'.",
     [("7", "yes", True), ("10", "no", True), ("97", "yes", False)]),
    (Difficulty.medium, "Two Sum Count", "Read n integers then target, print count of pairs summing to target.",
     [("4\n1 2 3 4\n5", "2", True), ("3\n1 1 1\n2", "3", False)]),
    (Difficulty.hard, "Longest Increasing Run", "Read n integers, print the length of the longest strictly increasing contiguous run.",
     [("6\n1 2 3 1 2 1", "3", True), ("5\n5 4 3 2 1", "1", False)]),
    (Difficulty.hard, "Balanced Brackets", "Read a line of brackets, print 'yes' if balanced else 'no'.",
     [("([]{})", "yes", True), ("([)]", "no", False)]),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    organizer = db.query(User).filter(User.email == "vedantabandyopadhyay@gmail.com").first()
    if not organizer:
        organizer = User(
            email="vedantabandyopadhyay@gmail.com",
            name="Organizer",
            role=Role.organizer,
            password_hash=hash_password("test123"),
        )
        db.add(organizer)
        db.commit()
        db.refresh(organizer)
        print(f"Created organizer: {organizer.email}")

    if db.query(Question).count() == 0:
        for difficulty, title, statement, cases in QUESTIONS:
            question = Question(
                title=title,
                statement=statement,
                difficulty=difficulty,
                base_score=BASE_SCORE[difficulty],
                allowed_languages=["python3", "c", "cpp", "java"],
                created_by=organizer.id,
            )
            question.test_cases = [
                TestCase(input=i, expected_output=o, is_public=pub, order_index=idx)
                for idx, (i, o, pub) in enumerate(cases)
            ]
            db.add(question)
        db.commit()
        print("Seeded 6 questions.")
    else:
        print("Questions already exist, skipping.")

    db.close()


if __name__ == "__main__":
    main()
