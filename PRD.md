# Product Requirements Document: Program Portfolio AI System

> **Version:** 1.1  
> **Last Updated:** February 1, 2026  
> **Owner:** [Your Name/Team]  
> **Scope:** Prototype (Week 1 Demo)

---

## Objective

### Problem Statement
Program managers today spend significant time manually compiling status updates, tracking risks across dozens of programs, and communicating portfolio health to stakeholders. Critical risks get buried in spreadsheets and slide decks. Teams lack real-time visibility into portfolio health, and there is no proactive mechanism to surface issues before they escalate. Executives need a single source of truth for program portfolio decisions, and the tools that exist today require manual effort to maintain.

### Goals
- Build a working prototype that demonstrates an AI-powered Program Portfolio Management system end-to-end within one week
- Prove the core value proposition: an AI agent that can answer questions about a program portfolio, grounded in real data, without hallucinating
- Demonstrate the system working across two interfaces — an executive dashboard and Slack — using the same underlying AI agent
- Validate the multi-LLM architecture: allow the system to operate with different LLM providers via a bring-your-own-API-key model
- Establish the prototype as a foundation for a production-grade product and a demo artifact for securing design partners or funding

### Target Users
**Primary (Prototype Demo Audience):**
- Stakeholders and decision-makers evaluating the concept
- Potential design partner contacts at prospective customer companies

**End Users (for production, informing prototype design):**
- **Executive Sponsors** — need a high-level portfolio health view at a glance
- **Program Managers** — need to track status, risks, and milestones for programs they own
- **Team Members** — need quick answers about program status without context-switching out of Slack
- **Portfolio Leads** — need cross-program visibility: what's launching, what's at risk, what needs attention

---

## Tech Stack

