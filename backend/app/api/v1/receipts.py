from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.receipt import (
    ReceiptCreate,
    ReceiptUpdate,
    ReceiptResponse,
    ReceiptListResponse,
    ReceiptStatus,
)
from app.services import receipt_service

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.get("/next-number")
async def get_next_receipt_number(
    session: AsyncSession = Depends(get_db)
):
    """
    Get the next receipt number that will be assigned.
    Useful for preview purposes before saving a receipt.
    """
    try:
        next_number = await receipt_service.generate_receipt_number(session)
        return {"next_number": next_number}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting next receipt number: {str(e)}"
        )


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    receipt_data: ReceiptCreate,
    session: AsyncSession = Depends(get_db)
):
    """
    Create a new receipt with items.

    - **customer_name**: Customer name (required)
    - **customer_nit**: Customer NIT (optional)
    - **customer_phone**: Customer phone (optional)
    - **customer_email**: Customer email (optional)
    - **date**: Receipt date (optional, defaults to current date)
    - **notes**: Additional notes (optional)
    - **signature**: Base64 encoded signature image (optional)
    - **items**: List of receipt items (minimum 1 required)
    """
    try:
        receipt = await receipt_service.create_receipt(session, receipt_data)
        return receipt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating receipt: {str(e)}"
        )


@router.get("", response_model=List[ReceiptListResponse])
async def list_receipts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    date_from: Optional[date] = Query(None, description="Filter receipts from this date"),
    date_to: Optional[date] = Query(None, description="Filter receipts up to this date"),
    receipt_status: Optional[ReceiptStatus] = Query(None, alias="status", description="Filter by status"),
    session: AsyncSession = Depends(get_db)
):
    """
    List receipts with pagination and optional search/filters.

    - **skip**: Number of receipts to skip (default: 0)
    - **limit**: Maximum number of receipts to return (default: 100)
    - **search**: Search by receipt number, customer name, or NIT (optional)
    - **date_from**: Filter receipts from this date (optional)
    - **date_to**: Filter receipts up to this date (optional)
    - **status**: Filter by status (draft, completed, paid, cancelled) (optional)
    """
    try:
        receipts = await receipt_service.list_receipts(
            session, skip, limit, search, date_from, date_to, receipt_status
        )
        return receipts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing receipts: {str(e)}"
        )


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: int,
    session: AsyncSession = Depends(get_db)
):
    """
    Get a single receipt by ID with all items.

    - **receipt_id**: Receipt ID
    """
    receipt = await receipt_service.get_receipt(session, receipt_id)
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt with ID {receipt_id} not found"
        )
    return receipt


@router.put("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: int,
    receipt_data: ReceiptUpdate,
    session: AsyncSession = Depends(get_db)
):
    """
    Update a receipt and optionally its items.

    - **receipt_id**: Receipt ID
    - All fields are optional, only provided fields will be updated
    """
    try:
        receipt = await receipt_service.update_receipt(session, receipt_id, receipt_data)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found"
            )
        return receipt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating receipt: {str(e)}"
        )


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: int,
    session: AsyncSession = Depends(get_db)
):
    """
    Delete a receipt (cascade deletes all items).

    - **receipt_id**: Receipt ID
    """
    try:
        deleted = await receipt_service.delete_receipt(session, receipt_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting receipt: {str(e)}"
        )
