from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, or_, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.receipt import Receipt, ReceiptItem, ReceiptStatus
from app.schemas.receipt import ReceiptCreate, ReceiptUpdate
from app.core.config import settings


async def generate_receipt_number(session: AsyncSession) -> str:
    """
    Generate next receipt number in format RECIBO-00000001
    Thread-safe implementation using database query
    """
    # Query the highest receipt number
    stmt = select(Receipt.receipt_number).order_by(Receipt.id.desc()).limit(1)
    result = await session.execute(stmt)
    last_receipt_number = result.scalar_one_or_none()

    if last_receipt_number is None:
        # First receipt
        next_number = 1
    else:
        # Extract number from "RECIBO-00000001" -> 1
        number_part = last_receipt_number.split('-')[-1]
        next_number = int(number_part) + 1

    # Format with leading zeros
    receipt_number = f"{settings.receipt_prefix}-{next_number:0{settings.receipt_number_digits}d}"

    return receipt_number


def calculate_item_total(quantity: Decimal, unit_price: Decimal) -> Decimal:
    """Calculate total for a receipt item"""
    return quantity * unit_price


def calculate_receipt_totals(items: List[ReceiptItem]) -> tuple[Decimal, Decimal]:
    """Calculate subtotal and total for a receipt"""
    subtotal = sum(item.total for item in items)
    total = subtotal  # For now, total equals subtotal (future: add taxes, discounts)
    return subtotal, total


async def create_receipt(session: AsyncSession, receipt_data: ReceiptCreate) -> Receipt:
    """
    Create a new receipt with items
    """
    # Generate receipt number
    receipt_number = await generate_receipt_number(session)

    # Create receipt instance
    receipt = Receipt(
        receipt_number=receipt_number,
        customer_name=receipt_data.customer_name,
        customer_nit=receipt_data.customer_nit,
        customer_phone=receipt_data.customer_phone,
        customer_email=receipt_data.customer_email,
        customer_address=receipt_data.customer_address,
        date=receipt_data.date,
        status=receipt_data.status or ReceiptStatus.COMPLETED,
        notes=receipt_data.notes,
        signature=receipt_data.signature,
        received_by_name=receipt_data.received_by_name,
        institution=receipt_data.institution,
        concept=receipt_data.concept,
        payment_method=receipt_data.payment_method,
        check_number=receipt_data.check_number,
        bank_account=receipt_data.bank_account,
        custom_fields=receipt_data.custom_fields,
    )

    # Add receipt to session
    session.add(receipt)
    await session.flush()  # Get receipt.id

    # Create receipt items
    items = []
    for idx, item_data in enumerate(receipt_data.items):
        item_total = calculate_item_total(item_data.quantity, item_data.unit_price)
        item = ReceiptItem(
            receipt_id=receipt.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total=item_total,
            line_order=idx,
        )
        items.append(item)
        session.add(item)

    # Calculate and set receipt totals
    subtotal, total = calculate_receipt_totals(items)
    receipt.subtotal = subtotal
    receipt.total = total

    # Commit transaction
    await session.commit()
    await session.refresh(receipt)

    return receipt


async def get_receipt(session: AsyncSession, receipt_id: int) -> Optional[Receipt]:
    """
    Get a receipt by ID with items
    """
    stmt = (
        select(Receipt)
        .where(Receipt.id == receipt_id)
        .options(selectinload(Receipt.items))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_receipt_by_number(session: AsyncSession, receipt_number: str) -> Optional[Receipt]:
    """
    Get a receipt by receipt number with items
    """
    stmt = (
        select(Receipt)
        .where(Receipt.receipt_number == receipt_number)
        .options(selectinload(Receipt.items))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_receipts(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[ReceiptStatus] = None
) -> List[Receipt]:
    """
    List receipts with pagination, optional search, date filtering, and status
    Search filters by receipt_number, customer_name, or customer_nit
    """
    stmt = select(Receipt)

    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Receipt.receipt_number.ilike(search_term),
                Receipt.customer_name.ilike(search_term),
                Receipt.customer_nit.ilike(search_term),
            )
        )

    # Apply date filters if provided
    if date_from:
        stmt = stmt.where(Receipt.date >= date_from)
    if date_to:
        stmt = stmt.where(Receipt.date <= date_to)

    # Apply status filter if provided
    if status:
        stmt = stmt.where(Receipt.status == status)

    # Order by created_at DESC
    stmt = stmt.order_by(Receipt.created_at.desc())

    # Apply pagination
    stmt = stmt.offset(skip).limit(limit)

    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_receipt(
    session: AsyncSession,
    receipt_id: int,
    receipt_data: ReceiptUpdate
) -> Optional[Receipt]:
    """
    Update a receipt and optionally its items
    """
    # Get existing receipt
    receipt = await get_receipt(session, receipt_id)
    if not receipt:
        return None

    # Update receipt fields if provided
    if receipt_data.customer_name is not None:
        receipt.customer_name = receipt_data.customer_name
    if receipt_data.customer_nit is not None:
        receipt.customer_nit = receipt_data.customer_nit
    if receipt_data.customer_phone is not None:
        receipt.customer_phone = receipt_data.customer_phone
    if receipt_data.customer_email is not None:
        receipt.customer_email = receipt_data.customer_email
    if receipt_data.customer_address is not None:
        receipt.customer_address = receipt_data.customer_address
    if receipt_data.date is not None:
        receipt.date = receipt_data.date
    if receipt_data.status is not None:
        receipt.status = receipt_data.status
    if receipt_data.notes is not None:
        receipt.notes = receipt_data.notes
    if receipt_data.signature is not None:
        receipt.signature = receipt_data.signature
    if receipt_data.received_by_name is not None:
        receipt.received_by_name = receipt_data.received_by_name
    if receipt_data.institution is not None:
        receipt.institution = receipt_data.institution
    if receipt_data.concept is not None:
        receipt.concept = receipt_data.concept
    if receipt_data.payment_method is not None:
        receipt.payment_method = receipt_data.payment_method
    if receipt_data.check_number is not None:
        receipt.check_number = receipt_data.check_number
    if receipt_data.bank_account is not None:
        receipt.bank_account = receipt_data.bank_account
    if receipt_data.custom_fields is not None:
        receipt.custom_fields = receipt_data.custom_fields

    # Update items if provided
    if receipt_data.items is not None:
        # Delete existing items
        for item in receipt.items:
            await session.delete(item)

        # Create new items
        items = []
        for idx, item_data in enumerate(receipt_data.items):
            item_total = calculate_item_total(item_data.quantity, item_data.unit_price)
            item = ReceiptItem(
                receipt_id=receipt.id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total=item_total,
                line_order=idx,
            )
            items.append(item)
            session.add(item)

        # Recalculate totals
        await session.flush()
        subtotal, total = calculate_receipt_totals(items)
        receipt.subtotal = subtotal
        receipt.total = total

    # Commit transaction
    await session.commit()
    await session.refresh(receipt)

    return receipt


async def delete_receipt(session: AsyncSession, receipt_id: int) -> bool:
    """
    Delete a receipt (cascade will delete items)
    Returns True if deleted, False if not found
    """
    receipt = await get_receipt(session, receipt_id)
    if not receipt:
        return False

    await session.delete(receipt)
    await session.commit()

    return True
