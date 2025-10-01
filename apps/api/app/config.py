from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="API_", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/whey"
    alembic_ini: str = "alembic.ini"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: Optional[str] = "redis://redis:6379/0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
