from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Paramètres d'application."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="SCRAPER_", env_file_encoding="utf-8")

    database_url: str = "postgresql+asyncpg://scraper:scraper@localhost:5432/whey"
    redis_url: str = "redis://localhost:6379/0"
    scheduler_timezone: str = "Europe/Paris"
    refresh_cron: str = "0 * * * *"  # toutes les heures
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
