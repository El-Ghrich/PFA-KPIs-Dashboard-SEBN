from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.dependencies import require_admin, UserSession
from app.domains.takeaways.schemas import (
    KeyTakeawayBulkCreate,
    KeyTakeawayResponse,
    KeyTakeawayListResponse,
)
from app.domains.takeaways.service import KeyTakeawayService

router = APIRouter()


@router.get("/projects/{project_id}/takeaways", response_model=KeyTakeawayListResponse)
async def list_project_takeaways(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    items = await KeyTakeawayService.get_by_project(db, project_id)
    return KeyTakeawayListResponse(items=items, total=len(items))


@router.post(
    "/projects/{project_id}/takeaways",
    response_model=list[KeyTakeawayResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_project_takeaways(
    project_id: str,
    body: KeyTakeawayBulkCreate,
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin),
):
    created = await KeyTakeawayService.create_bulk(
        session=db,
        project_id=project_id,
        items=body.items,
        created_by=actor.user_id,
    )
    return created


@router.delete("/takeaways/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_takeaway(
    id: str,
    db: AsyncSession = Depends(get_db),
    actor: UserSession = Depends(require_admin),
):
    await KeyTakeawayService.delete(db, id)
