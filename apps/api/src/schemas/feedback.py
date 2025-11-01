"""Feedback schemas for API request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    """Schema for submitting feedback on a report."""

    rating: int = Field(
        ..., ge=1, le=5, alias="rating_1_5", description="Rating from 1 to 5 stars"
    )
    accurate: bool | None = Field(
        None, alias="accurate_bool", description="Was the report accurate?"
    )
    missing_info: str | None = Field(
        None,
        alias="missing_text",
        max_length=1000,
        description="What was missing from the report?",
    )

    class Config:
        populate_by_name = True


class FeedbackOut(BaseModel):
    """Feedback response schema."""

    id: UUID
    report_id: UUID
    rating_1_5: int
    accurate_bool: bool | None = None
    missing_text: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
