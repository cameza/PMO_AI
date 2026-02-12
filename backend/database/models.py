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
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"
    AT_RISK = "At Risk"


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
    strategic_objective_ids: List[str] = []
    strategic_objectives: List[str] = []  # Resolved names for frontend display
    launch_date: Optional[str] = None
    progress: int = 0
    risks: List[Risk] = []
    milestones: List[Milestone] = []
    last_update: Optional[str] = None


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


# ---------------------------------------------------------------------------
# Request models for CRUD operations
# ---------------------------------------------------------------------------

class ProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProgramStatus = ProgramStatus.ON_TRACK
    owner: Optional[str] = None
    team: Optional[str] = None
    product_line: Optional[str] = None
    pipeline_stage: Optional[PipelineStage] = None
    launch_date: Optional[str] = None
    progress: int = 0
    last_update: Optional[str] = None
    strategic_objective_ids: List[str] = []


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProgramStatus] = None
    owner: Optional[str] = None
    team: Optional[str] = None
    product_line: Optional[str] = None
    pipeline_stage: Optional[PipelineStage] = None
    launch_date: Optional[str] = None
    progress: Optional[int] = None
    last_update: Optional[str] = None
    strategic_objective_ids: Optional[List[str]] = None


class RiskCreate(BaseModel):
    title: str
    severity: RiskSeverity
    description: Optional[str] = None
    mitigation: Optional[str] = None
    status: RiskStatus = RiskStatus.OPEN


class RiskUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[RiskSeverity] = None
    description: Optional[str] = None
    mitigation: Optional[str] = None
    status: Optional[RiskStatus] = None


class MilestoneCreate(BaseModel):
    name: str
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    status: MilestoneStatus = MilestoneStatus.PENDING


class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    status: Optional[MilestoneStatus] = None


# ---------------------------------------------------------------------------
# Integration models
# ---------------------------------------------------------------------------

class IntegrationConnect(BaseModel):
    api_key: str


class IntegrationConfig(BaseModel):
    id: str
    organization_id: str
    tool: str
    status: str
    sync_schedule: str
    last_sync_at: Optional[str] = None
    config: Optional[dict] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class IntegrationStatus(BaseModel):
    connected: bool
    tool: Optional[str] = None
    status: Optional[str] = None
    last_sync_at: Optional[str] = None
    organization: Optional[dict] = None


class SyncResult(BaseModel):
    strategic_objectives: int = 0
    programs: int = 0
    milestones: int = 0
    last_sync_at: Optional[str] = None


class DataSourceToggle(BaseModel):
    data_source: str  # 'manual' or 'synced'
