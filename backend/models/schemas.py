from pydantic import BaseModel
from typing import List

class AnalyzeRequest(BaseModel):
    pr_url: str

class FileRisk(BaseModel):
    filename: str
    risk_level: str # "High","Medium", or "Low"
    lines_changed: int
    bugs: List[str]
    suggestions: List[str]

class Summary(BaseModel):
    total_files: int
    high_risk_files: int
    medium_risk_files: int
    low_risk_files: int
    total_bugs: int

class ReportResponse(BaseModel):
    report_id: str
    pr_url: str
    pr_title: str
    author: str
    created_at: str
    overall_risk_score: int
    confidence: str # "High","Medium", or "Low"
    merge_recommendation: str
    summary: Summary
    files: List[FileRisk]