"""
Explain My Game - FastAPI Backend
Main application entry point
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Any

import sentry_sdk
import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text

from src.core.config import get_settings
from src.core.database import engine
from src.core.exceptions import register_exception_handlers
from src.core.validation import validate_config_or_exit
from src.routers import teams_router, games_router, reports_router, users_router

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

# Rate limiting placeholder (in-memory, swap to Redis later)
rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
RATE_LIMIT_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> bool:
    """
    Simple in-memory rate limiting.
    Returns True if request is allowed, False if rate limited.

    TODO: Replace with Redis-based rate limiting for production.
    """
    current_time = time.time()
    window_start = current_time - RATE_LIMIT_WINDOW

    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []

    # Clean old entries
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip] if t > window_start
    ]

    # Check limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False

    # Record request
    rate_limit_store[client_ip].append(current_time)
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Validate configuration on startup
    validate_config_or_exit()

    logger.info("Starting Explain My Game API", environment=ENVIRONMENT)
    yield
    logger.info("Shutting down Explain My Game API")


# Create FastAPI app
app = FastAPI(
    title="Explain My Game API",
    description="Turn basketball game stats into clear coaching insights",
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(teams_router)
app.include_router(games_router)
app.include_router(reports_router)
app.include_router(users_router)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next) -> Response:
    """Rate limiting middleware."""
    # Skip rate limiting for health check
    if request.url.path == "/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(client_ip):
        logger.warning("Rate limit exceeded", client_ip=client_ip)
        return Response(
            content='{"detail": "Rate limit exceeded. Please try again later."}',
            status_code=429,
            media_type="application/json",
        )

    return await call_next(request)


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    """Request/response logging middleware."""
    start_time = time.time()

    response = await call_next(request)

    duration_ms = (time.time() - start_time) * 1000

    logger.info(
        "Request processed",
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
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    Returns the current status of the API.
    """
    # Quick database connectivity check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            environment=ENVIRONMENT,
            version="1.0.0",
        )

    return HealthResponse(
        status="healthy",
        environment=ENVIRONMENT,
        version="1.0.0",
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "name": "Explain My Game API",
        "version": "1.0.0",
        "docs": "/docs" if ENVIRONMENT == "development" else None,
        "health": "/health",
    }
