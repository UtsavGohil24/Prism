from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze

app = FastAPI(title="PRism AI Code Auditor Backend")

# Allow React development server to communicate with our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our test API endpoint
app.include_router(analyze.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "PRism API"}