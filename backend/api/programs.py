from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from database.db import get_all_programs, get_program_by_id
from database.models import Program

router = APIRouter()


@router.get("/programs", response_model=List[Program])
async def list_programs(
    status: Optional[str] = Query(None, description="Filter by status: On Track, At Risk, Off Track, Completed"),
    product_line: Optional[str] = Query(None, description="Filter by product line")
):
    """
    List all programs with optional filtering.
    
    - **status**: Filter by program status
    - **product_line**: Filter by product line
    """
    programs = get_all_programs()
    
    if status:
        programs = [p for p in programs if p.status.value == status]
    
    if product_line:
        programs = [p for p in programs if p.product_line == product_line]
    
    return programs


@router.get("/programs/{program_id}", response_model=Program)
async def get_program(program_id: str):
    """
    Get a single program by ID.
    
    Returns the program with all associated risks and milestones.
    """
    program = get_program_by_id(program_id)
    
    if not program:
        raise HTTPException(status_code=404, detail=f"Program {program_id} not found")
    
    return program
