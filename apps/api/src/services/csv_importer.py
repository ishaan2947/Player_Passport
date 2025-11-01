"""CSV import service for game stats."""

import csv
import io
from typing import List, Dict, Any

import structlog

from src.schemas import BasketballStatsCreate

logger = structlog.get_logger()

# Expected CSV columns for basketball stats
BASKETBALL_COLUMNS = {
    "points_for": int,
    "points_against": int,
    "fg_made": int,
    "fg_att": int,
    "three_made": int,
    "three_att": int,
    "ft_made": int,
    "ft_att": int,
    "rebounds_off": int,
    "rebounds_def": int,
    "assists": int,
    "steals": int,
    "blocks": int,
    "turnovers": int,
    "fouls": int,
    "pace_estimate": (int, type(None)),
}

# Column aliases for flexibility
COLUMN_ALIASES = {
    "points scored": "points_for",
    "our score": "points_for",
    "team score": "points_for",
    "points allowed": "points_against",
    "opponent score": "points_against",
    "opp score": "points_against",
    "field goals made": "fg_made",
    "fgm": "fg_made",
    "field goals attempted": "fg_att",
    "fga": "fg_att",
    "3pt made": "three_made",
    "3pm": "three_made",
    "threes made": "three_made",
    "3pt attempted": "three_att",
    "3pa": "three_att",
    "threes attempted": "three_att",
    "free throws made": "ft_made",
    "ftm": "ft_made",
    "free throws attempted": "ft_att",
    "fta": "ft_att",
    "offensive rebounds": "rebounds_off",
    "off reb": "rebounds_off",
    "oreb": "rebounds_off",
    "defensive rebounds": "rebounds_def",
    "def reb": "rebounds_def",
    "dreb": "rebounds_def",
    "ast": "assists",
    "stl": "steals",
    "blk": "blocks",
    "to": "turnovers",
    "tov": "turnovers",
    "pf": "fouls",
    "personal fouls": "fouls",
    "pace": "pace_estimate",
}


def normalize_column_name(col: str) -> str:
    """Normalize column name to match expected format."""
    normalized = col.strip().lower().replace("_", " ")
    # Check aliases first
    if normalized in COLUMN_ALIASES:
        return COLUMN_ALIASES[normalized]
    # Otherwise return as-is with underscores
    return normalized.replace(" ", "_")


def parse_csv_stats(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse CSV content and return list of stats dictionaries.

    Args:
        csv_content: CSV string content

    Returns:
        List of parsed stats dictionaries

    Raises:
        ValueError: If CSV is invalid or missing required columns
    """
    # Parse CSV
    reader = csv.DictReader(io.StringIO(csv_content))

    if not reader.fieldnames:
        raise ValueError("CSV file is empty or has no headers")

    # Map columns
    column_mapping = {}
    for col in reader.fieldnames:
        normalized = normalize_column_name(col)
        if normalized in BASKETBALL_COLUMNS:
            column_mapping[col] = normalized

    # Check required columns
    required = {"points_for", "points_against"}
    mapped_cols = set(column_mapping.values())
    missing = required - mapped_cols
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    # Parse rows
    results = []
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is 1)
        try:
            stats = {}
            for original_col, normalized_col in column_mapping.items():
                value = row.get(original_col, "").strip()
                if value:
                    # Convert to appropriate type
                    expected_type = BASKETBALL_COLUMNS[normalized_col]
                    if isinstance(expected_type, tuple):
                        # Optional field
                        try:
                            stats[normalized_col] = int(value)
                        except ValueError:
                            stats[normalized_col] = None
                    else:
                        stats[normalized_col] = expected_type(value)
                else:
                    # Use default 0 for required int fields
                    if BASKETBALL_COLUMNS[normalized_col] is int:
                        stats[normalized_col] = 0

            # Validate and create schema
            results.append(stats)

        except Exception as e:
            raise ValueError(f"Error parsing row {row_num}: {str(e)}")

    if not results:
        raise ValueError("CSV file has no data rows")

    return results


def validate_stats(stats_dict: Dict[str, Any]) -> BasketballStatsCreate:
    """
    Validate stats dictionary and return Pydantic model.

    Args:
        stats_dict: Dictionary of stats values

    Returns:
        Validated BasketballStatsCreate model

    Raises:
        ValueError: If validation fails
    """
    # Fill in defaults for missing optional fields
    defaults = {
        "fg_made": 0,
        "fg_att": 0,
        "three_made": 0,
        "three_att": 0,
        "ft_made": 0,
        "ft_att": 0,
        "rebounds_off": 0,
        "rebounds_def": 0,
        "assists": 0,
        "steals": 0,
        "blocks": 0,
        "turnovers": 0,
        "fouls": 0,
        "pace_estimate": None,
    }

    full_stats = {**defaults, **stats_dict}

    try:
        return BasketballStatsCreate(**full_stats)
    except Exception as e:
        raise ValueError(f"Stats validation failed: {str(e)}")


def generate_csv_template() -> str:
    """Generate a CSV template for stats import."""
    headers = [
        "points_for",
        "points_against",
        "fg_made",
        "fg_att",
        "three_made",
        "three_att",
        "ft_made",
        "ft_att",
        "rebounds_off",
        "rebounds_def",
        "assists",
        "steals",
        "blocks",
        "turnovers",
        "fouls",
        "pace_estimate",
    ]

    example_row = [
        "85",
        "78",
        "32",
        "65",
        "8",
        "22",
        "13",
        "18",
        "12",
        "28",
        "22",
        "8",
        "5",
        "14",
        "18",
        "",
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(example_row)

    return output.getvalue()
