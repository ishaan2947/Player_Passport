"""
Configuration validation for production environments.
"""

import sys
from typing import List

import structlog

from src.core.config import get_settings

logger = structlog.get_logger()


def validate_config() -> List[str]:
    """
    Validate configuration settings.

    Returns:
        List of error messages (empty if valid)
    """
    settings = get_settings()
    errors: List[str] = []
    warnings: List[str] = []

    # Always required
    if not settings.database_url:
        errors.append("DATABASE_URL is required")

    # Production requirements
    # SECURITY: In production, authentication MUST be configured.
    # There is NO silent bypass allowed - the app will fail to start.
    if settings.is_production:
        # OpenAI is required for AI reports
        if not settings.openai_api_key:
            errors.append("OPENAI_API_KEY is required in production")
        elif not settings.openai_api_key.startswith("sk-"):
            errors.append("OPENAI_API_KEY appears invalid (should start with 'sk-')")

        # SECURITY: Clerk authentication is REQUIRED in production.
        # Without these keys, the dev auth bypass would theoretically be available,
        # but we prevent that by failing fast here.
        if not settings.clerk_secret_key:
            errors.append(
                "CLERK_SECRET_KEY is required in production. "
                "Authentication bypass is NOT allowed in production environments."
            )
        elif not settings.clerk_secret_key.startswith("sk_"):
            errors.append("CLERK_SECRET_KEY appears invalid (should start with 'sk_')")

        if not settings.clerk_publishable_key:
            errors.append(
                "CLERK_PUBLISHABLE_KEY is required in production. "
                "Authentication bypass is NOT allowed in production environments."
            )
        elif not settings.clerk_publishable_key.startswith("pk_"):
            errors.append(
                "CLERK_PUBLISHABLE_KEY appears invalid (should start with 'pk_')"
            )

        # Database should not be localhost in production
        if "localhost" in settings.database_url or "127.0.0.1" in settings.database_url:
            errors.append("DATABASE_URL should not use localhost in production")

        # Frontend URL should be set
        if settings.frontend_url == "http://localhost:3000":
            warnings.append("FRONTEND_URL is still set to localhost")

    # Development warnings
    else:
        if not settings.openai_api_key:
            warnings.append("OPENAI_API_KEY not set - AI reports will fail")

        if not settings.clerk_secret_key:
            warnings.append("CLERK_SECRET_KEY not set - using dev auth bypass")

    # Log warnings
    for warning in warnings:
        logger.warning("Config warning", message=warning)

    return errors


def validate_config_or_exit() -> None:
    """
    Validate configuration and exit if invalid.

    Call this at application startup.
    """
    settings = get_settings()

    logger.info(
        "Validating configuration",
        environment=settings.environment,
    )

    errors = validate_config()

    if errors:
        logger.error(
            "Configuration validation failed",
            errors=errors,
            environment=settings.environment,
        )
        print("\n❌ Configuration errors:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print(
            "\nPlease set the required environment variables and restart.",
            file=sys.stderr,
        )
        sys.exit(1)

    logger.info("Configuration validation passed")
