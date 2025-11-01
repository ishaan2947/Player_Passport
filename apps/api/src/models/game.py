"""
Game model.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Game(Base):
    """Game model."""

    __tablename__ = "games"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    opponent_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    game_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    team: Mapped["Team"] = relationship(  # noqa: F821
        "Team",
        back_populates="games",
    )
    basketball_stats: Mapped["BasketballGameStats | None"] = relationship(  # noqa: F821
        "BasketballGameStats",
        back_populates="game",
        uselist=False,
        cascade="all, delete-orphan",
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report",
        back_populates="game",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Game vs {self.opponent_name} on {self.game_date}>"
