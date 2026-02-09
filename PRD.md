# Product Requirements Document: Program Portfolio AI System

> **Version:** 2.1  
> **Last Updated:** February 9, 2026  
> **Owner:** [Your Name/Team]  
> **Scope:** Production SaaS (evolved from Week 1 Prototype)

---

## Objective

### Problem Statement
Program managers today spend significant time manually compiling status updates, tracking risks across dozens of programs, and communicating portfolio health to stakeholders. Critical risks get buried in spreadsheets and slide decks. Teams lack real-time visibility into portfolio health, and there is no proactive mechanism to surface issues before they escalate. Executives need a single source of truth for program portfolio decisions, and the tools that exist today require manual effort to maintain.

### Goals
- ~~Build a working prototype that demonstrates an AI-powered Program Portfolio Management system end-to-end within one week~~ **DONE**
- ~~Prove the core value proposition: an AI agent that can answer questions about a program portfolio, grounded in real data, without hallucinating~~ **DONE**
- ~~Demonstrate the system working across two interfaces — an executive dashboard and Slack — using the same underlying AI agent~~ **DONE**
- ~~Validate the multi-LLM architecture: allow the system to operate with different LLM providers via a bring-your-own-API-key model~~ **DONE**
- ~~Establish the prototype as a foundation for a production-grade product and a demo artifact for securing design partners or funding~~ **DONE**

### Production Goals (v2)
- Deploy as a production SaaS accessible via URL (Vercel-unified infrastructure)
- Support multi-tenant architecture: multiple companies, each with isolated data and users
- Enable customers to bring their own LLM API keys via Vercel AI Gateway (BYOK)
- Integrate with external PM tools (Jira, Linear, Smartsheet) using AI-driven data normalization
- Provide admin interfaces for configuring AI behavior, strategic objectives, terminology, and integrations
- Implement authentication, role-based access control, and billing

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
- Vercel AI SDK for chat streaming (production) / SSE for streaming AI chat responses (prototype)
- Supabase Auth (`@supabase/supabase-js`) for authentication (production)

### Backend (Hybrid Architecture)
- **Data CRUD API**: Python 3.11+ with FastAPI, deployed as Vercel Function (Fluid Compute)
- **AI Chat API**: Next.js API route (`/app/api/chat/route.ts`) using Vercel AI SDK — handles streaming, BYOK, AI Gateway integration
- **Database**: Supabase PostgreSQL with Row-Level Security for multi-tenancy (production) / SQLite (prototype)
- **Vector Store**: Supabase pgvector for RAG embeddings (production) / ChromaDB in-memory (prototype)

### Slack Integration
- Slack HTTP/Events API mode with Vercel Functions (production) / Slack Bolt Socket Mode (prototype)
- Vercel Cron Jobs for Monday morning summary (production) / APScheduler (prototype)

### LLM Providers
- **Vercel AI Gateway** (production): One API key → hundreds of models (Claude, GPT-4, Gemini, Llama, etc.). Supports request-scoped BYOK so each customer uses their own API keys. Automatic fallbacks, spend monitoring, embeddings.
- Custom `llm_provider.py` abstraction layer (prototype): Claude and OpenAI via environment variable switching.

### Infrastructure
- **Vercel**: Frontend, FastAPI backend, AI Gateway, Cron Jobs — single platform for all compute
- **Supabase**: PostgreSQL, Auth, pgvector, Row-Level Security, Vault (encrypted secrets) — single platform for all data
- Git + GitHub for version control
- Vercel environment variables + Supabase Vault for secrets management

---

## Commands

### Development
```bash
# Backend (FastAPI — standalone mode)
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (Next.js — from repo root)
npm install
npm run dev                       # http://localhost:3000
# Frontend proxies /api/py/* to FastAPI at :8000 via next.config.mjs

# Both together (local dev)
# Terminal 1: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
# Terminal 2: npm run dev (from repo root)

# Slack Bot (prototype — Socket Mode)
cd slack-bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Build & Deployment (Production)
```bash
# Deploy to Vercel (frontend + backend in monorepo)
vercel deploy

# Local development with Vercel CLI
vercel dev

