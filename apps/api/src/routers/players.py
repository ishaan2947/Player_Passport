"""
Player Passport API endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.core.auth import get_current_user
from src.core.database import get_db
from src.core.rate_limit import check_report_generation_rate_limit
from src.models import Player, PlayerGame, PlayerReport, User
from src.schemas.player import (
    PlayerCreate,
    PlayerGameCreate,
    PlayerGameResponse,
    PlayerGameUpdate,
    PlayerReportCreate,
    PlayerReportResponse,
    PlayerReportWithPlayerResponse,
    PlayerResponse,
    PlayerUpdate,
    PlayerWithGamesResponse,
)
from src.services.player_report_generator import generate_player_report

router = APIRouter(prefix="/players", tags=["players"])


# ============================================================================
# Player CRUD
# ============================================================================


@router.post("", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
async def create_player(
    player_data: PlayerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Player:
    """Create a new player profile."""
    player = Player(
        user_id=current_user.id,
        name=player_data.name,
        grade=player_data.grade,
        position=player_data.position,
        height=player_data.height,
        team=player_data.team,
        goals=player_data.goals,
        competition_level=player_data.competition_level,
        role=player_data.role,
        injuries=player_data.injuries,
        minutes_context=player_data.minutes_context,
        coach_notes=player_data.coach_notes,
        parent_notes=player_data.parent_notes,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("", response_model=list[PlayerResponse])
async def list_players(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Player]:
    """List all players for the current user."""
    result = db.execute(
        select(Player)
        .where(Player.user_id == current_user.id)
        .order_by(Player.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{player_id}", response_model=PlayerWithGamesResponse)
async def get_player(
    player_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Player:
    """Get a player profile with games."""
    result = db.execute(
        select(Player)
        .options(selectinload(Player.games))
        .where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.patch("/{player_id}", response_model=PlayerResponse)
async def update_player(
    player_id: UUID,
    player_data: PlayerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Player:
    """Update a player profile."""
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Update fields
    update_data = player_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(player, field, value)

    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player(
    player_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a player profile."""
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    db.delete(player)
    db.commit()


# ============================================================================
# Player Games CRUD
# ============================================================================


@router.post(
    "/{player_id}/games",
    response_model=PlayerGameResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_player_game(
    player_id: UUID,
    game_data: PlayerGameCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlayerGame:
    """Add a game to a player's record."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    game = PlayerGame(
        player_id=player_id,
        game_date=game_data.game_date,
        opponent=game_data.opponent,
        game_label=game_data.game_label,
        minutes=game_data.minutes,
        pts=game_data.pts,
        reb=game_data.reb,
        ast=game_data.ast,
        stl=game_data.stl,
        blk=game_data.blk,
        tov=game_data.tov,
        fgm=game_data.fgm,
        fga=game_data.fga,
        tpm=game_data.tpm,
        tpa=game_data.tpa,
        ftm=game_data.ftm,
        fta=game_data.fta,
        notes=game_data.notes,
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.get("/{player_id}/games", response_model=list[PlayerGameResponse])
async def list_player_games(
    player_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PlayerGame]:
    """List all games for a player."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    result = db.execute(
        select(PlayerGame)
        .where(PlayerGame.player_id == player_id)
        .order_by(PlayerGame.game_date.desc())
    )
    return list(result.scalars().all())


@router.patch("/{player_id}/games/{game_id}", response_model=PlayerGameResponse)
async def update_player_game(
    player_id: UUID,
    game_id: UUID,
    game_data: PlayerGameUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlayerGame:
    """Update a player's game stats."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get game
    result = db.execute(
        select(PlayerGame).where(
            PlayerGame.id == game_id, PlayerGame.player_id == player_id
        )
    )
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Update fields
    update_data = game_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(game, field, value)

    db.commit()
    db.refresh(game)
    return game


@router.delete("/{player_id}/games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player_game(
    player_id: UUID,
    game_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a player's game."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get game
    result = db.execute(
        select(PlayerGame).where(
            PlayerGame.id == game_id, PlayerGame.player_id == player_id
        )
    )
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    db.delete(game)
    db.commit()


# ============================================================================
# Player Reports
# ============================================================================


@router.post(
    "/{player_id}/reports",
    response_model=PlayerReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_player_report(
    player_id: UUID,
    report_data: PlayerReportCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlayerReport:
    """Generate a new development report for a player."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player)
        .options(selectinload(Player.games))
        .where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get games to include
    if report_data.game_ids:
        # Use specific games
        result = db.execute(
            select(PlayerGame).where(
                PlayerGame.player_id == player_id,
                PlayerGame.id.in_(report_data.game_ids),
            )
        )
        games = list(result.scalars().all())
    else:
        # Use most recent 5 games
        result = db.execute(
            select(PlayerGame)
            .where(PlayerGame.player_id == player_id)
            .order_by(PlayerGame.game_date.desc())
            .limit(5)
        )
        games = list(result.scalars().all())

    if len(games) < 3:
        raise HTTPException(
            status_code=400,
            detail="At least 3 games are required to generate a report",
        )

    # Check rate limit for report generation (stricter than general rate limit)
    is_allowed, error_message = check_report_generation_rate_limit(
        str(current_user.id), requests_per_hour=10
    )
    if not is_allowed:
        raise HTTPException(status_code=429, detail=error_message)

    # Create report
    report = PlayerReport(
        player_id=player_id,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Generate report with correlation ID
    correlation_id = getattr(request.state, "correlation_id", None)
    report = await generate_player_report(
        player, games, report, correlation_id=correlation_id
    )
    db.commit()
    db.refresh(report)

    return report


@router.get("/{player_id}/reports", response_model=list[PlayerReportResponse])
async def list_player_reports(
    player_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PlayerReport]:
    """List all reports for a player."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    result = db.execute(
        select(PlayerReport)
        .where(PlayerReport.player_id == player_id)
        .order_by(PlayerReport.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{player_id}/reports/{report_id}", response_model=PlayerReportResponse)
async def get_player_report(
    player_id: UUID,
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlayerReport:
    """Get a specific report."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    result = db.execute(
        select(PlayerReport).where(
            PlayerReport.id == report_id, PlayerReport.player_id == player_id
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


# ============================================================================
# Public Report Sharing
# ============================================================================


@router.get("/share/{share_token}", response_model=PlayerReportWithPlayerResponse)
async def get_shared_report(
    share_token: str,
    db: Session = Depends(get_db),
) -> PlayerReport:
    """Get a publicly shared report (no auth required)."""
    result = db.execute(
        select(PlayerReport)
        .options(selectinload(PlayerReport.player))
        .where(
            PlayerReport.share_token == share_token,
            PlayerReport.is_public == True,  # noqa: E712
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.patch(
    "/{player_id}/reports/{report_id}/share", response_model=PlayerReportResponse
)
async def toggle_report_sharing(
    player_id: UUID,
    report_id: UUID,
    is_public: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlayerReport:
    """Enable or disable public sharing for a report."""
    # Verify player exists and belongs to user
    result = db.execute(
        select(Player).where(Player.id == player_id, Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    result = db.execute(
        select(PlayerReport).where(
            PlayerReport.id == report_id, PlayerReport.player_id == player_id
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.is_public = is_public
    db.commit()
    db.refresh(report)

    return report
