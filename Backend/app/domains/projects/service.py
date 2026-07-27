import uuid
from typing import Sequence, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.domains.projects.models import Project
from app.domains.projects.schemas import ProjectCreate, ProjectUpdate

class ProjectService:
    
    @staticmethod
    async def create_project(session: AsyncSession, data: ProjectCreate) -> Project:
        """Creates a new project, ensuring the project name is unique."""
        # 1. Check for existing project with the same name
        query = select(Project).where(Project.name == data.name)
        result = await session.execute(query)
        
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A project named '{data.name}' already exists."
            )
            
        # 2. Instantiate and save
        new_project = Project(**data.model_dump())
        session.add(new_project)
        await session.commit()
        await session.refresh(new_project)
        
        return new_project

    @staticmethod
    async def get_projects(
        session: AsyncSession, 
        page: int = 1, 
        page_size: int = 10
    ) -> Tuple[Sequence[Project], int]:
        """Retrieves a paginated list of projects and the total count."""
        
        # 1. Get the total count of projects for the frontend pagination component
        count_query = select(func.count()).select_from(Project)
        total = await session.scalar(count_query) or 0
        
        # 2. Fetch the actual records for the current page
        offset = (page - 1) * page_size
        query = select(Project).offset(offset).limit(page_size)
        result = await session.execute(query)
        projects = result.scalars().all()
        
        return projects, total

    @staticmethod
    async def get_project(
        session: AsyncSession, 
        project_id: uuid.UUID, 
        include_kpis: bool = False
    ) -> Project:
        """Fetches a single project, optionally joining its KPI records."""
        query = select(Project).where(Project.id == str(project_id))
        
        # Conditionally load the KPI records if the router needs them
        if include_kpis:
            query = query.options(joinedload(Project.kpi_records))
            
        result = await session.execute(query)
        project = result.scalars().first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found."
            )
            
        return project

    @staticmethod
    async def update_project(
        session: AsyncSession, 
        project_id: uuid.UUID, 
        data: ProjectUpdate
    ) -> Project:
        """Dynamically updates provided fields on an existing project."""
        
        # 1. Fetch the existing project
        project = await ProjectService.get_project(session, project_id)
        
        # 2. Check name collision if they are trying to rename it
        if data.name and data.name != project.name:
            query = select(Project).where(Project.name == data.name)
            result = await session.execute(query)
            if result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A project named '{data.name}' already exists."
                )
        
        # 3. Apply changes dynamically using exclude_unset
        # exclude_unset=True ensures we only update fields the user actually sent in the JSON payload
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
            
        session.add(project)
        await session.commit()
        await session.refresh(project)
        
        return project