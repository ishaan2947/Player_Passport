"""
Role-Based Access Control (RBAC) for team membership.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

import structlog

from src.core.auth import CurrentUser, DbSession
from src.core.security import AuthorizationError
from src.models.team import Team
from src.models.team_member import TeamMember
from src.models.game import Game
from src.models.report import Report
from src.models.user import User

logger = structlog.get_logger()

# Role hierarchy: owner > coach > member
ROLE_HIERARCHY = {
    "owner": 3,
    "coach": 2,
    "member": 1,
}


def get_role_level(role: str) -> int:
    """Get numeric level for a role."""
    return ROLE_HIERARCHY.get(role, 0)


def check_team_membership(
    db: Session,
    user: User,
    team_id: uuid.UUID,
    min_role: str | None = None,
) -> TeamMember:
    """
    Check if a user is a member of a team.

    Args:
        db: Database session
        user: Current user
        team_id: Team ID to check
        min_role: Minimum required role (owner, coach, member)

    Returns:
        TeamMember instance

    Raises:
        AuthorizationError: If user is not a member or lacks required role
    """
    membership = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user.id,
        )
        .first()
    )

    if not membership:
        logger.warning(
            "User not a team member",
            user_id=str(user.id),
            team_id=str(team_id),
        )
        raise AuthorizationError(
            "You are not a member of this team",
            "NOT_TEAM_MEMBER",
        )

    if min_role:
        required_level = get_role_level(min_role)
        user_level = get_role_level(membership.role)

        if user_level < required_level:
            logger.warning(
                "Insufficient role",
                user_id=str(user.id),
                team_id=str(team_id),
                user_role=membership.role,
                required_role=min_role,
            )
            raise AuthorizationError(
                f"This action requires {min_role} role or higher",
                "INSUFFICIENT_ROLE",
            )

    return membership


def get_team_for_user(
    db: Session,
    user: User,
    team_id: uuid.UUID,
    min_role: str | None = None,
) -> Team:
    """
    Get a team if the user is a member.

    Args:
        db: Database session
        user: Current user
        team_id: Team ID
        min_role: Minimum required role

    Returns:
        Team instance

    Raises:
        HTTPException: If team not found or user lacks access
    """
    team = db.query(Team).filter(Team.id == team_id).first()

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    try:
        check_team_membership(db, user, team_id, min_role)
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
        )

    return team


def get_game_for_user(
    db: Session,
    user: User,
    game_id: uuid.UUID,
    min_role: str | None = None,
) -> Game:
    """
    Get a game if the user is a member of the game's team.

    Args:
        db: Database session
        user: Current user
        game_id: Game ID
        min_role: Minimum required role

    Returns:
        Game instance

    Raises:
        HTTPException: If game not found or user lacks access
    """
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    try:
        check_team_membership(db, user, game.team_id, min_role)
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
        )

    return game


def get_report_for_user(
    db: Session,
    user: User,
    report_id: uuid.UUID,
) -> Report:
    """
    Get a report if the user is a member of the report's game's team.

    Args:
        db: Database session
        user: Current user
        report_id: Report ID

    Returns:
        Report instance

    Raises:
        HTTPException: If report not found or user lacks access
    """
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    # Get the game to check team membership
    game = db.query(Game).filter(Game.id == report.game_id).first()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    try:
        check_team_membership(db, user, game.team_id)
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
        )

    return report


# Dependency factories for route parameters


class TeamAccessChecker:
    """Dependency factory for team access checking."""

    def __init__(self, min_role: str | None = None):
        self.min_role = min_role

    async def __call__(
        self,
        team_id: Annotated[uuid.UUID, Path(description="Team ID")],
        user: CurrentUser,
        db: DbSession,
    ) -> Team:
        return get_team_for_user(db, user, team_id, self.min_role)


class GameAccessChecker:
    """Dependency factory for game access checking."""

    def __init__(self, min_role: str | None = None):
        self.min_role = min_role

    async def __call__(
        self,
        game_id: Annotated[uuid.UUID, Path(description="Game ID")],
        user: CurrentUser,
        db: DbSession,
    ) -> Game:
        return get_game_for_user(db, user, game_id, self.min_role)


class ReportAccessChecker:
    """Dependency factory for report access checking."""

    async def __call__(
        self,
        report_id: Annotated[uuid.UUID, Path(description="Report ID")],
        user: CurrentUser,
        db: DbSession,
    ) -> Report:
        return get_report_for_user(db, user, report_id)


# Pre-configured access checkers
require_team_member = TeamAccessChecker()
require_team_coach = TeamAccessChecker(min_role="coach")
require_team_owner = TeamAccessChecker(min_role="owner")

require_game_member = GameAccessChecker()
require_game_coach = GameAccessChecker(min_role="coach")

require_report_access = ReportAccessChecker()

# Type aliases for route dependencies
TeamMemberAccess = Annotated[Team, Depends(require_team_member)]
TeamCoachAccess = Annotated[Team, Depends(require_team_coach)]
TeamOwnerAccess = Annotated[Team, Depends(require_team_owner)]

GameMemberAccess = Annotated[Game, Depends(require_game_member)]
GameCoachAccess = Annotated[Game, Depends(require_game_coach)]

ReportAccess = Annotated[Report, Depends(require_report_access)]
