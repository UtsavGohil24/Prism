from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze

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


@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Run: uvicorn main:app --reload --port 8000