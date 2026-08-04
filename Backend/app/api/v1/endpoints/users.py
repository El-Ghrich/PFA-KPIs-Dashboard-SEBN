from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.users.schemas import UserCreate, UserUpdate, UserResponse
from app.domains.users.service import UserService
from app.api.dependencies import require_admin, UserSession

router = APIRouter()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin)
):
    return await UserService.signup(session=db, data=data, actor_role=actor.role)


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin)
):
    return await UserService.list_users(session=db, actor_role=actor.role)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin)
):
    return await UserService.update_user(session=db, user_id=user_id, data=data, actor_role=actor.role)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin)
):
    await UserService.delete_user(session=db, user_id=user_id, actor_role=actor.role)
