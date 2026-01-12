from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://receipts:receipts@localhost:5433/receipts"

    # App
    debug: bool = True
    app_name: str = "Custom Receipt Framework"

    # Receipt settings
    receipt_prefix: str = "RECIBO"
    receipt_number_digits: int = 8

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
