"""
Seed Supabase with synthetic program data from data/synthetic_programs.json.
Reads the JSON, maps strategic objectives by name, and inserts programs/risks/milestones.

Usage:
  cd backend && source venv/bin/activate
  python scripts/seed_supabase.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
(service role key bypasses RLS for seeding)
"""

import json
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DEMO_ORG_ID = "a0000000-0000-0000-0000-000000000001"

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    logger.error("Get these from: https://supabase.com/dashboard/project/jxjjwumtgjbjcxeosibl/settings/api")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    logger.error("supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def load_synthetic_data() -> dict:
    data_path = Path(__file__).resolve().parent.parent.parent / "data" / "synthetic_programs.json"
    with open(data_path) as f:
        return json.load(f)


def get_objective_id_map() -> dict:
    """Fetch strategic objectives and return name -> id mapping."""
    result = supabase.table("strategic_objectives").select("id, name").eq("organization_id", DEMO_ORG_ID).execute()
    return {row["name"]: row["id"] for row in result.data}


def seed_programs(data: dict, obj_map: dict):
    programs = data["programs"]
    
    program_count = 0
    risk_count = 0
    milestone_count = 0
    mapping_count = 0
    
    for p in programs:
        # Insert program
        program_row = {
            "organization_id": DEMO_ORG_ID,
            "name": p["name"],
            "description": p.get("description"),
            "status": p["status"],
            "owner": p.get("owner"),
            "team": p.get("team"),
            "product_line": p.get("product_line"),
            "pipeline_stage": p.get("pipeline_stage"),
            "launch_date": p.get("launch_date"),
            "progress": p.get("progress", 0),
            "last_update": p.get("last_update"),
        }
        
        result = supabase.table("programs").insert(program_row).execute()
        program_id = result.data[0]["id"]
        program_count += 1
        
        # Insert risks
        for r in p.get("risks", []):
            risk_row = {
                "organization_id": DEMO_ORG_ID,
                "program_id": program_id,
                "title": r["title"],
                "severity": r["severity"],
                "description": r.get("description"),
                "mitigation": r.get("mitigation"),
                "status": r.get("status", "Open"),
            }
            supabase.table("risks").insert(risk_row).execute()
            risk_count += 1
        
        # Insert milestones
        for m in p.get("milestones", []):
            # Map status values to match our CHECK constraint
            status = m.get("status", "Pending")
            status_map = {"Upcoming": "Pending"}
            status = status_map.get(status, status)
            
            milestone_row = {
                "organization_id": DEMO_ORG_ID,
                "program_id": program_id,
                "name": m["name"],
                "due_date": m.get("due_date"),
                "completed_date": m.get("completed_date"),
                "status": status,
            }
            supabase.table("milestones").insert(milestone_row).execute()
            milestone_count += 1
        
        # Map strategic objectives
        for obj_name in p.get("strategic_objectives", []):
            obj_id = obj_map.get(obj_name)
            if obj_id:
                mapping_row = {
                    "program_id": program_id,
                    "strategic_objective_id": obj_id,
                }
                supabase.table("program_strategic_objectives").insert(mapping_row).execute()
                mapping_count += 1
            else:
                logger.warning(f"Objective not found: {obj_name}")
    
    logger.info(f"Seeded successfully:")
    logger.info(f"  Programs: {program_count}")
    logger.info(f"  Risks: {risk_count}")
    logger.info(f"  Milestones: {milestone_count}")
    logger.info(f"  Objective mappings: {mapping_count}")


def main():
    logger.info("Loading synthetic data...")
    data = load_synthetic_data()
    
    logger.info("Fetching strategic objective IDs...")
    obj_map = get_objective_id_map()
    logger.info(f"Found {len(obj_map)} objectives: {list(obj_map.keys())}")
    
    logger.info("Seeding programs, risks, milestones...")
    seed_programs(data, obj_map)
    
    logger.info("Done!")


if __name__ == "__main__":
    main()
