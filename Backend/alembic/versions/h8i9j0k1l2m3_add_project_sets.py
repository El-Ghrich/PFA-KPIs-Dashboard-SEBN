"""add project_sets table and set_id columns

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create project_sets table
    op.create_table(
        'project_sets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add set_id to kpi_records
    op.add_column('kpi_records', sa.Column('set_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_kpi_records_set_id', 'kpi_records', 'project_sets', ['set_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('fk_kpi_records_set_id', 'kpi_records', type_='foreignkey')
    op.drop_column('kpi_records', 'set_id')

    op.drop_table('project_sets')
