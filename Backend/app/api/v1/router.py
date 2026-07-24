from fastapi import APIRouter
from app.api.v1.endpoints import kpis

api_router = APIRouter()

# Include the feature router and give it a prefix and tag for the Swagger docs
api_router.include_router(kpis.router, prefix="/kpis", tags=["KPIs"])