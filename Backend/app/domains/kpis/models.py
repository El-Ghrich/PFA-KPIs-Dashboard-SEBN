from datetime import date, datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, Enum, ForeignKey, Text, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4

if TYPE_CHECKING:
    from app.domains.users.models import User
    from app.domains.projects.models import Project
    from app.domains.api_keys.models import ApiKey


class KpiType(str, enum.Enum):
    NUMERIC = "NUMERIC"
    TEXT = "TEXT"


class RecordPeriod(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


class KPIDefinition(Base):
    __tablename__ = "kpi_definitions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    kpi_type: Mapped[KpiType] = mapped_column(Enum(KpiType), nullable=False)

    records: Mapped[list["KPIRecord"]] = relationship(back_populates="kpi_definition")


class KPIRecord(Base):
    __tablename__ = "kpi_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    kpi_id: Mapped[str] = mapped_column(String(36), ForeignKey("kpi_definitions.id"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[RecordPeriod] = mapped_column(Enum(RecordPeriod), nullable=False)

    numeric_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    asset_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_missing: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    api_key_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("api_keys.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    kpi_definition: Mapped["KPIDefinition"] = relationship(back_populates="records")
    project: Mapped["Project"] = relationship(back_populates="kpi_records")
    creator: Mapped[Optional["User"]] = relationship(back_populates="kpi_records")
    api_key: Mapped[Optional["ApiKey"]] = relationship()


from app.domains.users.models import User  # noqa: E402, F811
from app.domains.projects.models import Project  # noqa: E402, F811
from app.domains.api_keys.models import ApiKey
