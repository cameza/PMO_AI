import os
import json
import logging
from typing import List, Optional, Any, Dict
from urllib.parse import quote

import httpx

from .models import Program, Risk, Milestone, StrategicObjective

logger = logging.getLogger(__name__)

# Demo org ID — will be replaced by auth-scoped org_id in production
DEMO_ORG_ID = "a0000000-0000-0000-0000-000000000001"

# Cached config
_supabase_url: Optional[str] = None
_supabase_key: Optional[str] = None


def _get_config():
    """Get Supabase URL and service role key from env."""
    global _supabase_url, _supabase_key
    if _supabase_url is None:
        _supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        _supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        if not _supabase_url or not _supabase_key:
            raise RuntimeError(
                "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. "
                "Set them in .env or Vercel environment variables."
            )
    return _supabase_url, _supabase_key


def _headers() -> dict:
    """Build PostgREST request headers."""
    url, key = _get_config()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table: str) -> str:
    """Build the PostgREST URL for a table."""
    url, _ = _get_config()
    return f"{url}/rest/v1/{table}"


def _rpc_url(fn_name: str) -> str:
    """Build the PostgREST URL for an RPC call."""
    url, _ = _get_config()
    return f"{url}/rest/v1/rpc/{fn_name}"


def _get(table: str, params: Optional[dict] = None) -> List[dict]:
    """GET rows from a PostgREST table."""
    resp = httpx.get(_rest_url(table), headers=_headers(), params=params or {}, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def _post(table: str, data: Any) -> List[dict]:
    """POST (insert) rows into a PostgREST table."""
    resp = httpx.post(_rest_url(table), headers=_headers(), json=data, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def _patch(table: str, data: dict, params: dict) -> List[dict]:
    """PATCH (update) rows in a PostgREST table."""
    resp = httpx.patch(_rest_url(table), headers=_headers(), json=data, params=params, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def _delete(table: str, params: dict) -> List[dict]:
    """DELETE rows from a PostgREST table."""
    hdrs = _headers()
    hdrs["Prefer"] = "return=representation"
    resp = httpx.delete(_rest_url(table), headers=hdrs, params=params, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def rpc(fn_name: str, payload: dict) -> List[dict]:
    """Call a Supabase RPC (database function)."""
    resp = httpx.post(_rpc_url(fn_name), headers=_headers(), json=payload, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def get_connection():
    """Backward-compatible alias — verifies config is available."""
    _get_config()
    return None


def init_db() -> None:
    """Verify Supabase connectivity. Schema is managed via Supabase migrations."""
    try:
        _get("programs", {"select": "id", "limit": "1"})
        logger.info("Supabase connection verified. Programs table accessible.")
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
        org_id = _get_org_id()

        prog_rows = _get("programs", {"select": "*", "organization_id": f"eq.{org_id}"})
        risk_rows = _get("risks", {"select": "*", "organization_id": f"eq.{org_id}"})
        ms_rows = _get("milestones", {"select": "*", "organization_id": f"eq.{org_id}"})
        map_rows = _get("program_strategic_objectives", {"select": "*"})

        # Index risks and milestones by program_id
        risks_by_prog: dict = {}
        for r in risk_rows:
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
        for m in ms_rows:
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
        for mapping in map_rows:
            pid = str(mapping["program_id"])
            obj_ids_by_prog.setdefault(pid, []).append(str(mapping["strategic_objective_id"]))

        programs = []
        for row in prog_rows:
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
        org_id = _get_org_id()

        prog_rows = _get("programs", {"select": "*", "id": f"eq.{program_id}", "organization_id": f"eq.{org_id}"})
        if not prog_rows:
            return None
        row = prog_rows[0]

        risk_rows = _get("risks", {"select": "*", "program_id": f"eq.{program_id}"})
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
            for r in risk_rows
        ]

        ms_rows = _get("milestones", {"select": "*", "program_id": f"eq.{program_id}"})
        milestones = [
            Milestone(
                id=str(m["id"]),
                program_id=str(m["program_id"]),
                name=m["name"],
                due_date=m.get("due_date"),
                completed_date=m.get("completed_date"),
                status=m.get("status", "Pending"),
            )
            for m in ms_rows
        ]

        map_rows = _get("program_strategic_objectives", {"select": "strategic_objective_id", "program_id": f"eq.{program_id}"})
        objective_ids = [str(m["strategic_objective_id"]) for m in map_rows]

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
        org_id = _get_org_id()
        rows = _get("strategic_objectives", {
            "select": "*",
            "organization_id": f"eq.{org_id}",
            "order": "priority.asc,name.asc",
        })
        return [_row_to_objective(row) for row in rows]
    except Exception as e:
        logger.error(f"Error fetching strategic objectives: {e}")
        raise


def get_strategic_objective_by_id(objective_id: str) -> Optional[StrategicObjective]:
    """Retrieve a single strategic objective by ID."""
    try:
        org_id = _get_org_id()
        rows = _get("strategic_objectives", {
            "select": "*",
            "id": f"eq.{objective_id}",
            "organization_id": f"eq.{org_id}",
        })
        if not rows:
            return None
        return _row_to_objective(rows[0])
    except Exception as e:
        logger.error(f"Error fetching strategic objective {objective_id}: {e}")
        raise


def create_strategic_objective(objective: StrategicObjective) -> StrategicObjective:
    """Create a new strategic objective."""
    try:
        org_id = _get_org_id()
        data = {
            "organization_id": org_id,
            "name": objective.name,
            "description": objective.description,
            "priority": objective.priority,
            "owner": objective.owner,
        }
        rows = _post("strategic_objectives", data)
        logger.info(f"Created strategic objective: {rows[0]['id']}")
        return _row_to_objective(rows[0])
    except Exception as e:
        logger.error(f"Error creating strategic objective: {e}")
        raise


def update_strategic_objective(objective_id: str, objective: StrategicObjective) -> StrategicObjective:
    """Update an existing strategic objective."""
    try:
        org_id = _get_org_id()
        data = {
            "name": objective.name,
            "description": objective.description,
            "priority": objective.priority,
            "owner": objective.owner,
        }
        rows = _patch("strategic_objectives", data, {
            "id": f"eq.{objective_id}",
            "organization_id": f"eq.{org_id}",
        })
        if not rows:
            raise ValueError(f"Strategic objective {objective_id} not found")
        logger.info(f"Updated strategic objective: {objective_id}")
        return _row_to_objective(rows[0])
    except Exception as e:
        logger.error(f"Error updating strategic objective {objective_id}: {e}")
        raise


def delete_strategic_objective(objective_id: str) -> bool:
    """Delete a strategic objective."""
    try:
        org_id = _get_org_id()
        rows = _delete("strategic_objectives", {
            "id": f"eq.{objective_id}",
            "organization_id": f"eq.{org_id}",
        })
        deleted = len(rows) > 0
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
        # Delete existing mappings
        _delete("program_strategic_objectives", {"program_id": f"eq.{program_id}"})

        # Insert new mappings
        if objective_ids:
            rows = [{"program_id": program_id, "strategic_objective_id": oid} for oid in objective_ids]
            _post("program_strategic_objectives", rows)

        logger.info(f"Updated strategic objectives for program: {program_id}")
        return get_program_by_id(program_id)
    except Exception as e:
        logger.error(f"Error updating strategic objectives for program {program_id}: {e}")
        raise
