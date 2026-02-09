from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
import logging

try:
    from backend.agent.query_handler import (
        process_query_stream,
        generate_portfolio_summary,
        QueryResult,
        Source as QueryHandlerSource
    )
except ImportError:
    from agent.query_handler import (
        process_query_stream,
        generate_portfolio_summary,
        QueryResult,
        Source as QueryHandlerSource
    )

logger = logging.getLogger(__name__)

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


def _convert_query_handler_source(source: QueryHandlerSource) -> Source:
    """Convert QueryHandler Source to API Source with proper type mapping."""
    # Map source types: "risk" and "milestone" → "document"
    api_type = "program" if source.type == "program" else "document"
    return Source(
        type=api_type,
        id=source.id,
        title=source.title
    )


def _convert_query_result_to_response(result: QueryResult) -> ChatResponse:
    """Convert QueryResult to ChatResponse with source mapping."""
    sources = [_convert_query_handler_source(s) for s in result.sources]
    return ChatResponse(
        answer=result.answer,
        sources=sources,
        confidence=result.confidence
    )


async def generate_stream(message: str, history: List[ChatMessage] = None, context: Optional[ChatContext] = None):
    """
    Generator for SSE streaming response using the query handler.
    
    Args:
        message: User's chat message
        history: Previous conversation messages
        context: Optional context including program_id for context-aware queries
    """
    # Convert history format for query handler
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in (history or [])]
    
    # Extract program_id from context for context-aware queries
    program_id = context.program_id if context and context.program_id else None
    
    try:
        # Stream response from query handler
        for token, result in process_query_stream(
            query=message,
            history=history_dicts,
            program_id=program_id
        ):
            if result is not None:
                # Final result - send done event
                response = _convert_query_result_to_response(result)
                yield f"data: {json.dumps({'type': 'done', 'response': response.model_dump()})}\n\n"
            else:
                # Streaming token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                await asyncio.sleep(0.01)  # Small delay for streaming effect
                
    except Exception as e:
        logger.error(f"Error in generate_stream: {e}")
        # Send error response via SSE
        error_response = ChatResponse(
            answer="I encountered an error while processing your question. Please try again.",
            sources=[],
            confidence="low"
        )
        yield f"data: {json.dumps({'type': 'done', 'response': error_response.model_dump()})}\n\n"


@router.post("/agent/chat")
async def chat(request: ChatRequest):
    """
    Submit a chat message and receive a streaming AI response.
    
    Returns Server-Sent Events (SSE) stream with:
    - `type: token` events for each character/token
    - `type: done` event with the complete response and sources
    
    The AI response is grounded in the program dataset via RAG retrieval.
    Supports context-aware queries when context.programId is provided.
    """
    return StreamingResponse(
        generate_stream(request.message, request.history, request.context),
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
    Uses the RAG pipeline to generate a natural language summary of portfolio state.
    """
    from datetime import datetime, timezone
    
    try:
        # Generate summary using query handler
        result = generate_portfolio_summary()
        
        return {
            "summary": result.answer,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "confidence": result.confidence
        }
        
    except Exception as e:
        logger.error(f"Error generating portfolio summary: {e}")
        return {
            "summary": "Unable to generate portfolio summary at this time. Please check the system logs.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "confidence": "low"
        }
