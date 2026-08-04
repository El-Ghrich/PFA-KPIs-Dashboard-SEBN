import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.domains.projects.schemas import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectListResponse, 
    ProjectWithKPIsResponse
)
from app.domains.projects.service import ProjectService
from app.api.dependencies import require_user, require_write_access, UserSession


router = APIRouter()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new production project.
    """
    return await ProjectService.create_project(session=db, data=project_in)


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    _: UserSession = Depends(require_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    location: str | None = Query(None, description="Filter by location"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a paginated list of projects, optionally filtered by location.
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
    include_kpis: bool = Query(False, description="Include associated daily KPI records"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific project by its UUID.
    Optionally include all its KPI records by setting ?include_kpis=true
    """
    return await ProjectService.get_project(
        session=db, project_id=project_id, include_kpis=include_kpis
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update specific fields of an existing project.
    """
    return await ProjectService.update_project(
        session=db, project_id=project_id, data=project_in
    )