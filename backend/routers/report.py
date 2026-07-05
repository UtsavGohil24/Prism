from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse
from services import db

router = APIRouter()


@router.get("/report/{report_id}", response_model=AnalysisResponse)
def get_report(report_id: str):
    try:
        return db.get_report(report_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))