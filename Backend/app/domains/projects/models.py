from datetime import datetime
from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base
import enum
from uuid import uuid4


# ==========================================
# ENUMS
# ==========================================

class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    SUSPENDED = "SUSPENDED"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive status values"""
        if isinstance(value, str):
            upper_value = value.upper()
            for member in cls:
                if member.value == upper_value:
                    return member
        return None


# ==========================================
# MODEL
# ==========================================

class Project(Base):
    __tablename__ = "projects"
    
    # Primary Key
    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=lambda: str(uuid4())
    )
    
    # Business Fields
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
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String,
    )
    
    # Relationships
    kpi_records: Mapped[list["KPIRecord"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, status={self.status}, descprition={self.description})>"