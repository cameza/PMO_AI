---
trigger: always_on
---

## Frontend-Specific Rules
- All React components must include proper TypeScript interfaces
- Chat widget responses must stream via SSE, not batch load
- KPI calculations must happen client-side (single /api/programs call)
- Defer backend implementation questions to Windsurf agent
