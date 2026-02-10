from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel
import logging

try:
    from backend.database.db import (
        get_all_programs, get_program_by_id, update_program_strategic_objectives,
        create_program as db_create_program,
        update_program as db_update_program,
        delete_program as db_delete_program,
        create_risk as db_create_risk,
        update_risk as db_update_risk,
        delete_risk as db_delete_risk,
        create_milestone as db_create_milestone,
        update_milestone as db_update_milestone,
        delete_milestone as db_delete_milestone,
        get_org_data_source,
    )
    from backend.database.models import (
        Program, Risk, Milestone,
        ProgramCreate, ProgramUpdate,
        RiskCreate, RiskUpdate,
        MilestoneCreate, MilestoneUpdate,
    )
except ImportError:
    from database.db import (
        get_all_programs, get_program_by_id, update_program_strategic_objectives,
        create_program as db_create_program,
        update_program as db_update_program,
        delete_program as db_delete_program,
        create_risk as db_create_risk,
        update_risk as db_update_risk,
        delete_risk as db_delete_risk,
        create_milestone as db_create_milestone,
        update_milestone as db_update_milestone,
        delete_milestone as db_delete_milestone,
        get_org_data_source,
    )
    from database.models import (
        Program, Risk, Milestone,
        ProgramCreate, ProgramUpdate,
        RiskCreate, RiskUpdate,
        MilestoneCreate, MilestoneUpdate,
    )

logger = logging.getLogger(__name__)


class StrategicObjectivesUpdate(BaseModel):
    """Request model for updating program strategic objectives."""
    strategic_objective_ids: List[str]

router = APIRouter()


# ---------------------------------------------------------------------------
# Organization data source
# ---------------------------------------------------------------------------

@router.get("/org/data-source")
async def get_data_source():
    """Return the data source mode for the current organization."""
    return {"data_source": get_org_data_source()}


# ---------------------------------------------------------------------------
# Program CRUD
# ---------------------------------------------------------------------------

@router.get("/programs", response_model=List[Program])
async def list_programs(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: On Track, At Risk, Off Track, Completed"),
    product_line: Optional[str] = Query(None, description="Filter by product line")
):
    """List all programs with optional filtering."""
    programs = get_all_programs()

    if status_filter:
        programs = [p for p in programs if p.status.value == status_filter]

    if product_line:
        programs = [p for p in programs if p.product_line == product_line]

    return programs


@router.get("/programs/{program_id}", response_model=Program)
async def get_program(program_id: str):
    """Get a single program by ID with risks and milestones."""
    program = get_program_by_id(program_id)
    if not program:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    return program


@router.post("/programs", response_model=Program, status_code=status.HTTP_201_CREATED)
async def create_program(data: ProgramCreate):
    """Create a new program."""
    try:
        program = db_create_program(data)
        return program
    except Exception as e:
        logger.error(f"Error creating program: {e}")
        raise HTTPException(status_code=500, detail="Failed to create program")


@router.patch("/programs/{program_id}", response_model=Program)
async def update_program(program_id: str, data: ProgramUpdate):
    """Update an existing program. Only provided fields are changed."""
    existing = get_program_by_id(program_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    try:
        updated = db_update_program(program_id, data)
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to update program")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating program {program_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update program")


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(program_id: str):
    """Delete a program and all its risks, milestones, and objective mappings (FK CASCADE)."""
    existing = get_program_by_id(program_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    try:
        deleted = db_delete_program(program_id)
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete program")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting program {program_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete program")


@router.put("/programs/{program_id}/strategic-objectives", response_model=Program)
async def update_program_objectives(program_id: str, update: StrategicObjectivesUpdate):
    """Update the strategic objectives for a program."""
    existing_program = get_program_by_id(program_id)
    if not existing_program:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    updated_program = update_program_strategic_objectives(program_id, update.strategic_objective_ids)
    if not updated_program:
        raise HTTPException(status_code=500, detail="Failed to update program strategic objectives")
    return updated_program


# ---------------------------------------------------------------------------
# Risk CRUD (sub-resource of programs)
# ---------------------------------------------------------------------------

@router.post("/programs/{program_id}/risks", response_model=Risk, status_code=status.HTTP_201_CREATED)
async def create_risk(program_id: str, data: RiskCreate):
    """Add a risk to a program."""
    existing = get_program_by_id(program_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    try:
        risk = db_create_risk(program_id, data)
        return risk
    except Exception as e:
        logger.error(f"Error creating risk for program {program_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create risk")


@router.patch("/programs/{program_id}/risks/{risk_id}", response_model=Risk)
async def update_risk(program_id: str, risk_id: str, data: RiskUpdate):
    """Update a risk."""
    try:
        updated = db_update_risk(risk_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Risk {risk_id} not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating risk {risk_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update risk")


@router.delete("/programs/{program_id}/risks/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_risk(program_id: str, risk_id: str):
    """Delete a risk."""
    try:
        deleted = db_delete_risk(risk_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Risk {risk_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting risk {risk_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete risk")


# ---------------------------------------------------------------------------
# Milestone CRUD (sub-resource of programs)
# ---------------------------------------------------------------------------

@router.post("/programs/{program_id}/milestones", response_model=Milestone, status_code=status.HTTP_201_CREATED)
async def create_milestone(program_id: str, data: MilestoneCreate):
    """Add a milestone to a program."""
    existing = get_program_by_id(program_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    try:
        milestone = db_create_milestone(program_id, data)
        return milestone
    except Exception as e:
        logger.error(f"Error creating milestone for program {program_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create milestone")


@router.patch("/programs/{program_id}/milestones/{milestone_id}", response_model=Milestone)
async def update_milestone(program_id: str, milestone_id: str, data: MilestoneUpdate):
    """Update a milestone."""
    try:
        updated = db_update_milestone(milestone_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Milestone {milestone_id} not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating milestone {milestone_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update milestone")


@router.delete("/programs/{program_id}/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(program_id: str, milestone_id: str):
    """Delete a milestone."""
    try:
        deleted = db_delete_milestone(milestone_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Milestone {milestone_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting milestone {milestone_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete milestone")
