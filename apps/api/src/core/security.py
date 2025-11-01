"""
Security utilities for JWT validation and user authentication.
"""

import jwt
from functools import lru_cache
from typing import Any

import structlog

from src.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Clerk JWKS URL
CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"


class AuthenticationError(Exception):
    """Raised when authentication fails."""

    def __init__(self, message: str, error_code: str = "AUTHENTICATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class AuthorizationError(Exception):
    """Raised when authorization fails."""

    def __init__(self, message: str, error_code: str = "AUTHORIZATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


@lru_cache(maxsize=1)
def get_jwks_client() -> jwt.PyJWKClient:
    """
    Get cached JWKS client for Clerk.
    Uses LRU cache to avoid repeated network calls.
    """
    return jwt.PyJWKClient(CLERK_JWKS_URL)


def verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify a Clerk JWT token and return the decoded payload.

    Args:
        token: The JWT token from the Authorization header

    Returns:
        Decoded token payload containing user claims

    Raises:
        AuthenticationError: If token is invalid or expired
    """
    try:
        # Get the signing key from Clerk's JWKS
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "require": ["exp", "iat", "sub"],
            },
        )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise AuthenticationError("Token has expired", "TOKEN_EXPIRED")

    except jwt.InvalidTokenError as e:
        logger.warning("Invalid token", error=str(e))
        raise AuthenticationError("Invalid token", "INVALID_TOKEN")

    except Exception as e:
        logger.error("Token verification failed", error=str(e))
        raise AuthenticationError("Authentication failed", "AUTH_FAILED")


def extract_clerk_user_id(payload: dict[str, Any]) -> str:
    """
    Extract the Clerk user ID from a decoded JWT payload.

    Args:
        payload: Decoded JWT payload

    Returns:
        Clerk user ID (sub claim)

    Raises:
        AuthenticationError: If user ID is not found
    """
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("User ID not found in token", "MISSING_USER_ID")
    return user_id


def extract_user_email(payload: dict[str, Any]) -> str | None:
    """
    Extract user email from JWT payload if available.

    Args:
        payload: Decoded JWT payload

    Returns:
        User email or None
    """
    # Clerk stores email in different places depending on configuration
    # Check common locations
    if "email" in payload:
        return payload["email"]

    # Check in user metadata
    if "user" in payload and isinstance(payload["user"], dict):
        return payload["user"].get("email")

    # Check primary email addresses
    if "email_addresses" in payload and payload["email_addresses"]:
        primary = next(
            (e for e in payload["email_addresses"] if e.get("primary")),
            payload["email_addresses"][0] if payload["email_addresses"] else None,
        )
        if primary:
            return primary.get("email_address")

    return None
