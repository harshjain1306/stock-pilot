from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    LOW_STOCK_THRESHOLD: int = 10
    APP_NAME: str = "Inventory & Order Management API"
    APP_VERSION: str = "1.0.0"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
