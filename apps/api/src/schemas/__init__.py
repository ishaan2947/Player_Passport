# Pydantic schemas for Player Passport API
from src.schemas.user import UserOut
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
from src.schemas.player_report_content import PlayerReportContent

__all__ = [
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
    "PlayerReportContent",
]
