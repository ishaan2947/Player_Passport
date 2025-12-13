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


# ============================================================================
# Demo Data Seeding
# ============================================================================


@router.post("/seed-demo", response_model=list[PlayerResponse], status_code=status.HTTP_201_CREATED)
async def seed_demo_players(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Player]:
    """Seed 5 diverse demo players with realistic game data for testing AI reports."""
    from datetime import date, timedelta

    # 5 Unique Test Cases with different profiles and stat patterns
    demo_players = [
        # TEST CASE 1: High-scoring shooting guard - consistent scorer, good efficiency
        {
            "name": "Jordan Mitchell",
            "grade": "Junior",
            "position": "SG",
            "height": "6'2\"",
            "team": "Eastside Elite",
            "goals": ["Score 20+ PPG", "Get D1 offers", "Lead team in scoring"],
            "competition_level": "Varsity",
            "role": "Starting shooting guard, primary scorer",
            "coach_notes": "Jordan is our go-to scorer. Great shooter, needs to improve defense.",
            "games": [
                {"opponent": "North Valley", "pts": 24, "reb": 4, "ast": 3, "stl": 1, "blk": 0, "tov": 2, "fgm": 9, "fga": 16, "tpm": 4, "tpa": 8, "ftm": 2, "fta": 2, "minutes": 32},
                {"opponent": "South Central", "pts": 28, "reb": 5, "ast": 2, "stl": 2, "blk": 0, "tov": 3, "fgm": 10, "fga": 18, "tpm": 5, "tpa": 10, "ftm": 3, "fta": 4, "minutes": 34},
                {"opponent": "West Lake", "pts": 19, "reb": 3, "ast": 4, "stl": 1, "blk": 1, "tov": 2, "fgm": 7, "fga": 14, "tpm": 3, "tpa": 7, "ftm": 2, "fta": 2, "minutes": 30},
                {"opponent": "Metro Prep", "pts": 22, "reb": 4, "ast": 3, "stl": 3, "blk": 0, "tov": 1, "fgm": 8, "fga": 15, "tpm": 4, "tpa": 9, "ftm": 2, "fta": 3, "minutes": 31},
                {"opponent": "Tech Academy", "pts": 26, "reb": 6, "ast": 2, "stl": 2, "blk": 0, "tov": 2, "fgm": 9, "fga": 17, "tpm": 5, "tpa": 11, "ftm": 3, "fta": 4, "minutes": 33},
            ],
        },
        # TEST CASE 2: Playmaking point guard - high assists, turnover prone
        {
            "name": "Marcus Chen",
            "grade": "Sophomore",
            "position": "PG",
            "height": "5'11\"",
            "team": "Riverside Academy",
            "goals": ["Reduce turnovers", "Make varsity", "Improve leadership"],
            "competition_level": "JV",
            "role": "Starting point guard, floor general",
            "coach_notes": "Marcus sees the floor well but turns it over too much trying to make highlight passes.",
            "games": [
                {"opponent": "Lincoln High", "pts": 8, "reb": 3, "ast": 9, "stl": 2, "blk": 0, "tov": 5, "fgm": 3, "fga": 8, "tpm": 1, "tpa": 3, "ftm": 1, "fta": 2, "minutes": 28},
                {"opponent": "Oak Valley", "pts": 12, "reb": 2, "ast": 11, "stl": 3, "blk": 0, "tov": 6, "fgm": 5, "fga": 10, "tpm": 2, "tpa": 5, "ftm": 0, "fta": 0, "minutes": 30},
                {"opponent": "Central Prep", "pts": 6, "reb": 4, "ast": 8, "stl": 1, "blk": 0, "tov": 4, "fgm": 2, "fga": 7, "tpm": 1, "tpa": 4, "ftm": 1, "fta": 2, "minutes": 26},
                {"opponent": "St. Mary's", "pts": 10, "reb": 3, "ast": 10, "stl": 4, "blk": 0, "tov": 5, "fgm": 4, "fga": 9, "tpm": 2, "tpa": 5, "ftm": 0, "fta": 1, "minutes": 29},
                {"opponent": "North Valley", "pts": 14, "reb": 2, "ast": 7, "stl": 2, "blk": 0, "tov": 3, "fgm": 5, "fga": 11, "tpm": 2, "tpa": 6, "ftm": 2, "fta": 2, "minutes": 31},
            ],
        },
        # TEST CASE 3: Defensive-minded wing - low scoring, great steals/blocks
        {
            "name": "Isaiah Brooks",
            "grade": "Senior",
            "position": "SF",
            "height": "6'5\"",
            "team": "Westside Warriors",
            "goals": ["D2/D3 scholarship", "Develop offensive game", "Be team captain"],
            "competition_level": "Varsity",
            "role": "Defensive stopper, guards best opposing player",
            "coach_notes": "Isaiah is our lockdown defender. Would love to see him score more off steals.",
            "games": [
                {"opponent": "South Academy", "pts": 6, "reb": 7, "ast": 2, "stl": 4, "blk": 3, "tov": 1, "fgm": 2, "fga": 6, "tpm": 0, "tpa": 2, "ftm": 2, "fta": 4, "minutes": 32},
                {"opponent": "East Central", "pts": 8, "reb": 9, "ast": 3, "stl": 5, "blk": 2, "tov": 1, "fgm": 3, "fga": 7, "tpm": 1, "tpa": 2, "ftm": 1, "fta": 2, "minutes": 34},
                {"opponent": "Metro Tech", "pts": 4, "reb": 8, "ast": 1, "stl": 3, "blk": 4, "tov": 2, "fgm": 1, "fga": 5, "tpm": 0, "tpa": 1, "ftm": 2, "fta": 4, "minutes": 30},
                {"opponent": "Lincoln High", "pts": 10, "reb": 6, "ast": 2, "stl": 4, "blk": 2, "tov": 0, "fgm": 4, "fga": 8, "tpm": 1, "tpa": 3, "ftm": 1, "fta": 2, "minutes": 33},
                {"opponent": "Oak Valley", "pts": 7, "reb": 10, "ast": 3, "stl": 6, "blk": 3, "tov": 1, "fgm": 2, "fga": 6, "tpm": 0, "tpa": 2, "ftm": 3, "fta": 4, "minutes": 35},
            ],
        },
        # TEST CASE 4: Dominant big man - rebounds, blocks, limited range
        {
            "name": "DeShawn Williams",
            "grade": "Junior",
            "position": "C",
            "height": "6'8\"",
            "team": "Central High",
            "goals": ["Average double-double", "Improve free throws", "Get stronger"],
            "competition_level": "Varsity",
            "role": "Starting center, rim protector",
            "coach_notes": "DeShawn dominates inside but struggles at the free throw line. Working on mid-range.",
            "games": [
                {"opponent": "West Prep", "pts": 14, "reb": 12, "ast": 1, "stl": 0, "blk": 4, "tov": 2, "fgm": 6, "fga": 10, "tpm": 0, "tpa": 0, "ftm": 2, "fta": 6, "minutes": 28},
                {"opponent": "North Tech", "pts": 12, "reb": 14, "ast": 2, "stl": 1, "blk": 5, "tov": 3, "fgm": 5, "fga": 9, "tpm": 0, "tpa": 0, "ftm": 2, "fta": 5, "minutes": 30},
                {"opponent": "East Valley", "pts": 16, "reb": 11, "ast": 0, "stl": 0, "blk": 3, "tov": 2, "fgm": 7, "fga": 11, "tpm": 0, "tpa": 1, "ftm": 2, "fta": 4, "minutes": 27},
                {"opponent": "Metro Academy", "pts": 10, "reb": 15, "ast": 3, "stl": 1, "blk": 6, "tov": 1, "fgm": 4, "fga": 8, "tpm": 0, "tpa": 0, "ftm": 2, "fta": 6, "minutes": 31},
                {"opponent": "South Central", "pts": 18, "reb": 13, "ast": 1, "stl": 0, "blk": 4, "tov": 2, "fgm": 8, "fga": 12, "tpm": 0, "tpa": 0, "ftm": 2, "fta": 5, "minutes": 29},
            ],
        },
        # TEST CASE 5: Developing freshman - inconsistent, shows flashes
        {
            "name": "Tyler Rodriguez",
            "grade": "Freshman",
            "position": "SG",
            "height": "5'9\"",
            "team": "Valley View High",
            "goals": ["Make JV team", "Improve shooting", "Get more confident"],
            "competition_level": "Freshman",
            "role": "Developing guard, learning the system",
            "coach_notes": "Tyler has potential but is inconsistent. Great attitude, needs more reps.",
            "games": [
                {"opponent": "North Freshman", "pts": 4, "reb": 1, "ast": 2, "stl": 1, "blk": 0, "tov": 3, "fgm": 1, "fga": 6, "tpm": 0, "tpa": 3, "ftm": 2, "fta": 4, "minutes": 14},
                {"opponent": "East JV", "pts": 12, "reb": 3, "ast": 3, "stl": 2, "blk": 0, "tov": 2, "fgm": 5, "fga": 10, "tpm": 2, "tpa": 5, "ftm": 0, "fta": 0, "minutes": 20},
                {"opponent": "South Freshman", "pts": 6, "reb": 2, "ast": 1, "stl": 0, "blk": 0, "tov": 4, "fgm": 2, "fga": 8, "tpm": 1, "tpa": 4, "ftm": 1, "fta": 2, "minutes": 16},
                {"opponent": "West JV", "pts": 8, "reb": 2, "ast": 4, "stl": 1, "blk": 0, "tov": 2, "fgm": 3, "fga": 9, "tpm": 1, "tpa": 5, "ftm": 1, "fta": 2, "minutes": 18},
                {"opponent": "Central Freshman", "pts": 15, "reb": 4, "ast": 2, "stl": 3, "blk": 1, "tov": 1, "fgm": 6, "fga": 11, "tpm": 2, "tpa": 6, "ftm": 1, "fta": 2, "minutes": 24},
            ],
        },
    ]

    created_players = []
    base_date = date.today() - timedelta(days=25)

    for player_data in demo_players:
        # Check if player with same name already exists for this user
        existing = db.execute(
            select(Player).where(
                Player.user_id == current_user.id,
                Player.name == player_data["name"],
            )
        ).scalar_one_or_none()

        if existing:
            continue  # Skip if already exists

        # Create player
        player = Player(
            user_id=current_user.id,
            name=player_data["name"],
            grade=player_data["grade"],
            position=player_data["position"],
            height=player_data["height"],
            team=player_data["team"],
            goals=player_data["goals"],
            competition_level=player_data.get("competition_level"),
            role=player_data.get("role"),
            coach_notes=player_data.get("coach_notes"),
        )
        db.add(player)
        db.flush()  # Get player ID

        # Add the predefined games for each player
        for i, game_data in enumerate(player_data["games"]):
            game_date = base_date + timedelta(days=i * 4)
            game = PlayerGame(
                player_id=player.id,
                game_date=game_date,
                opponent=game_data["opponent"],
                game_label=f"Game {i + 1}",
                minutes=game_data["minutes"],
                pts=game_data["pts"],
                reb=game_data["reb"],
                ast=game_data["ast"],
                stl=game_data["stl"],
                blk=game_data["blk"],
                tov=game_data["tov"],
                fgm=game_data["fgm"],
                fga=game_data["fga"],
                tpm=game_data["tpm"],
                tpa=game_data["tpa"],
                ftm=game_data["ftm"],
                fta=game_data["fta"],
            )
            db.add(game)

        created_players.append(player)

    db.commit()

    # Refresh all created players
    for player in created_players:
        db.refresh(player)

    return created_players
