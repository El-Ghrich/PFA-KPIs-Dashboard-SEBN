from datetime import date, datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Enum, ForeignKey, Text, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4

if TYPE_CHECKING:
    from app.domains.users.models import User
    from app.domains.projects.models import Project
    from app.domains.api_keys.models import ApiKey


class HighlightStatus(str, enum.Enum):
    GOOD = "GOOD"
    BAD = "BAD"


class HighlightPeriod(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[HighlightPeriod] = mapped_column(Enum(HighlightPeriod, name="recordperiod"), nullable=False)

    value: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[HighlightStatus] = mapped_column(Enum(HighlightStatus), nullable=False, default=HighlightStatus.GOOD)

    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    api_key_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("api_keys.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project: Mapped["Project"] = relationship(back_populates="highlights")
    creator: Mapped[Optional["User"]] = relationship(back_populates="highlights")
    api_key: Mapped[Optional["ApiKey"]] = relationship()


from app.domains.users.models import User  # noqa: E402, F811
from app.domains.projects.models import Project  # noqa: E402, F811
from app.domains.api_keys.models import ApiKey
