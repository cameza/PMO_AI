# PMO AI System - Agent Instructions

## Project Overview
AI-powered Program Portfolio Management system. See PRD.md for complete requirements.

## Architecture
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Backend**: FastAPI + Python 3.11+ + SQLite/ChromaDB
- **Integration**: Slack Bolt

## Code Style (Global)
- React Components: PascalCase (e.g., KPICard.tsx)
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Python: snake_case for modules

## Build Commands
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && python -m venv venv && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## Critical Constraints (from PRD)
- All AI responses must be grounded in SQLite/ChromaDB data
- No API keys in code - use .env only
- LLM provider must route through abstraction layer
- No authentication in prototype phase

## Work Coordination
- Check WORK.md for current feature assignments
- Each agent works on dedicated feature branches
- Prefix branches: feature/frontend-* or feature/backend-*
