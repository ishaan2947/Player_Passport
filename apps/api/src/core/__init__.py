# Core module
from src.core.config import get_settings, Settings
from src.core.database import get_db, Base, engine, SessionLocal
from src.core.auth import (
    get_current_user,
    get_optional_user,
    CurrentUser,
    OptionalUser,
    DbSession,
)
from src.core.security import AuthenticationError, AuthorizationError
from src.core.exceptions import (
    AppException,
    NotFoundError,
    ValidationError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    register_exception_handlers,
)
from src.core.rbac import (
    check_team_membership,
    get_team_for_user,
    get_game_for_user,
    get_report_for_user,
    TeamMemberAccess,
    TeamCoachAccess,
    TeamOwnerAccess,
    GameMemberAccess,
    GameCoachAccess,
    ReportAccess,
)

__all__ = [
    # Config
    "get_settings",
    "Settings",
    # Database
    "get_db",
    "Base",
    "engine",
    "SessionLocal",
    # Auth
    "get_current_user",
    "get_optional_user",
    "CurrentUser",
    "OptionalUser",
    "DbSession",
    # Security
    "AuthenticationError",
    "AuthorizationError",
    # Exceptions
    "AppException",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    "RateLimitError",
    "ExternalServiceError",
    "register_exception_handlers",
    # RBAC
    "check_team_membership",
    "get_team_for_user",
    "get_game_for_user",
    "get_report_for_user",
    "TeamMemberAccess",
    "TeamCoachAccess",
    "TeamOwnerAccess",
    "GameMemberAccess",
    "GameCoachAccess",
    "ReportAccess",
]
