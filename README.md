# Program Portfolio AI System

AI-powered Program Portfolio Management SaaS — executive dashboard, AI chat, Slack integration.

## Quick Start (Local Dev)

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2: Frontend (from repo root)
npm install && npm run dev
# Open http://localhost:3000
# Frontend proxies /api/py/* → FastAPI at :8000
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: FastAPI (Vercel Function), Supabase PostgreSQL + pgvector
- **AI**: Vercel AI Gateway (BYOK, multi-model) / Claude + OpenAI (prototype)
- **Auth**: Supabase Auth + Row-Level Security
- **Slack**: HTTP/Events API + Vercel Functions

## Project Structure

```
├── app/               # Next.js App Router (pages, layouts)
├── components/        # React components (KPIs, charts, chat widget)
├── lib/               # Frontend utilities (API client, mock data)
├── api/index.py       # Vercel Function entrypoint → imports FastAPI
├── backend/           # Python source (FastAPI, database, agent)
├── slack-bot/         # Slack bot (prototype mode)
├── data/              # Synthetic program data
├── vercel.json        # Vercel routing + function config
├── next.config.mjs    # Next.js config with API proxy rewrites
├── requirements.txt   # Python deps (for Vercel)
└── PRD.md             # Product requirements (v2.0)
```

## Deploy

```bash
vercel deploy
```

See [PRD.md](./PRD.md) for full requirements and architecture.
