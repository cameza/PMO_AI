"""
RAG Implementation for Program Portfolio AI

Uses OpenAI embeddings + Supabase pgvector for vector storage and semantic retrieval.
Embeds program descriptions, update narratives, and risk descriptions.
"""

import os
import logging
from typing import List, Dict, Any, Optional

import httpx

try:
    from backend.database.db import get_all_programs, _get_client, _get_org_id
except ImportError:
    from database.db import get_all_programs, _get_client, _get_org_id

logger = logging.getLogger(__name__)

_rag_ready: bool = False

# OpenAI embedding model — 1536 dimensions, cheap and fast
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536


def _get_openai_key() -> str:
    """Get the OpenAI API key from environment."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return key


def _embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts using OpenAI API.
    Batches up to 2048 texts per request (API limit).
    """
    if not texts:
        return []

    api_key = _get_openai_key()
    all_embeddings: List[List[float]] = []
    batch_size = 2048

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = httpx.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"input": batch, "model": EMBEDDING_MODEL},
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
        # Sort by index to preserve order
        sorted_data = sorted(data["data"], key=lambda x: x["index"])
        all_embeddings.extend([item["embedding"] for item in sorted_data])

    return all_embeddings


def _build_program_document(program: Dict[str, Any]) -> str:
    """Build a searchable document from a program."""
    objectives = ", ".join(program.get("strategic_objectives", program.get("strategic_objective_ids", [])))
    
    doc = f"""Program: {program['name']}
Description: {program.get('description', '')}
Status: {program['status']}
Product Line: {program.get('product_line', '')}
Pipeline Stage: {program.get('pipeline_stage', '')}
Owner: {program.get('owner', '')}
Team: {program.get('team', '')}
Launch Date: {program.get('launch_date', '')}
Progress: {program.get('progress', 0)}%
Strategic Objectives: {objectives}
Last Update: {program.get('last_update', '')}"""
    
    return doc


def _build_risk_document(risk: Dict[str, Any], program_name: str) -> str:
    """Build a searchable document from a risk."""
    doc = f"""Risk for {program_name}: {risk['title']}
Severity: {risk['severity']}
Description: {risk.get('description', '')}
Mitigation: {risk.get('mitigation', '')}
Status: {risk.get('status', '')}"""
    
    return doc


def _build_milestone_document(milestone: Dict[str, Any], program_name: str) -> str:
    """Build a searchable document from a milestone."""
    completed = milestone.get('completed_date') or "Not completed"
    
    doc = f"""Milestone for {program_name}: {milestone['name']}
Due Date: {milestone.get('due_date', '')}
Completed: {completed}
Status: {milestone.get('status', '')}"""
    
    return doc


def index_portfolio_data() -> int:
    """
    Index all program data into Supabase pgvector for semantic search.
    
    Embeds:
    - Program descriptions and metadata
    - Risk descriptions
    - Milestone information
    
    Returns:
        Number of documents indexed
    """
    client = _get_client()
    org_id = _get_org_id()

    # Clear existing embeddings for this org
    try:
        client.table("embeddings").delete().eq("organization_id", org_id).execute()
        logger.info("Cleared existing embeddings for re-indexing")
    except Exception as e:
        logger.warning(f"Could not clear embeddings: {e}")

    programs = get_all_programs()

    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for program in programs:
        program_dict = program.model_dump()

        # Index program document
        program_doc = _build_program_document(program_dict)
        documents.append(program_doc)
        metadatas.append({
            "type": "program",
            "program_id": program.id,
            "program_name": program.name,
            "status": program.status.value if hasattr(program.status, 'value') else str(program.status),
            "product_line": program.product_line or "",
            "pipeline_stage": program.pipeline_stage.value if program.pipeline_stage and hasattr(program.pipeline_stage, 'value') else str(program.pipeline_stage or ""),
        })

        # Index risks
        for risk in program.risks:
            risk_dict = risk.model_dump()
            risk_doc = _build_risk_document(risk_dict, program.name)
            documents.append(risk_doc)
            metadatas.append({
                "type": "risk",
                "program_id": program.id,
                "program_name": program.name,
                "risk_id": risk.id,
                "severity": risk.severity.value if hasattr(risk.severity, 'value') else str(risk.severity),
                "risk_status": risk.status.value if hasattr(risk.status, 'value') else str(risk.status),
            })

        # Index milestones
        for milestone in program.milestones:
            milestone_dict = milestone.model_dump()
            milestone_doc = _build_milestone_document(milestone_dict, program.name)
            documents.append(milestone_doc)
            metadatas.append({
                "type": "milestone",
                "program_id": program.id,
                "program_name": program.name,
                "milestone_id": milestone.id,
                "milestone_status": milestone.status.value if hasattr(milestone.status, 'value') else str(milestone.status),
            })

    if not documents:
        logger.warning("No documents to index")
        return 0

    # Generate embeddings via OpenAI
    logger.info(f"Generating embeddings for {len(documents)} documents...")
    embeddings = _embed_texts(documents)

    # Batch insert into Supabase
    rows = []
    for doc, meta, emb in zip(documents, metadatas, embeddings):
        rows.append({
            "organization_id": org_id,
            "content": doc,
            "metadata": meta,
            "embedding": emb,
        })

    # Insert in batches of 100
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        client.table("embeddings").insert(batch).execute()
        logger.info(f"Inserted embeddings batch {i // batch_size + 1}")

    logger.info(f"Indexed {len(documents)} documents into pgvector")
    return len(documents)


