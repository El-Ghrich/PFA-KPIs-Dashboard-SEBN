from fastapi import APIRouter
from app.api.v1.endpoints import projects, kpis, auth, api_keys

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(kpis.router, prefix="/kpis", tags=["KPIs"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])