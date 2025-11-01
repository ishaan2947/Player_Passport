"""LLM-powered game report generation service."""

import json
import time

from openai import OpenAI
from pydantic import ValidationError
from sqlalchemy.orm import Session

import structlog

from src.core.config import get_settings
from src.models import Game, BasketballGameStats, Report
from src.schemas.report import ReportContent

logger = structlog.get_logger()
settings = get_settings()

# Initialize OpenAI client
client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


def _build_stats_summary(stats: BasketballGameStats) -> str:
    """Build a human-readable summary of game stats."""
    lines = [
        f"Final Score: {stats.points_for} - {stats.points_against}",
        f"Result: {'Win' if stats.points_for > stats.points_against else 'Loss' if stats.points_for < stats.points_against else 'Tie'}",
        f"Point Differential: {stats.points_for - stats.points_against:+d}",
    ]

    # Shooting stats
    if stats.fg_att > 0:
        fg_pct = (stats.fg_made / stats.fg_att) * 100
        lines.append(f"Field Goals: {stats.fg_made}/{stats.fg_att} ({fg_pct:.1f}%)")

    if stats.three_att > 0:
        three_pct = (stats.three_made / stats.three_att) * 100
        lines.append(
            f"Three-Pointers: {stats.three_made}/{stats.three_att} ({three_pct:.1f}%)"
        )

    if stats.ft_att > 0:
        ft_pct = (stats.ft_made / stats.ft_att) * 100
        lines.append(f"Free Throws: {stats.ft_made}/{stats.ft_att} ({ft_pct:.1f}%)")

    # Rebounds
    total_rebounds = stats.rebounds_off + stats.rebounds_def
    lines.append(
        f"Rebounds: {total_rebounds} (Off: {stats.rebounds_off}, Def: {stats.rebounds_def})"
    )

    # Other stats
    lines.append(f"Assists: {stats.assists}")
    lines.append(f"Steals: {stats.steals}")
    lines.append(f"Blocks: {stats.blocks}")
    lines.append(f"Turnovers: {stats.turnovers}")
    lines.append(f"Team Fouls: {stats.fouls}")

    return "\n".join(lines)


def _detect_risk_flags(stats: BasketballGameStats) -> list[str]:
    """Detect data quality issues or unusual patterns."""
    flags = []

    # Unusual patterns
    if stats.points_for > 150 or stats.points_against > 150:
        flags.append("Unusually high score - verify data accuracy")

    if stats.fg_att > 0:
        fg_pct = (stats.fg_made / stats.fg_att) * 100
        if fg_pct > 70:
            flags.append("Unusually high FG% - verify data accuracy")
        if fg_pct < 20:
            flags.append("Unusually low FG% - verify data accuracy")

    return flags


def _build_prompt(
    game: Game,
    stats: BasketballGameStats,
    additional_context: str | None = None,
) -> str:
    """Build the prompt for the LLM."""
    stats_summary = _build_stats_summary(stats)

    prompt = f"""You are an experienced basketball coach providing a post-game analysis report.

GAME INFORMATION:
- Opponent: {game.opponent_name}
- Date: {game.game_date.strftime("%B %d, %Y")}
- Location: {game.location or "Not specified"}

GAME STATISTICS:
{stats_summary}

{f"COACH'S NOTES: {game.notes}" if game.notes else ""}
{f"ADDITIONAL CONTEXT: {additional_context}" if additional_context else ""}

Based on these statistics, provide a structured coaching report. Be specific and use the actual numbers from the stats. Focus on actionable insights that can improve performance.

Guidelines:
- The summary should be 2-4 sentences highlighting the key story of the game
- Each insight must cite specific statistics as evidence
- Set confidence to "high" if you have clear data, "medium" if data is partial, "low" if inferring
- Action items should be specific and measurable
- Practice focus should be the single most important area to work on
- Questions should prompt strategic thinking for the next game

Return ONLY valid JSON with this exact structure:
{{
    "summary": "2-4 sentence game overview",
    "key_insights": [
        {{"title": "...", "description": "...", "evidence": "...", "confidence": "high|medium|low"}},
        {{"title": "...", "description": "...", "evidence": "...", "confidence": "high|medium|low"}},
        {{"title": "...", "description": "...", "evidence": "...", "confidence": "high|medium|low"}}
    ],
    "action_items": [
        {{"title": "...", "description": "...", "metric": "...", "priority": "high|medium|low"}},
        {{"title": "...", "description": "...", "metric": "...", "priority": "high|medium|low"}}
    ],
    "practice_focus": "One clear theme to work on",
    "questions_for_next_game": [
        {{"question": "...", "context": "..."}},
        {{"question": "...", "context": "..."}}
    ]
}}"""

    return prompt