# Supabase migrations
npx supabase db push
```

---

## Project Structure

```
pmo-ai/                                  # Vercel monorepo (Next.js at root)
├── .env.example                          # Template for all required env vars
├── README.md
├── package.json                          # Next.js + frontend dependencies
├── next.config.mjs                       # Rewrites /api/py/* → FastAPI in dev
├── vercel.json                           # Routes /api/py/* → Python Function in prod
├── requirements.txt                      # Root Python deps (slim, for Vercel bundle)
├── middleware.ts                          # Supabase SSR middleware (refreshes session cookies)
├── api/
│   └── index.py                          # Vercel Function entrypoint → imports FastAPI
├── app/
│   ├── layout.tsx                        # Root layout, wraps AuthProvider
│   ├── page.tsx                          # Dashboard home: KPIs + charts + program table (client-side auth guard)
│   ├── error.tsx                         # Error boundary for client-side exceptions
│   ├── auth/
│   │   └── page.tsx                      # Login / signup page (Supabase Auth)
│   ├── admin/
│   │   └── strategic-objectives/page.tsx # Admin: manage strategic objectives
│   ├── programs/
│   │   └── [id]/page.tsx                 # Individual program detail page
│   └── api/
│       └── chat/route.ts                 # AI chat endpoint (Vercel AI SDK)
├── components/
│   ├── KPICard.tsx                       # Reusable metric card
│   ├── ProgramTable.tsx                  # Filterable/sortable program list
│   ├── ChatWidget.tsx                    # AI chat sidebar (Vercel AI SDK useChat)
│   ├── StrategicCoverageDetail.tsx       # Strategic coverage drill-down modal
│   ├── StrategicObjectivesAdmin.tsx      # Admin CRUD for objectives
│   └── charts/
│       ├── ProgramVelocityChart.tsx      # Pipeline funnel chart
│       ├── StrategicAlignmentChart.tsx   # Programs per objective by status
│       ├── LaunchCadenceChart.tsx        # Monthly launch bar chart
│       └── PortfolioStatusChart.tsx      # Portfolio health distribution
├── lib/
│   ├── api.ts                            # Axios client for FastAPI calls (/api/py/*)
│   ├── supabase.ts                       # Lazy Supabase client via getSupabase() (SSG-safe)
│   ├── auth-context.tsx                  # AuthProvider + useAuth hook
│   └── mockData.ts                       # KPI/chart computation utilities
├── data/
│   └── synthetic_programs.json           # Seed dataset: 30 synthetic programs
├── backend/
│   ├── main.py                           # FastAPI app (dynamic /api or /api/py prefix, CORS, routers)
│   ├── requirements.txt                  # Backend Python deps (includes RAG/LLM)
│   ├── database/
│   │   ├── db.py                         # Supabase PostgreSQL client (replaces SQLite)
│   │   └── models.py                     # Pydantic models: Program, Risk, Milestone, etc.
│   ├── agent/
│   │   ├── llm_provider.py              # LLM abstraction layer (Claude, OpenAI)
│   │   ├── rag.py                        # pgvector + OpenAI embeddings (replaces ChromaDB)
│   │   ├── query_handler.py             # Agent orchestration: intent → retrieval → generation
│   │   └── prompts.py                    # System prompts and templates per provider
│   ├── api/
│   │   ├── programs.py                   # REST: list, get, filter programs
│   │   ├── agent.py                      # Chat endpoint: query → AI response via SSE
│   │   └── strategic_objectives.py       # REST: CRUD for strategic objectives
│   └── scripts/
│       └── seed_supabase.py              # Seed Supabase with synthetic data
└── slack-bot/
    ├── app.py                            # Slack Bolt (prototype, Socket Mode)
    ├── requirements.txt
    └── handlers/
        ├── messages.py                   # DMs and @mentions → backend agent API
        └── notifications.py              # Scheduled Monday morning summary
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
- [x] **Portfolio Status Overview** — a horizontal stacked bar chart showing the count and percentage of programs in each status category (On Track / At Risk / Off Track / Completed) across the entire portfolio. Provides immediate portfolio health triage and visually grounds the "Product Lines Under Pressure" KPI.

**Acceptance Criteria — Program Table (Row 3):**
- [x] A program table lists all programs with columns: Name, Status, Product Line, Owner, Team, Launch Date, Pipeline Stage
- [x] The table supports filtering by status (On Track / At Risk / Off Track) and by product line
- [x] **Sticky Headers**: The table header and "Program Portfolio" title remain fixed at the top while rows scroll.
- [x] **Internal Scrolling**: Vertical scrolling is contained within the table, keeping the dashboard overview (KPIs/Charts) always visible.

**Technical Notes:**
- KPI card and chart components adapted from AI Missions Week 04 codebase
- All four charts use Recharts; component types are specified per chart above
- A single `GET /api/programs` call on page load returns all data needed to compute KPIs and populate charts client-side — no separate endpoints per widget
- Strategic objectives are defined as a static config list in the prototype (e.g., 9 objectives). Production will allow admin configuration.
- **Fixed Layout**: Dashboard uses a `h-screen flex flex-col` structure with `overflow-hidden` at the root and `overflow-auto` within the program list.

#### User Story 1.2 — Program Detail View
**As a** program manager  
**I want** to see all details for a specific program on a dedicated page  
**So that** I can review risks, milestones, and recent updates without scrolling through a large table

