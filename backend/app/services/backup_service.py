"""Backup and restore service for receipts data."""
import json
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.receipt import Receipt, ReceiptItem


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


async def export_all_receipts(session: AsyncSession) -> Dict[str, Any]:
    """
    Export all receipts and their items to a JSON-serializable dict.
    Returns a backup object with metadata and data.
    """
    # Query all receipts with items
    stmt = select(Receipt).options(selectinload(Receipt.items)).order_by(Receipt.id)
    result = await session.execute(stmt)
    receipts = list(result.scalars().all())

    # Convert to serializable format
    receipts_data = []
    for receipt in receipts:
        receipt_dict = {
            "receipt_number": receipt.receipt_number,
            "customer_name": receipt.customer_name,
            "customer_nit": receipt.customer_nit,
            "customer_phone": receipt.customer_phone,
            "customer_email": receipt.customer_email,
            "date": receipt.date.isoformat() if receipt.date else None,
            "status": receipt.status.value if receipt.status else "completed",
            "notes": receipt.notes,
            "signature": receipt.signature,
            "subtotal": str(receipt.subtotal) if receipt.subtotal else "0",
            "total": str(receipt.total) if receipt.total else "0",
            "custom_fields": receipt.custom_fields,
            "created_at": receipt.created_at.isoformat() if receipt.created_at else None,
            "items": [
                {
                    "description": item.description,
                    "quantity": str(item.quantity),
                    "unit_price": str(item.unit_price),
                    "total": str(item.total) if item.total else "0",
                    "line_order": item.line_order,
                }
                for item in sorted(receipt.items, key=lambda x: x.line_order)
            ]
        }
        receipts_data.append(receipt_dict)

    # Create backup object
    backup = {
        "version": "1.0",
        "created_at": datetime.utcnow().isoformat(),
        "receipt_count": len(receipts_data),
        "receipts": receipts_data,
    }

    return backup


async def import_receipts(
    session: AsyncSession,
    backup_data: Dict[str, Any],
    skip_existing: bool = True
) -> Dict[str, Any]:
    """
    Import receipts from a backup object.

    Args:
        session: Database session
        backup_data: Backup object with receipts data
        skip_existing: If True, skip receipts that already exist (by receipt_number)

    Returns:
        Dict with import statistics
    """
    from app.models.receipt import ReceiptStatus

    receipts_data = backup_data.get("receipts", [])

    imported = 0
    skipped = 0
    errors = []

    for receipt_data in receipts_data:
        try:
            receipt_number = receipt_data.get("receipt_number")

            # Check if receipt already exists
            existing = await session.execute(
                select(Receipt).where(Receipt.receipt_number == receipt_number)
            )
            if existing.scalar_one_or_none():
                if skip_existing:
                    skipped += 1
                    continue
                else:
                    # Delete existing to replace
                    await session.execute(
                        select(Receipt).where(Receipt.receipt_number == receipt_number)
                    )

            # Parse date
            date_str = receipt_data.get("date")
            receipt_date = datetime.fromisoformat(date_str).date() if date_str else datetime.utcnow().date()

            # Parse status
            status_str = receipt_data.get("status", "completed").upper()
            try:
                status = ReceiptStatus[status_str]
            except KeyError:
                status = ReceiptStatus.COMPLETED

            # Create receipt
            receipt = Receipt(
                receipt_number=receipt_number,
                customer_name=receipt_data.get("customer_name", "Unknown"),
                customer_nit=receipt_data.get("customer_nit"),
                customer_phone=receipt_data.get("customer_phone"),
                customer_email=receipt_data.get("customer_email"),
                date=receipt_date,
                status=status,
                notes=receipt_data.get("notes"),
                signature=receipt_data.get("signature"),
                subtotal=Decimal(receipt_data.get("subtotal", "0")),
                total=Decimal(receipt_data.get("total", "0")),
                custom_fields=receipt_data.get("custom_fields"),
            )

            session.add(receipt)
            await session.flush()  # Get receipt ID

            # Create items
            for item_data in receipt_data.get("items", []):
                item = ReceiptItem(
                    receipt_id=receipt.id,
                    description=item_data.get("description", ""),
                    quantity=Decimal(item_data.get("quantity", "1")),
                    unit_price=Decimal(item_data.get("unit_price", "0")),
                    total=Decimal(item_data.get("total", "0")),
                    line_order=item_data.get("line_order", 0),
                )
                session.add(item)

            imported += 1

        except Exception as e:
            errors.append({
                "receipt_number": receipt_data.get("receipt_number", "unknown"),
                "error": str(e)
            })

    await session.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "total_processed": len(receipts_data),
    }
