from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from sqlalchemy import String, Text, Numeric, Date, ForeignKey, Integer, Index, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class ReceiptStatus(str, Enum):
    """Receipt status enum"""
    DRAFT = "draft"
    COMPLETED = "completed"
    PAID = "paid"
    CANCELLED = "cancelled"


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class Receipt(Base, TimestampMixin):
    """Receipt model - main receipt table"""
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    receipt_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    # Customer information
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    customer_nit: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(50))
    customer_email: Mapped[Optional[str]] = mapped_column(String(255))

    # Receipt details
    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        server_default=func.current_date(),
        index=True
    )
    status: Mapped[ReceiptStatus] = mapped_column(
        SQLEnum(ReceiptStatus, name='receipt_status', create_constraint=True),
        nullable=False,
        server_default=ReceiptStatus.COMPLETED.value,
        index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    signature: Mapped[Optional[str]] = mapped_column(Text)  # Base64 encoded

    # Calculated totals
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0.00"
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0.00"
    )

    # Flexible JSON storage
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSONB)

    # Relationships
    items: Mapped[List["ReceiptItem"]] = relationship(
        "ReceiptItem",
        back_populates="receipt",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ReceiptItem.line_order"
    )

    __table_args__ = (
        Index('ix_receipts_created_at', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<Receipt {self.receipt_number} - {self.customer_name}>"


class ReceiptItem(Base, TimestampMixin):
    """ReceiptItem model - line items for receipts"""
    __tablename__ = "receipt_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    receipt_id: Mapped[int] = mapped_column(
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Line item details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default="1.00"
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0.00"
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0.00"
    )

    # Order tracking
    line_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0"
    )

    # Relationships
    receipt: Mapped["Receipt"] = relationship("Receipt", back_populates="items")

    __table_args__ = (
        Index('ix_receipt_items_receipt_line', 'receipt_id', 'line_order'),
    )

    def __repr__(self) -> str:
        return f"<ReceiptItem {self.id} - {self.description[:30]}>"
