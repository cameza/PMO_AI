# Current Work - Week of Feb 2, 2026

## Active Feature Branches
- `feature/backend-data-db` (Windsurf) → Stream C: Data & Database
- `feature/backend-api` (Windsurf) → Stream D: AI Agent & API

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
- **Handoff**: Backend API ready → Frontend can integrate
 
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
*Refer to `PRD.md` for full context.*
