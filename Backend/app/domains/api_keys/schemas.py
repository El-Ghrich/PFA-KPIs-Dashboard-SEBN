from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class ApiKeyStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    DELETED = "DELETED"


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Friendly name for this key")
    description: Optional[str] = Field(None, description="What this key is used for")
    expires_at: datetime = Field(..., description="When this key should expire")
    user_id: Optional[str] = Field(None, description="Owner user id (defaults to the creating admin)")


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    key_prefix: str
    user_id: str
    status: ApiKeyStatusEnum
    expires_at: datetime
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreatedResponse(ApiKeyResponse):
    plain_key: str = Field(..., description="Full API key — shown only once")

    model_config = ConfigDict(from_attributes=True)
