"""
Sync engine — orchestrates pulling data from Linear and writing to normalized tables.

Uses deterministic field mapping (v1). The field_mappings table exists for future
user-configurable and AI-assisted mapping but is not read in this version.
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Status mapping: Linear project status → PMO AI pipeline_stage
# ---------------------------------------------------------------------------
LINEAR_STATUS_TO_PIPELINE_STAGE: Dict[str, str] = {
    "Backlog": "Discovery",
    "Discovery": "Discovery",
    "Planning": "Planning",
    "In Progress": "In Progress",
    "Completed": "Completed",
}

# Statuses to skip (don't sync canceled projects)
SKIP_STATUSES = {"Canceled"}

SYNC_SOURCE = "linear"


def _get_db_helpers():
    """Import db helpers with dual-mode support."""
    try:
        from backend.database.db import (
            _get, _post, _patch, _delete, _get_org_id, _rest_url, _headers,
        )
    except ImportError:
        from database.db import (
            _get, _post, _patch, _delete, _get_org_id, _rest_url, _headers,
        )
    return _get, _post, _patch, _delete, _get_org_id, _rest_url, _headers


def _get_adapter_class():
    """Import LinearAdapter with dual-mode support."""
    try:
        from backend.integrations.linear_adapter import LinearAdapter
    except ImportError:
        from integrations.linear_adapter import LinearAdapter
    return LinearAdapter


def _extract_product_line(project: Dict[str, Any]) -> Optional[str]:
    """Extract product line from project labels (label group 'Product Line')."""
    labels = project.get("labels", {}).get("nodes", [])
    for label in labels:
        parent = label.get("parent")
        if parent and parent.get("name", "").lower() == "product line":
            return label.get("name")
        # Also match labels that are themselves product line labels (no parent group check)
        # In case the API returns flat labels
        if label.get("name") in ("Mobile", "Broadband", "Entertainment"):
            return label.get("name")
    return None


def _extract_owner(project: Dict[str, Any]) -> Optional[str]:
    """Extract owner name from project lead, falling back to creator."""
    lead = project.get("lead")
    if lead and lead.get("name"):
        return lead["name"]
    creator = project.get("creator")
    if creator and creator.get("name"):
        return creator["name"]
    return None


def _extract_initiative_ids(project: Dict[str, Any]) -> List[str]:
    """Extract initiative IDs from project."""
    initiatives = project.get("initiatives", {}).get("nodes", [])
    return [init["id"] for init in initiatives]


# Linear health → PMO AI program status
LINEAR_HEALTH_TO_STATUS: Dict[str, str] = {
    "onTrack": "On Track",
    "atRisk": "At Risk",
    "offTrack": "Off Track",
}


def _derive_program_status(project: Dict[str, Any]) -> str:
    """Derive PMO AI program status from Linear project status + health.

    - Completed projects → "Completed" (from project status, not health)
    - Active projects → read latest project update health
    - No updates → default "On Track"
    """
    status_name = project.get("status", {}).get("name", "")
    if status_name == "Completed":
        return "Completed"

    updates = project.get("projectUpdates", {}).get("nodes", [])
    if updates:
        health = updates[0].get("health")
        if health and health in LINEAR_HEALTH_TO_STATUS:
            return LINEAR_HEALTH_TO_STATUS[health]

    return "On Track"


def _extract_last_update(project: Dict[str, Any]) -> Optional[str]:
    """Extract the body text from the latest project update."""
    updates = project.get("projectUpdates", {}).get("nodes", [])
    if updates:
        return updates[0].get("body")
    return None


def sync_linear(integration_id: str) -> Dict[str, Any]:
    """
    Orchestrate a full sync from Linear to the normalized PMO AI tables.

    Steps:
    1. Load integration config (API key)
    2. Fetch raw data from Linear → upsert into raw_records
    3. Apply deterministic mapping → upsert into strategic_objectives, programs, milestones
    4. Update integration_configs.last_sync_at
    5. Update organizations.data_source to 'synced'

    Returns:
        Dict with counts of synced entities.
    """
    _get, _post, _patch, _delete, _get_org_id, _rest_url, _headers = _get_db_helpers()
    LinearAdapter = _get_adapter_class()
    org_id = _get_org_id()

    # 1. Load integration config
    configs = _get("integration_configs", {
        "select": "*",
        "id": f"eq.{integration_id}",
        "organization_id": f"eq.{org_id}",
    })
    if not configs:
        raise ValueError(f"Integration config {integration_id} not found")

    config = configs[0]
    api_key = config["credentials_encrypted"]
    if not api_key:
        raise ValueError("No API key configured for this integration")

    adapter = LinearAdapter(api_key)

    # 2. Fetch raw data from Linear
    logger.info("Fetching data from Linear...")
    initiatives = adapter.fetch_initiatives()
    projects = adapter.fetch_projects()

    # Store raw records
    for init in initiatives:
        _upsert_raw_record(
            _get, _post, _patch, org_id, integration_id,
            "initiative", init["id"], init,
        )
    for proj in projects:
        _upsert_raw_record(
            _get, _post, _patch, org_id, integration_id,
            "project", proj["id"], proj,
        )
        milestones = proj.get("projectMilestones", {}).get("nodes", [])
        for ms in milestones:
            _upsert_raw_record(
                _get, _post, _patch, org_id, integration_id,
                "milestone", ms["id"], ms,
            )

    # 3. Apply deterministic mapping
    # 3a. Sync initiatives → strategic_objectives
    so_count = 0
    initiative_id_map: Dict[str, str] = {}  # linear_id → supabase_id
    for init in initiatives:
        so_id = _upsert_strategic_objective(
            _get, _post, _patch, org_id, init,
        )
        if so_id:
            initiative_id_map[init["id"]] = so_id
            so_count += 1

    # 3b. Sync projects → programs
    prog_count = 0
    ms_count = 0
    for proj in projects:
        status_name = proj.get("status", {}).get("name", "Backlog")
        if status_name in SKIP_STATUSES:
            logger.info(f"Skipping canceled project: {proj['name']}")
            continue

        program_id = _upsert_program(
            _get, _post, _patch, _delete, org_id, proj, initiative_id_map,
        )
        if program_id:
            prog_count += 1

            # 3c. Sync milestones
            milestones = proj.get("projectMilestones", {}).get("nodes", [])
            for ms in milestones:
                ms_id = _upsert_milestone(
                    _get, _post, _patch, org_id, program_id, ms,
                )
                if ms_id:
                    ms_count += 1

    # 4. Update last_sync_at
    import httpx
    now = datetime.now(timezone.utc).isoformat()
    _patch("integration_configs", {"last_sync_at": now, "updated_at": now}, {
        "id": f"eq.{integration_id}",
    })

    # 5. Update org data_source to 'synced'
    _patch("organizations", {"data_source": "synced"}, {
        "id": f"eq.{org_id}",
    })

    result = {
        "strategic_objectives": so_count,
        "programs": prog_count,
        "milestones": ms_count,
        "last_sync_at": now,
    }
    logger.info(f"Linear sync complete: {result}")
    return result


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

def _upsert_raw_record(
    _get, _post, _patch,
    org_id: str, integration_id: str,
    record_type: str, external_id: str, raw_data: Dict,
):
    """Upsert a raw record into the raw_records table."""
    import httpx
    existing = _get("raw_records", {
        "select": "id",
        "integration_id": f"eq.{integration_id}",
        "external_id": f"eq.{external_id}",
    })
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        _patch("raw_records", {
            "raw_data": json.dumps(raw_data) if isinstance(raw_data, dict) else raw_data,
            "ingested_at": now,
        }, {"id": f"eq.{existing[0]['id']}"})
    else:
        _post("raw_records", {
            "organization_id": org_id,
            "integration_id": integration_id,
            "record_type": record_type,
            "external_id": external_id,
            "raw_data": raw_data,
            "ingested_at": now,
        })


def _upsert_strategic_objective(
    _get, _post, _patch,
    org_id: str, initiative: Dict[str, Any],
) -> Optional[str]:
    """Upsert a Linear initiative as a strategic objective. Returns the SO id."""
    external_id = initiative["id"]
    name = initiative.get("name", "")
    description = initiative.get("description", "")

    existing = _get("strategic_objectives", {
        "select": "id",
        "organization_id": f"eq.{org_id}",
        "external_id": f"eq.{external_id}",
        "sync_source": f"eq.{SYNC_SOURCE}",
    })

    if existing:
        _patch("strategic_objectives", {
            "name": name,
            "description": description,
        }, {"id": f"eq.{existing[0]['id']}"})
        return existing[0]["id"]
    else:
        rows = _post("strategic_objectives", {
            "organization_id": org_id,
            "name": name,
            "description": description,
            "priority": 1,
            "external_id": external_id,
            "sync_source": SYNC_SOURCE,
        })
        return str(rows[0]["id"]) if rows else None


def _upsert_program(
    _get, _post, _patch, _delete,
    org_id: str, project: Dict[str, Any],
    initiative_id_map: Dict[str, str],
) -> Optional[str]:
    """Upsert a Linear project as a program. Returns the program id."""
    external_id = project["id"]
    status_name = project.get("status", {}).get("name", "Backlog")
    pipeline_stage = LINEAR_STATUS_TO_PIPELINE_STAGE.get(status_name, "Discovery")
    product_line = _extract_product_line(project)
    owner = _extract_owner(project)

    program_status = _derive_program_status(project)
    last_update = _extract_last_update(project)

    program_data = {
        "organization_id": org_id,
        "name": project.get("name", ""),
        "description": project.get("description", ""),
        "status": program_status,
        "owner": owner,
        "team": "",
        "product_line": product_line,
        "pipeline_stage": pipeline_stage,
        "launch_date": project.get("targetDate"),
        "progress": 0,
        "last_update": last_update,
        "external_id": external_id,
        "sync_source": SYNC_SOURCE,
    }

    existing = _get("programs", {
        "select": "id",
        "organization_id": f"eq.{org_id}",
        "external_id": f"eq.{external_id}",
        "sync_source": f"eq.{SYNC_SOURCE}",
    })

    if existing:
        program_id = existing[0]["id"]
        update_data = {k: v for k, v in program_data.items() if k != "organization_id"}
        _patch("programs", update_data, {"id": f"eq.{program_id}"})
    else:
        rows = _post("programs", program_data)
        program_id = str(rows[0]["id"]) if rows else None

    if program_id:
        # Link to strategic objectives via initiative mapping
        linear_initiative_ids = _extract_initiative_ids(project)
        so_ids = [
            initiative_id_map[lid]
            for lid in linear_initiative_ids
            if lid in initiative_id_map
        ]
        if so_ids:
            # Delete existing mappings for this program
            try:
                _delete("program_strategic_objectives", {
                    "program_id": f"eq.{program_id}",
                })
            except Exception:
                pass
            # Insert new mappings
            mappings = [
                {"program_id": program_id, "strategic_objective_id": so_id}
                for so_id in so_ids
            ]
            try:
                _post("program_strategic_objectives", mappings)
            except Exception as e:
                logger.warning(f"Failed to link program {program_id} to objectives: {e}")

    return str(program_id) if program_id else None


def _upsert_milestone(
    _get, _post, _patch,
    org_id: str, program_id: str, milestone: Dict[str, Any],
) -> Optional[str]:
    """Upsert a Linear project milestone. Returns the milestone id."""
    external_id = milestone["id"]
    name = milestone.get("name", "")
    target_date = milestone.get("targetDate")

    existing = _get("milestones", {
        "select": "id",
        "organization_id": f"eq.{org_id}",
        "external_id": f"eq.{external_id}",
        "sync_source": f"eq.{SYNC_SOURCE}",
    })

    milestone_data = {
        "organization_id": org_id,
        "program_id": program_id,
        "name": name,
        "due_date": target_date,
        "status": "Pending",
        "external_id": external_id,
        "sync_source": SYNC_SOURCE,
    }

    if existing:
        ms_id = existing[0]["id"]
        update_data = {k: v for k, v in milestone_data.items()
                       if k not in ("organization_id", "program_id")}
        _patch("milestones", update_data, {"id": f"eq.{ms_id}"})
        return str(ms_id)
    else:
        rows = _post("milestones", milestone_data)
        return str(rows[0]["id"]) if rows else None