**Acceptance Criteria:**
- [x] Clicking a program in the table navigates to a detail page
- [x] Detail page shows: description, status, product line, pipeline stage, owner, team, launch date, progress percentage, strategic objectives mapped
- [x] All risks associated with the program are listed with severity and mitigation plan
- [x] All milestones are listed with due dates and completion status

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
- [x] A chat widget is visible in the bottom-right corner of every dashboard page
- [x] The widget expands into a conversational interface when clicked
- [x] The user can type a question and receive an AI-generated response
- [x] Responses stream in real-time (character by character) rather than appearing all at once
- [x] The AI's response is grounded in the program dataset — it does not fabricate program names, statuses, or details
- [x] The chat maintains conversation history for the duration of the session (page refreshes may reset)
- [x] **Proactive Insight Surfacing** — When the dashboard loads, the widget displays a static welcome message with prompt suggestions, eliminating unnecessary LLM token usage while guiding users to valuable queries.

### Mobile Responsiveness
- [x] **Carousels for Cards** — On mobile devices (max-width: 768px), KPI cards and Charts must be displayed in a horizontal carousel where only one item is fully visible at a time ("front and center").
- [x] **Swipe Interaction** — Users must be able to swipe horizontally to view the next KPI or Chart.
- [x] **Layout Adaptation** — The side-by-side or grid layouts used on desktop must switch to stacked, swipeable rows on mobile.

**Acceptance Criteria — Sample Questions That Must Work:**
- [x] "What programs are launching this quarter?"
- [x] "Show me all at-risk programs"
- [x] "What is the status of Project Phoenix?"
- [x] "Which programs in the Smart Home product line are at risk?"
- [x] "What are the main risks across all programs?"
- [x] "Give me a summary of engineering programs"

**Technical Notes:**
- Chat widget calls `POST /api/agent/chat` with the user's message and conversation history
- Backend uses RAG (pgvector similarity search + Supabase PostgreSQL query) to retrieve context before calling the LLM
- Response streamed back via SSE (prototype) or Vercel AI SDK streaming (production)

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

### Epic 4: Multi-LLM Support via Vercel AI Gateway

#### User Story 4.1 — Swap LLM Providers Without Code Changes (Prototype — DONE)
**As a** developer or system administrator  
**I want** to switch the AI agent between Claude and OpenAI by changing a config value  
**So that** the system can work with whatever LLM provider a customer is already paying for

**Acceptance Criteria:**
- [x] Setting `LLM_PROVIDER=claude` and providing a valid Anthropic API key makes the agent use Claude
- [x] Setting `LLM_PROVIDER=openai` and providing a valid OpenAI API key makes the agent use GPT-4
- [x] Both providers return coherent, grounded answers to the same questions
- [x] No application code changes are required to switch providers — only `.env` values

**Technical Notes (Prototype):**
- `llm_provider.py` implements a common interface; `query_handler.py` is provider-agnostic
- Prompt templates in `prompts.py` adapt formatting to the active provider (e.g., XML tags for Claude, standard format for OpenAI)

#### User Story 4.2 — Vercel AI Gateway Integration (Production)
**As a** SaaS platform  
**I want** to route all LLM requests through Vercel AI Gateway  
**So that** customers can use any supported model with their own API keys, with automatic fallbacks and spend monitoring

**Acceptance Criteria:**
- [ ] All LLM calls route through Vercel AI Gateway (`https://ai-gateway.vercel.sh/v1`)
- [ ] Customers can bring their own API keys (BYOK) — keys passed per-request, not stored in Vercel env vars
- [ ] Customer API keys are encrypted at rest in Supabase Vault
- [ ] If a customer's primary provider fails, AI Gateway automatically falls back to an alternative
- [ ] Admin can select model from AI Gateway's catalog (Claude, GPT-4, Gemini, Llama, etc.)
- [ ] Spend monitoring is visible in Vercel dashboard per model/provider
- [ ] Embeddings for RAG are generated via AI Gateway's embeddings endpoint

**Technical Notes:**
- Chat endpoint moves to Next.js API route (`/app/api/chat/route.ts`) using Vercel AI SDK
- FastAPI retains data CRUD endpoints (`/api/programs`, `/api/strategic-objectives`, etc.)
- Request-scoped BYOK: customer's encrypted API key is decrypted server-side and passed in `providerOptions.gateway.byok` per request
- Replaces `llm_provider.py`, `ClaudeProvider`, `OpenAIProvider` entirely
- AI SDK handles streaming natively via `streamText()` / `toUIMessageStreamResponse()`

---

### Epic 5: SaaS Configuration & Customization (Post-Prototype)

#### User Story 5.1 — Configure Organization-Specific Terminology
**As a** SaaS customer administrator  
**I want** to teach the AI agent about our organization's specific acronyms, team names, and terminology  
**So that** the AI understands our context and provides responses using our language

**Acceptance Criteria:**
- [ ] Admin can upload a terminology dictionary (acronym → full term, team name → description)
- [ ] AI agent uses organization-specific terminology in responses instead of generic terms
- [ ] System can handle multiple customer configurations with complete data isolation
- [ ] Terminology can be updated without redeploying the system
- [ ] AI maintains accuracy while incorporating custom terminology

