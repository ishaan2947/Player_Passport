"""Convert players.goals from array to jsonb

Revision ID: 004_convert_goals_jsonb
Revises: 003_add_indexes
Create Date: 2026-02-23 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_convert_goals_jsonb"
down_revision: Union[str, None] = "003_add_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert goals from character varying[] (PostgreSQL array) to jsonb
    # to_jsonb() handles the conversion natively
    op.execute(
        "ALTER TABLE players ALTER COLUMN goals TYPE jsonb USING to_jsonb(goals)"
    )


def downgrade() -> None:
    # Convert back from jsonb to character varying[]
    op.execute(
        "ALTER TABLE players ALTER COLUMN goals TYPE character varying[] "
        "USING ARRAY(SELECT jsonb_array_elements_text(goals))"
    )
