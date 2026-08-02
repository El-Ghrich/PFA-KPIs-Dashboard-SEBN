from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional
from enum import Enum

# ==========================================
# ENUM SCHEMAS
# ==========================================

class HighlightStatusEnum(str, Enum):
    GOOD = "GOOD"
    BAD = "BAD"


class HighlightPeriodEnum(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


# ==========================================
# HIGHLIGHT SCHEMAS
# ==========================================

class HighlightBase(BaseModel):
    project_id: str
    record_date: date
    period: HighlightPeriodEnum
    value: str = Field(..., min_length=1, description="The highlight/comment text")
    status: HighlightStatusEnum = HighlightStatusEnum.GOOD


class HighlightCreate(HighlightBase):
    created_by: Optional[str] = None


class HighlightUpdate(BaseModel):
    record_date: Optional[date] = None
    period: Optional[HighlightPeriodEnum] = None
    value: Optional[str] = None
    status: Optional[HighlightStatusEnum] = None


class HighlightResponse(HighlightBase):
    id: str
    created_at: datetime
    created_by: Optional[str] = None
    api_key_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HighlightBulkCreate(BaseModel):
    records: list[HighlightCreate]


class HighlightBulkResponse(BaseModel):
    records: list[HighlightResponse]
    total: int
