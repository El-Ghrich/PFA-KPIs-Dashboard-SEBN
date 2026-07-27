"""Add location column to projects

Revision ID: a1b2c3d4e5f6
Revises: 9c8a2b1d3e5f
Create Date: 2026-07-27 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9c8a2b1d3e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'projects',
        sa.Column('location', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('projects', 'location')
