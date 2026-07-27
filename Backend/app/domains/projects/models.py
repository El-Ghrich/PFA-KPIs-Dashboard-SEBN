from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4

if TYPE_CHECKING:
    from app.domains.kpis.models import KPIRecord
    from app.domains.users.models import User


class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    SUSPENDED = "SUSPENDED"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            upper_value = value.upper()
            for member in cls:
                if member.value == upper_value:
                    return member
        return None


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4())
    )

    name: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus),
        nullable=False,
        default=ProjectStatus.ACTIVE
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    description: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, default=None
    )

    location: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, default=None
    )

    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    kpi_records: Mapped[list["KPIRecord"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan"
    )

    creator: Mapped[Optional["User"]] = relationship(back_populates="projects")

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, status={self.status}, location={self.location})>"


from app.domains.kpis.models import KPIRecord  # noqa: E402, F811
from app.domains.users.models import User  # noqa: E402, F811
