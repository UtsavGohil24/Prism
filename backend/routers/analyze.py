from fastapi import APIRouter
from models.schemas import AnalyzeRequest, ReportResponse

router = APIRouter()

@router.post("/analyze", response_model=ReportResponse)
async def analyze(req: AnalyzeRequest):
    # This is a temporary fake report to test if our API plumbing works!
    return {
        "report_id": "mock001",
        "pr_url": req.pr_url,
        "pr_title": "Add auth module",
        "author": "dev_user",
        "created_at": "2025-06-26T10:00:00Z",
        "overall_risk_score": 72,
        "confidence": "high",
        "merge_recommendation": "Review carefully before merging.",
        "summary": {
            "total_files": 1,
            "high_risk_files": 0,
            "medium_risk_files": 1,
            "low_risk_files": 0,
            "total_bugs": 1
        },
        "files": [
            {
                "filename": "auth/login.py",
                "risk_level": "medium",
                "lines_changed": 42,
                "bugs": ["Potential raw input log leak on line 12"],
                "suggestions": ["Sanitize your log variables before saving them"]
            }
        ]
    }