# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PMO AI is an AI-powered Program Portfolio Management SaaS with an executive dashboard, AI chat assistant, and Slack integration. It uses a **Vercel monorepo** layout: a Next.js frontend at the repo root and a FastAPI Python backend in `backend/`.

## Development Commands

```bash
# Frontend (from repo root)
npm install
npm run dev          # Next.js dev server at :3000

# Backend (separate terminal)
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Lint
npm run lint         # ESLint (next/core-web-vitals + next/typescript)

# Build
npm run build        # Next.js production build

# Deploy
vercel deploy
```

Local dev requires **both** servers running. The frontend proxies `/api/py/*` to FastAPI at `:8000` via `next.config.mjs` rewrites.

## Architecture

### Dual-backend pattern

- **Next.js API routes** (`app/api/chat/route.ts`): Handle AI chat via Vercel AI SDK (`streamText`). Uses `@ai-sdk/openai` or `@ai-sdk/anthropic` based on `LLM_PROVIDER` env var. Fetches portfolio context from Supabase and streams responses.
- **FastAPI** (`backend/`): Handles all CRUD operations for programs, risks, milestones, and strategic objectives. Exposed in production as a single Vercel Python Function via `api/index.py`.

### Data flow

- Frontend calls `/api/py/*` for CRUD (routed to FastAPI) and `/api/chat` for AI chat (Next.js API route).
- `lib/api.ts`: Axios-based API client with `mapProgram()` that converts snake_case backend responses to camelCase frontend types.
- `lib/mockData.ts`: Contains TypeScript interfaces (`Program`, `Risk`, `Milestone`) and mock data used as type definitions throughout the frontend.

### Backend structure (`backend/`)

- `main.py`: FastAPI app with CORS, router registration, RAG init on startup. Uses `IS_VERCEL` flag to toggle API prefix between `/api/py` (Vercel) and `/api` (local).
- `api/programs.py`: CRUD routes for programs, risks, milestones.
- `api/strategic_objectives.py`: CRUD for strategic objectives.
- `api/agent.py`: Chat/agent endpoint (FastAPI-side, used by Slack bot).
- `database/db.py`: Direct PostgREST/httpx calls to Supabase (no supabase-py SDK — removed to stay under Vercel's 250MB bundle limit).
- `database/models.py`: Pydantic models for request/response schemas.
- `agent/rag.py`: pgvector-based RAG indexing and retrieval.
- `agent/query_handler.py`: Orchestrates structured DB queries + RAG for agent responses.
- `agent/llm_provider.py`: LLM abstraction layer (Claude/OpenAI).
- Backend imports use `try/except` for dual-mode: package import (Vercel) vs direct import (standalone `uvicorn`).

### Frontend structure

- `app/page.tsx`: Main dashboard page (client component) — KPI cards, program table, charts, chat widget all rendered here.
- `app/auth/page.tsx`: Supabase auth login/signup page.
- `app/admin/strategic-objectives/`: Admin page for managing strategic objectives.
- `app/programs/[id]/`: Individual program detail page.
- `components/`: Dashboard components — `ProgramTable`, `ProgramFormModal`, `ProgramDetailModal`, `ChatWidget`, `KPICard`, KPI detail modals, `charts/` subdirectory.
- `lib/auth-context.tsx`: React context wrapping Supabase Auth (used in `layout.tsx`'s `AuthProvider`).
- `middleware.ts`: Refreshes Supabase auth session on every request via `@supabase/ssr`.

### Auth

Supabase Auth with `@supabase/ssr`. The middleware refreshes sessions; auth redirects are client-side. The `AuthProvider` context exposes `user`, `session`, `signIn`, `signUp`, `signOut`.

### Database

Supabase PostgreSQL with pgvector. All queries are scoped by `organization_id` for multi-tenancy. The backend uses direct httpx calls to Supabase's PostgREST API (not the Python SDK).

## Key Conventions

- **Naming**: React components PascalCase, functions/variables camelCase, Python snake_case, constants UPPER_SNAKE_CASE.
- **Path alias**: `@/*` maps to repo root (e.g., `@/lib/api`, `@/components/KPICard`).
- **UI theme**: Dark glassmorphism with Plus Jakarta Sans font. Custom Tailwind colors: `surface`, `deep`, `accent-{violet,emerald,amber,rose}`. CSS utilities: `.glass`, `.card-hover`.
- **Chat widget**: Streams via SSE using Vercel AI SDK's `useChat` hook. KPI calculations happen client-side from a single `/api/py/programs` fetch.
- **LLM provider**: Controlled by `LLM_PROVIDER` env var (`openai` default, or `claude`/`anthropic`). Never hard-code providers — use the abstraction layer.
- **Environment**: Copy `.env.example` to `.env`. Required: Supabase credentials, at least one LLM API key. See `.env.example` for all variables.

## Vercel Deployment

`vercel.json` rewrites `/api/py/*` to `api/index.py` (Python function with `@vercel/python@6.9.0`, 60s max duration). Root `requirements.txt` is kept minimal for the 250MB bundle limit — this is why supabase-py was removed in favor of direct httpx PostgREST calls.

- Production URL: https://pmo-ai.vercel.app
