"""add_receipt_print_fields

Revision ID: d9c93a49f8f0
Revises: 164df0f8c079
Create Date: 2026-01-14 06:29:30.817990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9c93a49f8f0'
down_revision: Union[str, None] = '164df0f8c079'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('receipts', sa.Column('customer_address', sa.String(500), nullable=True))
    op.add_column('receipts', sa.Column('institution', sa.String(255), nullable=True))
    op.add_column('receipts', sa.Column('concept', sa.String(500), nullable=True))
    op.add_column('receipts', sa.Column('payment_method', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('receipts', 'payment_method')
    op.drop_column('receipts', 'concept')
    op.drop_column('receipts', 'institution')
    op.drop_column('receipts', 'customer_address')
