from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4

if TYPE_CHECKING:
    from app.domains.kpis.models import KPIRecord
    from app.domains.highlights.models import Highlight
    from app.domains.projects.models import Project
    from app.domains.api_keys.models import ApiKey


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    VIEWER = "VIEWER"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            upper_value = value.upper()
            for member in cls:
                if member.value == upper_value:
                    return member
        return None


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4())
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True
    )
    full_name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.VIEWER
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="creator")
    projects: Mapped[list["Project"]] = relationship(back_populates="creator")
    kpi_records: Mapped[list["KPIRecord"]] = relationship(back_populates="creator")
    highlights: Mapped[list["Highlight"]] = relationship(back_populates="creator")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


User.refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


from app.domains.projects.models import Project  # noqa: E402, F811
from app.domains.kpis.models import KPIRecord  # noqa: E402, F811
from app.domains.highlights.models import Highlight  # noqa: E402, F811
