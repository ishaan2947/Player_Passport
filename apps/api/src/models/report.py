"""
Report model.
"""

import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

# Report status type
ReportStatus = Literal["pending", "generating", "completed", "failed"]


class Report(Base):
    """AI-generated game report."""

    __tablename__ = "reports"

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
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
    )
    report_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    model_used: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    prompt_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    error_text: Mapped[str | None] = mapped_column(
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
    game: Mapped["Game"] = relationship(  # noqa: F821
        "Game",
        back_populates="reports",
    )
    feedback: Mapped[list["Feedback"]] = relationship(  # noqa: F821
        "Feedback",
        back_populates="report",
        cascade="all, delete-orphan",
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
        return f"<Report game={self.game_id} status={self.status}>"
