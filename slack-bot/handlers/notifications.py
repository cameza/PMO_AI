"""
Notification Handlers for Slack Bot

Handles scheduled notifications, including the Monday Morning Summary.
Uses APScheduler for cron-based scheduling.
"""

import os
import logging
import json
import requests
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def init_scheduler(app):
    """
    Initialize the APScheduler with all scheduled jobs.
    
    Args:
        app: Slack Bolt app instance for posting messages
    """
    global scheduler
    
    scheduler = BackgroundScheduler()
    
    # Add Monday Morning Summary job
    scheduler.add_job(
        func=lambda: monday_morning_summary(app),
        trigger=CronTrigger(
            day_of_week='mon',
            hour=9,
            minute=0
        ),
        id='monday_morning_summary',
        name='Monday Morning Portfolio Summary',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler initialized with Monday Morning Summary job")


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    global scheduler
    if scheduler:
        scheduler.shutdown()
        logger.info("Scheduler shutdown")


def monday_morning_summary(app):
    """
    Generate and post Monday Morning Summary to configured Slack channel.
    
    This function:
    1. Calls the backend summary endpoint
    2. Formats the response for Slack
    3. Posts to the configured channel
    """
    try:
        logger.info("Starting Monday Morning Summary generation")
        
        # Get configuration
        backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8000")
        channel_id = os.getenv("SLACK_CHANNEL_ID")
        
        if not channel_id:
            logger.error("SLACK_CHANNEL_ID not configured")
            return
        
        # Call backend summary endpoint
        summary_data = _get_portfolio_summary(backend_url)
        
        if not summary_data:
            logger.error("Failed to generate portfolio summary")
            return
        
        # Format for Slack
        slack_message = _format_summary_for_slack(summary_data)
        
        # Post to Slack channel
        app.client.chat_postMessage(
            channel=channel_id,
            text=slack_message,
            username="PMO AI Assistant",
            icon_emoji=":robot_face:"
        )
        
        logger.info(f"Monday Morning Summary posted to channel {channel_id}")
        
    except Exception as e:
        logger.error(f"Error in Monday Morning Summary: {e}")
        # Try to post error message
        try:
            app.client.chat_postMessage(
                channel=os.getenv("SLACK_CHANNEL_ID"),
                text="❌ Failed to generate Monday Morning Summary. Please check the logs.",
                username="PMO AI Assistant",
                icon_emoji=":warning:"
            )
        except:
            logger.error("Failed to post error message to Slack")


def _get_portfolio_summary(backend_url: str) -> dict:
    """
    Call backend API to get portfolio summary.
    
    Args:
        backend_url: Base URL of the backend API
        
    Returns:
        Summary data dictionary or None if failed
    """
    endpoint = f"{backend_url}/api/agent/summary"
    
    try:
        response = requests.post(
            endpoint,
            json={"message": "Generate a comprehensive portfolio summary"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code != 200:
            logger.error(f"Backend summary API error: {response.status_code}")
            return None
        
        return response.json()
        
    except requests.exceptions.Timeout:
        logger.error("Backend summary API request timed out")
        return None
    
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to backend summary API")
        return None
    
    except Exception as e:
        logger.error(f"Unexpected error calling summary API: {e}")
        return None


def _format_summary_for_slack(summary_data: dict) -> str:
    """
    Format portfolio summary for Slack message.
    
    Args:
        summary_data: Summary data from backend API
        
    Returns:
        Formatted Slack message string
    """
    try:
        summary = summary_data.get("summary", "No summary available")
        confidence = summary_data.get("confidence", "unknown")
        timestamp = summary_data.get("timestamp", datetime.now().isoformat())
        
        # Format timestamp
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            formatted_time = dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = timestamp
        
        # Build Slack message
        message = f"""🌅 *Good Morning! Here's your PMO Portfolio Summary for {formatted_time}*

{summary}

---
*Confidence Level: {confidence}* | *Generated by PMO AI Assistant* 🤖"""
        
        # Truncate if too long for Slack (4000 char limit)
        if len(message) > 3900:
            message = message[:3870] + "...\n\n*(Summary truncated for length)*"
        
        return message
        
    except Exception as e:
        logger.error(f"Error formatting summary for Slack: {e}")
        return "❌ Error formatting portfolio summary"


def test_summary_now(app):
    """
    Test function to immediately generate and post a summary.
    Useful for testing and debugging.
    
    Args:
        app: Slack Bolt app instance
    """
    logger.info("Running test summary generation")
    monday_morning_summary(app)
