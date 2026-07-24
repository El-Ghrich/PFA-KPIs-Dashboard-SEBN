from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(title="HCM-S", version="1.0.0")

# Mount the v1 router at the /api/v1 path
app.include_router(api_router, prefix="/api/v1")