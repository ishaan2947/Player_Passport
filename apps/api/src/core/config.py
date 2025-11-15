"""
Application configuration using Pydantic Settings.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = (
        "postgresql://emg_user:emg_password@localhost:5432/explain_my_game"
    )

    # OpenAI
    openai_api_key: str = ""

    # Clerk Auth
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # Application
    environment: Literal["development", "staging", "production", "test"] = "development"
    log_level: str = "INFO"
    debug: bool = False

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 60

    # Frontend URL (for CORS)
    frontend_url: str = "http://localhost:3000"

    # Sentry Error Tracking
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_test(self) -> bool:
        return self.environment == "test"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
