"""
Query Handler — Agent Orchestration

Main orchestration layer for the AI agent. Receives user queries,
determines retrieval strategy, assembles context, and generates responses.

Implements hybrid retrieval:
- Vector search (ChromaDB) for semantic queries
- Direct SQL queries for structured lookups
"""

import os
import logging
import re
from typing import List, Dict, Any, Optional, Iterator, Tuple
from dataclasses import dataclass

from .llm_provider import get_llm_provider, LLMProvider
from .rag import get_context_for_query, semantic_search, is_rag_ready
from .prompts import (
    get_system_prompt,
    build_chat_messages,
    PROACTIVE_INSIGHT_PROMPT,
    SUMMARY_PROMPT
)
try:
    from backend.database.db import get_all_programs, get_program_by_id
except ImportError:
    from database.db import get_all_programs, get_program_by_id

logger = logging.getLogger(__name__)


@dataclass
class Source:
    """Represents a source document referenced in the response."""
    type: str  # "program", "risk", "milestone"
    id: str
    title: str


@dataclass
class QueryResult:
    """Result from query processing."""
    answer: str
    sources: List[Source]
    confidence: str  # "high", "medium", "low"


def _extract_sources_from_search(search_results: List[Dict[str, Any]]) -> List[Source]:
    """Extract unique sources from semantic search results."""
    seen = set()
    sources = []
    
    for result in search_results:
        metadata = result.get("metadata", {})
        doc_type = metadata.get("type", "program")
        
        if doc_type == "program":
            source_id = metadata.get("program_id", "")
            title = metadata.get("program_name", "Unknown Program")
        elif doc_type == "risk":
            source_id = metadata.get("risk_id", "")
            title = f"Risk: {metadata.get('program_name', 'Unknown')}"
        elif doc_type == "milestone":
            source_id = metadata.get("milestone_id", "")
            title = f"Milestone: {metadata.get('program_name', 'Unknown')}"
        else:
            source_id = metadata.get("program_id", "")
            title = metadata.get("program_name", "Unknown")
        
        if source_id and source_id not in seen:
            seen.add(source_id)
            sources.append(Source(type=doc_type, id=source_id, title=title))
    
    return sources


def _detect_query_type(query: str) -> str:
    """
    Detect the type of query to determine retrieval strategy.
    
    Returns:
        "structured" - for count/list queries that need SQL
        "semantic" - for open-ended questions needing vector search
        "hybrid" - for queries that benefit from both
    """
    query_lower = query.lower()
    
    # Structured query patterns (counts, specific lookups)
    structured_patterns = [
        r"how many",
        r"count of",
        r"list all",
        r"show me all",
        r"what is the status of",
        r"which programs are",
        r"programs in .* status",
        r"programs launching (this|next|in)",
    ]
    
    for pattern in structured_patterns:
        if re.search(pattern, query_lower):
            return "hybrid"  # Use both for better grounding
    
    # Semantic query patterns (analysis, risks, summaries)
    semantic_patterns = [
        r"what are the (main|key|biggest|top)",
        r"summarize",
        r"explain",
        r"why is",
        r"tell me about",
        r"risks? (across|for|in)",
        r"health of",
    ]
    
    for pattern in semantic_patterns:
        if re.search(pattern, query_lower):
            return "semantic"
    
    # Default to hybrid for best coverage
    return "hybrid"


