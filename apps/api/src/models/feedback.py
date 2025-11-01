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
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
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
    report: Mapped["Report"] = relationship(  # noqa: F821
        "Report",
        back_populates="feedback",
    )

    def __repr__(self) -> str:
        return f"<Feedback report={self.report_id} rating={self.rating_1_5}>"
