from datetime import datetime
from typing import Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class Settings(Base):
    """Settings model - application-wide settings"""
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    company_info: Mapped[Optional[str]] = mapped_column(String(500))
    field_visibility: Mapped[Optional[dict]] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Settings {self.id} - {self.company_name}>"