**Technical Notes:**
- Multi-tenant database schema with customer_id isolation
- Terminology service injects customer-specific context into LLM prompts
- Vector embeddings are tenant-specific to prevent cross-customer contamination

#### User Story 5.2 — Configure Strategic Objectives
**As a** SaaS customer administrator  
**I want** to define our organization's specific strategic objectives  
**So that** the AI agent can analyze programs against our actual goals, not generic ones

**Acceptance Criteria:**
- [ ] Admin can create, edit, and delete strategic objectives via admin interface
- [ ] Programs can be mapped to multiple strategic objectives
- [ ] AI agent references specific strategic objectives in portfolio analysis
- [ ] System provides insights about strategic alignment and gaps
- [ ] Objectives can be weighted for importance in AI analysis

**Technical Notes:**
- Strategic objectives stored in tenant-specific database tables
- AI prompts include customer's strategic objectives context
- RAG retrieval prioritizes content related to strategic objectives

#### User Story 5.3 — Configure Integration Data Sources (AI-Driven Normalization)
**As a** SaaS customer administrator  
**I want** to connect our existing project management tools (Jira, Linear, Smartsheet)  
**So that** the AI agent works with our real project data instead of manual entry

**Acceptance Criteria:**
- [ ] Admin can authenticate and connect to multiple data sources (OAuth or API key)
- [ ] On first sync, AI analyzes a sample of raw records and proposes field mappings with confidence scores
- [ ] Admin reviews AI-proposed mappings — approves high-confidence, corrects low-confidence (one-time)
- [ ] Learned mappings are cached per organization + tool — no LLM cost on subsequent syncs for known fields
- [ ] When the external tool's schema changes (new statuses, new custom fields), only the delta triggers AI re-analysis
- [ ] Admin can view and manually override any mapping at any time via `/settings/integrations/[tool]/mappings`
- [ ] System syncs data on configurable schedules (hourly, daily) via Vercel Cron Jobs
- [ ] Webhook support for real-time updates from integrated tools
- [ ] Integration failures trigger alerts and retry mechanisms
- [ ] Historical data is preserved for trend analysis

**Technical Notes — Three-Layer Integration Pipeline:**

```
Layer 1: RAW INGESTION
  → Thin API adapters per tool (auth + raw JSON fetch only, NO field mapping logic)
  → Raw records stored in `raw_records` table (JSONB) as-is from external API

Layer 2: AI NORMALIZATION (Span-inspired)
  → LLM reads raw record + our target schema → outputs mapped fields + confidence + reasoning
  → Human reviews low-confidence mappings (one-time per field type, not per record)
  → Corrections stored in `field_mappings` table keyed by (organization_id, tool, source_field)
  → Cached mappings reused for all future syncs — LLM only called for new/unknown fields

Layer 3: NORMALIZED STORE
  → Clean data written to standard schema (programs, risks, milestones)
  → Ready for dashboard, RAG indexing, AI chat
```

**Per-connector API adapter interface:**
```python
class DataSourceAdapter(ABC):
    def authenticate(self, credentials: dict) -> bool
    def fetch_raw_projects(self) -> List[dict]   # Raw JSON from external API
    def fetch_raw_issues(self) -> List[dict]
    def setup_webhook(self, callback_url: str)    # Real-time updates
    def test_connection(self) -> bool
```

**New database tables:**
```sql
-- Integration configurations per org
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY, organization_id UUID, tool TEXT,
  credentials_encrypted TEXT, webhook_url TEXT, sync_schedule TEXT,
  last_sync_at TIMESTAMPTZ, status TEXT
);

-- Raw ingested records (Layer 1)
CREATE TABLE raw_records (
  id UUID PRIMARY KEY, organization_id UUID, integration_id UUID,
  external_id TEXT, raw_data JSONB, ingested_at TIMESTAMPTZ
);

-- AI-learned field mappings (Layer 2) — per org + tool
CREATE TABLE field_mappings (
  id UUID PRIMARY KEY, organization_id UUID, tool TEXT,
  source_field TEXT, target_field TEXT, transform_rule TEXT,
  confidence FLOAT, human_verified BOOLEAN DEFAULT false
);
```

**Planned connectors (in priority order):**
1. Linear (dogfood — we use it ourselves)
2. Jira Cloud (largest market share)
3. Smartsheet
4. CSV/manual upload (fallback for any tool)

#### User Story 5.4 — Configure AI Behavior & Tone
**As a** SaaS customer administrator  
**I want** to customize how the AI agent communicates and what it focuses on  
**So that** the AI matches our organization's communication style and priorities

**Acceptance Criteria:**
- [ ] Admin can adjust AI tone (formal, casual, technical, executive)
- [ ] Admin can set analysis priorities (risk focus, timeline focus, budget focus)
- [ ] Admin can configure response length and detail level
- [ ] Admin can define custom report templates and formats
- [ ] Changes apply immediately without system restart

