from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, report

app = FastAPI(title="PRism API")

import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # local dev
        os.getenv("FRONTEND_URL", "http://localhost:5173"),  # deployed frontend, set via env var
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(report.router)



@app.get("/health")
def health_check():
    return {"status": "healthy"}

