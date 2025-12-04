"""
Rate limiting utilities for API endpoints.
"""

import time

import structlog

logger = structlog.get_logger()

# Simple in-memory rate limiting stores
# TODO: Replace with Redis-based rate limiting for production
_report_generation_store: dict[str, list[float]] = {}
_general_rate_limit_store: dict[str, list[float]] = {}


def check_report_generation_rate_limit(
    user_id: str, requests_per_hour: int = 10
) -> tuple[bool, str | None]:
    """
    Check if user has exceeded report generation rate limit.

    Args:
        user_id: User ID to check rate limit for
        requests_per_hour: Maximum requests per hour (default: 10)

    Returns:
        Tuple of (is_allowed, error_message)
    """
    current_time = time.time()
    window_start = current_time - 3600  # 1 hour window

    if user_id not in _report_generation_store:
        _report_generation_store[user_id] = []

    # Clean old entries
    _report_generation_store[user_id] = [
        t for t in _report_generation_store[user_id] if t > window_start
    ]

    # Check limit
    if len(_report_generation_store[user_id]) >= requests_per_hour:
        logger.warning(
            "Report generation rate limit exceeded",
            user_id=user_id,
            requests=len(_report_generation_store[user_id]),
        )
        return (
            False,
            f"Rate limit exceeded. Maximum {requests_per_hour} reports per hour.",
        )

    # Record request
    _report_generation_store[user_id].append(current_time)
    return (True, None)


def check_general_rate_limit(
    client_ip: str, requests_per_minute: int = 60
) -> tuple[bool, str | None]:
    """
    Check if client has exceeded general rate limit.

    Args:
        client_ip: Client IP address
        requests_per_minute: Maximum requests per minute (default: 60)

    Returns:
        Tuple of (is_allowed, error_message)
    """
    current_time = time.time()
    window_start = current_time - 60  # 1 minute window

    if client_ip not in _general_rate_limit_store:
        _general_rate_limit_store[client_ip] = []

    # Clean old entries
    _general_rate_limit_store[client_ip] = [
        t for t in _general_rate_limit_store[client_ip] if t > window_start
    ]

    # Check limit
    if len(_general_rate_limit_store[client_ip]) >= requests_per_minute:
        return (
            False,
            f"Rate limit exceeded. Maximum {requests_per_minute} requests per minute.",
        )

    # Record request
    _general_rate_limit_store[client_ip].append(current_time)
    return (True, None)
