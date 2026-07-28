from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.domains.api_keys.models import ApiKey
from app.domains.api_keys.schemas import ApiKeyCreate, ApiKeyCreatedResponse
from app.core.security import generate_api_key


class ApiKeyService:

    @staticmethod
    async def create_key(
        session: AsyncSession,
        data: ApiKeyCreate,
        user_id: str
    ) -> ApiKeyCreatedResponse:
        plain_key, key_hash = generate_api_key()

        api_key = ApiKey(
            name=data.name,
            description=data.description,
            key_prefix=plain_key[:8],
            key_hash=key_hash,
            user_id=user_id,
            expires_at=data.expires_at,
        )
        session.add(api_key)
        await session.commit()
        await session.refresh(api_key)

        return ApiKeyCreatedResponse(
            id=api_key.id,
            name=api_key.name,
            description=api_key.description,
            key_prefix=api_key.key_prefix,
            is_active=api_key.is_active,
            expires_at=api_key.expires_at,
            last_used_at=api_key.last_used_at,
            created_at=api_key.created_at,
            plain_key=plain_key,
        )

    @staticmethod
    async def list_keys(session: AsyncSession, user_id: str | None = None) -> list[ApiKey]:
        query = select(ApiKey)
        if user_id:
            query = query.where(ApiKey.user_id == user_id)
        query = query.order_by(ApiKey.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def revoke_key(session: AsyncSession, key_id: str) -> None:
        api_key = await session.get(ApiKey, key_id)
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        api_key.is_active = False
        await session.commit()

    @staticmethod
    async def touch_key(session: AsyncSession, key_id: str) -> None:
        api_key = await session.get(ApiKey, key_id)
        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            await session.commit()
