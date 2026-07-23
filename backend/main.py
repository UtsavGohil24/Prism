import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, report

app = FastAPI(title="PRism API")

# Enable CORS so React frontend can talk to our server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(report.router)



@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/status")
def get_status():
    return {
        "github_token": bool(os.getenv("GITHUB_TOKEN")),
        "gemini_api_key": bool(os.getenv("GEMINI_API_KEY")),
        "groq_api_key": bool(os.getenv("GROQ_API_KEY")),
        "supabase_configured": bool(os.getenv("SUPABASE_URL")) and bool(os.getenv("SUPABASE_KEY"))
    }


