from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,          # Set to True if you want to see the raw SQL queries in the console
    pool_size=5,         # Keep 5 connections open and ready at all times
    max_overflow=10      # Allow up to 10 extra connections during traffic spikes
)

# 2. The Session Factory: Creates temporary workspaces for your transactions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Prevents SQLAlchemy from wiping data after saving, which breaks async flows
    autoflush=False
)

# 3. The Dependency Injection function
async def get_db():
    """
    FastAPI will use this to give each request its own database session.
    It ensures the session is safely closed after the request is done, 
    even if an error occurs.
    """
    async with AsyncSessionLocal() as session:
        yield session