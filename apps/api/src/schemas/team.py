"""Team schemas for API request/response validation."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    """Schema for creating a new team."""

    name: str = Field(..., min_length=1, max_length=100, description="Team name")
    sport: Literal["basketball"] = Field(
        default="basketball", description="Sport type (currently only basketball)"
    )


class TeamUpdate(BaseModel):
    """Schema for updating a team."""

    name: str | None = Field(
        None, min_length=1, max_length=100, description="Team name"
    )


class TeamOut(BaseModel):
    """Team response schema."""

    id: UUID
    name: str
    sport: str
    created_at: datetime

    class Config:
        from_attributes = True


class TeamMemberCreate(BaseModel):
    """Schema for adding a team member."""

    email: str = Field(..., description="Email of the user to add")
    role: Literal["owner", "coach", "member"] = Field(
        default="member", description="Role in the team"
    )


class TeamMemberOut(BaseModel):
    """Team member response schema."""

    id: UUID
    user_id: UUID
    team_id: UUID
    role: str
    created_at: datetime
    user_email: str | None = None

    class Config:
        from_attributes = True


class TeamWithMembers(BaseModel):
    """Team with members response schema."""

    id: UUID
    name: str
    sport: str
    created_at: datetime
    members: list[TeamMemberOut] = []

    class Config:
        from_attributes = True