def semantic_search(
    query: str,
    n_results: int = 5,
    filter_type: Optional[str] = None,
    filter_program_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Perform semantic search over the portfolio data using pgvector.
    
    Args:
        query: Natural language search query
        n_results: Maximum number of results to return
        filter_type: Optional filter by document type ('program', 'risk', 'milestone')
        filter_program_id: Optional filter by specific program ID
        
    Returns:
        List of search results with document content, metadata, and relevance score
    """
    if not _rag_ready:
        logger.warning("RAG not ready, returning empty results")
        return []

    try:
        # Generate query embedding
        query_embedding = _embed_texts([query])[0]

        client = _get_client()
        org_id = _get_org_id()

        # Call the match function
        resp = client.rpc(
            "match_embeddings",
            {
                "query_embedding": query_embedding,
                "match_count": n_results,
                "match_threshold": 0.3,
                "filter_org_id": org_id,
                "filter_type": filter_type,
            },
        ).execute()

        results = resp.data or []

        # Post-filter by program_id if needed
        if filter_program_id:
            results = [
                r for r in results
                if r.get("metadata", {}).get("program_id") == filter_program_id
            ]

        search_results = []
        for r in results:
            search_results.append({
                "content": r["content"],
                "metadata": r.get("metadata", {}),
                "relevance_score": r.get("similarity", 0),
            })

        logger.debug(f"Semantic search for '{query}' returned {len(search_results)} results")
        return search_results

    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        return []


def get_context_for_query(
    query: str,
    n_results: int = 5,
    program_id: Optional[str] = None
) -> str:
    """
    Get assembled context string for an LLM query.
    
    This is the main interface for the query_handler to retrieve
    grounded context before calling the LLM.
    
    Args:
        query: User's natural language query
        n_results: Number of relevant documents to include
        program_id: Optional program ID for context-aware queries
        
    Returns:
        Formatted context string for LLM prompt
    """
    results = semantic_search(
        query=query,
        n_results=n_results,
        filter_program_id=program_id
    )
    
    if not results:
        return "No relevant information found in the portfolio database."
    
    context_parts = []
    for i, result in enumerate(results, 1):
        relevance = f"{result['relevance_score']:.2f}" if result.get('relevance_score') else "N/A"
        context_parts.append(f"--- Document {i} (relevance: {relevance}) ---\n{result['content']}")
    
    context = "\n\n".join(context_parts)
    return context


def is_rag_ready() -> bool:
    """Check if RAG is initialized and ready for queries."""
    return _rag_ready


def set_rag_ready(ready: bool) -> None:
    """Set the RAG ready state."""
    global _rag_ready
    _rag_ready = ready
    logger.info(f"RAG ready state set to: {ready}")


def get_rag_stats() -> Dict[str, Any]:
    """Get statistics about the RAG index."""
    try:
        if not _rag_ready:
            return {
                "indexed_documents": 0,
                "store": "pgvector",
                "status": "not_initialized"
            }
        client = _get_client()
        org_id = _get_org_id()
        resp = client.table("embeddings").select("id", count="exact").eq("organization_id", org_id).execute()
        count = resp.count or 0
        return {
            "indexed_documents": count,
            "store": "pgvector",
            "status": "ready" if count > 0 else "empty"
        }
    except Exception as e:
        logger.error(f"Failed to get RAG stats: {e}")
        return {
            "indexed_documents": 0,
            "store": "pgvector",
            "status": "error",
            "error": str(e)
        }
