from fastapi import APIRouter, HTTPException
import os

from models.schemas import AnalysisRequest, AnalysisResponse
from services.github import fetch_pr_diff
from services.gemini_service import analyze_code_diff, compute_diff_hash
from services.comparison import compute_comparison
from services import db

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_pr(payload: AnalysisRequest):
    try:
        # 1. Fetch the diff — cheap, no LLM cost
        raw_diff = fetch_pr_diff(payload.pr_url, github_token=os.getenv("GITHUB_TOKEN"))

        # 2. Compute its fingerprint
        diff_hash = compute_diff_hash(raw_diff)

        # 3. Check cache first
        cached = db.find_cached_report(payload.pr_url, diff_hash)
        if cached:
            print(f"[CACHE HIT] Returning cached report for {payload.pr_url}")
            historical_scores = db.get_repo_risk_scores(
                repo=cached["repo"],
                exclude_report_id=cached["report_id"]
            )
            cached["comparison"] = compute_comparison(
                cached["overall_risk_score"], historical_scores, cached["repo"]
            )
            return cached

        # 4. No cache hit — fresh analysis
        ai_analysis_report = analyze_code_diff(raw_diff, payload.pr_url)
        ai_analysis_report["diff_hash"] = diff_hash
        db.save_report(ai_analysis_report)

        # 5. Compute comparison for the freshly created report
        historical_scores = db.get_repo_risk_scores(
            repo=ai_analysis_report["repo"],
            exclude_report_id=ai_analysis_report["report_id"]
        )
        ai_analysis_report["comparison"] = compute_comparison(
            ai_analysis_report["overall_risk_score"], historical_scores, ai_analysis_report["repo"]
        )

        return ai_analysis_report

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))