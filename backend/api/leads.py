"""
Leads API endpoints
Handles lead capture from demo notification modal
"""

from fastapi import APIRouter, HTTPException
from pydantic import EmailStr
from typing import Optional

from ..database.models import LeadCapture
from ..database.db import create_lead

router = APIRouter()


@router.post("")
async def capture_lead(lead: LeadCapture) -> dict:
    """
    Capture a lead from the demo notification modal.
    
    Args:
        lead: Lead capture data with email, optional name/company, and source
        
    Returns:
        Created lead record with ID and timestamp
        
    Raises:
        HTTPException: If lead creation fails
    """
    try:
        # Basic email validation
        if not lead.email or "@" not in lead.email:
            raise HTTPException(status_code=400, detail="Valid email is required")
        
        # Create lead in database
        created_lead = create_lead(lead)
        
        return {
            "success": True,
            "lead": created_lead,
            "message": "Lead captured successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to capture lead: {str(e)}"
        )
