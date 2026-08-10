from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.domains.takeaways.models import KeyTakeaway
from app.domains.takeaways.schemas import KeyTakeawayCreate
from app.domains.projects.models import Project


class KeyTakeawayService:
    @staticmethod
    async def get_by_project(session: AsyncSession, project_id: str) -> list[KeyTakeaway]:
        stmt = (
            select(KeyTakeaway)
            .where(KeyTakeaway.project_id == project_id)
            .order_by(KeyTakeaway.created_at.desc())
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create_bulk(
        session: AsyncSession,
        project_id: str,
        items: list[KeyTakeawayCreate],
        created_by: str | None = None,
    ) -> list[KeyTakeaway]:
        # Check project exists
        proj_res = await session.execute(select(Project).where(Project.id == project_id))
        if not proj_res.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        created: list[KeyTakeaway] = []
        for item in items:
            takeaway = KeyTakeaway(
                project_id=project_id,
                content=item.content.trim() if hasattr(item.content, 'trim') else item.content.strip(),
                created_by=created_by,
            )
            session.add(takeaway)
            created.append(takeaway)

        await session.commit()
        for t in created:
            await session.refresh(t)
        return created

    @staticmethod
    async def delete(session: AsyncSession, takeaway_id: str) -> None:
        stmt = select(KeyTakeaway).where(KeyTakeaway.id == takeaway_id)
        res = await session.execute(stmt)
        takeaway = res.scalar_one_or_none()
        if not takeaway:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key takeaway not found")

        await session.delete(takeaway)
        await session.commit()
