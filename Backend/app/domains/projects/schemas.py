import uuid
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

class ProjectStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class ProjectBase(BaseModel):
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Project name (must be unique)"
    )
    status: ProjectStatusEnum = Field(
        default=ProjectStatusEnum.ACTIVE,
        description="Project status: ACTIVE or COMPLETED"
    )

# ==========================================
# CREATE SCHEMA
# ==========================================

class ProjectCreate(ProjectBase):
    """Schema for creating a new project"""
    pass

# ==========================================
# UPDATE SCHEMA
# ==========================================

class ProjectUpdate(BaseModel):
    """Schema for updating an existing project (all fields optional)"""
    name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=100,
        description="New project name"
    )
    status: Optional[ProjectStatusEnum] = Field(
        None,
        description="New project status"
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 1:
                raise ValueError('Name cannot be empty')
        return v

# ==========================================
# RESPONSE SCHEMA
# ==========================================

class ProjectResponse(ProjectBase):
    """Schema for returning project data"""
    id: uuid.UUID
    created_at: datetime
    
    # Pydantic V2 syntax for ORM mode
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# LIST RESPONSE SCHEMA
# ==========================================

class ProjectListResponse(BaseModel):
    """Schema for paginated project list"""
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# PROJECT WITH KPIS SCHEMA
# ==========================================

class ProjectWithKPIsResponse(ProjectResponse):
    """Schema for project with its KPI records"""
    # Using string annotation avoids circular imports before rebuild
    kpi_records: Optional[list["KPIRecordResponse"]] = [] 
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# IMPORT FOR FORWARD REFERENCE
# ==========================================

from app.domains.kpis.schemas import KPIRecordResponse
ProjectWithKPIsResponse.model_rebuild()