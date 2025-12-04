# API Routers for Player Passport
from src.routers.users import router as users_router
from src.routers.players import router as players_router

__all__ = [
    "users_router",
    "players_router",
]
