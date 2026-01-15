"""Add receipt_title to settings

Revision ID: g3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2025-01-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g3b4c5d6e7f8'
down_revision: Union[str, None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add receipt_title column for custom receipt title
    op.add_column('settings', sa.Column('receipt_title', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('settings', 'receipt_title')
