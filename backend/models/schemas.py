from pydantic import BaseModel, Field
from typing import List, Literal


class AnalysisRequest(BaseModel):
    pr_url: str

class Bug(BaseModel):
    description: str
    severity: Literal["minor", "moderate", "critical"]
    line_reference: str | None = None

class FileRisk(BaseModel):
    filename: str
    risk_level: Literal["low", "medium", "high"]
    lines_changed: int
    # Setting default_factory=list ensures Pydantic supplies [] if Gemini forgets to include it!
    bugs: List[Bug] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)

class Summary(BaseModel):
    total_files: int
    high_risk_files: int
    medium_risk_files: int
    low_risk_files: int
    total_bugs: int

class Comparison(BaseModel):
    insufficient_data: bool
    percentile: int | None = None
    median: float | None = None
    sample_size: int
    current_score: int
    repo: str

class AnalysisResponse(BaseModel):
    report_id: str
    pr_url: str
    repo: str
    pr_title: str
    author: str
    created_at: str
    overall_risk_score: int
    confidence: Literal["low", "medium", "high"]
    merge_recommendation: str
    summary: Summary
    files: List[FileRisk]
    comparison: Comparison