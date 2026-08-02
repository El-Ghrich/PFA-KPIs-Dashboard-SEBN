"""Create highlights table, backfill data, drop kpi_records.text_value

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-08-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HIGHLIGHT_DEFINITION_ID = '00000000-0000-4000-8000-000000000001'


def upgrade() -> None:
    # 1. Create the highlightstatus enum type
    op.execute("CREATE TYPE highlightstatus AS ENUM ('GOOD', 'BAD')")

    # 2. Create the highlights table (reuses the existing recordperiod enum type)
    op.execute("""
        CREATE TABLE highlights (
            id          VARCHAR(36) NOT NULL,
            project_id  VARCHAR(36) NOT NULL,
            record_date DATE NOT NULL,
            period      recordperiod NOT NULL,
            value       TEXT NOT NULL,
            status      highlightstatus NOT NULL DEFAULT 'GOOD',
            created_by  VARCHAR(36),
            api_key_id  VARCHAR(36),
            created_at  TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (created_by) REFERENCES users (id),
            FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
        )
    """)

    # 3. Backfill existing highlight records into the new table
    op.execute("""
        INSERT INTO highlights
            (id, project_id, record_date, period, value, status, created_by, api_key_id, created_at)
        SELECT
            r.id, r.project_id, r.record_date, r.period, r.text_value, 'GOOD',
            r.created_by, r.api_key_id, r.created_at
        FROM kpi_records r
        JOIN kpi_definitions d ON d.id = r.kpi_id
        WHERE d.name = 'Highlight' AND r.text_value IS NOT NULL
    """)

    # 4. Remove the now-migrated highlight records and their definition
    op.execute(
        "DELETE FROM kpi_records "
        "WHERE kpi_id IN (SELECT id FROM kpi_definitions WHERE name = 'Highlight')"
    )
    op.execute("DELETE FROM kpi_definitions WHERE name = 'Highlight'")

    # 5. Drop text_value; highlights are no longer stored in kpi_records
    op.drop_column('kpi_records', 'text_value')

    # 6. Drop the temporary server default to keep the schema aligned with the model
    op.execute("ALTER TABLE highlights ALTER COLUMN status DROP DEFAULT")


def downgrade() -> None:
    # 1. Restore text_value on kpi_records
    op.add_column('kpi_records', sa.Column('text_value', sa.Text(), nullable=True))

    # 2. Recreate the 'Highlight' KPI definition
    op.execute(
        "INSERT INTO kpi_definitions (id, name, unit, kpi_type) "
        f"VALUES ('{HIGHLIGHT_DEFINITION_ID}', 'Highlight', '', 'TEXT')"
    )

    # 3. Move highlights back into kpi_records (status is lost)
    op.execute(f"""
        INSERT INTO kpi_records
            (id, project_id, kpi_id, record_date, period, numeric_value, text_value,
             asset_url, is_missing, created_by, api_key_id, created_at)
        SELECT
            h.id, h.project_id, '{HIGHLIGHT_DEFINITION_ID}', h.record_date, h.period, NULL, h.value,
            NULL, FALSE, h.created_by, h.api_key_id, h.created_at
        FROM highlights h
    """)

    # 4. Drop the highlights table and enum type
    op.execute("DROP TABLE highlights")
    op.execute("DROP TYPE highlightstatus")
