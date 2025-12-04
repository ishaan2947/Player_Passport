"""
Player model for Player Passport.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Player(Base):
    """Player profile for development tracking."""

    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Player info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    grade: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # e.g., "9th", "10th"
    position: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # Guard, Wing, Big
    height: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # e.g., "5'10"
    team: Mapped[str | None] = mapped_column(String(255), nullable=True)
    goals: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Context
    competition_level: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g., "JV", "Varsity", "AAU"
    role: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g., "starter", "rotation"
    injuries: Mapped[str | None] = mapped_column(Text, nullable=True)
    minutes_context: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Notes
    coach_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="players",
    )
    games: Mapped[list["PlayerGame"]] = relationship(  # noqa: F821
        "PlayerGame",
        back_populates="player",
        cascade="all, delete-orphan",
        order_by="PlayerGame.game_date.desc()",
    )
    reports: Mapped[list["PlayerReport"]] = relationship(  # noqa: F821
        "PlayerReport",
        back_populates="player",
        cascade="all, delete-orphan",
        order_by="PlayerReport.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Player {self.name} ({self.position})>"
