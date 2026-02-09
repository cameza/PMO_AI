"""
Message Event Handlers for Slack Bot

Handles DMs and @mentions, forwarding questions to the backend AI agent
and posting responses back to Slack.
"""

import os
import logging
import json
import requests
from typing import Optional

logger = logging.getLogger(__name__)


def _convert_to_slack_format(text: str) -> str:
    """
    Convert markdown formatting to Slack-compatible format.
    
    Args:
        text: Text with markdown formatting
        
    Returns:
        Text formatted for Slack display
    """
    if not text:
        return text
    
    # Convert markdown bold (**text**) to Slack bold (*text*)
    import re
    text = re.sub(r'\*\*(.*?)\*\*', r'*\1*', text)
    
    # Convert markdown headers to bold text (Slack doesn't support headers)
    text = re.sub(r'^#{1,6}\s*(.+)$', r'*\1*', text, flags=re.MULTILINE)
    
    # Convert markdown italics (*text*) to Slack italics (_text_)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'_\1_', text)
    
    return text


def register_message_handlers(app):
    """Register all message-related event handlers with the Slack app."""
    
    @app.event("message")
    def handle_message_events(event, say, logger):
        """
        Handle direct messages to the bot.
        
        Filters out bot messages and channel messages (handled by app_mention).
        """
        # Ignore bot messages to prevent loops
        if event.get("bot_id"):
            return
        
        # Only handle DMs (channel_type is 'im')
        if event.get("channel_type") != "im":
            return
        
        message_text = event.get("text", "")
        user_id = event.get("user")
        
        logger.info(f"Received DM from user {user_id}: {message_text}")
        
        # Process the message and get AI response
        response = _get_ai_response(message_text)
        
        # Send response back to user
        say(response)
    
    
    @app.event("app_mention")
    def handle_app_mention(event, say, logger):
        """
        Handle @mentions of the bot in channels.
        
        Responds in a thread to keep conversations organized.
        """
        # Ignore bot messages
        if event.get("bot_id"):
            return
        
        message_text = event.get("text", "")
        user_id = event.get("user")
        thread_ts = event.get("thread_ts") or event.get("ts")
        
        logger.info(f"Received mention from user {user_id}: {message_text}")
        
        # Remove the bot mention from the message text
        # Mentions look like <@U12345678>
        import re
        clean_text = re.sub(r'<@[A-Z0-9]+>', '', message_text).strip()
        
        # Process the message and get AI response
        response = _get_ai_response(clean_text)
        
        # Respond in thread
        say(text=response, thread_ts=thread_ts)


def _get_ai_response(message: str) -> str:
    """
    Forward message to backend AI agent and get response.
    
    Args:
        message: User's question
        
    Returns:
        AI-generated response text
    """
    backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8000")
    endpoint = f"{backend_url}/api/agent/chat"
    
    try:
        # Prepare request payload
        payload = {
            "message": message,
            "history": [],
            "context": None
        }
        
        # Call backend API with streaming
        response = requests.post(
            endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=60
        )
        
        if response.status_code != 200:
            logger.error(f"Backend API error: {response.status_code}")
            return "I encountered an error while processing your question. Please try again later."
        
        # Parse SSE stream
        full_answer = ""
        sources = []
        confidence = "medium"
        
        for line in response.iter_lines():
            if not line:
                continue
            
            line_str = line.decode('utf-8')
            
            # SSE format: "data: {json}"
            if line_str.startswith("data: "):
                data_str = line_str[6:]  # Remove "data: " prefix
                
                try:
                    data = json.loads(data_str)
                    
                    if data.get("type") == "token":
                        # Accumulate tokens
                        full_answer += data.get("content", "")
                    
                    elif data.get("type") == "done":
                        # Final response with metadata
                        response_data = data.get("response", {})
                        full_answer = response_data.get("answer", full_answer)
                        sources = response_data.get("sources", [])
                        confidence = response_data.get("confidence", "medium")
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse SSE data: {e}")
                    continue
        
        # Convert markdown formatting to Slack format
        full_answer = _convert_to_slack_format(full_answer)
        
        # Format response with sources if available
        if sources:
            source_text = "\n\n_Sources:_\n"
            for source in sources[:3]:  # Limit to 3 sources
                source_text += f"• {source.get('title', 'Unknown')}\n"
            full_answer += source_text
        
        return full_answer if full_answer else "I don't have enough information to answer that question."
        
    except requests.exceptions.Timeout:
        logger.error("Backend API request timed out")
        return "The request took too long to process. Please try again."
    
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to backend API")
        return "I'm having trouble connecting to the backend service. Please make sure it's running."
    
    except Exception as e:
        logger.error(f"Unexpected error in _get_ai_response: {e}")
        return "I encountered an unexpected error. Please try again later."
