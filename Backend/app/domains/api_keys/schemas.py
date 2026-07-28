from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Friendly name for this key")
    description: Optional[str] = Field(None, description="What this key is used for")
    expires_at: datetime = Field(..., description="When this key should expire")


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    key_prefix: str
    is_active: bool
    expires_at: datetime
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreatedResponse(ApiKeyResponse):
    plain_key: str = Field(..., description="Full API key — shown only once")

    model_config = ConfigDict(from_attributes=True)
