from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import uuid
import logging

try:
    from backend.database.models import StrategicObjective
    from backend.database.db import (
        get_all_strategic_objectives,
        get_strategic_objective_by_id,
        create_strategic_objective,
        update_strategic_objective,
        delete_strategic_objective
    )
except ImportError:
    from database.models import StrategicObjective
    from database.db import (
        get_all_strategic_objectives,
        get_strategic_objective_by_id,
        create_strategic_objective,
        update_strategic_objective,
        delete_strategic_objective
    )

logger = logging.getLogger(__name__)

router = APIRouter(tags=["strategic-objectives"])


@router.get("", response_model=List[StrategicObjective])
async def get_strategic_objectives():
    """Get all strategic objectives."""
    try:
        objectives = get_all_strategic_objectives()
        return objectives
    except Exception as e:
        logger.error(f"Error fetching strategic objectives: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch strategic objectives"
        )


@router.get("/{objective_id}", response_model=StrategicObjective)
async def get_strategic_objective(objective_id: str):
    """Get a specific strategic objective by ID."""
    try:
        objective = get_strategic_objective_by_id(objective_id)
        if not objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Strategic objective {objective_id} not found"
            )
        return objective
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching strategic objective {objective_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch strategic objective"
        )


@router.post("", response_model=StrategicObjective, status_code=status.HTTP_201_CREATED)
async def create_new_strategic_objective(objective: StrategicObjective):
    """Create a new strategic objective."""
    try:
        # Generate ID if not provided
        if not objective.id:
            objective.id = f"obj-{uuid.uuid4().hex[:8]}"
        
        # Check if objective with this ID already exists
        existing = get_strategic_objective_by_id(objective.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Strategic objective with ID {objective.id} already exists"
            )
        
        created_objective = create_strategic_objective(objective)
        return created_objective
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating strategic objective: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create strategic objective"
        )


@router.put("/{objective_id}", response_model=StrategicObjective)
async def update_existing_strategic_objective(objective_id: str, objective: StrategicObjective):
    """Update an existing strategic objective."""
    try:
        # Check if objective exists
        existing = get_strategic_objective_by_id(objective_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Strategic objective {objective_id} not found"
            )
        
        # Ensure ID in body matches URL parameter
        objective.id = objective_id
        
        updated_objective = update_strategic_objective(objective_id, objective)
        return updated_objective
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating strategic objective {objective_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update strategic objective"
        )


@router.delete("/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_strategic_objective(objective_id: str):
    """Delete a strategic objective."""
    try:
        # Check if objective exists
        existing = get_strategic_objective_by_id(objective_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Strategic objective {objective_id} not found"
            )
        
        deleted = delete_strategic_objective(objective_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete strategic objective"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting strategic objective {objective_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete strategic objective"
        )