**Technical Notes:**
- Configurable prompt templates per tenant
- AI behavior settings stored in customer configuration tables
- A/B testing framework for prompt optimization
- Analytics on AI response effectiveness by configuration

#### User Story 5.5 — Multi-Tenant User Management
**As a** SaaS customer administrator  
**I want** to manage which team members can access what data and features  
**So that** sensitive information is properly controlled and users see relevant content

**Acceptance Criteria:**
- [ ] Admin can invite team members with role-based permissions
- [ ] Users can be limited to specific programs or product lines
- [ ] Role-based access control for dashboard, chat, and admin features
- [ ] Audit log tracks all user actions and data access
- [ ] SSO integration with customer's identity provider

**Technical Notes:**
- JWT-based authentication with tenant isolation
- Row-level security in database queries
- Middleware for permission checking on all API endpoints
- Integration with SAML/OIDC identity providers

---

## Technical Specifications

### Architecture Overview

#### Prototype Architecture
The prototype uses a three-service local architecture: Next.js frontend, FastAPI backend (SQLite + ChromaDB + custom LLM abstraction), and Slack Bolt bot.

#### Production Architecture (Vercel-Unified)
The production system consolidates onto two managed platforms: **Vercel** (all compute) and **Supabase** (all data). The AI chat endpoint moves to a Next.js API route using Vercel AI SDK, while FastAPI handles data CRUD as a Vercel Function.

