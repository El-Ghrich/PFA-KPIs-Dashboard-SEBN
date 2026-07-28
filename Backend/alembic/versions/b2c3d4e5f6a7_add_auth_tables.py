"""Add refresh_tokens, api_keys tables and api_key_id to kpi_records

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-27 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('refresh_tokens',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    op.create_table('api_keys',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('key_prefix', sa.String(length=8), nullable=False),
        sa.Column('key_hash', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_keys_key_hash'), 'api_keys', ['key_hash'], unique=True)
    op.add_column('kpi_records',
        sa.Column('api_key_id', sa.String(length=36), nullable=True)
    )
    op.create_foreign_key('fk_kpi_records_api_key_id', 'kpi_records', 'api_keys', ['api_key_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_kpi_records_api_key_id', 'kpi_records', type_='foreignkey')
    op.drop_column('kpi_records', 'api_key_id')
    op.drop_index(op.f('ix_api_keys_key_hash'), table_name='api_keys')
    op.drop_table('api_keys')
    op.drop_table('refresh_tokens')
