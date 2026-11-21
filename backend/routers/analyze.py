from fastapi import APIRouter, HTTPException
import os
import traceback

from models.schemas import AnalysisRequest, AnalysisResponse
from services.github import fetch_pr_diff
from services.gemini_service import analyze_code_diff, compute_diff_hash
from services.comparison import compute_comparison
from services import db

router = APIRouter()


def _attach_comparison(report: dict) -> dict:
    """Adds the percentile/median comparison against other PRs in the same
    repo AND the same model, so the comparison isn't skewed by models that
    score more harshly or leniently than others."""
    historical_scores = db.get_repo_risk_scores(
        repo=report["repo"],
        exclude_report_id=report["report_id"],
        model_used=report["model_used"],
    )
    report["comparison"] = compute_comparison(
        report["overall_risk_score"], historical_scores, report["repo"]
    )
    return report


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_pr(payload: AnalysisRequest):
    try:
        pr_url = payload.pr_url.strip().rstrip("/")

        # 1. Fetch the diff — cheap, no LLM cost
        raw_diff = fetch_pr_diff(pr_url, github_token=os.getenv("GITHUB_TOKEN"))

        # 2. Compute its fingerprint
        diff_hash = compute_diff_hash(raw_diff)
        print(f"[DEBUG] diff length={len(raw_diff)} hash={diff_hash[:12]} model={payload.model} url={pr_url}")

        # 3. Check cache first (same PR + same diff + same requested model)
        cached = db.find_cached_report(pr_url, diff_hash, payload.model)
        if cached:
            print(f"[CACHE HIT] Returning cached {payload.model} report for {pr_url}")
            return _attach_comparison(cached)

        # 4. No cache hit — fresh analysis, using the requested model
        report = analyze_code_diff(raw_diff, pr_url, model=payload.model)
        report["diff_hash"] = diff_hash
        db.save_report(report)
        print(f"[ANALYZED] {report['report_id']} via {report.get('model_used')}")

        # 5. Compute comparison for the freshly created report
        return _attach_comparison(report)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()  # full traceback in the terminal
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")