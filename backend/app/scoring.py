DECAY_PER_WRONG_ATTEMPT = 0.2
FLOOR_FRACTION = 0.2


def score_for_question(base_score: int, wrong_attempts: int, solved: bool) -> float:
    """Fixed-step decay: each wrong attempt before the accepted submission costs
    DECAY_PER_WRONG_ATTEMPT of base_score, never dropping below FLOOR_FRACTION.
    Unsolved questions score 0."""
    if not solved:
        return 0.0
    fraction = max(FLOOR_FRACTION, 1 - DECAY_PER_WRONG_ATTEMPT * wrong_attempts)
    return round(base_score * fraction, 2)
