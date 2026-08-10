from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class KeyTakeawayCreate(BaseModel):
    content: str = Field(..., min_length=1, description="The takeaway note content")


class KeyTakeawayBulkCreate(BaseModel):
    items: list[KeyTakeawayCreate] = Field(..., min_length=1, description="List of key takeaways to create")


class KeyTakeawayResponse(BaseModel):
    id: str
    project_id: str
    content: str
    created_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KeyTakeawayListResponse(BaseModel):
    items: list[KeyTakeawayResponse]
    total: int
