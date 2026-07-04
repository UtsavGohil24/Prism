from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import AnalysisRequest, AnalysisResponse
# Import your brand-new service tool!
from services.github import fetch_pr_diff 

app = FastAPI()

# Enable CORS so React frontend can talk to our server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_pr(payload: AnalysisRequest):
    try:
        # Call our fresh GitHub tool using the incoming URL!
        raw_diff = fetch_pr_diff(payload.github_url)
        
        # Temporary print statement so we can see the real code changes in our terminal!
        print("--- FETCHED RAW DIFF START ---")
        print(raw_diff[:500]) # Prints the first 500 characters of the code diff
        print("--- FETCHED RAW DIFF END ---")
        
        # Right now, we still return mock data until Phase 3 (Gemini) is ready,
        # but the actual GitHub fetch engine is now fully firing!
        return {
            "status": "success",
            "message": "Successfully fetched code diff from GitHub!",
            "vulnerabilities": [
                {
                    "file_name": "auth/login.py",
                    "risk_level": "Medium",
                    "summary": "Mock data alert: GitHub fetcher successfully triggered behind the scenes.",
                    "vulnerability_type": "Code Quality",
                    "line_number": 12
                }
            ]
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))