from pydantic import BaseModel, Field
from typing import List, Literal


class AnalysisRequest(BaseModel):
    pr_url: str
    # "gemini" (default), "qwen", or "glm" — whichever the user picks on
    # the landing page. Groq (Llama 3.3 70B) is never user-selectable;
    # it's the silent fallback used if the chosen primary model is
    # unavailable or hits a transient error (rate limit / overload).
    model: Literal["gemini", "nemotron", "glm"] = "gemini"

class Bug(BaseModel):
    description: str
    severity: Literal["minor", "moderate", "critical"]
    line_reference: str | None = None

class FileRisk(BaseModel):
    filename: str
    risk_level: Literal["low", "medium", "high"]
    lines_changed: int
    bugs: List[Bug] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)

class RiskFactor(BaseModel):
    type: str
    reason: str
    source: str
    points: int | None = None

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
    risk_factors: List[RiskFactor]
    model_used: str | None = None
    fallback_used: bool = False

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str