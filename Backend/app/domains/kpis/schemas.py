from pydantic import BaseModel, ConfigDict, field_validator
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
    set_id: Optional[str] = None
    record_date: date
    period: RecordPeriodEnum
    numeric_value: Optional[float] = None
    asset_url: Optional[str] = None

    @field_validator("record_date")
    @classmethod
    def validate_record_year(cls, v: date) -> date:
        if v.year < 2020 or v.year > 2035:
            raise ValueError(f"Record year {v.year} is outside valid range (2020-2035)")
        return v

    @field_validator("numeric_value")
    @classmethod
    def validate_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Numeric value cannot be negative")
        return v

class KPIRecordCreate(KPIRecordBase):
    created_by: Optional[str] = None

class KPIRecordUpdate(BaseModel):
    record_date: Optional[date] = None
    period: Optional[RecordPeriodEnum] = None
    numeric_value: Optional[float] = None
    asset_url: Optional[str] = None

    @field_validator("numeric_value")
    @classmethod
    def validate_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Numeric value cannot be negative")
        return v

class KPIRecordResponseBase(KPIRecordBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class KPIRecordWriteResponse(KPIRecordResponseBase):
    pass

class KPIRecordResponse(KPIRecordResponseBase):
    kpi_definition: Optional[KPIDefinitionResponse] = None

class KPIRecordWithoutDefinitionResponse(KPIRecordResponseBase):
    pass

class KPIRecordsListResponse(BaseModel):
    definitions: list[KPIDefinitionResponse]
    records: list[KPIRecordWithoutDefinitionResponse]

class KPIRecordBulkCreate(BaseModel):
    records: list[KPIRecordCreate]

class KPIRecordBulkResponse(BaseModel):
    records: list[KPIRecordWriteResponse]
    total: int