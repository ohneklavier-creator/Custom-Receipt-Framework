"""add_receipt_status

Revision ID: b6e774a85ca0
Revises: d520449d3cae
Create Date: 2026-01-13 08:06:28.824089

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6e774a85ca0'
down_revision: Union[str, None] = 'd520449d3cae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type first
    receipt_status = sa.Enum('DRAFT', 'COMPLETED', 'PAID', 'CANCELLED', name='receipt_status')
    receipt_status.create(op.get_bind(), checkfirst=True)

    # Add the column
    op.add_column('receipts', sa.Column('status', receipt_status, server_default='COMPLETED', nullable=False))
    op.create_index(op.f('ix_receipts_status'), 'receipts', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_receipts_status'), table_name='receipts')
    op.drop_column('receipts', 'status')

    # Drop the enum type
    receipt_status = sa.Enum('DRAFT', 'COMPLETED', 'PAID', 'CANCELLED', name='receipt_status')
    receipt_status.drop(op.get_bind(), checkfirst=True)