def _build_structured_context(query: str, program_id: Optional[str] = None) -> str:
    """
    Build context from direct database queries for structured lookups.
    """
    query_lower = query.lower()
    context_parts = []
    
    # If specific program context provided
    if program_id:
        program = get_program_by_id(program_id)
        if program:
            context_parts.append(f"Current Program Context: {program.name}")
            context_parts.append(f"Status: {program.status}")
            context_parts.append(f"Product Line: {program.product_line}")
            context_parts.append(f"Progress: {program.progress}%")
            if program.risks:
                risks_str = ", ".join([f"{r.title} ({r.severity})" for r in program.risks])
                context_parts.append(f"Risks: {risks_str}")
    
    # Get all programs for aggregate queries
    programs = get_all_programs()
    
    # Status-based queries
    if "at risk" in query_lower or "at-risk" in query_lower:
        at_risk = [p for p in programs if p.status == "At Risk"]
        context_parts.append(f"\nAt Risk Programs ({len(at_risk)}):")
        for p in at_risk:
            context_parts.append(f"- {p.name} ({p.product_line}): {p.last_update}")
    
    if "off track" in query_lower or "off-track" in query_lower:
        off_track = [p for p in programs if p.status == "Off Track"]
        context_parts.append(f"\nOff Track Programs ({len(off_track)}):")
        for p in off_track:
            context_parts.append(f"- {p.name} ({p.product_line}): {p.last_update}")
    
    # Launch-related queries
    if "launch" in query_lower:
        from datetime import datetime, timedelta
        today = datetime.now()
        
        if "this month" in query_lower or "february" in query_lower:
            launching = [p for p in programs 
                        if p.launch_date and p.launch_date.startswith("2026-02")]
        elif "this quarter" in query_lower or "q1" in query_lower:
            launching = [p for p in programs 
                        if p.launch_date and (p.launch_date.startswith("2026-01") or 
                                              p.launch_date.startswith("2026-02") or 
                                              p.launch_date.startswith("2026-03"))]
        elif "next" in query_lower:
            launching = [p for p in programs 
                        if p.launch_date and p.launch_date.startswith("2026-03")]
        else:
            # Default: next 30 days
            launching = [p for p in programs if p.launch_date]
            launching = sorted(launching, key=lambda x: x.launch_date)[:5]
        
        if launching:
            context_parts.append(f"\nUpcoming Launches ({len(launching)}):")
            for p in launching:
                context_parts.append(f"- {p.name}: {p.launch_date} ({p.status})")
    
    # Product line queries
    product_lines = ["smart home", "mobile", "platform", "video"]
    for pl in product_lines:
        if pl in query_lower:
            pl_programs = [p for p in programs if p.product_line.lower() == pl]
            context_parts.append(f"\n{pl.title()} Programs ({len(pl_programs)}):")
            for p in pl_programs:
                context_parts.append(f"- {p.name}: {p.status}, {p.pipeline_stage}")
    
    # Risk queries
    if "risk" in query_lower:
        all_risks = []
        for p in programs:
            for r in p.risks:
                all_risks.append((p.name, r))
        
        if all_risks:
            context_parts.append(f"\nAll Open Risks ({len(all_risks)}):")
            # Sort by severity
            severity_order = {"High": 0, "Medium": 1, "Low": 2}
            all_risks.sort(key=lambda x: severity_order.get(x[1].severity, 3))
            for prog_name, risk in all_risks:
                context_parts.append(f"- [{risk.severity}] {prog_name}: {risk.title}")
                context_parts.append(f"  Mitigation: {risk.mitigation}")
    
    return "\n".join(context_parts) if context_parts else ""


def _determine_confidence(search_results: List[Dict], structured_context: str) -> str:
    """Determine confidence level based on retrieval quality."""
    if not search_results and not structured_context:
        return "low"
    
    # Check relevance scores from semantic search
    if search_results:
        avg_relevance = sum(r.get("relevance_score", 0) for r in search_results) / len(search_results)
        if avg_relevance > 0.5:
            return "high"
        elif avg_relevance > 0.2:
            return "medium"
    
    if structured_context and len(structured_context) > 100:
        return "high"
    
    return "medium"


