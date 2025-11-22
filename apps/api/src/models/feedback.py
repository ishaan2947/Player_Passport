"""
Feedback model for report ratings.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Feedback(Base):
    """User feedback on generated reports."""

    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    # Legacy: links to old team-based reports
    report_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # New: links to player development reports
    player_report_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("player_reports.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    rating_1_5: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    accurate_bool: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    missing_text: Mapped[str | None] = mapped_column(
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
    report: Mapped["Report | None"] = relationship(  # noqa: F821
        "Report",
        back_populates="feedback",
    )
    player_report: Mapped["PlayerReport | None"] = relationship(  # noqa: F821
        "PlayerReport",
        back_populates="feedback",
        foreign_keys=[player_report_id],
    )

    def __repr__(self) -> str:
        report_ref = self.player_report_id or self.report_id
        return f"<Feedback report={report_ref} rating={self.rating_1_5}>"
