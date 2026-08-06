"""remove viewer role from userrole enum

Revision ID: g7h8i9j0k1l2
Revises: 56b8193d68c3
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'g7h8i9j0k1l2'
down_revision = 'a1f2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL does not allow removing enum values directly.
    # Strategy: rename old enum → temp, create new enum without VIEWER,
    # update the column, then drop the temp enum.

    # 1. Rename the existing enum type to a temporary name
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")

    # 2. Create the new enum without VIEWER
    op.execute("CREATE TYPE userrole AS ENUM ('SUPER_ADMIN', 'ADMIN')")

    # 3. Migrate the column to use the new enum
    #    (any existing VIEWER rows should have been removed from seed/DB)
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole
        USING role::text::userrole
    """)

    # 4. Drop the old enum
    op.execute("DROP TYPE userrole_old")


def downgrade() -> None:
    # Add VIEWER back if needed to revert
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    op.execute("CREATE TYPE userrole AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VIEWER')")
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole
        USING role::text::userrole
    """)
    op.execute("DROP TYPE userrole_old")