async def generate_game_report(
    db: Session,
    game: Game,
    stats: BasketballGameStats,
    additional_context: str | None = None,
    existing_report: Report | None = None,
) -> Report:
    """
    Generate a game report using OpenAI's API.

    Includes schema validation with one repair attempt.
    """
    if not client:
        raise ValueError("OpenAI API key not configured")

    prompt = _build_prompt(game, stats, additional_context)
    risk_flags = _detect_risk_flags(stats)

    model = "gpt-4o"
    start_time = time.time()

    logger.info(
        "Generating report",
        game_id=str(game.id),
        model=model,
    )

    # First attempt
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an expert basketball coach providing detailed game analysis. Always respond with valid JSON matching the exact schema provided.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=2000,
    )

    content = response.choices[0].message.content
    prompt_tokens = response.usage.prompt_tokens if response.usage else None
    completion_tokens = response.usage.completion_tokens if response.usage else None

    # Parse and validate
    try:
        data = json.loads(content)
        report_content = ReportContent(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(
            "First generation failed validation, attempting repair",
            error=str(e),
            game_id=str(game.id),
        )

        # Repair attempt
        repair_prompt = f"""The previous response had validation errors:
{str(e)}

Please fix the JSON and ensure it matches this schema exactly:
- summary: string (2-4 sentences, 50-500 characters)
- key_insights: array of exactly 3 objects, each with title, description, evidence, confidence (high/medium/low)
- action_items: array of exactly 2 objects, each with title, description, metric, priority (high/medium/low)
- practice_focus: string (20-300 characters)
- questions_for_next_game: array of 2-3 objects, each with question and context

Previous response:
{content}

Return ONLY the corrected JSON."""

        repair_response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Fix the JSON to match the required schema exactly.",
                },
                {"role": "user", "content": repair_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2000,
        )

        content = repair_response.choices[0].message.content
        if repair_response.usage:
            prompt_tokens = (prompt_tokens or 0) + repair_response.usage.prompt_tokens
            completion_tokens = (
                completion_tokens or 0
            ) + repair_response.usage.completion_tokens

        # Try parsing again - if it fails, raise the error
        try:
            data = json.loads(content)
            report_content = ReportContent(**data)
            risk_flags.append("Report required one repair attempt")
        except (json.JSONDecodeError, ValidationError) as e2:
            logger.error(
                "Repair attempt also failed",
                error=str(e2),
                game_id=str(game.id),
            )
            raise ValueError(f"Failed to generate valid report after repair: {e2}")

    generation_time_ms = int((time.time() - start_time) * 1000)

    # Build report_json with all content and metadata
    report_json = {
        "summary": report_content.summary,
        "key_insights": [i.model_dump() for i in report_content.key_insights],
        "action_items": [i.model_dump() for i in report_content.action_items],
        "practice_focus": report_content.practice_focus,
        "questions_for_next_game": [
            q.model_dump() for q in report_content.questions_for_next_game
        ],
        "model_used": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "generation_time_ms": generation_time_ms,
        "risk_flags": risk_flags,
    }

    # Create or update report
    if existing_report:
        # Update existing report
        existing_report.status = "completed"
        existing_report.report_json = report_json
        existing_report.model_used = model
        existing_report.prompt_version = "v1"
        existing_report.error_text = None
        db.commit()
        db.refresh(existing_report)
        return existing_report
    else:
        # Create new report
        report = Report(
            game_id=game.id,
            status="completed",
            report_json=report_json,
            model_used=model,
            prompt_version="v1",
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
