"""Teams API router."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

import structlog

from src.core import (
    CurrentUser,
    DbSession,
    TeamMemberAccess,
    TeamOwnerAccess,
)
from src.models import Team, TeamMember, User
from src.schemas import (
    TeamCreate,
    TeamUpdate,
    TeamOut,
    TeamMemberCreate,
    TeamMemberOut,
    TeamWithMembers,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_in: TeamCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> Team:
    """
    Create a new team.

    The current user will automatically become the team owner.
    """
    # Create the team
    team = Team(
        name=team_in.name,
        sport=team_in.sport,
        owner_user_id=current_user.id,
    )
    db.add(team)
    db.flush()  # Get the team ID

    # Add the current user as owner
    membership = TeamMember(
        user_id=current_user.id,
        team_id=team.id,
        role="owner",
    )
    db.add(membership)
    db.commit()
    db.refresh(team)

    logger.info(
        "Team created",
        team_id=str(team.id),
        team_name=team.name,
        owner_id=str(current_user.id),
    )

    return team


@router.get("", response_model=list[TeamOut])
async def list_teams(
    current_user: CurrentUser,
    db: DbSession,
) -> list[Team]:
    """
    List all teams the current user is a member of.
    """
    teams = (
        db.query(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(TeamMember.user_id == current_user.id)
        .order_by(Team.created_at.desc())
        .all()
    )
    return teams


@router.get("/{team_id}", response_model=TeamWithMembers)
async def get_team(
    team: TeamMemberAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """
    Get team details including members.

    Requires team membership.
    """
    # Get members with user emails
    members = (
        db.query(TeamMember, User.email)
        .join(User, TeamMember.user_id == User.id)
        .filter(TeamMember.team_id == team.id)
        .all()
    )

    member_list = []
    for member, email in members:
        member_out = TeamMemberOut(
            id=member.id,
            user_id=member.user_id,
            team_id=member.team_id,
            role=member.role,
            created_at=member.created_at,
            user_email=email,
        )
        member_list.append(member_out)

    return {
        "id": team.id,
        "name": team.name,
        "sport": team.sport,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "members": member_list,
    }


@router.patch("/{team_id}", response_model=TeamOut)
async def update_team(
    team_in: TeamUpdate,
    team: TeamOwnerAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> Team:
    """
    Update team details.

    Requires team owner role.
    """
    # Update only provided fields
    update_data = team_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)

    logger.info(
        "Team updated",
        team_id=str(team.id),
        updated_fields=list(update_data.keys()),
    )

    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team: TeamOwnerAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Delete a team.

    Requires team owner role. This will also delete all games, stats, and reports.
    """
    team_id = team.id
    db.delete(team)
    db.commit()

    logger.info(
        "Team deleted",
        team_id=str(team_id),
        deleted_by=str(current_user.id),
    )


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_team_member(
    member_in: TeamMemberCreate,
    team: TeamOwnerAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> TeamMember:
    """
    Add a new member to the team.

    Requires team owner role.
    """
    # Find the user by email
    user = db.query(User).filter(User.email == member_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {member_in.email} not found",
        )

    # Check if already a member
    existing = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a team member",
        )

    # Create membership
    membership = TeamMember(
        user_id=user.id,
        team_id=team.id,
        role=member_in.role,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    logger.info(
        "Team member added",
        team_id=str(team.id),
        user_id=str(user.id),
        role=member_in.role,
    )

    return membership


@router.delete(
    "/{team_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_team_member(
    user_id: UUID,
    team: TeamOwnerAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Remove a member from the team.

    Requires team owner role. Cannot remove yourself if you're the only owner.
    """
    # Check if trying to remove self
    if user_id == current_user.id:
        # Count owners
        owner_count = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == team.id, TeamMember.role == "owner")
            .count()
        )
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the only owner. Transfer ownership first.",
            )

    # Find and delete membership
    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    db.delete(membership)
    db.commit()

    logger.info(
        "Team member removed",
        team_id=str(team.id),
        removed_user_id=str(user_id),
    )
