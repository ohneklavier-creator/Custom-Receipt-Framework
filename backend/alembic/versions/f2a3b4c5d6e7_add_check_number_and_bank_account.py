"""Add check_number and bank_account fields

Revision ID: f2a3b4c5d6e7
Revises: e1a2b3c4d5e6
Create Date: 2025-01-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, None] = 'e1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add check_number column for Cheque payments
    op.add_column('receipts', sa.Column('check_number', sa.String(50), nullable=True))
    # Add bank_account column for Transferencia payments
    op.add_column('receipts', sa.Column('bank_account', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('receipts', 'bank_account')
    op.drop_column('receipts', 'check_number')
