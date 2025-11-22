"""Add Player Passport tables

Revision ID: 002_player_passport
Revises: 001_initial_schema
Create Date: 2024-12-28 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_player_passport"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create players table
    op.create_table(
        "players",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("grade", sa.String(50), nullable=False),
        sa.Column("position", sa.String(50), nullable=False),
        sa.Column("height", sa.String(20), nullable=True),
        sa.Column("team", sa.String(255), nullable=True),
        sa.Column("goals", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("competition_level", sa.String(100), nullable=True),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("injuries", sa.Text(), nullable=True),
        sa.Column("minutes_context", sa.Text(), nullable=True),
        sa.Column("coach_notes", sa.Text(), nullable=True),
        sa.Column("parent_notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_players_user_id", "players", ["user_id"])

    # Create player_games table
    op.create_table(
        "player_games",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("game_date", sa.Date(), nullable=False),
        sa.Column("opponent", sa.String(255), nullable=False),
        sa.Column("game_label", sa.String(100), nullable=True),
        sa.Column("minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reb", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ast", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stl", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("blk", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tov", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fgm", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fga", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tpm", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tpa", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ftm", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fta", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["player_id"],
            ["players.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_player_games_player_id", "player_games", ["player_id"])

    # Create player_reports table
    op.create_table(
        "player_reports",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("report_window", sa.String(100), nullable=True),
        sa.Column("report_json", postgresql.JSONB(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("prompt_version", sa.String(50), nullable=True),
        sa.Column("error_text", sa.Text(), nullable=True),
        sa.Column("share_token", sa.String(64), nullable=True, unique=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["player_id"],
            ["players.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_player_reports_player_id", "player_reports", ["player_id"])
    op.create_index("ix_player_reports_share_token", "player_reports", ["share_token"])

    # Add player_report_id to feedback table
    op.add_column(
        "feedback",
        sa.Column("player_report_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_feedback_player_report_id", "feedback", ["player_report_id"])
    op.create_foreign_key(
        "fk_feedback_player_report_id",
        "feedback",
        "player_reports",
        ["player_report_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Make report_id nullable in feedback (for backward compatibility)
    op.alter_column("feedback", "report_id", nullable=True)


def downgrade() -> None:
    # Remove player_report_id from feedback
    op.drop_constraint("fk_feedback_player_report_id", "feedback", type_="foreignkey")
    op.drop_index("ix_feedback_player_report_id", "feedback")
    op.drop_column("feedback", "player_report_id")

    # Restore report_id as not nullable
    op.alter_column("feedback", "report_id", nullable=False)

    # Drop player_reports table
    op.drop_index("ix_player_reports_share_token", "player_reports")
    op.drop_index("ix_player_reports_player_id", "player_reports")
    op.drop_table("player_reports")

    # Drop player_games table
    op.drop_index("ix_player_games_player_id", "player_games")
    op.drop_table("player_games")

    # Drop players table
    op.drop_index("ix_players_user_id", "players")
    op.drop_table("players")

