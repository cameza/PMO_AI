from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import concurrent.futures
from pathlib import Path
from dotenv import load_dotenv

try:
    # When imported as a package (e.g., from Vercel via backend.main)
    from backend.api import programs, agent, strategic_objectives
    from backend.database.db import init_db
    from backend.agent.rag import index_portfolio_data, get_rag_stats, set_rag_ready
except ImportError:
    # When run directly (e.g., uvicorn main:app from backend/)
    from api import programs, agent, strategic_objectives
    from database.db import init_db
    from agent.rag import index_portfolio_data, get_rag_stats, set_rag_ready

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file in project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
logger.info(f"Loading .env from: {env_path} (exists: {env_path.exists()})")

app = FastAPI(
    title="Portfolio AI API",
    description="AI-powered Program Portfolio Management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# On Vercel, requests arrive as /api/py/... (via vercel.json rewrite).
# Locally, next.config.mjs rewrites /api/py/:path* → localhost:8000/api/:path*
IS_VERCEL = bool(os.environ.get("VERCEL"))
API_PREFIX = "/api/py" if IS_VERCEL else "/api"

app.include_router(programs.router, prefix=API_PREFIX, tags=["programs"])
app.include_router(agent.router, prefix=API_PREFIX, tags=["agent"])
app.include_router(strategic_objectives.router, prefix=f"{API_PREFIX}/strategic-objectives")


def _check_existing_embeddings() -> int:
    """Check if embeddings already exist in pgvector."""
    try:
        from backend.database.db import _get, _get_org_id
    except ImportError:
        from database.db import _get, _get_org_id
    org_id = _get_org_id()
    rows = _get("embeddings", {"select": "id", "organization_id": f"eq.{org_id}", "limit": "1"})
    return len(rows)


def init_rag_with_timeout(timeout: int = 60) -> int:
    """
    Initialize RAG index with a timeout to prevent startup hang.
    Skips re-indexing if embeddings already exist in pgvector.
    
    Args:
        timeout: Maximum seconds to wait for RAG initialization
        
    Returns:
        Number of documents indexed, or 0 if timeout/error
    """
    # Check if embeddings already exist
    existing = _check_existing_embeddings()
    if existing > 0:
        logger.info(f"pgvector already has {existing} embeddings — skipping re-index")
        set_rag_ready(True)
        return existing

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(index_portfolio_data)
        try:
            doc_count = future.result(timeout=timeout)
            set_rag_ready(True)
            return doc_count
        except concurrent.futures.TimeoutError:
            logger.warning(f"RAG initialization timed out after {timeout}s - using fallback mode")
            set_rag_ready(False)
            return 0
        except Exception as e:
            logger.error(f"RAG initialization failed: {e}")
            set_rag_ready(False)
            return 0


@app.on_event("startup")
async def startup_event():
    """Initialize database and RAG index on startup."""
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed (non-fatal): {e}")
    
    # Index portfolio data into pgvector for RAG (skips if already seeded)
    logger.info("Starting RAG initialization...")
    try:
        doc_count = init_rag_with_timeout(timeout=30)
        if doc_count > 0:
            logger.info(f"RAG ready with {doc_count} documents")
        else:
            logger.warning("RAG not available - chat will use structured queries only")
    except Exception as e:
        logger.error(f"Failed to initialize RAG index: {e}")
        set_rag_ready(False)


@app.get(f"{API_PREFIX}/health")
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    rag_stats = get_rag_stats()
    return {
        "status": "healthy",
        "version": "1.0.0",
        "rag": rag_stats
    }
