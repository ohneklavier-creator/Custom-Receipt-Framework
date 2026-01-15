"""Add received_by_name field and make customer_name optional

Revision ID: e1a2b3c4d5e6
Revises: d9c93a49f8f0
Create Date: 2026-01-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1a2b3c4d5e6'
down_revision: Union[str, None] = 'd9c93a49f8f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make customer_name nullable for institution-only receipts
    op.alter_column('receipts', 'customer_name',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)

    # Add received_by_name field for signature section
    op.add_column('receipts', sa.Column('received_by_name', sa.String(255), nullable=True))


def downgrade() -> None:
    # Remove received_by_name
    op.drop_column('receipts', 'received_by_name')

    # Make customer_name required again (fill empty with 'N/A' first)
    op.execute("UPDATE receipts SET customer_name = 'N/A' WHERE customer_name IS NULL")
    op.alter_column('receipts', 'customer_name',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
