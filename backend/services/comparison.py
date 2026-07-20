import statistics

MIN_SAMPLE_SIZE = 3

def compute_comparison(current_score: int, historical_scores: list[int], repo: str) -> dict:
    if len(historical_scores) < MIN_SAMPLE_SIZE:
        return {
            "insufficient_data": True,
            "sample_size": len(historical_scores),
            "current_score": current_score,
            "repo": repo,
        }

    lower_count = sum(1 for s in historical_scores if s < current_score)
    percentile = round((lower_count / len(historical_scores)) * 100)
    median = statistics.median(historical_scores)

    return {
        "insufficient_data": False,
        "percentile": percentile,
        "median": round(median, 1),
        "sample_size": len(historical_scores),
        "current_score": current_score,
        "repo": repo,
    }
    