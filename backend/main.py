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

