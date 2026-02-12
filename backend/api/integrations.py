"""
Integration API endpoints — connect, sync, status, disconnect for Linear.
"""

import logging
from fastapi import APIRouter, HTTPException

try:
    from backend.database import db
    from backend.database.models import (
        IntegrationConnect, IntegrationStatus, SyncResult, DataSourceToggle,
    )
    from backend.integrations.linear_adapter import LinearAdapter
    from backend.integrations.sync_engine import sync_linear
except ImportError:
    from database import db
    from database.models import (
        IntegrationConnect, IntegrationStatus, SyncResult, DataSourceToggle,
    )
    from integrations.linear_adapter import LinearAdapter
    from integrations.sync_engine import sync_linear

logger = logging.getLogger(__name__)

router = APIRouter(tags=["integrations"])


@router.post("/integrations/linear/connect")
async def connect_linear(body: IntegrationConnect):
    """Save Linear API key, test connection, return workspace info."""
    try:
        adapter = LinearAdapter(body.api_key)
        result = adapter.test_connection()

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Connection failed"))

        org_id = db._get_org_id()

        # Check if integration already exists
        existing = db._get("integration_configs", {
            "select": "id",
            "organization_id": f"eq.{org_id}",
            "tool": "eq.linear",
        })

        org_info = result.get("organization", {})
        config_data = {
            "organization_id": org_id,
            "tool": "linear",
            "credentials_encrypted": body.api_key,
            "status": "active",
            "config": {
                "workspace_id": org_info.get("id"),
                "workspace_name": org_info.get("name"),
                "workspace_url_key": org_info.get("urlKey"),
            },
        }

        if existing:
            db._patch("integration_configs", config_data, {
                "id": f"eq.{existing[0]['id']}",
            })
            integration_id = existing[0]["id"]
        else:
            rows = db._post("integration_configs", config_data)
            integration_id = rows[0]["id"] if rows else None

        return {
            "success": True,
            "integration_id": integration_id,
            "organization": org_info,
            "user": result.get("user", {}),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to connect Linear: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/integrations/linear/sync", response_model=SyncResult)
async def sync_linear_data():
    """Trigger a manual sync from Linear."""
    try:
        org_id = db._get_org_id()

        configs = db._get("integration_configs", {
            "select": "id",
            "organization_id": f"eq.{org_id}",
            "tool": "eq.linear",
            "status": "eq.active",
        })

        if not configs:
            raise HTTPException(status_code=404, detail="No active Linear integration found")

        integration_id = configs[0]["id"]
        result = sync_linear(integration_id)

        return SyncResult(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Linear sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/integrations/status", response_model=IntegrationStatus)
async def get_integration_status():
    """Return current integration status."""
    try:
        org_id = db._get_org_id()

        configs = db._get("integration_configs", {
            "select": "*",
            "organization_id": f"eq.{org_id}",
            "tool": "eq.linear",
        })

        if not configs:
            return IntegrationStatus(connected=False)

        config = configs[0]
        return IntegrationStatus(
            connected=config.get("status") == "active",
            tool="linear",
            status=config.get("status"),
            last_sync_at=config.get("last_sync_at"),
            organization=config.get("config", {}),
        )

    except Exception as e:
        logger.error(f"Failed to get integration status: {e}")
        return IntegrationStatus(connected=False)


@router.delete("/integrations/linear")
async def disconnect_linear():
    """Remove Linear integration."""
    try:
        org_id = db._get_org_id()

        db._delete("integration_configs", {
            "organization_id": f"eq.{org_id}",
            "tool": "eq.linear",
        })

        return {"success": True, "message": "Linear integration disconnected"}

    except Exception as e:
        logger.error(f"Failed to disconnect Linear: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/org/data-source")
async def toggle_data_source(body: DataSourceToggle):
    """Toggle between 'manual' and 'synced' data source mode."""
    if body.data_source not in ("manual", "synced"):
        raise HTTPException(status_code=400, detail="data_source must be 'manual' or 'synced'")

    try:
        org_id = db._get_org_id()
        db._patch("organizations", {"data_source": body.data_source}, {
            "id": f"eq.{org_id}",
        })
        return {"data_source": body.data_source}

    except Exception as e:
        logger.error(f"Failed to toggle data source: {e}")
        raise HTTPException(status_code=500, detail=str(e))
