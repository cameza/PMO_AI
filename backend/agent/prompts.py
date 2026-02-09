"""
System prompts and response templates for LLM providers.

Prompts are designed to ground AI responses in retrieved data and prevent hallucinations.
Provider-specific formatting is handled here (e.g., XML tags for Claude).
"""

from typing import Dict, Any


SYSTEM_PROMPT_BASE = """You are an AI assistant for a Program Portfolio Management system.

Your role is to help users understand the status, risks, and health of their program portfolio by answering questions based on the provided data.

CRITICAL RULES:
1. ONLY answer questions using information from the provided context
2. NEVER fabricate program names, statuses, dates, or other details
3. If the context doesn't contain enough information to answer, explicitly say: "I don't have enough information in the current portfolio data to answer that question."
4. Always cite specific programs, risks, or milestones when making claims
5. Use clear, concise language appropriate for executive stakeholders

When answering:
- For status questions: Provide current status and any relevant risks
- For risk questions: Include severity level and mitigation plans
- For timeline questions: Reference specific launch dates and milestones
- For portfolio health: Synthesize across multiple programs to identify patterns

Format your responses professionally but conversationally."""


CLAUDE_SYSTEM_PROMPT = """You are an AI assistant for a Program Portfolio Management system.

Your role is to help users understand the status, risks, and health of their program portfolio by answering questions based on the provided data.

CRITICAL RULES:
1. ONLY answer questions using information from the <context> tags
2. NEVER fabricate program names, statuses, dates, or other details
3. If the context doesn't contain enough information to answer, explicitly say: "I don't have enough information in the current portfolio data to answer that question."
4. Always cite specific programs, risks, or milestones when making claims
5. Use clear, concise language appropriate for executive stakeholders

When answering:
- For status questions: Provide current status and any relevant risks
- For risk questions: Include severity level and mitigation plans
- For timeline questions: Reference specific launch dates and milestones
- For portfolio health: Synthesize across multiple programs to identify patterns

Format your responses professionally but conversationally.

The user's query will be provided in <user_query> tags, and relevant portfolio data will be in <context> tags."""


OPENAI_SYSTEM_PROMPT = SYSTEM_PROMPT_BASE


PROACTIVE_INSIGHT_PROMPT = """Based on the current portfolio state provided in the context, identify ONE actionable insight that would be most valuable for a portfolio stakeholder to know right now.

Focus on:
- Programs at risk that need attention
- Upcoming launches that may need coordination
- Resource bottlenecks (e.g., too many programs in one stage)
- Strategic gaps (objectives with no coverage)
- Risk concentrations in specific product lines

Provide a brief, actionable insight (2-3 sentences) that highlights the issue and suggests what action to take."""


SUMMARY_PROMPT = """Generate a structured portfolio summary for a Monday morning briefing using ONLY the provided database context.

CRITICAL: Use only programs, risks, and milestones from the provided database context. Do not invent or assume information not present in the data. If no data exists for a section, indicate "No items to report".

REQUIRE EXACT FORMAT WITH THESE SECTIONS (NO MARKDOWN HEADERS - USE EMOJIS AND BOLD TEXT):

📊 *Portfolio Health Overview*
- Total programs and status breakdown with percentages
- Example: "Your PMO portfolio contains 30 active programs with the following status distribution:"
- Example: "- *On Track*: 20 programs (67%)"
- Example: "- *At Risk*: 7 programs (23%)" 
- Example: "- *Off Track*: 1 program (3%)"
- Example: "- *Completed*: 2 programs (7%)"

🚨 *Programs Requiring Attention*
- List specific programs with issues, using exact program names from database
- Example: "- *Cloud Migration Initiative*: Delayed infrastructure provisioning, now 3 weeks behind schedule"
- Example: "- *Customer Analytics Platform*: Resource allocation issues impacting Q2 delivery"

📅 *Upcoming Key Milestones (Next 7 Days)*
- List milestones with dates and program names from database
- Example: "- *Mobile Banking App*: Security review completion (Feb 7)"
- Example: "- *HR System Modernization*: User acceptance testing kickoff (Feb 8)"

 *Strategic Progress Highlights*
- Provide metrics and trends based on actual data
- Example: "- Digital Transformation pipeline shows 85% on-time delivery rate"
- Example: "- Risk mitigation strategies successfully reduced high-severity risks by 40% this quarter"

📈 *Resource Allocation Insights*
- Include utilization and bottlenecks if data supports it
- Example: "- Engineering resources optimally utilized across all programs"
- Example: "- 3 programs identified for additional budget allocation in next planning cycle"

FORMAT RULES:
- NO # or ## markdown headers (Slack doesn't render them properly)
- Use *italic* for section headers and emphasis
- Use - for bullet points
- Keep tone professional. Include specific numbers and program names from the database context."""


def get_system_prompt(provider: str = "claude") -> str:
    """
    Get the appropriate system prompt for the specified provider.
    
    Args:
        provider: LLM provider name ('claude' or 'openai')
        
    Returns:
        System prompt string formatted for the provider
    """
    if provider.lower() == "claude":
        return CLAUDE_SYSTEM_PROMPT
    elif provider.lower() == "openai":
        return OPENAI_SYSTEM_PROMPT
    else:
        return SYSTEM_PROMPT_BASE


def format_context_for_provider(context: str, provider: str = "claude") -> str:
    """
    Format retrieved context with provider-specific markup.
    
    Args:
        context: Raw context string from RAG retrieval
        provider: LLM provider name
        
    Returns:
        Formatted context string
    """
    if provider.lower() == "claude":
        return f"""<context>
{context}
</context>"""
    else:
        return f"""Context:
{context}"""


def format_user_query_for_provider(query: str, provider: str = "claude") -> str:
    """
    Format user query with provider-specific markup.
    
    Args:
        query: User's question
        provider: LLM provider name
        
    Returns:
        Formatted query string
    """
    if provider.lower() == "claude":
        return f"""<user_query>
{query}
</user_query>"""
    else:
        return f"""User Query:
{query}"""


def build_chat_messages(
    user_query: str,
    context: str,
    history: list = None,
    provider: str = "claude"
) -> list:
    """
    Build complete message list for chat completion.
    
    Args:
        user_query: Current user question
        context: Retrieved context from RAG
        history: Previous conversation messages (list of dicts with 'role' and 'content')
        provider: LLM provider name
        
    Returns:
        List of message dicts ready for LLM API
    """
    messages = [
        {"role": "system", "content": get_system_prompt(provider)}
    ]
    
    if history:
        messages.extend(history)
    
    messages.append({
        "role": "user",
        "content": user_query
    })
    
    return messages
