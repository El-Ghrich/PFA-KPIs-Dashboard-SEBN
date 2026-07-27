"""Add period column to kpi_records

Revision ID: 9c8a2b1d3e5f
Revises: 5ba55f3e2624
Create Date: 2026-07-27 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9c8a2b1d3e5f'
down_revision: Union[str, None] = '5ba55f3e2624'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    recordperiod_enum = sa.Enum('DAILY', 'WEEKLY', name='recordperiod')
    recordperiod_enum.create(op.get_bind())

    op.add_column(
        'kpi_records',
        sa.Column(
            'period',
            recordperiod_enum,
            nullable=False,
            server_default='DAILY'
        )
    )
    op.alter_column('kpi_records', 'period', server_default=None)


def downgrade() -> None:
    op.drop_column('kpi_records', 'period')
    sa.Enum(name='recordperiod').drop(op.get_bind())
