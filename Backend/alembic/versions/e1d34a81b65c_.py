"""empty message

Revision ID: e1d34a81b65c
Revises: b2c3d4e5f6a7, e689e35d3a88
Create Date: 2026-07-28 15:44:38.723883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1d34a81b65c'
down_revision: Union[str, Sequence[str], None] = ('b2c3d4e5f6a7', 'e689e35d3a88')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
