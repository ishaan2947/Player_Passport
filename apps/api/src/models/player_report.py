"""
Player Report model for Player Passport.
"""

import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

# Report status type
PlayerReportStatus = Literal["pending", "generating", "completed", "failed"]


class PlayerReport(Base):
    """AI-generated player development report."""

    __tablename__ = "player_reports"

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

    # Report metadata
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
    )
    report_window: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g., "Dec 15-28, 2024"

    # The full report JSON matching the schema
    report_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # AI metadata
    # Note: Using model_used (not ai_model) to match database schema
    # Pydantic warning is suppressed via model_config in schemas
    model_used: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    prompt_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Error handling
    error_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Sharing
    share_token: Mapped[str | None] = mapped_column(
        String(64),
        unique=True,
        nullable=True,
        index=True,
    )
    is_public: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    player: Mapped["Player"] = relationship(  # noqa: F821
        "Player",
        back_populates="reports",
    )
    feedback: Mapped[list["Feedback"]] = relationship(  # noqa: F821
        "Feedback",
        back_populates="player_report",
        cascade="all, delete-orphan",
        foreign_keys="Feedback.player_report_id",
    )

    @property
    def is_completed(self) -> bool:
        """Check if report generation is complete."""
        return self.status == "completed"

    @property
    def is_failed(self) -> bool:
        """Check if report generation failed."""
        return self.status == "failed"

    def __repr__(self) -> str:
        return f"<PlayerReport player={self.player_id} status={self.status}>"

