from typing import Sequence
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract
from fastapi import HTTPException, status

from app.domains.highlights.models import Highlight
from app.domains.highlights.schemas import HighlightCreate, HighlightUpdate, HighlightBulkCreate
from app.domains.projects.models import Project
from app.api.dependencies import UserSession


class HighlightsService:

    # ==========================================
    # INTERNAL VALIDATION HELPERS
    # ==========================================

    @staticmethod
    async def _validate_project(session: AsyncSession, project_id: str) -> Project:
        project = await session.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found."
            )
        return project

    @staticmethod
    async def get_highlight(session: AsyncSession, highlight_id: str) -> Highlight:
        highlight = await session.get(Highlight, highlight_id)
        if not highlight:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Highlight '{highlight_id}' not found."
            )
        return highlight

    # ==========================================
    # SINGLE HIGHLIGHT OPERATIONS
    # ==========================================

    @staticmethod
    async def create_highlight(
        session: AsyncSession,
        data: HighlightCreate,
        user: UserSession | None = None
    ) -> Highlight:
        await HighlightsService._validate_project(session, data.project_id)

        highlight_data = data.model_dump()
        if user:
            if user.source == "jwt":
                highlight_data["created_by"] = user.user_id
            elif user.source == "api_key":
                highlight_data["api_key_id"] = user.api_key_id

        new_highlight = Highlight(**highlight_data)
        session.add(new_highlight)
        await session.commit()
        await session.refresh(new_highlight)

        return new_highlight

    @staticmethod
    async def update_highlight(
        session: AsyncSession,
        highlight_id: str,
        data: HighlightUpdate
    ) -> Highlight:
        highlight = await HighlightsService.get_highlight(session, highlight_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return highlight

        for key, value in update_data.items():
            setattr(highlight, key, value)

        await session.commit()
        await session.refresh(highlight)
        return highlight

    @staticmethod
    async def delete_highlight(session: AsyncSession, highlight_id: str) -> None:
        highlight = await HighlightsService.get_highlight(session, highlight_id)
        await session.delete(highlight)
        await session.commit()

    # ==========================================
    # BULK HIGHLIGHT OPERATIONS
    # ==========================================

    @staticmethod
    async def create_highlights_bulk(
        session: AsyncSession,
        data: HighlightBulkCreate,
        user: UserSession | None = None
    ) -> list[Highlight]:
        user_field = None
        user_value = None
        if user:
            user_field = "created_by" if user.source == "jwt" else "api_key_id"
            user_value = user.user_id if user.source == "jwt" else user.api_key_id

        for h in data.records:
            await HighlightsService._validate_project(session, h.project_id)

        highlights = []
        for h in data.records:
            highlight_data = h.model_dump()
            if user_field:
                highlight_data[user_field] = user_value
            highlights.append(Highlight(**highlight_data))

        session.add_all(highlights)
        await session.commit()

        for h in highlights:
            await session.refresh(h)

        return highlights

    # ==========================================
    # QUERY OPERATIONS
    # ==========================================

    @staticmethod
    async def get_project_highlights(
        session: AsyncSession,
        project_id: str,
        period: str | None = None,
        iso_year: int | None = None,
        iso_week: int | None = None,
    ) -> Sequence[Highlight]:
        query = select(Highlight).where(Highlight.project_id == project_id)

        if period:
            query = query.where(Highlight.period == period)

        if iso_year is not None:
            query = query.where(extract('year', Highlight.record_date) == iso_year)

        if iso_week is not None:
            if iso_year is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="iso_week requires iso_year"
                )
            week_start = date.fromisocalendar(iso_year, iso_week, 1)
            query = query.where(Highlight.record_date == week_start)

        result = await session.execute(query)
        return result.scalars().all()
