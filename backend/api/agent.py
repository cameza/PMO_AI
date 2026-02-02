from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatContext(BaseModel):
    program_id: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[ChatContext] = None


class Source(BaseModel):
    type: str  # "program" or "document"
    id: str
    title: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source] = []
    confidence: str = "medium"  # "high", "medium", "low"


async def generate_stream(message: str, context: Optional[ChatContext] = None):
    """
    Generator for SSE streaming response.
    
    This is a stub implementation. The full RAG pipeline will be implemented
    in the agent/ module (llm_provider.py, rag.py, query_handler.py).
    """
    stub_response = (
        f"I received your question: \"{message}\". "
        "This is a stub response. The full RAG-powered agent will be implemented "
        "in the next phase with ChromaDB vector search and LLM integration."
    )
    
    if context and context.program_id:
        stub_response += f" (Context: viewing program {context.program_id})"
    
    for char in stub_response:
        yield f"data: {json.dumps({'type': 'token', 'content': char})}\n\n"
        await asyncio.sleep(0.01)
    
    final_response = ChatResponse(
        answer=stub_response,
        sources=[],
        confidence="low"
    )
    yield f"data: {json.dumps({'type': 'done', 'response': final_response.model_dump()})}\n\n"


@router.post("/agent/chat")
async def chat(request: ChatRequest):
    """
    Submit a chat message and receive a streaming AI response.
    
    Returns Server-Sent Events (SSE) stream with:
    - `type: token` events for each character/token
    - `type: done` event with the complete response and sources
    
    The AI response is grounded in the program dataset via RAG retrieval.
    """
    return StreamingResponse(
        generate_stream(request.message, request.context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/agent/summary")
async def generate_summary():
    """
    Generate a portfolio summary.
    
    Called by the Slack notification scheduler for Monday morning summaries.
    This is a stub - full implementation will use the RAG pipeline.
    """
    return {
        "summary": "Portfolio Summary (Stub): 18 programs tracked. "
                   "4 at risk, 1 off track. 3 launching this month.",
        "generated_at": "2026-02-02T10:00:00Z"
    }
