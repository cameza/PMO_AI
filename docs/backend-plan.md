# Backend Prototype Plan — February 2, 2026

This document outlines the tasks for Stream C and D. Each stream can be worked on by a separate agent/IDE.

---

## Stream C: Backend — Data & Database

### C1. Set Up Python Environment
**Location:** `/backend/`

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic sqlalchemy
pip freeze > requirements.txt
```

### C2. Create Database Models
**File:** `backend/database/models.py`

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

---

## Stream D: Backend — AI Agent & API

### D1. Create FastAPI Main Entry
**File:** `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Portfolio AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], ...)
```

### D2. Create Programs API
**File:** `backend/api/programs.py`
Endpoints for `GET /api/programs` and `GET /api/programs/{id}`.

### D3. Create Agent Chat Stub
**File:** `backend/api/agent.py`
Streaming endpoint for `/api/agent/chat`.

---
*Refer to `PRD.md` for full context.*
