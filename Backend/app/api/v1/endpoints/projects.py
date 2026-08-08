import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.projects.schemas import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectListResponse, 
    ProjectWithKPIsResponse,
    ProjectSetCreate,
    ProjectSetUpdate,
    ProjectSetResponse,
)
from app.domains.projects.service import ProjectService
from app.api.dependencies import require_admin, UserSession


router = APIRouter()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Create a new production project with initial sets. Requires Admin.
    """
    return await ProjectService.create_project(session=db, data=project_in)


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    location: str | None = Query(None, description="Filter by location"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a list of active projects, optionally filtered by location.
    Public endpoint — no authentication required.
    """
    projects, total = await ProjectService.get_projects(
        session=db, page=page, page_size=page_size, location=location
    )

    return ProjectListResponse(
        items=projects,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{project_id}", response_model=ProjectWithKPIsResponse)
async def get_project(
    project_id: uuid.UUID,
    include_kpis: bool = Query(False, description="Include associated KPI records"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific project by its UUID.
    Public endpoint — no authentication required.
    """
    return await ProjectService.get_project(
        session=db, project_id=project_id, include_kpis=include_kpis
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Update specific fields of an existing project. Requires Admin.
    """
    return await ProjectService.update_project(
        session=db, project_id=project_id, data=project_in
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Soft delete a project and its sets. Requires Admin.
    """
    await ProjectService.soft_delete_project(session=db, project_id=project_id)


# ==========================================
# SET MANAGEMENT ENDPOINTS
# ==========================================

@router.post("/{project_id}/sets", response_model=ProjectSetResponse, status_code=status.HTTP_201_CREATED)
async def add_project_set(
    project_id: uuid.UUID,
    set_in: ProjectSetCreate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Add a new set to a project. Requires Admin.
    """
    return await ProjectService.add_set(session=db, project_id=project_id, data=set_in)


@router.patch("/{project_id}/sets/{set_id}", response_model=ProjectSetResponse)
async def update_project_set(
    project_id: uuid.UUID,
    set_id: str,
    set_in: ProjectSetUpdate,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Update/rename a project set. Requires Admin.
    """
    return await ProjectService.update_set(session=db, project_id=project_id, set_id=set_id, data=set_in)


@router.delete("/{project_id}/sets/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_set(
    project_id: uuid.UUID,
    set_id: str,
    db: AsyncSession = Depends(get_db),
    _: UserSession = Depends(require_admin)
):
    """
    Soft delete a project set. Requires Admin.
    """
    await ProjectService.soft_delete_set(session=db, project_id=project_id, set_id=set_id)