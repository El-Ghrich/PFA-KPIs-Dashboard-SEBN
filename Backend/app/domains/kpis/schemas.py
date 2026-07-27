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


class RecordPeriodEnum(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


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
    period: RecordPeriodEnum
    numeric_value: Optional[float] = None
    text_value: Optional[str] = None
    asset_url: Optional[str] = None
    is_missing: bool = False

class KPIRecordCreate(KPIRecordBase):
    created_by: Optional[str] = None

class KPIRecordUpdate(BaseModel):
    record_date: Optional[date] = None
    period: Optional[RecordPeriodEnum] = None
    numeric_value: Optional[float] = None
    text_value: Optional[str] = None
    asset_url: Optional[str] = None
    is_missing: Optional[bool] = None

class KPIRecordResponse(KPIRecordBase):
    id: str
    created_at: datetime
    created_by: Optional[str] = None
    kpi_definition: Optional[KPIDefinitionResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class KPIRecordBulkCreate(BaseModel):
    records: list[KPIRecordCreate]

class KPIRecordBulkResponse(BaseModel):
    records: list[KPIRecordResponse]
    total: int


# ==========================================
# HIGHLIGHT-SPECIFIC SCHEMA
# ==========================================

class HighlightCreate(BaseModel):
    project_id: str
    record_date: date
    text_value: str = Field(..., min_length=1, description="The highlight/comment text")
    created_by: Optional[str] = None