def process_query(
    query: str,
    history: List[Dict[str, str]] = None,
    program_id: Optional[str] = None
) -> QueryResult:
    """
    Process a user query and generate a grounded response.
    
    Args:
        query: User's natural language question
        history: Previous conversation messages
        program_id: Optional program ID for context-aware queries
        
    Returns:
        QueryResult with answer, sources, and confidence
    """
    history = history or []
    provider_name = os.getenv("LLM_PROVIDER", "claude").lower()
    
    # Detect query type for retrieval strategy
    query_type = _detect_query_type(query)
    logger.info(f"Query type detected: {query_type}")
    
    # Retrieve context based on query type
    semantic_context = ""
    structured_context = ""
    search_results = []
    
    if query_type in ("semantic", "hybrid") and is_rag_ready():
        search_results = semantic_search(query, n_results=5, filter_program_id=program_id)
        semantic_context = get_context_for_query(query, n_results=5, program_id=program_id)
    elif query_type in ("semantic", "hybrid") and not is_rag_ready():
        logger.warning("RAG not ready - falling back to structured queries only")
    
    if query_type in ("structured", "hybrid") or not is_rag_ready():
        structured_context = _build_structured_context(query, program_id)
    
    # Combine contexts
    combined_context = ""
    if semantic_context and structured_context:
        combined_context = f"=== Semantic Search Results ===\n{semantic_context}\n\n=== Structured Data ===\n{structured_context}"
    elif semantic_context:
        combined_context = semantic_context
    elif structured_context:
        combined_context = structured_context
    else:
        combined_context = "No relevant information found in the portfolio database."
    
    # Extract sources
    sources = _extract_sources_from_search(search_results)
    
    # Determine confidence
    confidence = _determine_confidence(search_results, structured_context)
    
    # Build messages and call LLM
    try:
        llm = get_llm_provider(provider_name)
        messages = build_chat_messages(query, combined_context, history, provider_name)
        answer = llm.generate(messages, combined_context, temperature=0.3)
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        answer = "I encountered an error while processing your question. Please try again."
        confidence = "low"
    
    return QueryResult(answer=answer, sources=sources, confidence=confidence)


def process_query_stream(
    query: str,
    history: List[Dict[str, str]] = None,
    program_id: Optional[str] = None
) -> Iterator[Tuple[str, Optional[QueryResult]]]:
    """
    Process a user query and stream the response.
    
    Yields:
        Tuples of (token, None) for streaming tokens
        Final tuple of ("", QueryResult) when complete
    """
    history = history or []
    provider_name = os.getenv("LLM_PROVIDER", "claude").lower()
    
    # Detect query type and retrieve context
    query_type = _detect_query_type(query)
    logger.info(f"Query type detected: {query_type}")
    
    semantic_context = ""
    structured_context = ""
    search_results = []
    
    if query_type in ("semantic", "hybrid") and is_rag_ready():
        search_results = semantic_search(query, n_results=5, filter_program_id=program_id)
        semantic_context = get_context_for_query(query, n_results=5, program_id=program_id)
    elif query_type in ("semantic", "hybrid") and not is_rag_ready():
        logger.warning("RAG not ready - falling back to structured queries only for streaming")
    
    if query_type in ("structured", "hybrid") or not is_rag_ready():
        structured_context = _build_structured_context(query, program_id)
    
    # Combine contexts
    combined_context = ""
    if semantic_context and structured_context:
        combined_context = f"=== Semantic Search Results ===\n{semantic_context}\n\n=== Structured Data ===\n{structured_context}"
    elif semantic_context:
        combined_context = semantic_context
    elif structured_context:
        combined_context = structured_context
    else:
        combined_context = "No relevant information found in the portfolio database."
    
    # Extract sources and determine confidence
    sources = _extract_sources_from_search(search_results)
    confidence = _determine_confidence(search_results, structured_context)
    
    # Stream response from LLM
    full_answer = ""
    try:
        llm = get_llm_provider(provider_name)
        messages = build_chat_messages(query, combined_context, history, provider_name)
        
        for token in llm.stream(messages, combined_context, temperature=0.3):
            full_answer += token
            yield (token, None)
        
    except Exception as e:
        logger.error(f"LLM streaming failed: {e}")
        error_msg = "I encountered an error while processing your question. Please try again."
        full_answer = error_msg
        yield (error_msg, None)
        confidence = "low"
    
    # Yield final result
    result = QueryResult(answer=full_answer, sources=sources, confidence=confidence)
    yield ("", result)


