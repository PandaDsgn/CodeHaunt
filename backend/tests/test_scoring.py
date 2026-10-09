from app.scoring import score_for_question


def test_first_try_correct_is_full_score():
    assert score_for_question(100, wrong_attempts=0, solved=True) == 100.0


def test_decays_by_20_percent_per_wrong_attempt():
    assert score_for_question(100, wrong_attempts=1, solved=True) == 80.0
    assert score_for_question(100, wrong_attempts=2, solved=True) == 60.0
    assert score_for_question(100, wrong_attempts=3, solved=True) == 40.0


def test_floor_clamps_at_20_percent():
    assert score_for_question(100, wrong_attempts=4, solved=True) == 20.0
    assert score_for_question(100, wrong_attempts=50, solved=True) == 20.0


def test_never_solved_scores_zero():
    assert score_for_question(100, wrong_attempts=10, solved=False) == 0.0
