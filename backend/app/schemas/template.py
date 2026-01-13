"""Receipt template schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class TemplateItemBase(BaseModel):
    """Base schema for template items."""
    description: str = Field(..., min_length=1, max_length=1000)
    quantity: float = Field(default=1, gt=0)
    unit_price: float = Field(default=0, ge=0)


class TemplateCreate(BaseModel):
    """Schema for creating templates."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    customer_name: Optional[str] = Field(None, max_length=255)
    customer_nit: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)
    items: Optional[List[TemplateItemBase]] = None


class TemplateUpdate(BaseModel):
    """Schema for updating templates."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    customer_name: Optional[str] = None
    customer_nit: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[TemplateItemBase]] = None


class TemplateResponse(BaseModel):
    """Schema for template responses."""
    id: int
    name: str
    description: Optional[str] = None
    customer_name: Optional[str] = None
    customer_nit: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[TemplateItemBase]] = None
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TemplateListResponse(BaseModel):
    """Schema for template list responses."""
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
