"""
Player Passport Report Generator Service.

Generates AI-powered player development reports using OpenAI with:
- Structured JSON schema validation
- Timeout and retry logic
- Safety guardrails
- Caching for duplicate requests
"""

import hashlib
import json
import secrets
from pathlib import Path
from typing import Any

import structlog
from openai import OpenAI, OpenAIError
from openai.types.chat import ChatCompletion

from src.core.config import get_settings
from src.models import Player, PlayerGame, PlayerReport
from src.schemas.player_report_content import PlayerReportContent

logger = structlog.get_logger()
settings = get_settings()

# Prompt version
PROMPT_VERSION = "player_passport_v1"

# Load prompt from file
_prompt_path = Path(__file__).parent / "prompts" / f"{PROMPT_VERSION}.txt"
if _prompt_path.exists():
    PLAYER_PASSPORT_SYSTEM_PROMPT = _prompt_path.read_text(encoding="utf-8")
else:
    # Fallback to embedded prompt if file doesn't exist
    logger.warning(
        "Prompt file not found, using fallback", prompt_path=str(_prompt_path)
    )
    PLAYER_PASSPORT_SYSTEM_PROMPT = """SYSTEM (Player Passport — Report Generator, V1)
You are Player Passport's AI coach and analyst. Your job is to turn limited youth/high-school basketball box score data + optional coach/parent notes into a trustworthy, motivational, parent-friendly development report and a shareable player profile summary.

NON-NEGOTIABLE RULES (Trust + Safety + Credibility):
- Do NOT claim guarantees about scholarships, recruiting outcomes, offers, or scout attention.
- Do NOT invent facts, stats, injuries, awards, rankings, or measurements not in the input.
- Do NOT provide medical advice, diagnoses, or treatment recommendations.
- If data is missing or noisy, explicitly say what's unknown and make best-effort suggestions without pretending certainty.
- Keep advice age-appropriate, practical, and positive.
- Avoid harsh language. Be supportive and professional.
- Use basketball language that parents understand; explain jargon briefly if used.
- IMPORTANT: The "College Fit Indicator" is a *rough* placeholder based only on provided stats + context. Use cautious wording.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY valid JSON (no markdown fences). The JSON must match the schema exactly.
All text must be ready to render in a web app UI (clean sentences, no weird symbols).
Keep each bullet concise. Prioritize clarity over hype.

[Full prompt schema details...]
"""

