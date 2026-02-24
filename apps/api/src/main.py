"""
Player Passport - FastAPI Backend
Main application entry point
"""

import os
import threading
import time
from contextlib import asynccontextmanager
from typing import Any

import sentry_sdk
import structlog
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text

from src.core.config import get_settings
from src.core.database import engine
from src.core.exceptions import register_exception_handlers
from src.core.validation import validate_config_or_exit
from src.routers import (
    users_router,
    players_router,
)

# Initialize Sentry
settings = get_settings()
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        profiles_sample_rate=0.1,
        enable_tracing=True,
    )

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Settings
settings = get_settings()
ENVIRONMENT = settings.environment

# Thread-safe rate limiting
_rate_limit_lock = threading.Lock()
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_REQUESTS = settings.rate_limit_requests_per_minute
RATE_LIMIT_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> tuple[bool, int, int]:
    """
    Thread-safe in-memory rate limiting.
    Returns (is_allowed, remaining_requests, seconds_until_reset).
    """
    current_time = time.time()
    window_start = current_time - RATE_LIMIT_WINDOW

    with _rate_limit_lock:
        if client_ip not in _rate_limit_store:
            _rate_limit_store[client_ip] = []

        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if t > window_start
        ]

        count = len(_rate_limit_store[client_ip])
        remaining = max(0, RATE_LIMIT_REQUESTS - count)

        if count >= RATE_LIMIT_REQUESTS:
            oldest = _rate_limit_store[client_ip][0]
            reset = int(oldest + RATE_LIMIT_WINDOW - current_time)
            return False, 0, max(reset, 1)

        _rate_limit_store[client_ip].append(current_time)
        return True, remaining - 1, RATE_LIMIT_WINDOW


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Validate configuration on startup
    validate_config_or_exit()

    logger.info("Starting Player Passport API", environment=ENVIRONMENT)
    yield
    logger.info("Shutting down Player Passport API")


# Create FastAPI app
app = FastAPI(
    title="Player Passport API",
    description="Turn youth basketball stats into trustworthy player development reports",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None,
)

# CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if ENVIRONMENT == "production":
    # Add production frontend URL
    prod_frontend = os.getenv("FRONTEND_URL")
    if prod_frontend:
        allowed_origins.append(prod_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Correlation-ID"],
)

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(users_router)
app.include_router(players_router)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next) -> Response:
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if ENVIRONMENT == "production":
        response.headers[
            "Strict-Transport-Security"
        ] = "max-age=31536000; includeSubDomains"
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next) -> Response:
    """Rate limiting middleware with standard headers."""
    if request.url.path in ("/health", "/"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    allowed, remaining, reset = check_rate_limit(client_ip)

    if not allowed:
        logger.warning("Rate limit exceeded", client_ip=client_ip)
        response = Response(
            content='{"detail": "Rate limit exceeded. Please try again later."}',
            status_code=429,
            media_type="application/json",
        )
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = "0"
        response.headers["X-RateLimit-Reset"] = str(reset)
        response.headers["Retry-After"] = str(reset)
        return response

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset)
    return response


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    """Request/response logging middleware with correlation ID support."""
    import uuid

    start_time = time.time()

    # Generate or use existing correlation ID
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

    # Add correlation ID to request state for use in handlers
    request.state.correlation_id = correlation_id

    # Log request with correlation ID
    log = logger.bind(correlation_id=correlation_id)
    log.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
    )

    response = await call_next(request)

    duration_ms = (time.time() - start_time) * 1000

    # Add correlation ID to response headers
    response.headers["X-Correlation-ID"] = correlation_id

    log.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )

    return response


# Response models
class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    environment: str
    version: str


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    error_code: str | None = None


# Health check endpoint
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint",
    responses={503: {"model": HealthResponse}},
)
async def health_check() -> Response:
    """
    Health check endpoint.
    Returns 200 if healthy, 503 if unhealthy.
    """
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        db_ok = True
    except Exception as e:
        logger.error("Database health check failed", error=str(e))

    body = HealthResponse(
        status="healthy" if db_ok else "unhealthy",
        environment=ENVIRONMENT,
        version="1.0.0",
    )

    return Response(
        content=body.model_dump_json(),
        media_type="application/json",
        status_code=status.HTTP_200_OK
        if db_ok
        else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "name": "Player Passport API",
        "version": "1.0.0",
        "description": "Turn youth basketball stats into player development reports",
        "docs": "/docs" if ENVIRONMENT == "development" else None,
        "health": "/health",
    }


# Status / metrics endpoint for production monitoring
@app.get("/status", tags=["Health"])
async def app_status() -> dict[str, Any]:
    """
    Detailed status endpoint for monitoring dashboards.
    Returns DB connectivity, OpenAI reachability, and basic metrics.
    """
    from src.core.database import SessionLocal
    from src.models import Player, PlayerReport, User

    checks: dict[str, Any] = {
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "database": "unknown",
        "openai": "unknown",
    }
    metrics: dict[str, Any] = {}

    # Database check + basic counts
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        checks["database"] = "connected"

        db = SessionLocal()
        try:
            metrics["total_users"] = db.query(User).count()
            metrics["total_players"] = db.query(Player).count()
            metrics["total_reports"] = db.query(PlayerReport).count()
            metrics["pending_reports"] = (
                db.query(PlayerReport)
                .filter(PlayerReport.status.in_(["pending", "generating"]))
                .count()
            )
        finally:
            db.close()
    except Exception as e:
        checks["database"] = f"error: {str(e)}"

    # OpenAI reachability check
    if settings.openai_api_key:
        checks["openai"] = "configured"
    else:
        checks["openai"] = "not_configured"

    return {"checks": checks, "metrics": metrics}
