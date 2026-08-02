from typing import Sequence
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.domains.kpis.models import KPIDefinition, KPIRecord, KpiType
from app.domains.kpis.schemas import (
    KPIDefinitionCreate, KPIRecordCreate, KPIRecordUpdate, KPIRecordBulkCreate
)
from app.domains.projects.models import Project
from app.api.dependencies import UserSession

class KPIService:
    
    # ==========================================
    # KPI DEFINITIONS LOGIC
    # ==========================================
    
    @staticmethod
    async def create_definition(session: AsyncSession, data: KPIDefinitionCreate) -> KPIDefinition:
        query = select(KPIDefinition).where(KPIDefinition.name == data.name)
        result = await session.execute(query)
        
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A KPI definition named '{data.name}' already exists."
            )
        
        new_def = KPIDefinition(**data.model_dump())
        session.add(new_def)
        await session.commit()
        await session.refresh(new_def)
        
        return new_def

    @staticmethod
    async def get_definitions(session: AsyncSession) -> Sequence[KPIDefinition]:
        query = select(KPIDefinition)
        result = await session.execute(query)
        return result.scalars().all()


    # ==========================================
    # INTERNAL VALIDATION HELPERS
    # ==========================================

    @staticmethod
    async def _validate_record(session: AsyncSession, data: KPIRecordCreate) -> tuple[Project, KPIDefinition]:
        project = await session.get(Project, data.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{data.project_id}' not found."
            )

        kpi_def = await session.get(KPIDefinition, data.kpi_id)
        if not kpi_def:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KPI definition '{data.kpi_id}' not found."
            )

        if not data.is_missing:
            if kpi_def.kpi_type == KpiType.NUMERIC and data.numeric_value is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"KPI '{kpi_def.name}' expects a numeric value."
                )

        return project, kpi_def


    # ==========================================
    # SINGLE RECORD OPERATIONS
    # ==========================================

    @staticmethod
    async def create_record(session: AsyncSession, data: KPIRecordCreate, user: UserSession | None = None) -> KPIRecord:
        await KPIService._validate_record(session, data)

        record_data = data.model_dump()
        if user:
            if user.source == "jwt":
                record_data["created_by"] = user.user_id
            elif user.source == "api_key":
                record_data["api_key_id"] = user.api_key_id

        new_record = KPIRecord(**record_data)
        session.add(new_record)
        await session.commit()
        await session.refresh(new_record)

        return new_record

    @staticmethod
    async def get_record(session: AsyncSession, record_id: str) -> KPIRecord:
        query = (
            select(KPIRecord)
            .where(KPIRecord.id == record_id)
            .options(joinedload(KPIRecord.kpi_definition))
        )
        result = await session.execute(query)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KPI record '{record_id}' not found."
            )

        return record

    @staticmethod
    async def update_record(session: AsyncSession, record_id: str, data: KPIRecordUpdate) -> KPIRecord:
        record = await KPIService.get_record(session, record_id)

        update_data = data.model_dump(exclude_unset=True)

        if not update_data:
            return record

        if "kpi_id" in update_data:
            kpi_def = await session.get(KPIDefinition, update_data["kpi_id"])
            if not kpi_def:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"KPI definition '{update_data['kpi_id']}' not found."
                )

        for key, value in update_data.items():
            setattr(record, key, value)

        await session.commit()
        await session.refresh(record)
        return record

    @staticmethod
    async def delete_record(session: AsyncSession, record_id: str) -> None:
        record = await KPIService.get_record(session, record_id)
        await session.delete(record)
        await session.commit()


    # ==========================================
    # BULK RECORD OPERATIONS
    # ==========================================

    @staticmethod
    async def create_records_bulk(
        session: AsyncSession,
        data: KPIRecordBulkCreate,
        user: UserSession | None = None
    ) -> list[KPIRecord]:
        user_field = None
        user_value = None
        if user:
            user_field = "created_by" if user.source == "jwt" else "api_key_id"
            user_value = user.user_id if user.source == "jwt" else user.api_key_id

        for r in data.records:
            await KPIService._validate_record(session, r)

        records = []
        for r in data.records:
            record_data = r.model_dump()
            if user_field:
                record_data[user_field] = user_value
            records.append(KPIRecord(**record_data))

        session.add_all(records)
        await session.commit()

        for r in records:
            await session.refresh(r)

        return records


    # ==========================================
    # QUERY OPERATIONS
    # ==========================================

    @staticmethod
    async def get_project_records(
        session: AsyncSession,
        project_id: str,
        period: str | None = None,
        iso_year: int | None = None,
        iso_week: int | None = None,
        kpi_id: str | None = None,
    ) -> Sequence[KPIRecord]:
        query = (
            select(KPIRecord)
            .where(KPIRecord.project_id == project_id)
            .options(joinedload(KPIRecord.kpi_definition))
        )

        if period:
            query = query.where(KPIRecord.period == period)

        if kpi_id:
            query = query.where(KPIRecord.kpi_id == kpi_id)

        if iso_year is not None:
            query = query.where(extract('year', KPIRecord.record_date) == iso_year)

        if iso_week is not None:
            if iso_year is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="iso_week requires iso_year"
                )
            week_start = date.fromisocalendar(iso_year, iso_week, 1)
            query = query.where(KPIRecord.record_date == week_start)

        result = await session.execute(query)
        return result.scalars().all()