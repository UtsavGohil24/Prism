from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse, ChatRequest, ChatResponse
from services.chat_service import get_chat_reply
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

@router.post("/report/{report_id}/chat", response_model=ChatResponse)
def chat_with_report(report_id: str, request: ChatRequest):
    try:
        report = db.get_report(report_id)  # raises 404 internally if missing

        # Sanitize and validate request parameters
        clean_message = request.message.strip()
        if not clean_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty.")
            
        # Cap message length to avoid token flooding / context limit abuse
        if len(clean_message) > 4000:
            raise HTTPException(status_code=400, detail="Message exceeds maximum allowed length of 4000 characters.")

        # Limit conversation history to the last 20 turns to maintain context integrity
        history = [turn.model_dump() for turn in request.history[-20:]]
        
        reply = get_chat_reply(report, clean_message, history)

        return ChatResponse(reply=reply)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
