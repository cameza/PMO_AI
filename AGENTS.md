# PMO AI System - Agent Instructions

## Project Overview
AI-powered Program Portfolio Management SaaS. See PRD.md (v2.0) for complete requirements.

## Architecture
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind — at repo root
- **Backend (Data CRUD)**: FastAPI + Python 3.11+ — in `backend/`, exposed via `api/index.py` as Vercel Function
- **Backend (AI Chat)**: Next.js API route using Vercel AI SDK (planned) — in `app/api/chat/`
- **Database**: Supabase PostgreSQL + pgvector (production) / SQLite + ChromaDB (prototype)
- **LLM**: Vercel AI Gateway with BYOK (production) / Custom llm_provider.py (prototype)
- **Slack**: HTTP/Events API + Vercel Functions (production) / Slack Bolt Socket Mode (prototype)

## Repo Structure (Vercel Monorepo)
- `app/`, `components/`, `lib/` — Next.js frontend (at repo root)
- `api/index.py` — Vercel Function entrypoint, imports FastAPI from `backend/`
- `backend/` — Python source (FastAPI, database, agent logic)
- `slack-bot/` — Slack bot (prototype mode)
- `vercel.json` — Vercel routing config
- `next.config.mjs` — Next.js config with `/api/py/*` → FastAPI proxy (dev mode)

## Code Style (Global)
- React Components: PascalCase (e.g., KPICard.tsx)
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Python: snake_case for modules

## Build Commands
```bash
# Frontend (from repo root)
npm install && npm run dev

# Backend (standalone, for local dev)
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Both together (local dev)
# Terminal 1: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
# Terminal 2: npm run dev (from repo root)
# Frontend at :3000 proxies /api/py/* to FastAPI at :8000

# Deploy
vercel deploy
```

## Critical Constraints (from PRD v2.0)
- All AI responses must be grounded in data — no hallucinations
- No API keys in code — use .env / Vercel env vars / Supabase Vault
- LLM calls route through Vercel AI Gateway (production) or abstraction layer (prototype)
- All queries must be scoped by organization_id (production multi-tenancy)
- Customer API keys encrypted at rest via Supabase Vault
- Backend imports use try/except for dual-mode (package import for Vercel, direct for standalone)

## Work Coordination
- Check WORK.md for current feature assignments
- Each agent works on dedicated feature branches
- Prefix branches: feature/frontend-* or feature/backend-*
