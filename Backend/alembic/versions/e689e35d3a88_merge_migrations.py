"""Merge migrations

Revision ID: e689e35d3a88
Revises: 56b8193d68c3, a1b2c3d4e5f6
Create Date: 2026-07-27 21:39:57.232726

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e689e35d3a88'
down_revision: Union[str, Sequence[str], None] = ('56b8193d68c3', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
