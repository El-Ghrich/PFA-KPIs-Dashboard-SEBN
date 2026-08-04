"""Add status enum to api_keys (3-state: ACTIVE, REVOKED, DELETED)

Revision ID: a1f2b3c4d5e6
Revises: f5a4b3c2d1e0
Create Date: 2026-08-04 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1f2b3c4d5e6'
down_revision: Union[str, None] = 'f5a4b3c2d1e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    apikeystatus = sa.Enum('ACTIVE', 'REVOKED', 'DELETED', name='apikeystatus')
    apikeystatus.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'api_keys',
        sa.Column(
            'status',
            sa.Enum('ACTIVE', 'REVOKED', 'DELETED', name='apikeystatus'),
            server_default='ACTIVE',
            nullable=False,
        ),
    )
    op.execute("UPDATE api_keys SET status = 'REVOKED' WHERE is_active = false")
    op.drop_column('api_keys', 'is_active')


def downgrade() -> None:
    op.add_column(
        'api_keys',
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
    )
    op.execute("UPDATE api_keys SET is_active = false WHERE status <> 'ACTIVE'")
    op.drop_column('api_keys', 'status')
    sa.Enum(name='apikeystatus').drop(op.get_bind(), checkfirst=True)
