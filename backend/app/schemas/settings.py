from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FieldVisibilitySettings(BaseModel):
    """Field visibility settings schema"""
    customer_name: bool = True  # Toggle customer name field
    customer_nit: bool = True
    customer_address: bool = True
    customer_phone: bool = True
    customer_email: bool = True
    institution: bool = True
    amount_in_words: bool = True
    concept: bool = True
    payment_method: bool = True
    notes: bool = True
    signature: bool = True
    received_by_name: bool = True  # Toggle NOMBRE field below signature
    authorized_signature: bool = True  # Toggle authorized signature box in print
    payment_method_in_print: bool = True  # Toggle payment method display in print footer
    line_items: bool = True  # Controls line items section in form
    line_items_in_print: bool = True  # Controls line items table in print
    # Print header controls
    show_company_name_in_header: bool = True  # Toggle company name in print header
    show_company_info_in_header: bool = True  # Toggle company info in print header
    institution_use_company_name: bool = False  # Auto-fill institution with company name


class SettingsBase(BaseModel):
    """Base schema for settings"""
    company_name: Optional[str] = Field(None, max_length=255)
    company_info: Optional[str] = Field(None, max_length=500)
    receipt_title: Optional[str] = Field(None, max_length=100)  # Custom title like "RECIBO DE PAGO"
    field_visibility: Optional[FieldVisibilitySettings] = None


class SettingsUpdate(SettingsBase):
    """Schema for updating settings"""
    pass


class SettingsResponse(SettingsBase):
    """Schema for settings responses"""
    id: int

    model_config = ConfigDict(from_attributes=True)
