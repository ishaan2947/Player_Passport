# API Routers
from src.routers.teams import router as teams_router
from src.routers.games import router as games_router
from src.routers.reports import router as reports_router
from src.routers.users import router as users_router

# Player Passport
from src.routers.players import router as players_router

__all__ = [
    "teams_router",
    "games_router",
    "reports_router",
    "users_router",
    "players_router",
]
