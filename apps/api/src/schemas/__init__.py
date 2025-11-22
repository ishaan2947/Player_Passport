# Pydantic schemas for API request/response validation
from src.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamOut,
    TeamMemberCreate,
    TeamMemberOut,
    TeamWithMembers,
)
from src.schemas.game import (
    GameCreate,
    GameUpdate,
    GameOut,
    GameWithStats,
)
from src.schemas.basketball_stats import (
    BasketballStatsCreate,
    BasketballStatsUpdate,
    BasketballStatsOut,
)
from src.schemas.report import (
    ReportOut,
    ReportContent,
    KeyInsight,
    ActionItem,
    QuestionForNextGame,
    GenerateReportRequest,
    GenerateReportResponse,
)
from src.schemas.feedback import (
    FeedbackCreate,
    FeedbackOut,
)
from src.schemas.user import (
    UserOut,
)

# Player Passport schemas
from src.schemas.player import (
    PlayerCreate,
    PlayerUpdate,
    PlayerResponse,
    PlayerWithGamesResponse,
    PlayerGameCreate,
    PlayerGameUpdate,
    PlayerGameResponse,
    PlayerReportCreate,
    PlayerReportResponse,
    PlayerReportWithPlayerResponse,
    FullPlayerReport,
)

__all__ = [
    # Team
    "TeamCreate",
    "TeamUpdate",
    "TeamOut",
    "TeamMemberCreate",
    "TeamMemberOut",
    "TeamWithMembers",
    # Game
    "GameCreate",
    "GameUpdate",
    "GameOut",
    "GameWithStats",
    # Basketball Stats
    "BasketballStatsCreate",
    "BasketballStatsUpdate",
    "BasketballStatsOut",
    # Report
    "ReportOut",
    "ReportContent",
    "KeyInsight",
    "ActionItem",
    "QuestionForNextGame",
    "GenerateReportRequest",
    "GenerateReportResponse",
    # Feedback
    "FeedbackCreate",
    "FeedbackOut",
    # User
    "UserOut",
    # Player Passport
    "PlayerCreate",
    "PlayerUpdate",
    "PlayerResponse",
    "PlayerWithGamesResponse",
    "PlayerGameCreate",
    "PlayerGameUpdate",
    "PlayerGameResponse",
    "PlayerReportCreate",
    "PlayerReportResponse",
    "PlayerReportWithPlayerResponse",
    "FullPlayerReport",
]
