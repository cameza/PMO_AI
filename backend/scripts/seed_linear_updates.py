"""
One-time script to create project updates with health in Linear.
Uses the projectUpdateCreate GraphQL mutation via httpx.

Usage: python3 backend/scripts/seed_linear_updates.py
"""

import os
import sys
from pathlib import Path

# Load .env from project root
from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

import httpx

LINEAR_API_URL = "https://api.linear.app/graphql"
API_KEY = os.environ.get("LINEAR_API_KEY")

if not API_KEY:
    print("ERROR: LINEAR_API_KEY not set in .env")
    sys.exit(1)

HEADERS = {
    "Authorization": API_KEY,
    "Content-Type": "application/json",
}

UPDATES = [
    {
        "projectId": "42708ffb-2786-4304-9735-4406a52f311f",  # 5G Network Expansion
        "body": "Site surveys underway in 8 of 15 target markets. Permitting delays in 2 cities but overall timeline holds. Equipment procurement on schedule.",
        "health": "onTrack",
    },
    {
        "projectId": "b4129ae5-1379-4592-8629-cc220cc63269",  # Streaming Platform Redesign
        "body": "Design system finalized but engineering capacity reduced due to unplanned attrition. Beta timeline may slip 2 weeks. Exploring contractor options to backfill.",
        "health": "atRisk",
    },
    {
        "projectId": "5537e00e-0d53-44fb-ae2b-94a4f83b09a0",  # Mobile App v3.0
        "body": "User research phase progressing well. 12 customer interviews completed, synthesis underway. Initial findings validate eSIM activation as top priority feature.",
        "health": "onTrack",
    },
    {
        "projectId": "787e1d76-afc4-482b-88a2-740995af6356",  # Fiber-to-Home Rollout Phase 2
        "body": "Vendor evaluation on track. 3 finalists selected for construction bids. Environmental impact assessments submitted for all target regions.",
        "health": "onTrack",
    },
    {
        "projectId": "671dc991-9987-4628-bd48-87f7df7eb3c1",  # Customer Self-Service Portal
        "body": "Critical dependency on billing API delayed 3 weeks due to upstream team capacity issues. Account management module launch pushed back. Escalated to VP Engineering.",
        "health": "offTrack",
    },
    {
        "projectId": "4729a4ae-bde1-432b-a7d7-f25781ffd384",  # Live Sports Streaming Package
        "body": "League partnership negotiations slower than expected. Legal review of broadcast rights adding 2-week delay. Technical architecture review on hold pending deal terms.",
        "health": "atRisk",
    },
    {
        "projectId": "b8ec104c-edde-43d4-83e2-9a7f1348f39c",  # Smart Home Hub Integration
        "body": "Market research phase on schedule. Initial findings show strong demand in suburban markets. Hardware partner shortlist narrowed to 4 candidates.",
        "health": "onTrack",
    },
]

MUTATION = """
mutation ProjectUpdateCreate($input: ProjectUpdateCreateInput!) {
    projectUpdateCreate(input: $input) {
        success
        projectUpdate {
            id
            body
            health
            project {
                id
                name
            }
        }
    }
}
"""


def create_update(update: dict) -> None:
    resp = httpx.post(
        LINEAR_API_URL,
        headers=HEADERS,
        json={
            "query": MUTATION,
            "variables": {"input": update},
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    result = resp.json()

    if "errors" in result:
        print(f"  ERROR: {result['errors']}")
        return

    data = result["data"]["projectUpdateCreate"]
    if data["success"]:
        proj = data["projectUpdate"]["project"]
        health = data["projectUpdate"]["health"]
        print(f"  ✓ {proj['name']} → {health}")
    else:
        print(f"  FAILED for project {update['projectId']}")


if __name__ == "__main__":
    print(f"Creating {len(UPDATES)} project updates in Linear...\n")
    for update in UPDATES:
        create_update(update)
    print("\nDone!")
