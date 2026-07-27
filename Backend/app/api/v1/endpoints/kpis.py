from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.kpis.schemas import (
    KPIDefinitionCreate, KPIDefinitionResponse,
    KPIRecordCreate, KPIRecordUpdate, KPIRecordResponse,
    KPIRecordBulkCreate, KPIRecordBulkResponse,
    RecordPeriodEnum,
)
from app.domains.kpis.service import KPIService

router = APIRouter()


# ==========================================
# DEFINITION ENDPOINTS
# ==========================================

@router.post("/definitions", response_model=KPIDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_kpi_definition(
    data: KPIDefinitionCreate,
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.create_definition(session=db, data=data)


@router.get("/definitions", response_model=list[KPIDefinitionResponse])
async def list_kpi_definitions(
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.get_definitions(session=db)


# ==========================================
# SINGLE RECORD ENDPOINTS
# ==========================================

@router.post("/records", response_model=KPIRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_kpi_record(
    data: KPIRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.create_record(session=db, data=data)


@router.get("/records/{record_id}", response_model=KPIRecordResponse)
async def get_kpi_record(
    record_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.get_record(session=db, record_id=record_id)


@router.patch("/records/{record_id}", response_model=KPIRecordResponse)
async def update_kpi_record(
    record_id: str,
    data: KPIRecordUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.update_record(session=db, record_id=record_id, data=data)


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kpi_record(
    record_id: str,
    db: AsyncSession = Depends(get_db)
):
    await KPIService.delete_record(session=db, record_id=record_id)


# ==========================================
# BULK ENDPOINT
# ==========================================

@router.post("/records/bulk", response_model=KPIRecordBulkResponse, status_code=status.HTTP_201_CREATED)
async def create_kpi_records_bulk(
    data: KPIRecordBulkCreate,
    db: AsyncSession = Depends(get_db)
):
    records = await KPIService.create_records_bulk(session=db, data=data)
    return KPIRecordBulkResponse(records=records, total=len(records))


# ==========================================
# PROJECT-SCOPED QUERY
# ==========================================

@router.get("/records", response_model=list[KPIRecordResponse])
async def list_project_kpi_records(
    project_id: str = Query(..., description="Filter by project ID"),
    period: RecordPeriodEnum | None = Query(None, description="Filter by period (DAILY or WEEKLY)"),
    iso_year: int | None = Query(None, description="ISO year (e.g. 2026)"),
    iso_week: int | None = Query(None, description="ISO week number (1-53)"),
    db: AsyncSession = Depends(get_db)
):
    return await KPIService.get_project_records(
        session=db, project_id=project_id,
        period=period, iso_year=iso_year, iso_week=iso_week
    )