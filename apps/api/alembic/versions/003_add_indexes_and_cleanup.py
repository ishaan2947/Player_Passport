"""Add performance indexes and cleanup

Revision ID: 003_add_indexes
Revises: 002_player_passport
Create Date: 2025-02-23 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_indexes"
down_revision: Union[str, None] = "002_player_passport"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite index for common query: player's games sorted by date
    op.create_index(
        "ix_player_games_player_date",
        "player_games",
        ["player_id", "game_date"],
    )

    # Index for report status polling (pending/generating reports)
    op.create_index(
        "ix_player_reports_status",
        "player_reports",
        ["status"],
    )

    # Composite index for player reports by player + creation date
    op.create_index(
        "ix_player_reports_player_created",
        "player_reports",
        ["player_id", "created_at"],
    )

    # Index on players.created_at for sorting
    op.create_index(
        "ix_players_created_at",
        "players",
        ["created_at"],
    )

    # Index on users.email for lookups
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
    )


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_players_created_at", table_name="players")
    op.drop_index("ix_player_reports_player_created", table_name="player_reports")
    op.drop_index("ix_player_reports_status", table_name="player_reports")
    op.drop_index("ix_player_games_player_date", table_name="player_games")
