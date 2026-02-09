"""
Slack Bot for PMO Portfolio AI

Main application file that initializes the Slack Bolt app and registers event handlers.
Handles DMs and @mentions, forwarding questions to the backend AI agent.
"""

import os
import logging
import atexit
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

from handlers import register_message_handlers, init_scheduler, shutdown_scheduler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Slack app
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

# Register event handlers
register_message_handlers(app)

# Initialize scheduler for notifications
init_scheduler(app)

# Register graceful shutdown
atexit.register(shutdown_scheduler)

logger.info("Slack bot initialized successfully")
logger.info("Monday Morning Summary scheduler configured for Mondays at 9:00 AM")


def main():
    """Start the Slack bot using Socket Mode."""
    app_token = os.environ.get("SLACK_APP_TOKEN")
    
    if not app_token:
        logger.error("SLACK_APP_TOKEN not found in environment variables")
        raise ValueError("SLACK_APP_TOKEN is required for Socket Mode")
    
    if not os.environ.get("SLACK_BOT_TOKEN"):
        logger.error("SLACK_BOT_TOKEN not found in environment variables")
        raise ValueError("SLACK_BOT_TOKEN is required")
    
    if not os.environ.get("SLACK_SIGNING_SECRET"):
        logger.error("SLACK_SIGNING_SECRET not found in environment variables")
        raise ValueError("SLACK_SIGNING_SECRET is required")
    
    if not os.environ.get("SLACK_CHANNEL_ID"):
        logger.warning("SLACK_CHANNEL_ID not found in environment variables")
        logger.warning("Monday Morning Summary will not be posted until channel is configured")
    
    logger.info("Starting Slack bot in Socket Mode...")
    logger.info(f"Backend API URL: {os.environ.get('BACKEND_API_URL', 'http://localhost:8000')}")
    
    # Start the app using Socket Mode
    handler = SocketModeHandler(app, app_token)
    handler.start()


if __name__ == "__main__":
    main()
