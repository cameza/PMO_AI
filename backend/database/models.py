from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


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
    COMPLETED = "Completed"
    OVERDUE = "Overdue"


class Risk(BaseModel):
    id: str
    program_id: str
    title: str
    severity: RiskSeverity
    description: str
    mitigation: str
    status: RiskStatus


class Milestone(BaseModel):
    id: str
    program_id: str
    name: str
    due_date: str
    completed_date: Optional[str] = None
    status: MilestoneStatus


class Program(BaseModel):
    id: str
    name: str
    description: str
    status: ProgramStatus
    owner: str
    team: str
    product_line: str
    pipeline_stage: PipelineStage
    strategic_objectives: List[str]
    launch_date: str
    progress: int
    risks: List[Risk] = []
    milestones: List[Milestone] = []
    last_update: str


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
