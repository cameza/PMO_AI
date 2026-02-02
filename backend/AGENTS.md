# Backend Guidelines (Windsurf)

## FastAPI Patterns
- Pydantic models for all request/response schemas
- SQLite queries wrapped in try/except with logging
- LLM provider abstraction via llm_provider.py

## RAG Implementation
- ChromaDB in-memory for prototype
- Hybrid retrieval: vector search + direct DB query
- Context must be assembled before LLM call

## Testing Focus
- Unit tests for query_handler.py orchestration
- Integration tests for RAG retrieval accuracy
- Mock LLM responses for deterministic testing

## Agent-Specific Notes
- Never hard-code LLM providers - use abstraction layer
- Graceful degradation if ChromaDB retrieval fails
- See PRD Epic 2 & 3 for agent behavior requirements
