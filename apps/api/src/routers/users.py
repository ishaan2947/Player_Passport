"""Users API router."""

from fastapi import APIRouter, HTTPException, status

import structlog

from src.core import (
    CurrentUser,
    DbSession,
)
from src.models import Team, TeamMember, Game, BasketballGameStats, Report

logger = structlog.get_logger()

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user(
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """
    Get current user information.
    """
    # Get team count
    team_count = (
        db.query(TeamMember).filter(TeamMember.user_id == current_user.id).count()
    )

    # Get owned teams count
    owned_teams_count = (
        db.query(Team).filter(Team.owner_user_id == current_user.id).count()
    )

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "clerk_id": current_user.clerk_user_id,
        "created_at": current_user.created_at.isoformat(),
        "team_count": team_count,
        "owned_teams_count": owned_teams_count,
    }


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Delete the current user's account.

    This will:
    - Delete all teams the user owns (along with their games, stats, reports)
    - Remove the user from all teams they're a member of
    - Delete the user record

    This action is irreversible.
    """
    user_id = current_user.id

    logger.info(
        "Starting account deletion",
        user_id=str(user_id),
        email=current_user.email,
    )

    try:
        # 1. Delete all teams the user owns (cascade will handle games, stats, reports)
        owned_teams = db.query(Team).filter(Team.owner_user_id == user_id).all()
        for team in owned_teams:
            logger.info(
                "Deleting owned team",
                team_id=str(team.id),
                team_name=team.name,
            )
            db.delete(team)

        # 2. Remove user from teams they're a member of (but don't own)
        memberships = db.query(TeamMember).filter(TeamMember.user_id == user_id).all()
        for membership in memberships:
            db.delete(membership)

        # 3. Delete the user record
        db.delete(current_user)

        db.commit()

        logger.info(
            "Account deleted successfully",
            user_id=str(user_id),
            deleted_teams=len(owned_teams),
            deleted_memberships=len(memberships),
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
    # Get all teams
    teams_query = (
        db.query(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(TeamMember.user_id == current_user.id)
        .all()
    )

    teams_data = []
    for team in teams_query:
        # Get games for this team
        games = db.query(Game).filter(Game.team_id == team.id).all()
        games_data = []

        for game in games:
            # Get stats
            stats = (
                db.query(BasketballGameStats)
                .filter(BasketballGameStats.game_id == game.id)
                .first()
            )

            # Get report
            report = db.query(Report).filter(Report.game_id == game.id).first()

            games_data.append(
                {
                    "id": str(game.id),
                    "opponent_name": game.opponent_name,
                    "game_date": game.game_date.isoformat(),
                    "location": game.location,
                    "notes": game.notes,
                    "stats": {
                        "points_for": stats.points_for,
                        "points_against": stats.points_against,
                        "fg_made": stats.fg_made,
                        "fg_att": stats.fg_att,
                        "three_made": stats.three_made,
                        "three_att": stats.three_att,
                        "ft_made": stats.ft_made,
                        "ft_att": stats.ft_att,
                        "rebounds_off": stats.rebounds_off,
                        "rebounds_def": stats.rebounds_def,
                        "assists": stats.assists,
                        "steals": stats.steals,
                        "blocks": stats.blocks,
                        "turnovers": stats.turnovers,
                        "fouls": stats.fouls,
                    }
                    if stats
                    else None,
                    "report": {
                        "status": report.status,
                        "report_json": report.report_json,
                        "created_at": report.created_at.isoformat(),
                    }
                    if report
                    else None,
                }
            )

        teams_data.append(
            {
                "id": str(team.id),
                "name": team.name,
                "sport": team.sport,
                "is_owner": team.owner_user_id == current_user.id,
                "created_at": team.created_at.isoformat(),
                "games": games_data,
            }
        )

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "clerk_id": current_user.clerk_user_id,
            "created_at": current_user.created_at.isoformat(),
        },
        "teams": teams_data,
        "exported_at": db.execute("SELECT NOW()").scalar().isoformat(),
    }
