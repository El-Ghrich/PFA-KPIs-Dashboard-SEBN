from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.highlights.schemas import (
    HighlightCreate, HighlightUpdate, HighlightResponse,
    HighlightBulkCreate, HighlightBulkResponse,
    HighlightPeriodEnum,
)
from app.domains.highlights.service import HighlightsService
from app.api.dependencies import (
    get_current_user, require_write_access, UserSession
)

router = APIRouter()


# ==========================================
# SINGLE HIGHLIGHT ENDPOINTS
# ==========================================

@router.post("", response_model=HighlightResponse, status_code=status.HTTP_201_CREATED)
async def create_highlight(
    data: HighlightCreate,
    db: AsyncSession = Depends(get_db),
    user: UserSession = Depends(require_write_access)
):
    return await HighlightsService.create_highlight(session=db, data=data, user=user)


@router.get("/{highlight_id}", response_model=HighlightResponse)
async def get_highlight(
    highlight_id: str,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(get_current_user)
):
    return await HighlightsService.get_highlight(session=db, highlight_id=highlight_id)


@router.patch("/{highlight_id}", response_model=HighlightResponse)
async def update_highlight(
    highlight_id: str,
    data: HighlightUpdate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_write_access)
):
    return await HighlightsService.update_highlight(session=db, highlight_id=highlight_id, data=data)


@router.delete("/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_highlight(
    highlight_id: str,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_write_access)
):
    await HighlightsService.delete_highlight(session=db, highlight_id=highlight_id)


# ==========================================
# BULK ENDPOINT
# ==========================================

@router.post("/bulk", response_model=HighlightBulkResponse, status_code=status.HTTP_201_CREATED)
async def create_highlights_bulk(
    data: HighlightBulkCreate,
    db: AsyncSession = Depends(get_db),
    user: UserSession = Depends(require_write_access)
):
    highlights = await HighlightsService.create_highlights_bulk(session=db, data=data, user=user)
    return HighlightBulkResponse(records=highlights, total=len(highlights))


# ==========================================
# PROJECT-SCOPED QUERY
# ==========================================

@router.get("", response_model=list[HighlightResponse])
async def list_project_highlights(
    project_id: str = Query(..., description="Filter by project ID"),
    period: HighlightPeriodEnum | None = Query(None, description="Filter by period (DAILY or WEEKLY)"),
    iso_year: int | None = Query(None, description="ISO year (e.g. 2026)"),
    iso_week: int | None = Query(None, description="ISO week number (1-53)"),
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(get_current_user)
):
    return await HighlightsService.get_project_highlights(
        session=db, project_id=project_id,
        period=period, iso_year=iso_year, iso_week=iso_week,
    )