def generate_proactive_insight() -> QueryResult:
    """
    Generate a proactive insight about the portfolio state.
    Called when dashboard loads to surface actionable information.
    """
    provider_name = os.getenv("LLM_PROVIDER", "claude").lower()
    
    # Get comprehensive portfolio context
    context = ""
    if is_rag_ready():
        context = get_context_for_query(
            "portfolio health risks launches status overview",
            n_results=10
        )
    else:
        logger.warning("RAG not ready - proactive insight will use structured data only")
    
    # Add structured summary
    programs = get_all_programs()
    status_counts = {}
    for p in programs:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1
    
    summary = f"\nPortfolio Summary: {len(programs)} total programs\n"
    for status, count in status_counts.items():
        summary += f"- {status}: {count}\n"
    
    combined_context = context + summary
    
    try:
        llm = get_llm_provider(provider_name)
        messages = [
            {"role": "system", "content": get_system_prompt(provider_name)},
            {"role": "user", "content": PROACTIVE_INSIGHT_PROMPT}
        ]
        answer = llm.generate(messages, combined_context, temperature=0.5)
        
        return QueryResult(answer=answer, sources=[], confidence="high")
    except Exception as e:
        logger.error(f"Proactive insight generation failed: {e}")
        return QueryResult(
            answer="Unable to generate insight at this time.",
            sources=[],
            confidence="low"
        )


def generate_portfolio_summary() -> QueryResult:
    """
    Generate a portfolio summary for Monday morning briefings.
    """
    provider_name = os.getenv("LLM_PROVIDER", "claude").lower()
    
    # Get comprehensive context
    programs = get_all_programs()
    
    # Build detailed summary context
    context_parts = []
    
    # Status breakdown
    status_counts = {}
    for p in programs:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1
    context_parts.append("Status Breakdown:")
    for status, count in status_counts.items():
        context_parts.append(f"- {status}: {count} programs")
    
    # At-risk programs
    at_risk = [p for p in programs if p.status in ("At Risk", "Off Track")]
    if at_risk:
        context_parts.append("\nPrograms Needing Attention:")
        for p in at_risk:
            context_parts.append(f"- {p.name} ({p.status}): {p.last_update}")
    
    # Upcoming launches (this week)
    launching_soon = [p for p in programs 
                     if p.launch_date and p.launch_date.startswith("2026-02-0")]
    if launching_soon:
        context_parts.append("\nLaunching This Week:")
        for p in launching_soon:
            context_parts.append(f"- {p.name}: {p.launch_date}")
    
    # High severity risks
    high_risks = []
    for p in programs:
        for r in p.risks:
            if r.severity == "High" and r.status == "Open":
                high_risks.append((p.name, r))
    
    if high_risks:
        context_parts.append("\nCritical Risks:")
        for prog_name, risk in high_risks:
            context_parts.append(f"- {prog_name}: {risk.title}")
    
    combined_context = "\n".join(context_parts)
    
    try:
        llm = get_llm_provider(provider_name)
        messages = [
            {"role": "system", "content": get_system_prompt(provider_name)},
            {"role": "user", "content": SUMMARY_PROMPT}
        ]
        answer = llm.generate(messages, combined_context, temperature=0.5)
        
        return QueryResult(answer=answer, sources=[], confidence="high")
    except Exception as e:
        logger.error(f"Portfolio summary generation failed: {e}")
        return QueryResult(
            answer="Unable to generate summary at this time.",
            sources=[],
            confidence="low"
        )
