"""Users API router for Player Passport."""

from fastapi import APIRouter, HTTPException, status

import structlog

from src.core import CurrentUser, DbSession
from src.models import Player, PlayerGame, PlayerReport

logger = structlog.get_logger()

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user(
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """Get current user information."""
    # Get player count
    player_count = (
        db.query(Player).filter(Player.user_id == current_user.id).count()
    )

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "clerk_id": current_user.clerk_user_id,
        "created_at": current_user.created_at.isoformat(),
        "player_count": player_count,
    }


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Delete the current user's account.

    This will delete all players, games, and reports associated with the user.
    This action is irreversible.
    """
    user_id = current_user.id

    logger.info(
        "Starting account deletion",
        user_id=str(user_id),
        email=current_user.email,
    )

    try:
        # Get all players owned by this user
        players = db.query(Player).filter(Player.user_id == user_id).all()
        deleted_players = len(players)

        # Delete user (cascade will handle players, games, reports)
        db.delete(current_user)
        db.commit()

        logger.info(
            "Account deleted successfully",
            user_id=str(user_id),
            deleted_players=deleted_players,
        )

    except Exception as e:
        db.rollback()
        logger.error(
            "Failed to delete account",
            user_id=str(user_id),
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account. Please try again.",
        )


@router.get("/me/data-export")
async def export_user_data(
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """
    Export all user data (GDPR compliance).

    Returns all data associated with the user's account.
    """
    # Get all players
    players = db.query(Player).filter(Player.user_id == current_user.id).all()

    players_data = []
    for player in players:
        # Get games
        games = db.query(PlayerGame).filter(PlayerGame.player_id == player.id).all()
        games_data = [
            {
                "id": str(g.id),
                "game_date": g.game_date.isoformat(),
                "opponent": g.opponent,
                "game_label": g.game_label,
                "minutes": g.minutes,
                "pts": g.pts,
                "reb": g.reb,
                "ast": g.ast,
                "stl": g.stl,
                "blk": g.blk,
                "tov": g.tov,
                "fgm": g.fgm,
                "fga": g.fga,
                "tpm": g.tpm,
                "tpa": g.tpa,
                "ftm": g.ftm,
                "fta": g.fta,
                "notes": g.notes,
                "created_at": g.created_at.isoformat(),
            }
            for g in games
        ]

        # Get reports
        reports = (
            db.query(PlayerReport).filter(PlayerReport.player_id == player.id).all()
        )
        reports_data = [
            {
                "id": str(r.id),
                "status": r.status,
                "report_json": r.report_json,
                "model_used": r.model_used,
                "prompt_version": r.prompt_version,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ]

        players_data.append(
            {
                "id": str(player.id),
                "name": player.name,
                "grade": player.grade,
                "position": player.position,
                "height": player.height,
                "team": player.team,
                "goals": player.goals,
                "created_at": player.created_at.isoformat(),
                "games": games_data,
                "reports": reports_data,
            }
        )

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "clerk_id": current_user.clerk_user_id,
            "created_at": current_user.created_at.isoformat(),
        },
        "players": players_data,
        "exported_at": db.execute("SELECT NOW()").scalar().isoformat(),
    }
