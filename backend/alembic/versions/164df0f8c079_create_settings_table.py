"""create_settings_table

Revision ID: 164df0f8c079
Revises: 91faacf34b67
Create Date: 2026-01-14 06:29:08.301180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '164df0f8c079'
down_revision: Union[str, None] = '91faacf34b67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('company_info', sa.String(500), nullable=True),
        sa.Column('field_visibility', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    # Insert default settings with all fields enabled
    op.execute("""
        INSERT INTO settings (id, company_name, company_info, field_visibility)
        VALUES (1, 'EMPRESA', 'Dirección de la empresa | Tel: 0000-0000', '{
            "customer_address": true,
            "customer_phone": true,
            "customer_email": true,
            "institution": true,
            "amount_in_words": true,
            "concept": true,
            "payment_method": true,
            "notes": true,
            "signature": true,
            "line_items_in_print": true
        }'::jsonb)
    """)


def downgrade() -> None:
    op.drop_table('settings')
