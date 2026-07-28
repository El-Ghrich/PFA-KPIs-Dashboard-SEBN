import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.domains.users.models import User, RefreshToken
from app.domains.users.schemas import UserCreate, UserLogin
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)


class UserService:

    @staticmethod
    async def signup(session: AsyncSession, data: UserCreate) -> User:
        existing = await session.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user = User(
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            password_hash=hash_password(data.password)
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def login(session: AsyncSession, data: UserLogin) -> dict:
        result = await session.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        expire = datetime.now(timezone.utc) + timedelta(days=7)
        print(expire)
        session.add(RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expire
        ))
        await session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value
            }
        }

    @staticmethod
    async def refresh(session: AsyncSession, refresh_token: str) -> dict:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Invalid token type")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = await session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        )
        stored = result.scalar_one_or_none()

        if not stored:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token revoked or expired"
            )

        user = await session.get(User, payload["sub"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        new_access = create_access_token(user.id, user.role.value)
        return {"access_token": new_access, "token_type": "bearer"}

    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: str) -> User:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    @staticmethod
    async def list_users(session: AsyncSession) -> list[User]:
        result = await session.execute(select(User))
        return result.scalars().all()
