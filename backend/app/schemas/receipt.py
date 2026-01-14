from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, EmailStr


class ReceiptStatus(str, Enum):
    """Receipt status enum"""
    DRAFT = "draft"
    COMPLETED = "completed"
    PAID = "paid"
    CANCELLED = "cancelled"


# ReceiptItem Schemas
class ReceiptItemBase(BaseModel):
    """Base schema for receipt items"""
    description: str = Field(..., min_length=1, max_length=1000)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class ReceiptItemCreate(ReceiptItemBase):
    """Schema for creating receipt items"""
    pass


class ReceiptItemUpdate(BaseModel):
    """Schema for updating receipt items"""
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)


class ReceiptItemResponse(ReceiptItemBase):
    """Schema for receipt item responses"""
    id: int
    total: Decimal
    line_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Receipt Schemas
class ReceiptBase(BaseModel):
    """Base schema for receipts"""
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_nit: Optional[str] = Field(None, max_length=50)
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[EmailStr] = None
    customer_address: Optional[str] = Field(None, max_length=500)
    date: Optional[date] = None
    notes: Optional[str] = None
    signature: Optional[str] = None  # Base64 encoded image
    institution: Optional[str] = Field(None, max_length=255)
    concept: Optional[str] = Field(None, max_length=500)
    payment_method: Optional[str] = Field(None, max_length=50)
    custom_fields: Optional[dict] = None

    @field_validator('payment_method')
    @classmethod
    def validate_payment_method(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['Cheque', 'Transferencia', 'Efectivo', 'Otro']:
            raise ValueError('payment_method must be Cheque, Transferencia, Efectivo, or Otro')
        return v


class ReceiptCreate(ReceiptBase):
    """Schema for creating receipts"""
    status: Optional[ReceiptStatus] = ReceiptStatus.COMPLETED
    items: List[ReceiptItemCreate] = Field(..., min_length=1)

    @field_validator('items')
    @classmethod
    def validate_items_not_empty(cls, v: List[ReceiptItemCreate]) -> List[ReceiptItemCreate]:
        if not v:
            raise ValueError('Receipt must have at least one item')
        return v


class ReceiptUpdate(BaseModel):
    """Schema for updating receipts"""
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_nit: Optional[str] = Field(None, max_length=50)
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[EmailStr] = None
    customer_address: Optional[str] = Field(None, max_length=500)
    date: Optional[date] = None
    status: Optional[ReceiptStatus] = None
    notes: Optional[str] = None
    signature: Optional[str] = None
    institution: Optional[str] = Field(None, max_length=255)
    concept: Optional[str] = Field(None, max_length=500)
    payment_method: Optional[str] = Field(None, max_length=50)
    custom_fields: Optional[dict] = None
    items: Optional[List[ReceiptItemCreate]] = None

    @field_validator('payment_method')
    @classmethod
    def validate_payment_method(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['Cheque', 'Transferencia', 'Efectivo', 'Otro']:
            raise ValueError('payment_method must be Cheque, Transferencia, Efectivo, or Otro')
        return v


class ReceiptResponse(BaseModel):
    """Schema for receipt responses"""
    id: int
    receipt_number: str
    customer_name: str
    customer_nit: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_address: Optional[str] = None
    date: date
    status: ReceiptStatus
    notes: Optional[str] = None
    signature: Optional[str] = None
    institution: Optional[str] = None
    concept: Optional[str] = None
    payment_method: Optional[str] = None
    custom_fields: Optional[dict] = None
    subtotal: Decimal
    total: Decimal
    items: List[ReceiptItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptListResponse(BaseModel):
    """Schema for receipt list responses (without items)"""
    id: int
    receipt_number: str
    customer_name: str
    customer_nit: Optional[str] = None
    date: date
    status: ReceiptStatus
    total: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
