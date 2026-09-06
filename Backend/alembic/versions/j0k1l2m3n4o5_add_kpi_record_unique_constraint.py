"""add_kpi_record_unique_constraint_and_updated_at

Revision ID: j0k1l2m3n4o5
Revises: 94a95c89277d
Create Date: 2026-09-06 14:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, Sequence[str], None] = '94a95c89277d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add updated_at column
    op.add_column(
        'kpi_records',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )

    # 2. Drop is_missing column if it exists
    with op.batch_alter_table('kpi_records') as batch_op:
        try:
            batch_op.drop_column('is_missing')
        except Exception:
            pass

    # 3. Create unique constraint
    op.create_unique_constraint(
        'uq_kpi_record_entry',
        'kpi_records',
        ['project_id', 'set_id', 'kpi_id', 'record_date', 'period']
    )


def downgrade() -> None:
    op.drop_constraint('uq_kpi_record_entry', 'kpi_records', type_='unique')
    op.add_column(
        'kpi_records',
        sa.Column('is_missing', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )
    op.drop_column('kpi_records', 'updated_at')
