import uuid
from typing import Sequence, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import joinedload, selectinload
from fastapi import HTTPException, status

from app.domains.projects.models import Project, ProjectSet
from app.domains.projects.schemas import ProjectCreate, ProjectUpdate, ProjectSetCreate, ProjectSetUpdate


class ProjectService:
    
    @staticmethod
    async def create_project(session: AsyncSession, data: ProjectCreate) -> Project:
        """Creates a new project and auto-generates initial sets."""
        query = select(Project).where(Project.name == data.name, Project.is_deleted == False)
        result = await session.execute(query)
        
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A project named '{data.name}' already exists."
            )
            
        dump = data.model_dump()
        initial_sets_count = dump.pop("initial_sets_count", 1)

        new_project = Project(**dump)
        session.add(new_project)
        await session.flush()

        # Create initial sets
        for i in range(1, initial_sets_count + 1):
            session.add(ProjectSet(project_id=new_project.id, name=f"Set {i}"))

        await session.commit()
        
        # Reload with sets
        return await ProjectService.get_project(session, uuid.UUID(new_project.id))

    @staticmethod
    async def get_projects(
        session: AsyncSession, 
        page: int = 1, 
        page_size: int = 10,
        location: str | None = None
    ) -> Tuple[Sequence[Project], int]:
        """Retrieves a paginated list of active projects, optionally filtered by location."""
        
        base_query = (
            select(Project)
            .where(Project.is_deleted == False)
            .options(
                selectinload(Project.sets.and_(ProjectSet.is_deleted == False))
            )
            .order_by(Project.created_at.desc())
        )
        count_query = select(func.count()).select_from(Project).where(Project.is_deleted == False)

        if location and location != 'All':
            base_query = base_query.where(Project.location == location)
            count_query = count_query.where(Project.location == location)

        total = await session.scalar(count_query) or 0
        
        offset = (page - 1) * page_size
        query = base_query.offset(offset).limit(page_size)
        result = await session.execute(query)
        projects = result.scalars().all()
        
        return projects, total

    @staticmethod
    async def get_project(
        session: AsyncSession, 
        project_id: uuid.UUID, 
        include_kpis: bool = False
    ) -> Project:
        """Fetches a single active project, optionally joining its KPI records."""
        query = (
            select(Project)
            .where(Project.id == str(project_id), Project.is_deleted == False)
            .options(selectinload(Project.sets.and_(ProjectSet.is_deleted == False)))
        )
        
        if include_kpis:
            # Use joinedload for full eager loading when caller explicitly wants KPIs
            query = query.options(joinedload(Project.kpi_records))
        else:
            # Always eager-load so the response model can serialise kpi_records as []
            query = query.options(selectinload(Project.kpi_records))
            
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
        project = await ProjectService.get_project(session, project_id)
        
        if data.name and data.name != project.name:
            query = select(Project).where(
                Project.name == data.name,
                Project.id != str(project_id),
                Project.is_deleted == False
            )
            result = await session.execute(query)
            if result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A project named '{data.name}' already exists."
                )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
            
        session.add(project)
        await session.commit()
        return await ProjectService.get_project(session, project_id)

    @staticmethod
    async def soft_delete_project(session: AsyncSession, project_id: uuid.UUID) -> None:
        """Soft deletes a project and all its sets."""
        project = await ProjectService.get_project(session, project_id)
        project.is_deleted = True

        # Soft delete sets as well
        await session.execute(
            update(ProjectSet)
            .where(ProjectSet.project_id == str(project_id))
            .values(is_deleted=True)
        )

        await session.commit()

    # ==========================================
    # SET OPERATIONS
    # ==========================================

    @staticmethod
    async def add_set(session: AsyncSession, project_id: uuid.UUID, data: ProjectSetCreate) -> ProjectSet:
        project = await ProjectService.get_project(session, project_id)
        
        new_set = ProjectSet(project_id=str(project_id), name=data.name)
        session.add(new_set)
        await session.commit()
        await session.refresh(new_set)
        return new_set

    @staticmethod
    async def update_set(
        session: AsyncSession, 
        project_id: uuid.UUID, 
        set_id: str, 
        data: ProjectSetUpdate
    ) -> ProjectSet:
        await ProjectService.get_project(session, project_id)
        
        pset = await session.get(ProjectSet, set_id)
        if not pset or pset.project_id != str(project_id) or pset.is_deleted:
            raise HTTPException(status_code=404, detail="Set not found.")

        if data.name:
            pset.name = data.name

        session.add(pset)
        await session.commit()
        await session.refresh(pset)
        return pset

    @staticmethod
    async def soft_delete_set(session: AsyncSession, project_id: uuid.UUID, set_id: str) -> None:
        await ProjectService.get_project(session, project_id)
        
        pset = await session.get(ProjectSet, set_id)
        if not pset or pset.project_id != str(project_id) or pset.is_deleted:
            raise HTTPException(status_code=404, detail="Set not found.")

        pset.is_deleted = True
        session.add(pset)
        await session.commit()