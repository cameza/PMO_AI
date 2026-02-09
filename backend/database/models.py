from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime


class ProgramStatus(str, Enum):
    ON_TRACK = "On Track"
    AT_RISK = "At Risk"
    OFF_TRACK = "Off Track"
    COMPLETED = "Completed"


class PipelineStage(str, Enum):
    DISCOVERY = "Discovery"
    PLANNING = "Planning"
    IN_PROGRESS = "In Progress"
    LAUNCHING = "Launching"
    COMPLETED = "Completed"


class RiskSeverity(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class RiskStatus(str, Enum):
    OPEN = "Open"
    MITIGATED = "Mitigated"
    CLOSED = "Closed"


class MilestoneStatus(str, Enum):
    UPCOMING = "Upcoming"
    PENDING = "Pending"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"


class StrategicObjective(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    priority: int = 1
    owner: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Risk(BaseModel):
    id: str
    program_id: str
    title: str
    severity: RiskSeverity
    description: Optional[str] = None
    mitigation: Optional[str] = None
    status: RiskStatus


class Milestone(BaseModel):
    id: str
    program_id: str
    name: str
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    status: MilestoneStatus


class Program(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: ProgramStatus
    owner: Optional[str] = None
    team: Optional[str] = None
    product_line: Optional[str] = None
    pipeline_stage: Optional[PipelineStage] = None
    strategic_objective_ids: List[str] = []  # Changed from strategic_objectives to strategic_objective_ids
    launch_date: Optional[str] = None
    progress: int = 0
    risks: List[Risk] = []
    milestones: List[Milestone] = []
    last_update: Optional[str] = None
    
    # Computed property for backward compatibility
    @property
    def strategic_objectives(self) -> List[str]:
        return self.strategic_objective_ids


# Constants matching PRD specifications
STRATEGIC_OBJECTIVES = [
    "Expand IoT ecosystem",
    "Improve user retention",
    "Accelerate cloud migration",
    "Enhance mobile experience",
    "Strengthen core platform",
    "Drive subscription growth",
    "Enable AI capabilities",
    "Modernize infrastructure",  # Uncovered
    "International expansion",   # Uncovered
]

PRODUCT_LINES = ["Smart Home", "Mobile", "Platform", "Video"]
