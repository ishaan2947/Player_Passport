"""
Basketball game stats model.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class BasketballGameStats(Base):
    """Basketball-specific game statistics."""

    __tablename__ = "basketball_game_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    game_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Scoring
    points_for: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    points_against: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Field Goals
    fg_made: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fg_att: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Three Pointers
    three_made: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    three_att: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Free Throws
    ft_made: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ft_att: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Rebounds
    rebounds_off: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rebounds_def: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Other Stats
    assists: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    steals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blocks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    turnovers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fouls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Optional advanced stats
    pace_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    game: Mapped["Game"] = relationship(  # noqa: F821
        "Game",
        back_populates="basketball_stats",
    )

    @property
    def total_rebounds(self) -> int:
        """Calculate total rebounds."""
        return self.rebounds_off + self.rebounds_def

    @property
    def fg_percentage(self) -> float | None:
        """Calculate field goal percentage."""
        if self.fg_att == 0:
            return None
        return round((self.fg_made / self.fg_att) * 100, 1)

    @property
    def three_percentage(self) -> float | None:
        """Calculate three-point percentage."""
        if self.three_att == 0:
            return None
        return round((self.three_made / self.three_att) * 100, 1)

    @property
    def ft_percentage(self) -> float | None:
        """Calculate free throw percentage."""
        if self.ft_att == 0:
            return None
        return round((self.ft_made / self.ft_att) * 100, 1)

    @property
    def point_differential(self) -> int:
        """Calculate point differential."""
        return self.points_for - self.points_against

    def __repr__(self) -> str:
        return f"<BasketballStats {self.points_for}-{self.points_against}>"
