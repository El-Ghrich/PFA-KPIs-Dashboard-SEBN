"""add is_deleted column to projects and project_sets

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'i9j0k1l2m3n4'
down_revision = 'h8i9j0k1l2m3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('project_sets', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('project_sets', 'is_deleted')
    op.drop_column('projects', 'is_deleted')
