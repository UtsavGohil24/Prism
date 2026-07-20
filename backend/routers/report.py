from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse
from services import db
from services.comparison import compute_comparison

router = APIRouter()


@router.get("/report/{report_id}", response_model=AnalysisResponse)
def get_report(report_id: str):
    try:
        report = db.get_report(report_id)

        historical_scores = db.get_repo_risk_scores(
            repo=report["repo"],
            exclude_report_id=report_id
        )
        report["comparison"] = compute_comparison(
            report["overall_risk_score"], historical_scores, report["repo"]
        )

        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/report/{report_id}/comparison")
def get_risk_comparison(report_id: str):
    try:
        current = db.get_report(report_id)
        historical_scores = db.get_repo_risk_scores(
            repo=current["repo"],
            exclude_report_id=report_id
        )
        comparison = compute_comparison(
            current["overall_risk_score"],
            historical_scores,
            current["repo"]
        )
        return comparison
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))