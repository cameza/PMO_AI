# Current Work - Week of Feb 2, 2026

## Active Feature Branches
- `feature/frontend-integration` (Frontend) → Stream F: Integration & Features
- `feature/backend-agent` (Backend) → Stream B: AI Agent Core
- `feature/slack-bot` (Backend) → Stream S: Slack Integration

### Completed Branches
- `feature/backend-data-db` (Windsurf) → Stream C: Data & Database ✓
- `feature/backend-api` (Windsurf) → Stream D: AI Agent & API ✓
- `feature/frontend-polish` (Antigravity) → Stream E: UI Polish & Responsiveness ✓

---

## Stream C: Backend — Data & Database (Windsurf)

### C1. Set Up Python Environment
**Location:** `/backend/`
- [x] Create `requirements.txt`

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### C2. Create Database Models
**File:** `backend/database/models.py`
- [x] Pydantic models for Program, Risk, Milestone
- [x] Enums for ProgramStatus, PipelineStage, RiskSeverity

```python
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class ProgramStatus(str, Enum):
    ON_TRACK = "On Track"
    AT_RISK = "At Risk"
    OFF_TRACK = "Off Track"
    COMPLETED = "Completed"

class PipelineStage(str, Enum):
    DISCOVERY = "Discovery"
    PLANNING = "Planning"
    IN_PROGRESS = "In Progress"
    LAUNCHING = "Launching"
    COMPLETED = "Completed"

class RiskSeverity(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Risk(BaseModel):
    id: str
    program_id: str
    title: str
    severity: RiskSeverity
    description: str
    mitigation: str
    status: str

class Milestone(BaseModel):
    id: str
    program_id: str
    name: str
    due_date: str
    completed_date: Optional[str] = None
    status: str

class Program(BaseModel):
    id: str
    name: str
    description: str
    status: ProgramStatus
    owner: str
    team: str
    product_line: str
    pipeline_stage: PipelineStage
    strategic_objectives: List[str]
    launch_date: str
    progress: int
    risks: List[Risk] = []
    milestones: List[Milestone] = []
    last_update: str
```

### C3. Create SQLite Database Connection
**File:** `backend/database/db.py`
- [x] SQLite connection with row factory
- [x] Schema initialization (programs, risks, milestones tables)
- [x] Query functions

```python
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "data" / "portfolio.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS programs (...)''')
    # ... (full schema in task.md)
    conn.commit()
    conn.close()
```

### C4. Synthetic Data
**File:** `data/synthetic_programs.json`
- [x] 18 programs ported from `frontend/lib/mockData.ts`

### C5. Seed Script
**File:** `backend/database/seed.py`
- [x] Reads JSON, populates SQLite
- [x] Idempotent (clears + re-seeds)

---

## Stream D: Backend — AI Agent & API (Windsurf)

### D1. Create FastAPI Main Entry
**File:** `backend/main.py`
- [x] FastAPI app with CORS middleware

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Portfolio AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], ...)
```

### D2. Create Programs API
**File:** `backend/api/programs.py`
- [x] `GET /api/programs` - List all programs (supports `?status=` and `?product_line=` filters)
- [x] `GET /api/programs/{id}` - Get program by ID

### D3. Create Agent Chat Stub
**File:** `backend/api/agent.py`
- [x] `POST /api/agent/chat` - Streaming SSE endpoint (stub, RAG TBD)
- [x] `POST /api/agent/summary` - Portfolio summary endpoint (stub)

---

## Integration Points This Week
- [x] Database schema finalized (Stream C)
- [x] `GET /api/programs` contract defined (Stream D)
- [x] `POST /api/agent/chat` SSE contract defined (Stream D)
- [x] Frontend mobile responsiveness complete (Stream E)
- **Handoff**: Full backend + frontend ready for RAG integration

## Completed This Week
- **Stream C**: SQLite database with 18 programs, 8 risks, 19 milestones
- **Stream D**: FastAPI with REST endpoints and SSE chat stub
- **Stream E**: Mobile-responsive dashboard with polished UI
 
---
 
## Stream E: Frontend — UI Polish & Responsiveness
 
### E1. Mobile Responsiveness
**Location:** `frontend/app/dashboard-compact/page.tsx`
- [x] Implement horizontal swipe carousels for KPI cards and Charts
- [x] Add CSS Scroll Snap behavior for mobile viewports
- [x] Hide AI Chat sidebar on mobile to optimize space
 
### E2. Visual Consistency & Refinements
**Location:** `frontend/components/`
- [x] Enforce uniform height for all KPI cards (Flexbox)
- [x] Enforce uniform height for all Chart cards (Flexbox)
- [x] Add value labels to `LaunchCadenceChart` bars
- [x] Optimize legend font sizes (10px in compact mode)
- [x] Fix data mapping/keys in all chart components to match `mockData.ts`
- [x] Remove duplicate legends in Risk and Alignment charts
 
---
 
## Blocked/Questions
- None currently

---

## Stream F: Frontend — Integration & Features

### F1. Frontend-Backend Integration ⚡ HIGH PRIORITY
**Files:** `frontend/lib/api.ts`, `frontend/app/page.tsx`, `frontend/app/dashboard-compact/page.tsx`
- [ ] Replace `mockData.ts` imports with API calls to `http://localhost:8000/api/programs`
- [ ] Add loading states and error handling
- [ ] Test with backend running at port 8000
> **Dependency:** None (can start immediately)

