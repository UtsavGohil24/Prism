from fastapi import APIRouter, HTTPException
import os

from models.schemas import AnalysisRequest, AnalysisResponse
from services.github import fetch_pr_diff
from services.analyzer import analyze_code_diff
from services import db

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_pr(payload: AnalysisRequest):
    try:
        # 1. Extracts the live diff text from GitHub
        raw_diff = fetch_pr_diff(payload.pr_url, github_token=os.getenv("GITHUB_TOKEN"))

        # 2. Passes the diff text to Gemini for structural analysis
        ai_analysis_report = analyze_code_diff(raw_diff, payload.pr_url)

        # 3. Db report
        db.save_report(ai_analysis_report)

        # 4. Return the verified AI risk audit directly to the client/UI
        return ai_analysis_report

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

