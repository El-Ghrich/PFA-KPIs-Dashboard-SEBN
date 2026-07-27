from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

def get_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"], # Update with your frontend URL
        allow_credentials=True,
        allow_methods=["*"], # Allows all HTTP methods (GET, POST, PUT, DELETE)
        allow_headers=["*"], # Allows all headers (including Authorization for JWT)
    )

    return app

app = get_application()

@app.get("/health", tags=["Health"])
def health_check():
    """Basic health check to ensure the API is running."""
    return {"status": "ok", "project": settings.PROJECT_NAME}