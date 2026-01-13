"""Receipt template API endpoints."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_required
from app.models.user import User
from app.models.template import ReceiptTemplate
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
)


router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[TemplateListResponse])
async def list_templates(
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """List all templates for the current user."""
    stmt = (
        select(ReceiptTemplate)
        .where(ReceiptTemplate.user_id == current_user.id)
        .order_by(ReceiptTemplate.name)
    )
    result = await session.execute(stmt)
    templates = list(result.scalars().all())
    return templates


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a new template."""
    # Convert items to dict for JSON storage
    items_data = None
    if template_data.items:
        items_data = [item.model_dump() for item in template_data.items]

    template = ReceiptTemplate(
        name=template_data.name,
        description=template_data.description,
        customer_name=template_data.customer_name,
        customer_nit=template_data.customer_nit,
        notes=template_data.notes,
        items=items_data,
        user_id=current_user.id,
    )

    session.add(template)
    await session.commit()
    await session.refresh(template)

    return template


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Get a template by ID."""
    stmt = select(ReceiptTemplate).where(
        ReceiptTemplate.id == template_id,
        ReceiptTemplate.user_id == current_user.id
    )
    result = await session.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantilla no encontrada"
        )

    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a template."""
    stmt = select(ReceiptTemplate).where(
        ReceiptTemplate.id == template_id,
        ReceiptTemplate.user_id == current_user.id
    )
    result = await session.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantilla no encontrada"
        )

    # Update fields
    if template_data.name is not None:
        template.name = template_data.name
    if template_data.description is not None:
        template.description = template_data.description
    if template_data.customer_name is not None:
        template.customer_name = template_data.customer_name
    if template_data.customer_nit is not None:
        template.customer_nit = template_data.customer_nit
    if template_data.notes is not None:
        template.notes = template_data.notes
    if template_data.items is not None:
        template.items = [item.model_dump() for item in template_data.items]

    await session.commit()
    await session.refresh(template)

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a template."""
    stmt = select(ReceiptTemplate).where(
        ReceiptTemplate.id == template_id,
        ReceiptTemplate.user_id == current_user.id
    )
    result = await session.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantilla no encontrada"
        )

    await session.delete(template)
    await session.commit()
