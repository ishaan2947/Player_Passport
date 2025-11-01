"""
Development authentication bypass.

SECURITY NOTE:
--------------
This module provides a way to bypass Clerk authentication during LOCAL DEVELOPMENT ONLY.
The bypass is ONLY available when ENVIRONMENT=development (checked in is_dev_token).

In production (ENVIRONMENT=production), this bypass is completely disabled:
- is_dev_token() always returns False
- extract_dev_user_id() returns None
- All requests must use valid Clerk JWT tokens

This prevents any accidental auth bypass in production environments.

Usage (development only):
    Set environment variable: ENVIRONMENT=development
    Use header: Authorization: Bearer dev_<clerk_user_id>

Example:
    Authorization: Bearer dev_user_seed_001
"""

import structlog

from src.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

DEV_TOKEN_PREFIX = "dev_"


def is_dev_token(token: str) -> bool:
    """
    Check if the token is a development bypass token.

    SECURITY: This ONLY returns True when:
    1. ENVIRONMENT=development (NOT production or staging)
    2. Token starts with "dev_" prefix

    In production, this always returns False, ensuring no auth bypass is possible.
    """
    # SECURITY: Strict check - only allow in development environment
    if not settings.is_development:
        return False

    return token.startswith(DEV_TOKEN_PREFIX)


def extract_dev_user_id(token: str) -> str | None:
    """
    Extract user ID from development token.

    Args:
        token: Token string like "dev_user_seed_001"

    Returns:
        Clerk user ID (e.g., "user_seed_001") or None if not a dev token
    """
    if not is_dev_token(token):
        return None

    # Remove the "dev_" prefix to get the clerk_user_id
    return token[len(DEV_TOKEN_PREFIX) :]
