"""
Vercel Function entrypoint for FastAPI backend.
Vercel auto-detects this file and serves it as a Python serverless function.
"""
import sys
from pathlib import Path

# Add backend directory to Python path so imports work
backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app
