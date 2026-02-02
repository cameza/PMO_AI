from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import programs, agent
from database.db import init_db

app = FastAPI(
    title="Portfolio AI API",
    description="AI-powered Program Portfolio Management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(programs.router, prefix="/api", tags=["programs"])
app.include_router(agent.router, prefix="/api", tags=["agent"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}
