from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.domains.api_keys.models import ApiKey, ApiKeyStatus
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
        owner_user_id = data.user_id or user_id

        api_key = ApiKey(
            name=data.name,
            description=data.description,
            key_prefix=plain_key[:8],
            key_hash=key_hash,
            user_id=owner_user_id,
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
            user_id=api_key.user_id,
            status=api_key.status,
            expires_at=api_key.expires_at,
            last_used_at=api_key.last_used_at,
            created_at=api_key.created_at,
            plain_key=plain_key,
        )

    @staticmethod
    async def list_keys(session: AsyncSession, actor_role: str) -> list[ApiKey]:
        query = select(ApiKey)
        # Admins cannot see soft-deleted keys; only the super admin can.
        if actor_role != "SUPER_ADMIN":
            query = query.where(ApiKey.status != ApiKeyStatus.DELETED)
        query = query.order_by(ApiKey.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def _get_visible_key(session: AsyncSession, key_id: str, actor_role: str) -> ApiKey:
        api_key = await session.get(ApiKey, key_id)
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        if api_key.status == ApiKeyStatus.DELETED and actor_role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        return api_key

    @staticmethod
    async def revoke_key(session: AsyncSession, key_id: str, actor_role: str) -> None:
        api_key = await ApiKeyService._get_visible_key(session, key_id, actor_role)
        api_key.status = ApiKeyStatus.REVOKED
        await session.commit()

    @staticmethod
    async def delete_key(session: AsyncSession, key_id: str, actor_role: str) -> None:
        api_key = await ApiKeyService._get_visible_key(session, key_id, actor_role)
        api_key.status = ApiKeyStatus.DELETED
        await session.commit()

    @staticmethod
    async def touch_key(session: AsyncSession, key_id: str) -> None:
        api_key = await session.get(ApiKey, key_id)
        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            await session.commit()
