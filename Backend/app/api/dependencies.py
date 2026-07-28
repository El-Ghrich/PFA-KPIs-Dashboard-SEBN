from typing import Literal
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import decode_token, hash_api_key

security_scheme = HTTPBearer(auto_error=False)


class UserSession(BaseModel):
    user_id: str | None = None
    role: str | None = None
    api_key_id: str | None = None
    source: Literal["jwt", "api_key"]


async def get_current_user(
    credentials: security_scheme = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserSession:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    token = credentials.credentials

    payload = _try_decode_jwt(token)
    if payload:
        return UserSession(
            user_id=payload["sub"],
            role=payload.get("role"),
            source="jwt"
        )

    api_key = await _try_find_api_key(db, token)
    if api_key:
        from app.domains.api_keys.service import ApiKeyService
        await ApiKeyService.touch_key(db, api_key.id)
        return UserSession(
            api_key_id=api_key.id,
            source="api_key"
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token"
    )


async def require_admin(
    user: UserSession = Depends(get_current_user)
) -> UserSession:
    if user.source != "jwt" or user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


async def require_user(
    user: UserSession = Depends(get_current_user)
) -> UserSession:
    if user.source != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User session required"
        )
    return user


async def require_write_access(
    user: UserSession = Depends(get_current_user)
) -> UserSession:
    if user.source == "api_key":
        return user
    if user.source == "jwt" and user.role == "ADMIN":
        return user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Write access required"
    )


def _try_decode_jwt(token: str) -> dict | None:
    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            return payload
    except Exception:
        return None
    return None


async def _try_find_api_key(db: AsyncSession, token: str):
    from app.domains.api_keys.models import ApiKey
    from datetime import datetime, timezone

    key_hash = hash_api_key(token)
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active == True,
            ApiKey.expires_at > datetime.now(timezone.utc)
        )
    )
    return result.scalar_one_or_none()
