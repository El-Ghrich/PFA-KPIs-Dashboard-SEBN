from fastapi import APIRouter
from app.api.v1.endpoints import projects, kpis

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(kpis.router, prefix="/kpis", tags=["KPIs"])