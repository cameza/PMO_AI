"""
AI Agent module for Program Portfolio Management system.

This module provides LLM provider abstraction, RAG implementation,
and query handling for the AI assistant.
"""

from .llm_provider import LLMProvider, ClaudeProvider, OpenAIProvider, get_llm_provider
from .rag import (
    index_portfolio_data,
    semantic_search,
    get_context_for_query,
    get_rag_stats
)
from .query_handler import (
    process_query,
    process_query_stream,
    generate_proactive_insight,
    generate_portfolio_summary,
    QueryResult,
    Source
)
from .prompts import (
    get_system_prompt,
    format_context_for_provider,
    format_user_query_for_provider,
    build_chat_messages,
    PROACTIVE_INSIGHT_PROMPT,
    SUMMARY_PROMPT
)

__all__ = [
    "LLMProvider",
    "ClaudeProvider",
    "OpenAIProvider",
    "get_llm_provider",
    "index_portfolio_data",
    "semantic_search",
    "get_context_for_query",
    "get_rag_stats",
    "process_query",
    "process_query_stream",
    "generate_proactive_insight",
    "generate_portfolio_summary",
    "QueryResult",
    "Source",
    "get_system_prompt",
    "format_context_for_provider",
    "format_user_query_for_provider",
    "build_chat_messages",
    "PROACTIVE_INSIGHT_PROMPT",
    "SUMMARY_PROMPT",
]
