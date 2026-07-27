from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Float, Boolean, Enum, ForeignKey, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4

class KpiType(str, enum.Enum):
    NUMERIC = "NUMERIC"  # Output, Scrap, OEE, Downtime
    TEXT = "TEXT"        # Highlight
    
class KPIDefinition(Base):
    __tablename__ = "kpi_definitions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    kpi_type: Mapped[KpiType] = mapped_column(Enum(KpiType), nullable=False)
    
    # Relationships
    records: Mapped[list["KPIRecord"]] = relationship(back_populates="kpi_definition")


class KPIRecord(Base):
    __tablename__ = "kpi_records"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    kpi_id: Mapped[str] = mapped_column(String(36), ForeignKey("kpi_definitions.id"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Mutually exclusive: one is filled based on kpi_type
    numeric_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    asset_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_missing: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    # Relationships
    kpi_definition: Mapped["KPIDefinition"] = relationship(back_populates="records")
    project: Mapped["Project"] = relationship()
    creator: Mapped["User"] = relationship()