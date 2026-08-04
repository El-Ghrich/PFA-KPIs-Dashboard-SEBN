from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.api_keys.schemas import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from app.domains.api_keys.service import ApiKeyService
from app.api.dependencies import require_admin, UserSession

router = APIRouter()


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    admin: UserSession = Depends(require_admin)
):
    return await ApiKeyService.create_key(session=db, data=data, user_id=admin.user_id)


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    admin: UserSession = Depends(require_admin)
):
    return await ApiKeyService.list_keys(session=db, actor_role=admin.role)


@router.post("/{key_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    admin: UserSession = Depends(require_admin)
):
    await ApiKeyService.revoke_key(session=db, key_id=key_id, actor_role=admin.role)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    admin: UserSession = Depends(require_admin)
):
    await ApiKeyService.delete_key(session=db, key_id=key_id, actor_role=admin.role)
