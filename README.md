# Program Portfolio AI System

An AI-powered Program Portfolio Management system with an executive dashboard and Slack integration.

## Quick Start

### Frontend (Dashboard)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Backend (Not yet implemented)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python database/seed.py   # Populate with synthetic data
uvicorn main:app --reload --port 8000
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: Python, FastAPI, SQLite, ChromaDB (planned)
- **AI**: Claude/OpenAI via LlamaIndex (planned)
- **Slack**: Bolt for Python (planned)

## Project Structure

```
├── frontend/          # Next.js dashboard application
├── backend/           # FastAPI server (planned)
├── slack-bot/         # Slack integration (planned)
├── data/              # Synthetic program data
└── PRD.md             # Product requirements
```

## Features

- **Executive Dashboard**: KPI cards, velocity funnel, strategic alignment, risk landscape
- **AI Assistant**: Context-aware Q&A with proactive insights
- **Program Table**: Filterable view of all programs with status tracking

See [PRD.md](./PRD.md) for full requirements.
