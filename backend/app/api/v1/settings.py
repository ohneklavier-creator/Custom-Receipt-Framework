from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user_required
from app.models.settings import Settings
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required)
):
    """Get application settings (requires authentication)"""
    # Get settings (always ID 1 for system-wide settings)
    result = await db.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Return default settings if not found
        return SettingsResponse(
            id=1,
            company_name="EMPRESA",
            company_info="Dirección de la empresa | Tel: 0000-0000",
            field_visibility={
                "customer_address": True,
                "customer_phone": True,
                "customer_email": True,
                "institution": True,
                "amount_in_words": True,
                "concept": True,
                "payment_method": True,
                "notes": True,
                "signature": True,
                "line_items_in_print": True
            }
        )

    return settings


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required)
):
    """Update application settings (requires authentication)"""
    print(f"Settings update requested by user: {current_user.id} - {current_user.username}")
    print(f"Update data: {settings_update.model_dump()}")
    # Get existing settings
    result = await db.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Create settings if they don't exist
        settings = Settings(id=1)
        db.add(settings)

    # Update fields
    if settings_update.company_name is not None:
        settings.company_name = settings_update.company_name
    if settings_update.company_info is not None:
        settings.company_info = settings_update.company_info
    if settings_update.field_visibility is not None:
        settings.field_visibility = settings_update.field_visibility.model_dump()

    await db.commit()
    await db.refresh(settings)

    return settings
