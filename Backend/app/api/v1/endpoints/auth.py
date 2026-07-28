from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer

from app.db.session import get_db
from app.domains.users.schemas import UserCreate, UserLogin, UserResponse, Token, RefreshRequest
from app.domains.users.service import UserService
from app.api.dependencies import require_user, require_admin, UserSession

router = APIRouter()
security_scheme = HTTPBearer()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    return await UserService.signup(session=db, data=data)


@router.post("/login")
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    return await UserService.login(session=db, data=data)


@router.post("/refresh")
async def refresh(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    return await UserService.refresh(session=db, refresh_token=data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: UserSession = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    user = await UserService.get_user_by_id(session=db, user_id=current_user.user_id)
    return user
