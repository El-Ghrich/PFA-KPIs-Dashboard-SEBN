"""Merge migrations

Revision ID: 56b8193d68c3
Revises: 9c8a2b1d3e5f, d30c8ca8aa2b
Create Date: 2026-07-27 20:40:32.650851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '56b8193d68c3'
down_revision: Union[str, Sequence[str], None] = ('9c8a2b1d3e5f', 'd30c8ca8aa2b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