### Frontend
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS for styling
- Recharts for data visualizations (KPI charts, status distribution)
- Server-Sent Events (SSE) for streaming AI chat responses
- Starting point: [AI Missions Week 04 Data Analyst](https://github.com/cameza/ai-missions-system/tree/main/Missions/week-04-data-analyst) — provides KPI card, chart, and table components to adapt

### Backend
- Python 3.11+ with FastAPI
- SQLite for program data storage (prototype only; PostgreSQL targeted for production)
- ChromaDB (in-memory) for vector storage and RAG retrieval (prototype only; Pinecone or Weaviate targeted for production)
- LlamaIndex for RAG orchestration and LLM provider abstraction

### Slack Integration
- Slack Bolt (Python) for the bot framework
- Communicates with the same FastAPI backend as the dashboard

### LLM Providers (Prototype)
- Anthropic Claude (primary: claude-sonnet-4-20250514)
- OpenAI GPT-4 (secondary, to demonstrate multi-LLM support)
- Provider is selected via environment variable; API key is user-supplied

### Infrastructure & Tools (Prototype)
- Local development only (no cloud deployment required for prototype)
- Git + GitHub for version control
- `.env` file for secrets management (API keys, Slack tokens)

---

## Commands

### Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python database/seed.py           # Populate SQLite with synthetic data
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev                       # http://localhost:3000

# Slack Bot
cd slack-bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Build & Deployment
```bash
# Not applicable for prototype — runs locally only
# Production deployment commands will be defined in a later phase
```

---

## Project Structure

```
program-portfolio-ai-prototype/
├── .env.example                      # Template for all required API keys and tokens
├── README.md
├── data/
│   └── synthetic_programs.json       # Seed dataset: ~20 synthetic programs
├── backend/
│   ├── main.py                       # FastAPI application entry point
│   ├── requirements.txt
│   ├── database/
│   │   ├── db.py                     # SQLite connection and initialization
│   │   ├── models.py                 # Pydantic data models for programs, risks, milestones
│   │   └── seed.py                   # Reads synthetic_programs.json, populates DB
│   ├── agent/
│   │   ├── llm_provider.py           # LLM abstraction layer (Claude, OpenAI)
│   │   ├── rag.py                    # ChromaDB vector store setup and retrieval
│   │   ├── query_handler.py          # Main agent orchestration: intent → retrieval → generation
│   │   └── prompts.py                # System prompts and response templates per provider
│   └── api/
│       ├── programs.py               # REST endpoints: list, get, filter programs
│       └── agent.py                  # Chat endpoint: receives query, returns AI response via SSE
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   │   ├── layout.tsx                # Global layout, includes ChatWidget
│   │   ├── page.tsx                  # Dashboard home: KPIs + chart + program table
│   │   └── programs/
│   │       └── [id]/page.tsx         # Individual program detail page
│   ├── components/
│   │   ├── KPICard.tsx               # Reusable metric card (adapted from AI Missions)
│   │   ├── ProgramTable.tsx          # Filterable/sortable program list
│   │   ├── charts/
│   │   │   ├── ProgramVelocityChart.tsx   # Horizontal funnel: programs by pipeline stage
│   │   │   ├── StrategicAlignmentChart.tsx # Stacked bar: programs per objective, segmented by status
│   │   │   ├── LaunchCadenceChart.tsx     # Monthly bar: launches over next 6 months
│   │   │   └── RiskLandscapeChart.tsx     # Stacked bar: open risks per product line by severity
│   │   └── ChatWidget.tsx            # Expandable AI chat bubble (bottom-right)
│   └── lib/
│       └── api.ts                    # Axios client for backend API calls
└── slack-bot/
    ├── app.py                        # Slack Bolt application entry point
    ├── requirements.txt
    └── handlers/
        ├── messages.py               # Handles DMs and @mentions → calls backend agent API
        └── notifications.py          # Scheduled job: generates and posts morning summary
```

---

## Code Style

### Naming Conventions
- **React Components:** PascalCase (e.g., `KPICard.tsx`, `ChatWidget.tsx`)
- **Functions / Variables:** camelCase (e.g., `fetchPrograms`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `LLM_PROVIDER`)
- **Python modules:** snake_case (e.g., `llm_provider.py`, `query_handler.py`)
- **Files (frontend):** PascalCase for components, camelCase for utilities

### Code Patterns

**React Component (TypeScript):**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function KPICard({ title, value, subtitle, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
```

**API Call Pattern (Frontend):**
```typescript
import axios from 'axios';

export async function fetchPrograms(): Promise<Program[]> {
  try {
    const response = await axios.get<Program[]>('/api/programs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    throw error;
  }
}
```

**LLM Provider Abstraction (Backend):**
```python
# All LLM providers implement the same interface.
# query_handler.py never needs to know which provider is active.

class LLMProvider:
    def __init__(self, api_key: str, model_name: str): ...
    def generate(self, messages: list, context: str) -> str: ...
    def stream(self, messages: list, context: str) -> Iterator[str]: ...

class ClaudeProvider(LLMProvider): ...
class OpenAIProvider(LLMProvider): ...
```

### Error Handling
- All API calls wrapped in try/catch with explicit error logging
- Backend returns structured error responses (status code + message)
- Frontend displays user-facing error state (not raw stack traces)
- AI agent gracefully handles retrieval failures ("I wasn't able to find information on that")

---

## User Stories & Features

### Epic 1: Executive Dashboard

#### User Story 1.1 — Portfolio Overview
**As a** program portfolio stakeholder  
**I want** to see the overall health of all programs at a glance  
**So that** I can quickly identify where attention is needed without reading individual reports

**Acceptance Criteria — KPI Cards (Row 1):**

The four KPI cards each surface a distinct signal. Together they answer: *Are we aligned? Are we dangerously concentrated? Are we delivering? What's imminent?*

- [x] **Strategic Coverage Score** — displays the percentage of defined strategic objectives that have at least one active program mapped to them (e.g., "7 of 9 objectives covered"). Subtitle shows which objectives have zero coverage.
- [x] **Product Lines Under Pressure** — displays the count of product lines that currently have 2 or more programs in At Risk or Off Track status (e.g., "2 product lines"). Subtitle identifies which product lines are flagged.
- [x] **Milestone Completion Rate** — displays the percentage of milestones due in the current month that have been marked Completed (e.g., "72% on track"). Subtitle shows the raw counts (e.g., "8 of 11 completed").
- [x] **Upcoming Launches** — displays the count of programs with a launch date within the next 30 days (e.g., "4 launching"). Subtitle shows the nearest launch date.

**Acceptance Criteria — Charts (Row 2):**

Each chart visually expands on or grounds one of the KPI cards above, giving the exec a reason to look deeper.

- [x] **Program Velocity** — a horizontal funnel or pipeline chart showing program counts at each stage: Discovery → Planning → In Progress → Launching → Completed. Makes throughput bottlenecks visible (e.g., if programs are pooling in Planning). Recommended chart type: horizontal stacked or segmented bar.
- [x] **Strategic Alignment** — a grouped or stacked bar chart with strategic objectives (or product lines) on the x-axis and program count on the y-axis. Bars are segmented by program status (On Track / At Risk / Off Track) so the viewer can see not just how many programs serve each objective, but how healthy that group is. Visually reinforces the Product Lines Under Pressure KPI.
- [x] **Launch Cadence** — a monthly bar chart showing the number of programs launching in each of the next 6 months, with the current month visually highlighted. Turns the Upcoming Launches KPI into a forward-looking scheduling view — makes it obvious if launches are dangerously clustered in one month.
- [x] **Risk Landscape** — a stacked bar chart with product lines on the x-axis, showing the count of open risks per product line, segmented by severity (High / Medium / Low). Visually grounds the Product Lines Under Pressure KPI by showing *what* is driving the pressure and *where*.

**Acceptance Criteria — Program Table (Row 3):**
- [x] A program table lists all programs with columns: Name, Status, Product Line, Owner, Team, Launch Date, Pipeline Stage
- [x] The table supports filtering by status (On Track / At Risk / Off Track) and by product line

**Technical Notes:**
- KPI card and chart components adapted from AI Missions Week 04 codebase
- All four charts use Recharts; component types are specified per chart above
- A single `GET /api/programs` call on page load returns all data needed to compute KPIs and populate charts client-side — no separate endpoints per widget
- Strategic objectives are defined as a static config list in the prototype (e.g., 9 objectives). Production will allow admin configuration.

#### User Story 1.2 — Program Detail View
**As a** program manager  
**I want** to see all details for a specific program on a dedicated page  
**So that** I can review risks, milestones, and recent updates without scrolling through a large table

**Acceptance Criteria:**
- [ ] Clicking a program in the table navigates to a detail page
- [ ] Detail page shows: description, status, product line, pipeline stage, owner, team, launch date, progress percentage, strategic objectives mapped
- [ ] All risks associated with the program are listed with severity and mitigation plan
- [ ] All milestones are listed with due dates and completion status

**Technical Notes:**
- Route: `/programs/[id]`
- Data fetched from `GET /api/programs/:id`

---

### Epic 2: AI Agent — Dashboard Chat

#### User Story 2.1 — Ask Questions About the Portfolio
**As a** dashboard user  
**I want** to ask natural language questions about my programs  
**So that** I can get instant answers without manually searching through data

**Acceptance Criteria:**
- [ ] A chat widget is visible in the bottom-right corner of every dashboard page
- [ ] The widget expands into a conversational interface when clicked
- [ ] The user can type a question and receive an AI-generated response
- [ ] Responses stream in real-time (character by character) rather than appearing all at once
- [ ] The AI's response is grounded in the program dataset — it does not fabricate program names, statuses, or details
- [ ] The chat maintains conversation history for the duration of the session (page refreshes may reset)
- [ ] **Proactive Insight Surfacing** — When the dashboard loads, the agent automatically analyzes the current portfolio state and surfaces one actionable insight before the user types anything.

### Mobile Responsiveness
- [x] **Carousels for Cards** — On mobile devices (max-width: 768px), KPI cards and Charts must be displayed in a horizontal carousel where only one item is fully visible at a time ("front and center").
- [x] **Swipe Interaction** — Users must be able to swipe horizontally to view the next KPI or Chart.
- [x] **Layout Adaptation** — The side-by-side or grid layouts used on desktop must switch to stacked, swipeable rows on mobile.

**Acceptance Criteria — Sample Questions That Must Work:**
- [ ] "What programs are launching this quarter?"
- [ ] "Show me all at-risk programs"
- [ ] "What is the status of Project Phoenix?"
- [ ] "Which programs in the Smart Home product line are at risk?"
- [ ] "What are the main risks across all programs?"
- [ ] "Give me a summary of engineering programs"

**Technical Notes:**
- Chat widget calls `POST /api/agent/chat` with the user's message and conversation history
- Backend uses RAG (ChromaDB vector search + SQLite query) to retrieve context before calling the LLM
- Response streamed back via SSE

#### User Story 2.2 — Context-Aware Chat
**As a** dashboard user viewing a specific program  
**I want** the AI to know which program I'm currently looking at  
**So that** I can ask follow-up questions like "What are the risks?" without re-specifying the program

**Acceptance Criteria:**
- [ ] When the chat widget is opened on a program detail page, the current program context is included in the request to the AI agent
- [ ] The AI correctly interprets ambiguous questions relative to the current program

**Technical Notes:**
- Frontend passes an optional `context.programId` field in the chat request payload
- Backend injects the relevant program data into the prompt context when present

---

### Epic 3: AI Agent — Slack Bot

#### User Story 3.1 — Ask Questions in Slack
**As a** team member  
**I want** to ask the bot questions about programs directly in Slack  
**So that** I can get answers without leaving my primary communication tool

**Acceptance Criteria:**
- [ ] A user can DM the bot with a program-related question and receive a relevant answer
- [ ] A user can @mention the bot in a channel and the bot replies in-thread
- [ ] The bot's responses are grounded in the same dataset as the dashboard (no hallucinations)
- [ ] The bot handles questions it cannot answer gracefully (e.g., "I don't have information on that topic")

**Technical Notes:**
- Slack Bolt listens for `message.im` and `app_mention` events
- Handlers extract the message text and forward it to the backend `POST /api/agent/chat`
- Response posted back to Slack via the Bolt SDK

#### User Story 3.2 — Proactive Morning Summary
**As a** program portfolio stakeholder  
**I want** to receive an AI-generated summary of my portfolio every Monday morning  
**So that** I start the week informed about what's launching, what's at risk, and what needs attention

**Acceptance Criteria:**
- [ ] Every Monday at 9:00 AM, the bot posts a summary to a configured Slack channel
- [ ] The summary includes: portfolio health overview, programs launching that week, any programs currently At Risk or Off Track
- [ ] The summary is written in natural language by the AI (not a raw data dump)
- [ ] The summary is accurate to the current state of the synthetic dataset

**Technical Notes:**
- A cron job (or equivalent scheduler) triggers at 9:00 AM Monday
- The job queries the program database, assembles context, and calls the LLM to generate a narrative summary
- The generated message is posted to the Slack channel configured in `.env`

---

### Epic 4: Multi-LLM Support

#### User Story 4.1 — Swap LLM Providers Without Code Changes
**As a** developer or system administrator  
**I want** to switch the AI agent between Claude and OpenAI by changing a config value  
**So that** the system can work with whatever LLM provider a customer is already paying for

**Acceptance Criteria:**
- [ ] Setting `LLM_PROVIDER=claude` and providing a valid Anthropic API key makes the agent use Claude
- [ ] Setting `LLM_PROVIDER=openai` and providing a valid OpenAI API key makes the agent use GPT-4
- [ ] Both providers return coherent, grounded answers to the same questions
- [ ] No application code changes are required to switch providers — only `.env` values

**Technical Notes:**
- `llm_provider.py` implements a common interface; `query_handler.py` is provider-agnostic
- Prompt templates in `prompts.py` adapt formatting to the active provider (e.g., XML tags for Claude, standard format for OpenAI)

---

## Technical Specifications

### Architecture Overview

The prototype follows a simple three-service architecture. The frontend (Next.js) and the Slack bot both communicate with a single FastAPI backend. The backend owns the AI agent logic: it handles RAG retrieval from ChromaDB, queries the SQLite program database, and calls the configured LLM provider. The LLM provider is abstracted behind a common interface so the agent layer never needs to know which model is active.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  KPI Cards   │  │  AI Chat     │      │
│  │  (Programs)  │  │  & Charts    │  │  Widget      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / SSE
┌────────────────────────────▼────────────────────────────────┐
│              BACKEND API (FastAPI)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Agent Service                                     │   │
│  │  ├── Query Handler (orchestration)                    │   │
│  │  ├── LLM Router (Claude / OpenAI)                     │   │
│  │  └── RAG (ChromaDB in-memory)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Program Data Service (SQLite)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│              SLACK BOT (Bolt)                                 │
│  ├── Message handler (DMs, @mentions)                        │
│  └── Notification scheduler (Monday summary)                │
└──────────────────────────────────────────────────────────────┘
```

### Data Models

**Program:**
```typescript
interface Program {
  id: string;                          // e.g., "prog-001"
  name: string;                        // e.g., "Project Phoenix"
  description: string;
  status: "On Track" | "At Risk" | "Off Track" | "Completed";
  owner: string;                       // Display name
  team: string;                        // e.g., "Mobile Engineering"
  productLine: string;                 // e.g., "Smart Home", "Video", "Mobile"
  pipelineStage: "Discovery" | "Planning" | "In Progress" | "Launching" | "Completed";
  strategicObjectives: string[];       // Maps to org's defined objectives, e.g., ["Expand IoT ecosystem", "Improve user retention"]
  launchDate: string;                  // ISO date string
  progress: number;                    // 0–100
  risks: Risk[];
  milestones: Milestone[];
  lastUpdate: string;                  // Narrative text of most recent update
}
```

**Risk:**
```typescript
interface Risk {
  id: string;
  programId: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  mitigation: string;
  status: "Open" | "Mitigated" | "Closed";
}
```

**Milestone:**
```typescript
interface Milestone {
  id: string;
  programId: string;
  name: string;
  dueDate: string;
  completedDate: string | null;
  status: "Upcoming" | "Completed" | "Overdue";
}
```

**AI Agent Chat Request / Response:**
```typescript
// Request
interface ChatRequest {
  message: string;
  history: ChatMessage[];             // Prior messages in this session
  context?: {
    programId?: string;               // Set when chat opened on a program detail page
  };
}

// Response (streamed via SSE; final event includes full structured payload)
interface ChatResponse {
  answer: string;
  sources: Source[];                  // Programs or documents referenced
  confidence: "high" | "medium" | "low";
}

interface Source {
  type: "program" | "document";
  id: string;
  title: string;
}
```

### API Endpoints

#### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | List all programs. Supports `?status=` filter |
| GET | `/api/programs/:id` | Get a single program by ID (includes risks, milestones) |

#### AI Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/chat` | Submit a chat message. Returns SSE stream of the AI response |
| POST | `/api/agent/summary` | (Internal) Generate a portfolio summary. Called by the Slack notification scheduler |

### Synthetic Dataset

The prototype ships with approximately 20 synthetic programs. The dataset is designed so that each KPI card and chart has enough variation to tell a compelling story during a demo — not a flat, uniform distribution, but one with visible patterns and tension.

**Product Lines in the dataset:** Video, Smart Home, Mobile, Platform (4 lines across ~20 programs)

**Strategic Objectives in the dataset:** 9 defined objectives. 7 are covered by at least one program; 2 are intentionally uncovered to make the Strategic Coverage Score meaningful (it should read "7 of 9" not "9 of 9").

| Scenario | Example Program | Product Line | Why It Matters for Demo |
|----------|----------------|--------------|------------------------|
| On Track, upcoming launch | Project Phoenix | Mobile | Healthy baseline; drives Launch Cadence chart |
| At Risk due to vendor delay | Project Titan | Smart Home | Risk Landscape chart; contributes to Smart Home pressure |
| Off Track, high-severity risk | Project Atlas | Smart Home | Second at-risk program in Smart Home → triggers Product Lines Under Pressure KPI |
| Recently completed | Project Orion | Video | Completed stage in Velocity funnel; historical data |
| Multiple high-severity risks | Project Nebula | Platform | Risk Landscape chart shows Platform as high-severity cluster |
| Launching this week | API Gateway v2 | Platform | Drives Monday summary; nearest date in Upcoming Launches KPI |
| Stuck in Planning | Data Pipeline Refresh | Video | Creates visible pooling in the Velocity funnel at Planning stage |
| Stuck in Planning | Content Recommendation Engine | Video | Second program in Planning → makes the bottleneck obvious in Velocity |
| In Progress, on track | Smart Home Hub v3 | Smart Home | Balances Smart Home so it's not all-red; adds depth to Strategic Alignment chart |
| In Discovery | Next-Gen Streaming | Video | Early-stage entry in Velocity funnel; maps to an uncovered strategic objective |
| Launching next month | Mobile Payments | Mobile | Populates Launch Cadence chart for the month after current |
| Launching next month | Voice Assistant 2.0 | Smart Home | Second launch next month; still manageable cadence |
| Launching in 3 months (clustered) | IoT Security Suite | Smart Home | First of a cluster in month +3 |
| Launching in 3 months (clustered) | Video Analytics Platform | Video | Second in the same month → Launch Cadence chart shows a spike |
| Launching in 3 months (clustered) | Mobile AR Features | Mobile | Third in the same month → spike becomes a visible risk |
| In Progress, milestone overdue | Connected Car Dashboard | Platform | Milestone Completion Rate KPI drops below 100%; flags execution risk |
| Completed last quarter | Legacy App Migration | Platform | Historical completed program; context for Velocity |
| In Progress, maps to uncovered objective | Accessibility Toolkit | Mobile | The second uncovered strategic objective; Strategic Coverage Score stays at 7/9 |

### RAG Implementation (Prototype)

The agent uses a hybrid retrieval approach to ground its responses:

1. **Vector Search (ChromaDB):** Program descriptions, update narratives, and risk descriptions are embedded and indexed at startup. Semantic queries ("What programs have vendor-related risks?") are answered via similarity search.
2. **Direct DB Query (SQLite):** Structured queries for precise lookups ("How many programs launch this week?", "Which programs are over budget?") are executed against SQLite.
3. **Context Assembly:** Retrieved chunks from both sources are assembled into the LLM's context window before generation. The prompt instructs the LLM to answer only from the provided context and to flag when it does not have enough information.

---

## Boundaries & Constraints

### ✅ Always Do
- Ground all AI responses in retrieved data — never allow the agent to answer from general knowledge about programs
- Include source references in AI responses so users can trace answers back to specific programs
- Handle LLM API errors gracefully (show a user-friendly message, do not crash)
- Keep API keys out of code — use `.env` files exclusively

### ⚠️ Ask First
- Adding new LLM providers beyond Claude and OpenAI
- Changing the synthetic dataset structure (may require re-seeding ChromaDB)
- Adding new Slack interaction patterns (slash commands, buttons, etc.)

### 🚫 Never Do
- Commit API keys, Slack tokens, or other secrets to the repository
- Allow the AI agent to make claims about programs that are not in the dataset
- Hard-code any LLM provider — everything must route through the abstraction layer
- Return raw database errors to the frontend

---

## Constraints & Non-Negotiables

### Prototype Constraints
- **No authentication** — the prototype runs in a demo mode with no login flow. All users see all data. Authentication is a production requirement and is deferred.
- **Single tenant** — no multi-tenant isolation in the prototype. The production architecture supports multi-tenancy; this is a scope reduction for speed.
- **Static data** — the synthetic dataset is seeded once at setup. There are no live ETL pipelines or real-time data updates in the prototype. The production version will integrate with tools like Jira, Asana, and others.
- **In-memory vector store** — ChromaDB runs in-memory. Data is re-indexed each time the backend starts. Production will use a persistent managed vector database.
- **Local deployment only** — the prototype is not deployed to a cloud environment. It runs entirely on the developer's machine.

### What This Prototype Does Not Prove (Deferred to Production)
- Scalability under real-world load
- Data security and tenant isolation
- Integration with external PM tools
- Slash commands in Slack
- Notification preference management
- Cost optimization across LLM providers

---

## Open Questions & Decisions Needed

- [ ] How many synthetic programs are enough to make the demo feel realistic? (Current target: ~20)
- [ ] Should the Monday summary notification also appear somewhere in the dashboard (e.g., a notification bell), or only in Slack for the prototype?
- [ ] For the multi-LLM demo: do we show the provider switch live during the demo, or just explain it and show configuration?
- [ ] Do we need a "reset data" button in the dashboard to re-seed the synthetic dataset for repeated demos?
- [ ] Which Slack workspace will we use for testing? (Need workspace with ability to install a custom app)

---

## References & Resources

### Related Documents
- Technical Design Document: `program-portfolio-ai-system.md` (companion document — contains full production architecture, platform evaluation, roadmap)

### Starting Point Codebase
- [AI Missions Week 04 — Data Analyst Dashboard](https://github.com/cameza/ai-missions-system/tree/main/Missions/week-04-data-analyst) — source of KPI card, chart, and table components for the frontend

### Key Libraries
- [LlamaIndex](https://docs.llamaindex.ai/) — RAG framework (Python)
- [ChromaDB](https://docs.trychroma.com/) — In-memory vector store
- [Slack Bolt for Python](https://api.slack.com/tools/bolt/python) — Slack bot framework
- [FastAPI](https://fastapi.tiangolo.com/) — Backend API framework
- [Next.js](https://nextjs.org/docs) — Frontend framework

---

## Changelog

### v1.5 — February 2, 2026
- **API Integration Core (F1)**: Frontend connected to FastAPI backend. Replaced all static mock data imports with real-time `fetchPrograms` calls.
- **Data Mapping**: Implemented field transformation layer in `lib/api.ts` to bridge `snake_case` (backend) and `camelCase` (frontend).
- **Portfolio Table Filtering (F2)**: Added status and product line dropdowns to `ProgramTable.tsx`. Filters are now fully reactive and work with API data.
- **Client-Side Scalability**: Refactored `mockData.ts` utility functions to accept dynamic data, enabling consistent KPI/Chart computation across layouts.

### v1.4 — February 2, 2026
- **Work Planning**: Defined next phase with 12 tasks across Frontend (F1-F5) and Backend (B1-B7)
- **Frontend Focus**: API integration, program detail page, functional chat widget
- **Backend Focus**: LLM provider abstraction, RAG implementation, query handler, Slack bot
- **Critical Path Identified**: B1 → B2 → B3 → B4 (agent must be functional before chat/Slack work)
- **Immediate Assignments**: F1, F2 (frontend), B1 (backend) — no dependencies

### v1.3 — February 2, 2026
- **Backend Implementation Complete**: SQLite database with 18 synthetic programs, FastAPI with REST endpoints and SSE chat stub
- **Database Layer**: Pydantic models, SQLite schema, seed script with 18 programs, 8 risks, 19 milestones
- **API Layer**: `GET /api/programs` (with filters), `GET /api/programs/{id}`, `POST /api/agent/chat` (SSE streaming)
- **Frontend Polish**: Mobile-responsive dashboard with horizontal carousels, uniform card heights, optimized charts
- **Integration Ready**: Backend API running at `http://localhost:8000`, frontend can consume real data

### v1.2 — February 1, 2026
- Added proactive insight surfacing to AI Chat Widget: agent initiates conversation with a high-level portfolio observation on load
- Confirmed chart implementations match PRD specs (5-stage Velocity, Status-segmented Alignment, Severity-segmented Risk)
- Synchronized technical notes with Next.js 14 / Recharts / Lucide implementation

### v1.1 — February 1, 2026
- Replaced KPI cards (which duplicated the status chart) with four strategically distinct metrics: Strategic Coverage Score, Product Lines Under Pressure, Milestone Completion Rate, Upcoming Launches
- Replaced single status distribution chart with four targeted charts: Program Velocity (funnel), Strategic Alignment (by product line + status), Launch Cadence (monthly), Risk Landscape (risks by product line + severity)
- Added `productLine`, `pipelineStage`, and `strategicObjectives` fields to the Program data model
- Removed `budget` and `spent` fields from Program model (not tracked reliably at program level in practice)
- Expanded synthetic dataset from 8 to 18 programs, designed so each KPI and chart has visible patterns and tension for demo storytelling
- Updated project structure to reflect new chart component files

### v1.0 — February 1, 2026
- Initial PRD created from technical design discussions
- Scope defined: 1-week prototype targeting a working demo
- Tech stack, data models, API endpoints, and user stories specified
- Prototype constraints and production deferral items documented