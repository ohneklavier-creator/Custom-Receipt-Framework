from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FieldVisibilitySettings(BaseModel):
    """Field visibility settings schema"""
    customer_address: bool = True
    customer_phone: bool = True
    customer_email: bool = True
    institution: bool = True
    amount_in_words: bool = True
    concept: bool = True
    payment_method: bool = True
    notes: bool = True
    signature: bool = True
    line_items: bool = True  # Controls line items section in form
    line_items_in_print: bool = True  # Controls line items table in print


class SettingsBase(BaseModel):
    """Base schema for settings"""
    company_name: Optional[str] = Field(None, max_length=255)
    company_info: Optional[str] = Field(None, max_length=500)
    field_visibility: Optional[FieldVisibilitySettings] = None


class SettingsUpdate(SettingsBase):
    """Schema for updating settings"""
    pass


class SettingsResponse(SettingsBase):
    """Schema for settings responses"""
    id: int

    model_config = ConfigDict(from_attributes=True)