### F2. Program Table Filtering
**File:** `frontend/components/ProgramTable.tsx`
- [x] Add filter dropdowns for Status and Product Line
- [x] Wire filters to table rendering logic
> **Status:** Completed ✓

### F3. Program Detail Page
**File:** `frontend/app/programs/[id]/page.tsx` (new)
- [ ] Create dynamic route for individual program view
- [ ] Display: description, status, product line, pipeline stage, owner, team, launch date, progress, strategic objectives
- [ ] List all risks with severity and mitigation
- [ ] List all milestones with due dates and completion status
- [ ] Fetch from `GET /api/programs/:id`
> **Dependency:** F1 (needs API integration pattern established)

### F4. Functional Chat Widget
**File:** `frontend/components/ChatWidget.tsx`
- [ ] Connect to `POST /api/agent/chat` SSE endpoint
- [ ] Implement streaming response display (character by character)
- [ ] Maintain conversation history in session state
- [ ] Add proactive insight on dashboard load (call agent on mount)
> **Dependency:** B4 (backend agent endpoint must be functional)

### F5. Context-Aware Chat
**File:** `frontend/components/ChatWidget.tsx`
- [ ] Pass `context.programId` when chat opened on `/programs/[id]` page
> **Dependency:** F3 + F4 (needs detail page and functional chat)

---

## Stream B: Backend — AI Agent Core

### B1. LLM Provider Abstraction ⚡ HIGH PRIORITY
**Files:** `backend/agent/llm_provider.py` (new), `backend/agent/prompts.py` (new)
- [ ] Create `LLMProvider` base class with `generate()` and `stream()` methods
- [ ] Implement `ClaudeProvider` (Anthropic claude-sonnet-4-20250514)
- [ ] Implement `OpenAIProvider` (GPT-4)
- [ ] Provider selected via `LLM_PROVIDER` env var
- [ ] Prompt templates adapt to provider (XML tags for Claude)
> **Dependency:** None (can start immediately)

### B2. RAG Implementation
**File:** `backend/agent/rag.py` (new)
- [ ] Set up ChromaDB in-memory vector store
- [ ] Embed program descriptions, update narratives, risk descriptions at startup
- [ ] Implement semantic search function for retrieval
> **Dependency:** B1 (needs LLM provider for embeddings or sentence-transformers)

### B3. Query Handler — Agent Orchestration
**File:** `backend/agent/query_handler.py` (new)
- [ ] Receive user query + conversation history
- [ ] Determine if query needs vector search, SQL query, or both
- [ ] Assemble context from retrieved chunks
- [ ] Call LLM with grounded context
- [ ] Return streaming response
- [ ] Handle "I don't have information on that" gracefully
> **Dependency:** B1 + B2 (needs LLM provider and RAG)

### B4. Wire Agent to Chat Endpoint
**File:** `backend/api/agent.py`
- [ ] Replace stub with actual query_handler calls
- [ ] Implement proper SSE streaming from LLM
- [ ] Accept optional `context.programId` for context-aware responses
> **Dependency:** B3 (needs query handler complete)

### B5. Portfolio Summary Endpoint
**File:** `backend/api/agent.py`
- [ ] Implement `POST /api/agent/summary`
- [ ] Query DB for portfolio state, assemble context, generate narrative summary
> **Dependency:** B3 (needs query handler for LLM generation)

---

## Stream S: Backend — Slack Integration

### B6. Slack Bot Core
**Files:** `slack-bot/app.py` (new), `slack-bot/handlers/messages.py` (new), `slack-bot/requirements.txt` (new)
- [ ] Set up Slack Bolt app
- [ ] Handle `message.im` (DMs) and `app_mention` events
- [ ] Forward messages to `POST /api/agent/chat`
- [ ] Post responses back to Slack
> **Dependency:** B4 (agent endpoint must be functional)

### B7. Monday Morning Summary
**File:** `slack-bot/handlers/notifications.py` (new)
- [ ] Implement scheduler (APScheduler) for Monday 9 AM
- [ ] Call `POST /api/agent/summary`
- [ ] Post generated summary to configured Slack channel
> **Dependency:** B5 + B6 (needs summary endpoint and Slack bot running)

---

## Dependencies & Critical Path

### Backend Critical Path (Sequential)
```
B1 (LLM Provider) → B2 (RAG) → B3 (Query Handler) → B4 (Chat Endpoint) → B5 (Summary)
                                                   ↓
                                              B6 (Slack Bot) → B7 (Monday Summary)
```

### Frontend Dependencies
| Task | Can Start When |
|------|----------------|
| F1 | Immediately |
| F2 | Immediately |
| F3 | After F1 |
| F4 | After B4 complete |
| F5 | After F3 + F4 |

### Tasks Ready to Assign Now
- **Frontend:** F1, F2
- **Backend:** B1

---

## Environment Setup Required
```bash
# Add to .env
LLM_PROVIDER=claude          # or "openai"
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_CHANNEL_ID=C...        # For Monday summary
```

---
*Refer to `PRD.md` for full context.*
