"""Make all datetime columns timezone-aware (TIMESTAMPTZ)

Revision ID: c3d4e5f6a7b8
Revises: ab2a600be900
Create Date: 2026-07-28 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'ab2a600be900'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE refresh_tokens ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE refresh_tokens ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE api_keys ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE api_keys ALTER COLUMN last_used_at TYPE TIMESTAMPTZ USING last_used_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE api_keys ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE projects ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE kpi_records ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'")


def downgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE refresh_tokens ALTER COLUMN expires_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE refresh_tokens ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE api_keys ALTER COLUMN expires_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE api_keys ALTER COLUMN last_used_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE api_keys ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE projects ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE")
    op.execute("ALTER TABLE kpi_records ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE")
