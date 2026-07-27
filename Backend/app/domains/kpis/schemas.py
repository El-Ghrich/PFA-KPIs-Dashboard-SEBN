from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional
from enum import Enum


# ==========================================
# ENUM SCHEMAS
# ==========================================

class KpiTypeEnum(str, Enum):
    NUMERIC = "NUMERIC"
    TEXT = "TEXT"


# ==========================================
# KPI DEFINITION SCHEMAS
# ==========================================

class KPIDefinitionBase(BaseModel):
    name: str
    unit: str
    kpi_type: KpiTypeEnum

class KPIDefinitionCreate(KPIDefinitionBase):
    pass

class KPIDefinitionResponse(KPIDefinitionBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# KPI RECORD SCHEMAS
# ==========================================

class KPIRecordBase(BaseModel):
    project_id: str
    kpi_id: str
    record_date: date
    numeric_value: Optional[float] = None
    text_value: Optional[str] = None
    asset_url: Optional[str] = None
    is_missing: bool = False

class KPIRecordCreate(KPIRecordBase):
    created_by: Optional[str] = None

class KPIRecordResponse(KPIRecordBase):
    id: str
    created_at: datetime
    kpi_definition: Optional[KPIDefinitionResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# HIGHLIGHT-SPECIFIC SCHEMA
# ==========================================

class HighlightCreate(BaseModel):
    project_id: str
    record_date: date
    text_value: str = Field(..., min_length=1, description="The highlight/comment text")
    created_by: Optional[str] = None