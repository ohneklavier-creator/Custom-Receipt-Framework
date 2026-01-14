from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://receipts:receipts@localhost:5433/receipts"

    # App
    debug: bool = True
    app_name: str = "Custom Receipt Framework"

    # Receipt settings
    receipt_prefix: str = "RECIBO"
    receipt_number_digits: int = 8

    # Authentication
    secret_key: str = secrets.token_hex(32)  # Generate random secret if not provided
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Email settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    admin_email: str = "admin@genesisone.app"
    from_email: str = ""
    from_name: str = "Custom Receipt Framework"

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