```
┌──────────────────────────── VERCEL ────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FRONTEND (Next.js)                                      │   │
│  │  ├── Dashboard (KPIs, Charts, Program Table)             │   │
│  │  ├── Auth Pages (Login, Signup) → Supabase Auth          │   │
│  │  ├── Admin Settings (AI, Integrations, Objectives)       │   │
│  │  └── AI Chat Widget                                      │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │  NEXT.JS API ROUTES (AI Chat)                            │   │
│  │  ├── /api/chat → Vercel AI SDK → AI Gateway (BYOK)      │   │
│  │  ├── /api/slack/events → Slack HTTP Events handler       │   │
│  │  └── /api/cron/monday-summary → Cron-triggered summary   │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │  FASTAPI (Vercel Function — Fluid Compute)               │   │
│  │  ├── /api/programs (CRUD)                                │   │
│  │  ├── /api/strategic-objectives (CRUD)                    │   │
│  │  └── /api/integrations (sync, mappings)                  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │  VERCEL AI GATEWAY                                       │   │
│  │  ├── Hundreds of models (Claude, GPT-4, Gemini, etc.)   │   │
│  │  ├── Request-scoped BYOK (customer API keys)             │   │
│  │  ├── Automatic fallbacks + spend monitoring              │   │
│  │  └── Embeddings for RAG                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL / Auth / Vectors
┌────────────────────────────▼────────────────────────────────────┐
│                        SUPABASE                                  │
│  ├── PostgreSQL (programs, risks, milestones, orgs, users)      │
│  ├── pgvector (RAG embeddings, tenant-scoped)                   │
│  ├── Auth (email, magic link, SSO)                              │
│  ├── Row-Level Security (multi-tenant isolation)                │
│  ├── Vault (encrypted customer API keys)                        │
│  └── raw_records + field_mappings (integration pipeline)        │
└─────────────────────────────────────────────────────────────────┘
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
  status: "Upcoming" | "Pending" | "Completed" | "Overdue";
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

The prototype ships with 30 synthetic programs. The dataset is designed so that each KPI card and chart has enough variation to tell a compelling story during a demo — not a flat, uniform distribution, but one with visible patterns and tension.

**Product Lines in the dataset:** Video, Smart Home, Mobile, Platform (4 lines across 30 programs)

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

### RAG Implementation

The agent uses a hybrid retrieval approach to ground its responses:

#### Prototype (Legacy — replaced)
1. ~~**Vector Search (ChromaDB):** Program descriptions, update narratives, and risk descriptions embedded via SentenceTransformers and indexed in-memory at startup.~~
2. ~~**Direct DB Query (SQLite):** Structured queries for precise lookups.~~
3. ~~**Context Assembly:** Retrieved chunks assembled into the LLM's context window before generation.~~

#### Current Implementation (Supabase pgvector)
1. **Vector Search (Supabase pgvector):** 210 documents (30 programs + 90 risks + 90 milestones) embedded via OpenAI `text-embedding-3-small` (1536 dimensions) and stored persistently in Supabase `embeddings` table with ivfflat index. Similarity search via `match_embeddings()` RPC function. Tenant-scoped by `organization_id`.
2. **Direct DB Query (Supabase PostgreSQL):** Structured queries via `supabase-py` REST client, scoped by `organization_id`.
3. **Context Assembly:** Retrieved chunks from both sources assembled and passed to LLM.
4. **Startup Optimization:** Backend checks for existing embeddings on startup — skips re-indexing if present (~2s startup vs ~30s with ChromaDB). Re-indexing triggered only on data changes.

#### Production (Planned Enhancements)
1. **Embeddings via AI Gateway:** Move embedding generation from direct OpenAI API to Vercel AI Gateway embeddings endpoint for BYOK support.
2. **Row-Level Security:** Replace service role key with per-user JWT for tenant isolation via RLS policies.
3. **Incremental Re-indexing:** Only re-embed changed documents on data sync, not full re-index.

---

## Boundaries & Constraints

### ✅ Always Do
- Ground all AI responses in retrieved data — never allow the agent to answer from general knowledge about programs
- Include source references in AI responses so users can trace answers back to specific programs
- Handle LLM API errors gracefully (show a user-friendly message, do not crash)
- Keep API keys out of code — use `.env` files exclusively

### ⚠️ Ask First
- Adding new LLM providers beyond what AI Gateway supports
- Changing the core data schema (programs, risks, milestones) — affects all connectors
- Adding new Slack interaction patterns (slash commands, buttons, etc.)
- Modifying Row-Level Security policies

### 🚫 Never Do
- Commit API keys, Slack tokens, or other secrets to the repository
- Allow the AI agent to make claims about programs that are not in the dataset
- Hard-code any LLM provider — everything must route through Vercel AI Gateway (production) or the abstraction layer (prototype)
- Return raw database errors to the frontend
- Store customer API keys in plaintext — must use Supabase Vault
- Allow cross-tenant data leakage — all queries must be scoped by `organization_id`

---

## Constraints & Non-Negotiables

### Prototype Constraints (Resolved in Production)
- ~~**No authentication**~~ → Supabase Auth (email, magic link, SSO)
- ~~**Single tenant**~~ → Multi-tenant with Supabase Row-Level Security
- ~~**Static data**~~ → AI-driven integration pipeline (Jira, Linear, Smartsheet, CSV)
- ~~**In-memory vector store**~~ → Supabase pgvector (persistent, tenant-scoped)
- ~~**Local deployment only**~~ → Vercel (frontend + backend + AI Gateway + cron)

### Production Constraints
- **Serverless functions**: Vercel Functions have max 250MB bundle size and configurable max duration. No persistent processes — Slack bot must use HTTP/Events API mode, not Socket Mode.
- **Request body size**: 4.5MB max for Vercel Functions. Large data syncs must be chunked.
- **Vercel Cron**: Minimum interval varies by plan. Monday summary uses `0 14 * * 1` (9 AM ET = 14:00 UTC).
- **AI Gateway dependency**: All LLM calls route through Vercel AI Gateway. If AI Gateway is unavailable, chat functionality degrades gracefully.

---

## Open Questions & Decisions Needed

- [x] ~~How many synthetic programs are enough to make the demo feel realistic?~~ **RESOLVED**: 30 programs with 3+ risks and 3+ milestones each provides realistic demo data
- [x] ~~Should the Monday summary notification also appear somewhere in the dashboard (e.g., a notification bell), or only in Slack for the prototype?~~ **RESOLVED**: Slack-only for prototype, structured format perfected
- [x] ~~For the multi-LLM demo: do we show the provider switch live during the demo, or just explain it and show configuration?~~ **RESOLVED**: Both Claude and OpenAI providers working with environment variable switching
- [x] ~~Do we need a "reset data" button in the dashboard to re-seed the synthetic dataset for repeated demos?~~ **RESOLVED**: Seed script available, admin database view shows data statistics
- [x] ~~Is bidirectional Slack communication (user questions → AI responses) working?~~ **RESOLVED**: Full bidirectional communication implemented with proper formatting
- [ ] Which Slack workspace will we use for testing? (Need workspace with ability to install a custom app)
- [x] ~~For SaaS production: What pricing model and tier structure for different organization sizes?~~ **RESOLVED**: Free (1 user, 5 programs) / Starter $99/mo (5 users, 50 programs, 1 integration) / Pro $199/mo (unlimited). See Linear Phase 4 project.
- [ ] For SaaS production: What compliance certifications needed (SOC2, GDPR, etc.)?
- [x] ~~Infrastructure: Vercel vs Railway vs Render for backend?~~ **RESOLVED**: Vercel-unified (FastAPI as Vercel Function + Next.js API routes for AI chat)
- [x] ~~LLM management: Custom abstraction vs managed gateway?~~ **RESOLVED**: Vercel AI Gateway with request-scoped BYOK
- [x] ~~Integration strategy: Manual field mapping vs AI-driven?~~ **RESOLVED**: AI-driven normalization (Span-inspired three-layer pipeline)
- [x] ~~Chat architecture: FastAPI-only vs hybrid?~~ **RESOLVED**: Hybrid — Next.js API route for AI chat (Vercel AI SDK), FastAPI for data CRUD

---

## References & Resources

### Related Documents
- Technical Design Document: `program-portfolio-ai-system.md` (companion document — contains full production architecture, platform evaluation, roadmap)

### Starting Point Codebase
- [AI Missions Week 04 — Data Analyst Dashboard](https://github.com/cameza/ai-missions-system/tree/main/Missions/week-04-data-analyst) — source of KPI card, chart, and table components for the frontend

### Key Libraries & Services
- [Vercel AI SDK](https://sdk.vercel.ai/) — AI toolkit for TypeScript (chat streaming, BYOK, AI Gateway integration)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — Unified LLM API (hundreds of models, BYOK, fallbacks, spend monitoring)
- [Supabase](https://supabase.com/docs) — PostgreSQL, Auth, pgvector, RLS, Vault
- [FastAPI](https://fastapi.tiangolo.com/) — Backend API framework (data CRUD, deployed as Vercel Function)
- [Next.js](https://nextjs.org/docs) — Frontend framework
- [Recharts](https://recharts.org/) — Data visualization
- [Slack Events API](https://api.slack.com/events-api) — Slack bot (production, HTTP mode)
- [Slack Bolt for Python](https://api.slack.com/tools/bolt/python) — Slack bot (prototype, Socket Mode)
- [LlamaIndex](https://docs.llamaindex.ai/) — RAG framework (prototype)
- [ChromaDB](https://docs.trychroma.com/) — In-memory vector store (prototype)

### Inspiration
- [Span.app](https://www.span.app/blog/first-true-view-of-engineering-time) — AI-driven data normalization approach: ingest raw data from tools, use LLMs to classify into consistent schema instead of manual field mapping

---

## Changelog

### v2.2 — February 9, 2026
- **Vercel Deployment Fixes**: Resolved full deployment pipeline — app now live at `pmo-ai.vercel.app`.
  - **Dynamic API Prefix**: FastAPI routers mount at `/api/py` on Vercel (detected via `VERCEL` env var) and `/api` locally. Fixes 404s caused by `vercel.json` rewrite passing original path to Python function.
  - **Auth Redirect Loop Fix**: Removed server-side middleware redirect. Middleware now only refreshes Supabase session cookies. Auth guard moved to client-side (`app/page.tsx` checks `useAuth()` and redirects to `/auth`).
  - **Lazy Supabase Client**: `lib/supabase.ts` exports `getSupabase()` function instead of module-level client. Prevents `supabaseUrl is required` crash during Next.js static page generation.
  - **Auth Page Fix**: Uses `window.location.href` instead of `router.push()` for post-login redirect, ensuring middleware sees fresh auth cookies on full page load.
  - **Data Mapping Hardening**: `mapProgram()` in `lib/api.ts` defaults `strategicObjectives` to `[]` and other mapped fields to `''` to prevent `forEach` crash on null backend data.
  - **Error Boundary**: Added `app/error.tsx` to surface client-side exceptions with stack traces instead of generic Next.js error page.
  - **Slim Python Bundle**: Removed `sqlalchemy`, `anthropic`, `openai` from root `requirements.txt`. Made imports conditional in `llm_provider.py`. Stays under Vercel 250MB limit.
  - **Environment Variables**: All secrets configured in Vercel dashboard as sensitive env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, Slack tokens).
- **Known Gaps** (next session): Portfolio Assistant chat not working, program detail pages not loading, Strategic Objectives admin page failing.

### v2.1 — February 9, 2026
- **Supabase Auth Integration**: Full authentication flow with `@supabase/supabase-js` + `@supabase/ssr`. Login/signup page (`/auth`), AuthProvider context + `useAuth` hook, Next.js middleware protecting all routes via `createServerClient`. User email and sign-out button in dashboard header. Demo user: `demo@pmo-ai.com`.
- **Backend → Supabase PostgreSQL**: Replaced SQLite `db.py` with Supabase `supabase-py` client. Same function signatures for drop-in compatibility. All queries scoped by `organization_id`. Strategic objectives use `program_strategic_objectives` join table instead of JSON column.
- **pgvector RAG (replaces ChromaDB)**: 210 documents embedded via OpenAI `text-embedding-3-small` (1536 dimensions) into Supabase `embeddings` table with ivfflat index. `match_embeddings()` RPC for cosine similarity search. Startup detects existing embeddings and skips re-indexing (~2s vs ~30s). Removes ChromaDB + SentenceTransformers from production path (saves ~500MB bundle).
- **Supabase Data Seeding**: 30 programs, 90 risks, 90 milestones, 9 strategic objectives, 40 program↔objective mappings inserted into Supabase PostgreSQL, scoped by demo `organization_id`.
- **Pydantic Model Updates**: Made `Risk`, `Milestone`, `Program` fields `Optional` for Supabase nullable columns. Added `Pending` to `MilestoneStatus` enum. Fixed `Critical` → `High` severity in seeded data.
- **Monorepo Structure Updated**: Project structure section in PRD updated to reflect repo-root Next.js, `api/index.py` entrypoint, `middleware.ts`, auth files, and Supabase client libs.
- **`.env.example` Secured**: Replaced real API keys with placeholder values, added Supabase environment variables.
- **Dependencies**: Added `supabase>=2.0.0` to both `requirements.txt` files. Added `@supabase/ssr` to frontend.

### v2.0 — February 9, 2026
- **Scope Upgrade**: PRD expanded from prototype-only to production SaaS. All prototype goals marked DONE; production goals defined.
- **Vercel-Unified Architecture**: Consolidated infrastructure onto Vercel (frontend + FastAPI backend + AI Gateway + Cron Jobs) and Supabase (PostgreSQL + Auth + pgvector + RLS + Vault). Eliminates Railway/Render dependency.
- **Vercel AI Gateway**: Replaces custom `llm_provider.py` abstraction. One API key → hundreds of models, request-scoped BYOK for customer API keys, automatic fallbacks, spend monitoring, embeddings support.
- **Hybrid Chat Architecture**: AI chat moves to Next.js API route (`/app/api/chat/route.ts`) using Vercel AI SDK. FastAPI retains data CRUD endpoints as Vercel Function.
- **Multi-Tenancy**: Supabase Row-Level Security with `organization_id` on all tables. Organizations, user profiles, role-based access.
- **AI-Driven Integration Pipeline (Span-inspired)**: Three-layer architecture (Raw Ingestion → AI Normalization → Normalized Store). LLM proposes field mappings with confidence scores; human reviews once; cached per org+tool. Replaces manual field-mapping UI.
- **Per-Client Mapping Customization**: Each org's `field_mappings` table serves as their trained mapping profile. Corrections stored independently per org. Delta re-analysis when external tool schemas change.
- **Planned Connectors**: Linear (dogfood), Jira Cloud, Smartsheet, CSV/manual upload.
- **Slack Production Mode**: Socket Mode → HTTP/Events API (serverless-compatible). APScheduler → Vercel Cron Jobs.
- **New Database Tables**: `organizations`, `user_profiles`, `integration_configs`, `raw_records`, `field_mappings`.
- **Updated Constraints**: Added production constraints (serverless limits, Vault encryption, cross-tenant isolation rules).
- **Pricing Tiers Defined**: Free / Starter $99/mo / Pro $199/mo.

### v1.9 — February 6, 2026
- **RAG Initialization Fix**: Resolved ChromaDB hanging issue during backend startup with pre-download script and 30s timeout wrapper.
- **Cost Optimization**: Replaced proactive AI-generated summary with static welcome message, eliminating unnecessary LLM token usage on page load.
- **Chat Widget Improvements**: Added prompt suggestions in welcome message, enhanced markdown rendering with headers and proper bullet points.
- **Graceful Degradation**: Implemented _rag_ready flag for fallback to structured queries when RAG unavailable.
- **Enhanced Markdown Rendering**: Fixed bullet point formatting and spacing issues in chat messages.
- **Model Pre-caching**: Created download_model.py script to pre-cache sentence-transformers embedding model.

### v1.8 — February 5, 2026 (Afternoon)
- **Bidirectional Slack Communication**: Complete user question → AI response functionality implemented and debugged.
- **Slack Bot Bug Fixes**: Resolved APScheduler cron trigger error ('monday' → 'mon') and added markdown-to-Slack formatting conversion.
- **Message Formatting Enhancement**: Added automatic conversion of **bold** and ## headers to Slack-compatible *italic* format.
- **Full Integration Testing**: Comprehensive validation confirms both Monday Morning Summary (push) and user questions (pull) working perfectly.
- **Data Accuracy Validation**: 100% verification that all Slack message content is grounded in database data with no hallucinations.

### v1.7 — February 5, 2026 (Morning)
- **Monday Morning Summary Integration**: Complete end-to-end Slack integration with structured formatting and 100% data accuracy validation.
- **Slack Bot Scheduling**: APScheduler implemented for automated Monday 9:00 AM postings with error handling and test functions.
- **Enhanced Summary Prompt**: Refined to produce Slack-compatible formatting with emojis and structured sections (Portfolio Health, Programs Requiring Attention, Upcoming Milestones, Strategic Progress, Resource Allocation).
- **Data Validation**: Comprehensive validation confirms all Slack message content is 100% grounded in database data with no hallucinations.
- **Synthetic Data Expansion**: Increased from 18 to 30 programs with 3+ risks and 3+ milestones per program for realistic demos.

### v1.6 — February 4, 2026
- **Sticky Headers & Fixed Layout**: Refactored dashboard to keep KPIs/Charts pinned at top while only program rows scroll.
- **UI Color Refinements**: Matched `ProgramTable` stage progress bars with `ProgramVelocityChart` gradient.
- **Chart Layout Fix**: Corrected stacking order and corner radius in `RiskLandscapeChart` for visual consistency.
- **Chat & Context Completion**: Marked chat widget and context-aware chat features as completed.

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