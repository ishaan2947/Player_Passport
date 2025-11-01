"""
Authentication dependencies for FastAPI routes.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

import structlog

from src.core.database import get_db
from src.core.dev_auth import extract_dev_user_id, is_dev_token
from src.core.security import (
    AuthenticationError,
    extract_clerk_user_id,
    extract_user_email,
    verify_clerk_token,
)
from src.models.user import User

logger = structlog.get_logger()


async def get_token_from_header(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """
    Extract Bearer token from Authorization header.

    Args:
        authorization: Authorization header value

    Returns:
        JWT token string

    Raises:
        HTTPException: If header is missing or malformed
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return parts[1]


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_header)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Get the current authenticated user from the JWT token.

    This dependency:
    1. Validates the Clerk JWT token (or dev token in development)
    2. Extracts the Clerk user ID
    3. Looks up or creates the user in our database
    4. Returns the User model instance

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        User model instance

    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Check for development token bypass
        if is_dev_token(token):
            clerk_user_id = extract_dev_user_id(token)
            if not clerk_user_id:
                raise AuthenticationError("Invalid dev token", "INVALID_DEV_TOKEN")

            logger.debug("Using dev token auth", clerk_user_id=clerk_user_id)

            # Look up user by clerk_user_id
            user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Dev user not found: {clerk_user_id}. Run seed script first.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return user

        # Production path: Verify the token and get payload
        payload = verify_clerk_token(token)

        # Extract user info from token
        clerk_user_id = extract_clerk_user_id(payload)
        email = extract_user_email(payload)

        # Look up user in database
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            # Auto-create user on first login
            # This syncs Clerk users to our database
            if not email:
                # If we can't get email from token, use a placeholder
                # This will be updated when we have more user info
                email = f"{clerk_user_id}@placeholder.local"

            user = User(
                clerk_user_id=clerk_user_id,
                email=email,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            logger.info(
                "Created new user from Clerk",
                user_id=str(user.id),
                clerk_user_id=clerk_user_id,
            )

        return user

    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> User | None:
    """
    Optionally get the current user if authenticated.

    Useful for routes that work with or without authentication.

    Args:
        authorization: Optional Authorization header
        db: Database session

    Returns:
        User model instance or None
    """
    if not authorization or not db:
        return None

    try:
        token = await get_token_from_header(authorization)
        return await get_current_user(token, db)
    except HTTPException:
        return None


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
DbSession = Annotated[Session, Depends(get_db)]
