import os
import json
import logging
from typing import List, Optional, Any, Dict
from urllib.parse import quote

import httpx

from .models import (
    Program, Risk, Milestone, StrategicObjective,
    ProgramCreate, ProgramUpdate,
    RiskCreate, RiskUpdate,
    MilestoneCreate, MilestoneUpdate,
)

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
    if resp.status_code >= 400:
        logger.error(f"PostgREST POST {table} error: {resp.status_code} {resp.text}")
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

def _build_program(row: dict, risks: List[Risk], milestones: List[Milestone], objective_ids: List[str], objective_names: List[str] = []) -> Program:
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
        strategic_objectives=objective_names,
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

        # Resolve objective IDs to names
        all_obj_ids = set()
        for ids in obj_ids_by_prog.values():
            all_obj_ids.update(ids)
        obj_name_map: dict = {}
        if all_obj_ids:
            so_rows = _get("strategic_objectives", {"select": "id,name", "organization_id": f"eq.{org_id}"})
            obj_name_map = {str(r["id"]): r["name"] for r in so_rows}

        programs = []
        for row in prog_rows:
            pid = str(row["id"])
            ids = obj_ids_by_prog.get(pid, [])
            names = [obj_name_map[oid] for oid in ids if oid in obj_name_map]
            programs.append(
                _build_program(
                    row,
                    risks_by_prog.get(pid, []),
                    milestones_by_prog.get(pid, []),
                    ids,
                    names,
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

        # Resolve objective IDs to names
        objective_names: List[str] = []
        if objective_ids:
            so_rows = _get("strategic_objectives", {"select": "id,name", "organization_id": f"eq.{org_id}"})
            name_map = {str(r["id"]): r["name"] for r in so_rows}
            objective_names = [name_map[oid] for oid in objective_ids if oid in name_map]

        return _build_program(row, risks, milestones, objective_ids, objective_names)
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


def create_program(data: ProgramCreate) -> Program:
    """Create a new program and optionally set strategic objectives."""
    try:
        org_id = _get_org_id()
        row_data = {
            "organization_id": org_id,
            "name": data.name,
            "description": data.description,
            "status": data.status.value if data.status else "On Track",
            "owner": data.owner,
            "team": data.team,
            "product_line": data.product_line,
            "pipeline_stage": data.pipeline_stage.value if data.pipeline_stage else None,
            "launch_date": data.launch_date or None,
            "progress": data.progress,
            "last_update": data.last_update or None,
        }
        rows = _post("programs", row_data)
        program_id = str(rows[0]["id"])

        if data.strategic_objective_ids:
            mappings = [{"program_id": program_id, "strategic_objective_id": oid} for oid in data.strategic_objective_ids]
            _post("program_strategic_objectives", mappings)

        logger.info(f"Created program: {program_id}")
        return get_program_by_id(program_id)  # type: ignore
    except Exception as e:
        logger.error(f"Error creating program: {e}")
        raise


def update_program(program_id: str, data: ProgramUpdate) -> Optional[Program]:
    """Update an existing program's fields. Only non-None fields are updated."""
    try:
        org_id = _get_org_id()
        update_data: Dict[str, Any] = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description
        if data.status is not None:
            update_data["status"] = data.status.value
        if data.owner is not None:
            update_data["owner"] = data.owner
        if data.team is not None:
            update_data["team"] = data.team
        if data.product_line is not None:
            update_data["product_line"] = data.product_line
        if data.pipeline_stage is not None:
            update_data["pipeline_stage"] = data.pipeline_stage.value
        if data.launch_date is not None:
            update_data["launch_date"] = data.launch_date or None
        if data.progress is not None:
            update_data["progress"] = data.progress
        if data.last_update is not None:
            update_data["last_update"] = data.last_update or None

        if update_data:
            _patch("programs", update_data, {
                "id": f"eq.{program_id}",
                "organization_id": f"eq.{org_id}",
            })

        if data.strategic_objective_ids is not None:
            update_program_strategic_objectives(program_id, data.strategic_objective_ids)

        logger.info(f"Updated program: {program_id}")
        return get_program_by_id(program_id)
    except Exception as e:
        logger.error(f"Error updating program {program_id}: {e}")
        raise


def delete_program(program_id: str) -> bool:
    """Delete a program. FK CASCADE handles risks, milestones, and objective mappings."""
    try:
        org_id = _get_org_id()
        rows = _delete("programs", {
            "id": f"eq.{program_id}",
            "organization_id": f"eq.{org_id}",
        })
        deleted = len(rows) > 0
        if deleted:
            logger.info(f"Deleted program: {program_id}")
        return deleted
    except Exception as e:
        logger.error(f"Error deleting program {program_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# Risk CRUD
# ---------------------------------------------------------------------------

def create_risk(program_id: str, data: RiskCreate) -> Risk:
    """Create a new risk for a program."""
    try:
        org_id = _get_org_id()
        row_data = {
            "organization_id": org_id,
            "program_id": program_id,
            "title": data.title,
            "severity": data.severity.value,
            "description": data.description,
            "mitigation": data.mitigation,
            "status": data.status.value if data.status else "Open",
        }
        rows = _post("risks", row_data)
        r = rows[0]
        logger.info(f"Created risk: {r['id']} for program {program_id}")
        return Risk(
            id=str(r["id"]),
            program_id=str(r["program_id"]),
            title=r["title"],
            severity=r["severity"],
            description=r.get("description"),
            mitigation=r.get("mitigation"),
            status=r.get("status", "Open"),
        )
    except Exception as e:
        logger.error(f"Error creating risk for program {program_id}: {e}")
        raise


def update_risk(risk_id: str, data: RiskUpdate) -> Optional[Risk]:
    """Update an existing risk."""
    try:
        update_data: Dict[str, Any] = {}
        if data.title is not None:
            update_data["title"] = data.title
        if data.severity is not None:
            update_data["severity"] = data.severity.value
        if data.description is not None:
            update_data["description"] = data.description
        if data.mitigation is not None:
            update_data["mitigation"] = data.mitigation
        if data.status is not None:
            update_data["status"] = data.status.value

        if not update_data:
            return None

        rows = _patch("risks", update_data, {"id": f"eq.{risk_id}"})
        if not rows:
            return None
        r = rows[0]
        logger.info(f"Updated risk: {risk_id}")
        return Risk(
            id=str(r["id"]),
            program_id=str(r["program_id"]),
            title=r["title"],
            severity=r["severity"],
            description=r.get("description"),
            mitigation=r.get("mitigation"),
            status=r.get("status", "Open"),
        )
    except Exception as e:
        logger.error(f"Error updating risk {risk_id}: {e}")
        raise


def delete_risk(risk_id: str) -> bool:
    """Delete a risk."""
    try:
        rows = _delete("risks", {"id": f"eq.{risk_id}"})
        deleted = len(rows) > 0
        if deleted:
            logger.info(f"Deleted risk: {risk_id}")
        return deleted
    except Exception as e:
        logger.error(f"Error deleting risk {risk_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# Milestone CRUD
# ---------------------------------------------------------------------------

def create_milestone(program_id: str, data: MilestoneCreate) -> Milestone:
    """Create a new milestone for a program."""
    try:
        org_id = _get_org_id()
        row_data = {
            "organization_id": org_id,
            "program_id": program_id,
            "name": data.name,
            "due_date": data.due_date or None,
            "completed_date": data.completed_date or None,
            "status": data.status.value if data.status else "Pending",
        }
        rows = _post("milestones", row_data)
        m = rows[0]
        logger.info(f"Created milestone: {m['id']} for program {program_id}")
        return Milestone(
            id=str(m["id"]),
            program_id=str(m["program_id"]),
            name=m["name"],
            due_date=m.get("due_date"),
            completed_date=m.get("completed_date"),
            status=m.get("status", "Pending"),
        )
    except Exception as e:
        logger.error(f"Error creating milestone for program {program_id}: {e}")
        raise


def update_milestone(milestone_id: str, data: MilestoneUpdate) -> Optional[Milestone]:
    """Update an existing milestone."""
    try:
        update_data: Dict[str, Any] = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.due_date is not None:
            update_data["due_date"] = data.due_date or None
        if data.completed_date is not None:
            update_data["completed_date"] = data.completed_date or None
        if data.status is not None:
            update_data["status"] = data.status.value

        if not update_data:
            return None

        rows = _patch("milestones", update_data, {"id": f"eq.{milestone_id}"})
        if not rows:
            return None
        m = rows[0]
        logger.info(f"Updated milestone: {milestone_id}")
        return Milestone(
            id=str(m["id"]),
            program_id=str(m["program_id"]),
            name=m["name"],
            due_date=m.get("due_date"),
            completed_date=m.get("completed_date"),
            status=m.get("status", "Pending"),
        )
    except Exception as e:
        logger.error(f"Error updating milestone {milestone_id}: {e}")
        raise


def delete_milestone(milestone_id: str) -> bool:
    """Delete a milestone."""
    try:
        rows = _delete("milestones", {"id": f"eq.{milestone_id}"})
        deleted = len(rows) > 0
        if deleted:
            logger.info(f"Deleted milestone: {milestone_id}")
        return deleted
    except Exception as e:
        logger.error(f"Error deleting milestone {milestone_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# Organization helpers
# ---------------------------------------------------------------------------

def get_org_data_source() -> str:
    """Return the data source mode for the current organization ('manual' or 'synced')."""
    try:
        org_id = _get_org_id()
        rows = _get("organizations", {
            "select": "data_source",
            "id": f"eq.{org_id}",
        })
        if rows:
            return rows[0].get("data_source", "manual")
        return "manual"
    except Exception as e:
        logger.error(f"Error fetching org data source: {e}")
        return "manual"
