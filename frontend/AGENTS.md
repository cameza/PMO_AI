# Frontend Guidelines (Antigravity)

## Component Patterns
- Functional components with hooks only
- Named exports, not default exports
- Server-sent events (SSE) for AI chat streaming
- Recharts for all visualizations

## File Structure Per Component
- ComponentName.tsx
- ComponentName.test.tsx (if applicable)
- Use Tailwind classes, no CSS modules in prototype

## Data Fetching
- All API calls through lib/api.ts
- Handle loading and error states explicitly
- See PRD.md User Stories 1.1-2.2 for acceptance criteria

## Agent-Specific Notes
- When creating charts, reference PRD Chart specifications (Velocity, Alignment, etc.)
- Chat widget must support context.programId for page-aware queries
