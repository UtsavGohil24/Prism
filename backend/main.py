
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, report

load_dotenv()

app = FastAPI(title="PRism API")

_origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(_origins),
    allow_credentials=True,
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
        "cohere_api_key": bool(os.getenv("COHERE_API_KEY")),
        "cloudflare_api_token": bool(os.getenv("CLOUDFLARE_API_TOKEN")),
        "cloudflare_account_id": bool(os.getenv("CLOUDFLARE_ACCOUNT_ID")),
        "groq_api_key": bool(os.getenv("GROQ_API_KEY")),
        "supabase_configured": (
            bool(os.getenv("SUPABASE_URL"))
            and bool(os.getenv("SUPABASE_KEY"))
        ),
    }
