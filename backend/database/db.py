import os
import logging
from typing import List, Optional

from supabase import create_client, Client

from .models import Program, Risk, Milestone, StrategicObjective

logger = logging.getLogger(__name__)

# Supabase client (singleton)
_supabase: Optional[Client] = None

# Demo org ID — will be replaced by auth-scoped org_id in production
DEMO_ORG_ID = "a0000000-0000-0000-0000-000000000001"


def _get_client() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        if not url or not key:
            raise RuntimeError(
                "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. "
                "Set them in .env or Vercel environment variables."
            )
        _supabase = create_client(url, key)
    return _supabase


def get_connection():
    """Backward-compatible alias — returns the Supabase client."""
    return _get_client()


def init_db() -> None:
    """Verify Supabase connectivity. Schema is managed via Supabase migrations."""
    try:
        client = _get_client()
        result = client.table("programs").select("id").limit(1).execute()
        logger.info(f"Supabase connection verified. Programs table accessible.")
    except Exception as e:
        logger.warning(f"Supabase connection check failed (non-fatal): {e}")


def _get_org_id() -> str:
    """Return the current organization ID. Hardcoded for now; will use auth session later."""
    return DEMO_ORG_ID


# ---------------------------------------------------------------------------
# Programs
# ---------------------------------------------------------------------------

def _build_program(row: dict, risks: List[Risk], milestones: List[Milestone], objective_ids: List[str]) -> Program:
    """Build a Program model from a Supabase row."""
    return Program(
        id=str(row["id"]),
        name=row["name"],
        description=row.get("description"),
        status=row["status"],
        owner=row.get("owner"),
        team=row.get("team"),
        product_line=row.get("product_line"),
        pipeline_stage=row.get("pipeline_stage"),
        strategic_objective_ids=objective_ids,
        launch_date=row.get("launch_date"),
        progress=row.get("progress", 0),
        risks=risks,
        milestones=milestones,
        last_update=row.get("last_update"),
    )


def get_all_programs() -> List[Program]:
    """Retrieve all programs with their risks and milestones."""
    try:
        client = _get_client()
        org_id = _get_org_id()

        prog_resp = client.table("programs").select("*").eq("organization_id", org_id).execute()
        risk_resp = client.table("risks").select("*").eq("organization_id", org_id).execute()
        ms_resp = client.table("milestones").select("*").eq("organization_id", org_id).execute()
        map_resp = client.table("program_strategic_objectives").select("*").execute()

        # Index risks and milestones by program_id
        risks_by_prog: dict = {}
        for r in risk_resp.data:
            pid = str(r["program_id"])
            risks_by_prog.setdefault(pid, []).append(
                Risk(
                    id=str(r["id"]),
                    program_id=pid,
                    title=r["title"],
                    severity=r["severity"],
                    description=r.get("description"),
                    mitigation=r.get("mitigation"),
                    status=r.get("status", "Open"),
                )
            )

        milestones_by_prog: dict = {}
        for m in ms_resp.data:
            pid = str(m["program_id"])
            milestones_by_prog.setdefault(pid, []).append(
                Milestone(
                    id=str(m["id"]),
                    program_id=pid,
                    name=m["name"],
                    due_date=m.get("due_date"),
                    completed_date=m.get("completed_date"),
                    status=m.get("status", "Pending"),
                )
            )

        obj_ids_by_prog: dict = {}
        for mapping in map_resp.data:
            pid = str(mapping["program_id"])
            obj_ids_by_prog.setdefault(pid, []).append(str(mapping["strategic_objective_id"]))

        programs = []
        for row in prog_resp.data:
            pid = str(row["id"])
            programs.append(
                _build_program(
                    row,
                    risks_by_prog.get(pid, []),
                    milestones_by_prog.get(pid, []),
                    obj_ids_by_prog.get(pid, []),
                )
            )

        return programs
    except Exception as e:
        logger.error(f"Error fetching programs: {e}")
        raise


