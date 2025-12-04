"""
Player Game stats model for Player Passport.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class PlayerGame(Base):
    """Individual game performance stats for a player."""

    __tablename__ = "player_games"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Game info
    game_date: Mapped[date] = mapped_column(Date, nullable=False)
    opponent: Mapped[str] = mapped_column(String(255), nullable=False)
    game_label: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g., "Game 1", "vs Eagles"

    # Playing time
    minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Scoring
    pts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Rebounds
    reb: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Playmaking
    ast: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Defense
    stl: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blk: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Turnovers
    tov: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Field Goals
    fgm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fga: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Three Pointers
    tpm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tpa: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Free Throws
    ftm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    player: Mapped["Player"] = relationship(  # noqa: F821
        "Player",
        back_populates="games",
    )

    @property
    def fg_pct(self) -> float | None:
        """Calculate field goal percentage."""
        if self.fga == 0:
            return None
        return round((self.fgm / self.fga) * 100, 1)

    @property
    def three_pct(self) -> float | None:
        """Calculate three-point percentage."""
        if self.tpa == 0:
            return None
        return round((self.tpm / self.tpa) * 100, 1)

    @property
    def ft_pct(self) -> float | None:
        """Calculate free throw percentage."""
        if self.fta == 0:
            return None
        return round((self.ftm / self.fta) * 100, 1)

    def __repr__(self) -> str:
        return f"<PlayerGame {self.game_date} vs {self.opponent}: {self.pts}pts>"
