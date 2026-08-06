from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum


# ==========================================
# ENUM SCHEMAS
# ==========================================

class UserRoleEnum(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"


# ==========================================
# BASE SCHEMA
# ==========================================

class UserBase(BaseModel):
    email: EmailStr = Field(
        ..., 
        description="User email address (must be unique)"
    )
    full_name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="User's full name"
    )
    role: UserRoleEnum = Field(
        default=UserRoleEnum.ADMIN,
        description="User role: SUPER_ADMIN or ADMIN"
    )


# ==========================================
# CREATE SCHEMA
# ==========================================

class UserCreate(UserBase):
    password: str = Field(
        ..., 
        min_length=8,
        description="Password (min 8 characters)"
    )


# ==========================================
# UPDATE SCHEMA
# ==========================================

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="New email address")
    full_name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=100,
        description="New full name"
    )
    role: Optional[UserRoleEnum] = Field(None, description="New role")
    password: Optional[str] = Field(
        None, 
        min_length=8,
        description="New password (min 8 characters)"
    )
    
    @field_validator('full_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 1:
                raise ValueError('Full name cannot be empty')
        return v


# ==========================================
# RESPONSE SCHEMA
# ==========================================

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # ORM mode for SQLAlchemy


# ==========================================
# LOGIN SCHEMA
# ==========================================

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")


# ==========================================
# TOKEN SCHEMA
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenResponse(Token):
    refresh_token: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRoleEnum] = None


# ==========================================
# PASSWORD CHANGE SCHEMA
# ==========================================

class PasswordChange(BaseModel):
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ..., 
        min_length=8,
        description="New password (min 8 characters)"
    )