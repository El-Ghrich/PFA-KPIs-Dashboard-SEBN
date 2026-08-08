"""
Root conftest.py — shared async fixtures for all tests.

Strategy:
  - SQLite in-memory DB (aiosqlite) — no live Postgres required.
  - One engine per test SESSION; schema created once.
  - Each TEST gets a fresh transaction that is rolled back → clean isolation.
  - FastAPI dependency `get_db` is overridden to yield the test session.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.base import Base
from app.core.security import (
    create_access_token,
    hash_password,
    generate_api_key,
)
from app.db.session import get_db
from app.main import app

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE ENGINE  (one per test session)
# ─────────────────────────────────────────────────────────────────────────────

TEST_DB_URL = "sqlite+aiosqlite:///:memory:?check_same_thread=False"


@pytest_asyncio.fixture(scope="session")
async def async_engine():
    """Create the in-memory SQLite engine and all tables once per test run."""
    engine = create_async_engine(TEST_DB_URL, echo=False)

    # Import all models so metadata is fully populated
    import app.domains.users.models          # noqa: F401
    import app.domains.projects.models       # noqa: F401
    import app.domains.kpis.models           # noqa: F401
    import app.domains.api_keys.models       # noqa: F401
    import app.domains.highlights.models     # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


# ─────────────────────────────────────────────────────────────────────────────
# PER-TEST SESSION  (rolls back after each test)
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def db_session(async_engine):
    """
    Yield a transactional AsyncSession that is rolled back after every test.
    This keeps tests hermetically isolated without wiping the schema.
    """
    connection = await async_engine.connect()
    await connection.begin()

    session = AsyncSession(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        await session.close()
        await connection.rollback()
        await connection.close()


# ─────────────────────────────────────────────────────────────────────────────
# HTTP CLIENT  (injects the test DB session)
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """AsyncClient that targets the FastAPI app with the test session injected."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ─────────────────────────────────────────────────────────────────────────────
# MODEL FACTORIES
# ─────────────────────────────────────────────────────────────────────────────

async def _create_user(
    session: AsyncSession,
    email: str = "test@example.com",
    password: str = "TestPass123",
    full_name: str = "Test User",
    role: str = "ADMIN",
):
    """Helper: persist a User directly and return it."""
    from app.domains.users.models import User, UserRole

    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=UserRole(role),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session):
    return await _create_user(
        db_session,
        email="admin@test.com",
        role="ADMIN",
    )


@pytest_asyncio.fixture
async def super_admin_user(db_session):
    return await _create_user(
        db_session,
        email="superadmin@test.com",
        role="SUPER_ADMIN",
    )


# ─────────────────────────────────────────────────────────────────────────────
# TOKEN HELPERS
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def admin_token(admin_user):
    return create_access_token(admin_user.id, "ADMIN")


@pytest.fixture
def super_admin_token(super_admin_user):
    return create_access_token(super_admin_user.id, "SUPER_ADMIN")


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def super_auth_headers(super_admin_token):
    return {"Authorization": f"Bearer {super_admin_token}"}


# ─────────────────────────────────────────────────────────────────────────────
# PROJECT FACTORY
# ─────────────────────────────────────────────────────────────────────────────

async def _create_project(
    session: AsyncSession,
    name: str = "Test Project",
    status: str = "ACTIVE",
    location: str = "Morocco",
    n_sets: int = 1,
):
    """Helper: persist a Project + N sets directly."""
    from app.domains.projects.models import Project, ProjectSet, ProjectStatus

    project = Project(name=name, status=ProjectStatus(status), location=location)
    session.add(project)
    await session.flush()

    for i in range(1, n_sets + 1):
        session.add(ProjectSet(project_id=project.id, name=f"Set {i}"))

    await session.commit()
    await session.refresh(project)
    return project


@pytest_asyncio.fixture
async def sample_project(db_session):
    return await _create_project(db_session, n_sets=2)


# ─────────────────────────────────────────────────────────────────────────────
# KPI DEFINITION FACTORY
# ─────────────────────────────────────────────────────────────────────────────

async def _create_kpi_def(
    session: AsyncSession,
    name: str = "Defect Rate",
    unit: str = "%",
    kpi_type: str = "NUMERIC",
):
    from app.domains.kpis.models import KPIDefinition, KpiType

    kpi_def = KPIDefinition(name=name, unit=unit, kpi_type=KpiType(kpi_type))
    session.add(kpi_def)
    await session.commit()
    await session.refresh(kpi_def)
    return kpi_def


@pytest_asyncio.fixture
async def sample_kpi_def(db_session):
    return await _create_kpi_def(db_session)


# ─────────────────────────────────────────────────────────────────────────────
# API KEY FACTORY
# ─────────────────────────────────────────────────────────────────────────────

async def _create_api_key(
    session: AsyncSession,
    user_id: str,
    name: str = "Test Key",
    days_valid: int = 30,
):
    from datetime import datetime, timedelta, timezone
    from app.domains.api_keys.models import ApiKey

    plain_key, key_hash = generate_api_key()
    expires_at = datetime.now(timezone.utc) + timedelta(days=days_valid)

    api_key = ApiKey(
        name=name,
        key_prefix=plain_key[:8],
        key_hash=key_hash,
        user_id=user_id,
        expires_at=expires_at,
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    return api_key, plain_key
