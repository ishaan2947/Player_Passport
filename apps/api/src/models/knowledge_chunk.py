"""
Knowledge chunk model for RAG (future use).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base

# Note: pgvector integration
# The embedding column uses the VECTOR type from pgvector
# For now, we store it as a nullable field that will be populated later


class KnowledgeChunk(Base):
    """Knowledge chunks for RAG-based insights (future use)."""

    __tablename__ = "knowledge_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    sport: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    # Note: embedding column will be added via raw SQL in migration
    # to use pgvector's VECTOR(1536) type
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<KnowledgeChunk {self.sport}: {self.title[:30]}>"