def get_program_by_id(program_id: str) -> Optional[Program]:
    """Retrieve a single program by ID with its risks and milestones."""
    try:
        client = _get_client()
        org_id = _get_org_id()

        prog_resp = client.table("programs").select("*").eq("id", program_id).eq("organization_id", org_id).execute()
        if not prog_resp.data:
            return None
        row = prog_resp.data[0]

        risk_resp = client.table("risks").select("*").eq("program_id", program_id).execute()
        risks = [
            Risk(
                id=str(r["id"]),
                program_id=str(r["program_id"]),
                title=r["title"],
                severity=r["severity"],
                description=r.get("description"),
                mitigation=r.get("mitigation"),
                status=r.get("status", "Open"),
            )
            for r in risk_resp.data
        ]

        ms_resp = client.table("milestones").select("*").eq("program_id", program_id).execute()
        milestones = [
            Milestone(
                id=str(m["id"]),
                program_id=str(m["program_id"]),
                name=m["name"],
                due_date=m.get("due_date"),
                completed_date=m.get("completed_date"),
                status=m.get("status", "Pending"),
            )
            for m in ms_resp.data
        ]

        map_resp = client.table("program_strategic_objectives").select("strategic_objective_id").eq("program_id", program_id).execute()
        objective_ids = [str(m["strategic_objective_id"]) for m in map_resp.data]

        return _build_program(row, risks, milestones, objective_ids)
    except Exception as e:
        logger.error(f"Error fetching program {program_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# Strategic Objectives
# ---------------------------------------------------------------------------

def _row_to_objective(row: dict) -> StrategicObjective:
    return StrategicObjective(
        id=str(row["id"]),
        name=row["name"],
        description=row.get("description"),
        priority=row.get("priority", 1),
        owner=row.get("owner"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def get_all_strategic_objectives() -> List[StrategicObjective]:
    """Retrieve all strategic objectives."""
    try:
        client = _get_client()
        org_id = _get_org_id()
        resp = client.table("strategic_objectives").select("*").eq("organization_id", org_id).order("priority").order("name").execute()
        return [_row_to_objective(row) for row in resp.data]
    except Exception as e:
        logger.error(f"Error fetching strategic objectives: {e}")
        raise


def get_strategic_objective_by_id(objective_id: str) -> Optional[StrategicObjective]:
    """Retrieve a single strategic objective by ID."""
    try:
        client = _get_client()
        org_id = _get_org_id()
        resp = client.table("strategic_objectives").select("*").eq("id", objective_id).eq("organization_id", org_id).execute()
        if not resp.data:
            return None
        return _row_to_objective(resp.data[0])
    except Exception as e:
        logger.error(f"Error fetching strategic objective {objective_id}: {e}")
        raise


def create_strategic_objective(objective: StrategicObjective) -> StrategicObjective:
    """Create a new strategic objective."""
    try:
        client = _get_client()
        org_id = _get_org_id()
        data = {
            "organization_id": org_id,
            "name": objective.name,
            "description": objective.description,
            "priority": objective.priority,
            "owner": objective.owner,
        }
        resp = client.table("strategic_objectives").insert(data).execute()
        logger.info(f"Created strategic objective: {resp.data[0]['id']}")
        return _row_to_objective(resp.data[0])
    except Exception as e:
        logger.error(f"Error creating strategic objective: {e}")
        raise


def update_strategic_objective(objective_id: str, objective: StrategicObjective) -> StrategicObjective:
    """Update an existing strategic objective."""
    try:
        client = _get_client()
        org_id = _get_org_id()
        data = {
            "name": objective.name,
            "description": objective.description,
            "priority": objective.priority,
            "owner": objective.owner,
        }
        resp = (
            client.table("strategic_objectives")
            .update(data)
            .eq("id", objective_id)
            .eq("organization_id", org_id)
            .execute()
        )
        if not resp.data:
            raise ValueError(f"Strategic objective {objective_id} not found")
        logger.info(f"Updated strategic objective: {objective_id}")
        return _row_to_objective(resp.data[0])
    except Exception as e:
        logger.error(f"Error updating strategic objective {objective_id}: {e}")
        raise


def delete_strategic_objective(objective_id: str) -> bool:
    """Delete a strategic objective."""
    try:
        client = _get_client()
        org_id = _get_org_id()
        resp = (
            client.table("strategic_objectives")
            .delete()
            .eq("id", objective_id)
            .eq("organization_id", org_id)
            .execute()
        )
        deleted = len(resp.data) > 0
        if deleted:
            logger.info(f"Deleted strategic objective: {objective_id}")
        return deleted
    except Exception as e:
        logger.error(f"Error deleting strategic objective {objective_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# Program ↔ Strategic Objective Mappings
# ---------------------------------------------------------------------------

def update_program_strategic_objectives(program_id: str, objective_ids: List[str]) -> Optional[Program]:
    """Update the strategic objectives for a program via the join table."""
    try:
        client = _get_client()

        # Delete existing mappings
        client.table("program_strategic_objectives").delete().eq("program_id", program_id).execute()

        # Insert new mappings
        if objective_ids:
            rows = [{"program_id": program_id, "strategic_objective_id": oid} for oid in objective_ids]
            client.table("program_strategic_objectives").insert(rows).execute()

        logger.info(f"Updated strategic objectives for program: {program_id}")
        return get_program_by_id(program_id)
    except Exception as e:
        logger.error(f"Error updating strategic objectives for program {program_id}: {e}")
        raise
