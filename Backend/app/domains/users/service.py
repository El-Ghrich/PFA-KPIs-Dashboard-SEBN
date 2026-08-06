import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status

from app.domains.users.models import User, RefreshToken, UserRole
from app.domains.users.schemas import UserCreate, UserLogin, UserUpdate, UserRoleEnum
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)


class UserService:

    @staticmethod
    async def _validate_role_assignment(
        session: AsyncSession,
        actor_role: str | None,
        requested_role: UserRoleEnum,
        exclude_user_id: str | None = None,
    ) -> None:
        # Only super admins can grant the super admin role, and only one may exist.
        if requested_role == UserRoleEnum.SUPER_ADMIN:
            if actor_role != UserRole.SUPER_ADMIN.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the super admin can grant the super admin role"
                )
            stmt = select(User).where(User.role == UserRole.SUPER_ADMIN)
            if exclude_user_id:
                stmt = stmt.where(User.id != exclude_user_id)
            existing = await session.execute(stmt)
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A super admin account already exists"
                )

    @staticmethod
    async def signup(session: AsyncSession, data: UserCreate, actor_role: str | None = None) -> User:
        await UserService._validate_role_assignment(
            session, actor_role=actor_role, requested_role=data.role
        )

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
    async def list_users(session: AsyncSession, actor_role: str) -> list[User]:
        # Super admins see all users; admins see only other admins (not super admin)
        stmt = select(User).order_by(User.created_at.desc())
        if actor_role == UserRole.ADMIN.value:
            stmt = stmt.where(User.role == UserRole.ADMIN)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_user(session: AsyncSession, user_id: str, data: UserUpdate, actor_role: str) -> User:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        updates = data.model_dump(exclude_unset=True)
        requested_role = updates.get("role")

        # The super admin account is protected.
        if user.role == UserRole.SUPER_ADMIN:
            if actor_role != UserRole.SUPER_ADMIN.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The super admin account can only be managed by the super admin"
                )
            if requested_role is not None and requested_role != UserRoleEnum.SUPER_ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The super admin account cannot be demoted"
                )

        # Any role change must respect the role assignment rules.
        if requested_role is not None:
            await UserService._validate_role_assignment(
                session, actor_role=actor_role, requested_role=requested_role,
                exclude_user_id=user_id,
            )

        if "password" in updates:
            updates["password_hash"] = hash_password(updates.pop("password"))

        if "email" in updates:
            existing = await session.execute(
                select(User).where(User.email == updates["email"], User.id != user_id)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )

        for key, value in updates.items():
            setattr(user, key, value)

        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def delete_user(session: AsyncSession, user_id: str, actor_role: str) -> None:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The super admin account cannot be deleted"
            )

        from app.domains.api_keys.models import ApiKey
        from app.domains.projects.models import Project
        from app.domains.kpis.models import KPIRecord
        from app.domains.highlights.models import Highlight

        keys = await session.execute(select(ApiKey).where(ApiKey.user_id == user_id))
        for key in keys.scalars():
            await session.delete(key)

        await session.execute(
            update(Project).where(Project.created_by == user_id).values(created_by=None)
        )
        await session.execute(
            update(KPIRecord).where(KPIRecord.created_by == user_id).values(created_by=None)
        )
        await session.execute(
            update(Highlight).where(Highlight.created_by == user_id).values(created_by=None)
        )

        await session.delete(user)
        await session.commit()