# Simple in-memory cache for report generation
# Key: hash of (player_id + game_ids), Value: (report_json, timestamp)
_report_cache: dict[str, tuple[dict[str, Any], float]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def _get_cache_key(player_id: str, game_ids: list[str]) -> str:
    """Generate a cache key from player ID and game IDs."""
    key_string = f"{player_id}:{':'.join(sorted(game_ids))}"
    return hashlib.sha256(key_string.encode()).hexdigest()


def _get_cached_report(cache_key: str) -> dict[str, Any] | None:
    """Get a cached report if it exists and is still valid."""
    import time

    if cache_key not in _report_cache:
        return None

    cached_json, cached_time = _report_cache[cache_key]
    if time.time() - cached_time > CACHE_TTL_SECONDS:
        # Cache expired
        del _report_cache[cache_key]
        return None

    return cached_json


def _cache_report(cache_key: str, report_json: dict[str, Any]) -> None:
    """Cache a report JSON."""
    import time

    _report_cache[cache_key] = (report_json, time.time())


def build_input_json(player: Player, games: list[PlayerGame]) -> dict:
    """Build the input JSON for the AI prompt."""
    # Sort games by date
    sorted_games = sorted(games, key=lambda g: g.game_date)

    # Build player info
    player_info: dict[str, Any] = {
        "name": player.name,
        "grade": player.grade,
        "position": player.position,
    }
    if player.height:
        player_info["height"] = player.height
    if player.team:
        player_info["team"] = player.team
    if player.goals:
        player_info["goals"] = player.goals

    # Build games array
    games_array = []
    for i, game in enumerate(sorted_games):
        game_data: dict[str, Any] = {
            "game_label": game.game_label or f"Game {i + 1}",
            "date": game.game_date.isoformat(),
            "opponent": game.opponent,
            "minutes": game.minutes,
            "pts": game.pts,
            "reb": game.reb,
            "ast": game.ast,
            "stl": game.stl,
            "blk": game.blk,
            "tov": game.tov,
            "fgm": game.fgm,
            "fga": game.fga,
            "tpm": game.tpm,
            "tpa": game.tpa,
            "ftm": game.ftm,
            "fta": game.fta,
        }
        if game.notes:
            game_data["notes"] = game.notes
        games_array.append(game_data)

    # Build input
    input_json: dict[str, Any] = {
        "player": player_info,
        "games": games_array,
    }

    # Add optional context
    context: dict[str, str] = {}
    if player.competition_level:
        context["competition_level"] = player.competition_level
    if player.role:
        context["role"] = player.role
    if player.injuries:
        context["injuries"] = player.injuries
    if player.minutes_context:
        context["minutes_context"] = player.minutes_context
    if context:
        input_json["context"] = context

    # Add notes
    if player.coach_notes:
        input_json["coach_notes"] = player.coach_notes
    if player.parent_notes:
        input_json["parent_notes"] = player.parent_notes

    return input_json


def compute_report_window(games: list[PlayerGame]) -> str:
    """Compute the report window string from games."""
    if not games:
        return "No games"

    sorted_games = sorted(games, key=lambda g: g.game_date)
    start_date = sorted_games[0].game_date
    end_date = sorted_games[-1].game_date

    if start_date == end_date:
        return start_date.strftime("%b %d, %Y")

    if start_date.year == end_date.year:
        if start_date.month == end_date.month:
            return f"{start_date.strftime('%b %d')}-{end_date.strftime('%d, %Y')}"
        return f"{start_date.strftime('%b %d')}-{end_date.strftime('%b %d, %Y')}"

    return f"{start_date.strftime('%b %d, %Y')}-{end_date.strftime('%b %d, %Y')}"


async def generate_player_report(
    player: Player,
    games: list[PlayerGame],
    report: PlayerReport,
    correlation_id: str | None = None,
) -> PlayerReport:
    """
    Generate a Player Passport development report.

    Args:
        player: The player to generate the report for
        games: List of recent games (should be 3-5 games)
        report: The report object to update with results
        correlation_id: Optional correlation ID for request tracking

    Returns:
        Updated PlayerReport with report_json or error_text
    """
    log = logger.bind(
        player_id=str(player.id),
        report_id=str(report.id),
        correlation_id=correlation_id,
        games_count=len(games),
    )

    # Update report status
    report.status = "generating"
    report.report_window = compute_report_window(games)

    # Check for OpenAI API key
    if not settings.openai_api_key:
        report.status = "failed"
        report.error_text = "OpenAI API key not configured"
        log.error("Report generation failed: OpenAI API key not configured")
        return report

    # Check cache first
    game_ids = [str(g.id) for g in games]
    cache_key = _get_cache_key(str(player.id), game_ids)
    cached_json = _get_cached_report(cache_key)
    if cached_json:
        log.info("Using cached report")
        report.status = "completed"
        report.report_json = cached_json
        report.prompt_version = PROMPT_VERSION
        report.share_token = secrets.token_urlsafe(32)
        return report

    # Build input JSON
    input_json = build_input_json(player, games)

    try:
        # Initialize OpenAI client with timeout
        client = OpenAI(
            api_key=settings.openai_api_key,
            timeout=60.0,  # 60 second timeout
            max_retries=2,  # Retry up to 2 times
        )

        log.info("Calling OpenAI API", model="gpt-4o")

        # Call OpenAI with retry logic
        response: ChatCompletion | None = None

        for attempt in range(3):  # Try up to 3 times
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": PLAYER_PASSPORT_SYSTEM_PROMPT},
                        {"role": "user", "content": json.dumps(input_json, indent=2)},
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                    response_format={"type": "json_object"},
                )
                break  # Success, exit retry loop
            except OpenAIError as e:
                if attempt < 2:  # Not the last attempt
                    log.warning(
                        "OpenAI API call failed, retrying",
                        attempt=attempt + 1,
                        error=str(e),
                    )
                    import asyncio

                    await asyncio.sleep(1.0 * (attempt + 1))  # Exponential backoff
                else:
                    raise

        if not response:
            raise ValueError("No response from OpenAI after retries")

        # Parse response
        content = response.choices[0].message.content
        if not content:
            report.status = "failed"
            report.error_text = "Empty response from OpenAI"
            log.error("Report generation failed: Empty response")
            return report

        # Parse JSON
        try:
            report_json_raw = json.loads(content)
        except json.JSONDecodeError as e:
            report.status = "failed"
            report.error_text = f"Failed to parse AI response as JSON: {str(e)}"
            log.error("Report generation failed: Invalid JSON", error=str(e))
            return report

        # Validate against structured schema
        try:
            validated_content = PlayerReportContent.model_validate(report_json_raw)
            report_json = validated_content.model_dump(mode="json")
            log.info("Report JSON validated successfully")
        except Exception as e:
            report.status = "failed"
            report.error_text = f"Report validation failed: {str(e)}"
            log.error(
                "Report generation failed: Schema validation error",
                error=str(e),
                error_type=type(e).__name__,
            )
            return report

        # Cache the validated report
        _cache_report(cache_key, report_json)

        # Update report
        report.status = "completed"
        report.report_json = report_json
        # Use ai_model instead of model_used to avoid Pydantic namespace conflict
        report.model_used = response.model
        report.prompt_version = PROMPT_VERSION
        report.share_token = secrets.token_urlsafe(32)

        log.info("Report generated successfully", model=response.model)

        return report

    except json.JSONDecodeError as e:
        report.status = "failed"
        report.error_text = f"Failed to parse AI response as JSON: {str(e)}"
        log.error("Report generation failed: JSON decode error", error=str(e))
        return report
    except OpenAIError as e:
        report.status = "failed"
        report.error_text = f"OpenAI API error: {str(e)}"
        log.error(
            "Report generation failed: OpenAI error",
            error=str(e),
            error_type=type(e).__name__,
        )
        return report
    except Exception as e:
        report.status = "failed"
        report.error_text = f"Error generating report: {str(e)}"
        log.error(
            "Report generation failed: Unexpected error",
            error=str(e),
            error_type=type(e).__name__,
        )
        return report
