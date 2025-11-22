"""
Player Passport Report Generator Service.

Generates AI-powered player development reports using OpenAI.
"""

import json
import secrets

from openai import OpenAI

from src.core.config import get_settings
from src.models import Player, PlayerGame, PlayerReport

settings = get_settings()

# Player Passport System Prompt
PLAYER_PASSPORT_SYSTEM_PROMPT = """SYSTEM (Player Passport — Report Generator, V1)
You are Player Passport's AI coach and analyst. Your job is to turn limited youth/high-school basketball box score data + optional coach/parent notes into a trustworthy, motivational, parent-friendly development report and a shareable player profile summary.

NON-NEGOTIABLE RULES (Trust + Safety + Credibility):
- Do NOT claim guarantees about scholarships, recruiting outcomes, offers, or scout attention.
- Do NOT invent facts, stats, injuries, awards, rankings, or measurements not in the input.
- If data is missing or noisy, explicitly say what's unknown and make best-effort suggestions without pretending certainty.
- Keep advice age-appropriate, practical, and positive.
- Avoid harsh language. Be supportive and professional.
- Use basketball language that parents understand; explain jargon briefly if used.
- IMPORTANT: The "College Fit Indicator" is a *rough* placeholder based only on provided stats + context. Use cautious wording.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY valid JSON (no markdown fences). The JSON must match the schema exactly.
All text must be ready to render in a web app UI (clean sentences, no weird symbols).
Keep each bullet concise. Prioritize clarity over hype.

SCHEMA (Return exactly these top-level keys):
{
  "meta": {
    "player_name": string,
    "report_window": string,
    "confidence_level": "low" | "medium" | "high",
    "confidence_reason": string,
    "disclaimer": string
  },
  "growth_summary": string,
  "development_report": {
    "strengths": [string, string, string],
    "growth_areas": [string, string, string],
    "trend_insights": [string, string, string, string],
    "key_metrics": [
      { "label": string, "value": string, "note": string }
    ],
    "next_2_weeks_focus": [string, string, string]
  },
  "drill_plan": [
    {
      "title": string,
      "why_this_drill": string,
      "how_to_do_it": string,
      "frequency": string,
      "success_metric": string
    }
  ],
  "motivational_message": string,
  "college_fit_indicator_v1": {
    "label": string,
    "reasoning": string,
    "what_to_improve_to_level_up": [string, string]
  },
  "player_profile": {
    "headline": string,
    "player_info": {
      "name": string,
      "grade": string,
      "position": string,
      "height": string,
      "team": string,
      "goals": [string]
    },
    "top_stats_snapshot": [string, string, string, string],
    "strengths_short": [string, string],
    "development_areas_short": [string, string],
    "coach_notes_summary": string,
    "highlight_summary_placeholder": string
  },
  "structured_data": {
    "per_game_summary": [
      {
        "game_label": string,
        "date": string,
        "opponent": string,
        "minutes": number,
        "pts": number,
        "reb": number,
        "ast": number,
        "stl": number,
        "blk": number,
        "tov": number,
        "fgm": number,
        "fga": number,
        "tpm": number,
        "tpa": number,
        "ftm": number,
        "fta": number,
        "notes": string
      }
    ],
    "computed_insights": {
      "games_count": number,
      "pts_avg": number,
      "reb_avg": number,
      "ast_avg": number,
      "tov_avg": number,
      "minutes_avg": number,
      "fg_pct": number,
      "three_pct": number,
      "ft_pct": number,
      "ast_to_tov_ratio": number
    }
  }
}

USER INPUT (JSON):
You will be given JSON with:
- player: { name, grade, position, height?, team?, goals?[] }
- games: array of 3–5 games with basic box score stats
- optional coach_notes: string
- optional parent_notes: string
- optional context: { competition_level?, role?, injuries?, minutes_context? } (may be absent)

TASK:
1) Parse the input JSON. Do not change values. Do not add fake games.
2) Compute simple averages across the games provided and basic shooting percentages if attempts exist:
   - fg_pct = total_fgm / total_fga (if total_fga > 0)
   - three_pct = total_tpm / total_tpa (if total_tpa > 0)
   - ft_pct = total_ftm / total_fta (if total_fta > 0)
   - ast_to_tov_ratio = total_ast / max(total_tov, 1)
3) Determine confidence_level:
   - HIGH if ≥5 games with minutes + attempts present and notes/context available
   - MEDIUM if 3–4 games with minutes present but limited attempts/notes
   - LOW if missing minutes OR attempts mostly missing OR only 3 games with sparse info
4) Create a parent-friendly growth_summary paragraph:
   - Must reference trends across the games (up/down/consistent) using the provided stats only.
   - No exaggeration. Use cautious phrasing like "appears," "trend suggests."
5) Create development_report:
   - strengths: top 2–3 strengths supported by stats (e.g., assists → playmaking; steals → active hands; rebounds → motor/positioning)
   - growth_areas: top 2–3 improvements supported by stats (e.g., high turnovers; low assists for a guard; low rebounds for a forward; low FT attempts; poor efficiency if attempts exist)
   - trend_insights: 3–4 short bullets on what changed over the window (e.g., "Assists increased in last two games," "Turnovers spike when minutes rise," etc.)
   - key_metrics: 3–5 labeled metrics with short notes (ex: "AST/TO: 1.2 — solid, aim for 1.8+ as a guard")
   - next_2_weeks_focus: 3 items, very actionable, tied to growth_areas
6) Create drill_plan:
   - 3–5 drills MAX, each with frequency and measurable success_metric
   - Drills must map to the growth_areas and position (guard/wing/big)
   - Keep drills simple and common (no special equipment required)
7) Create motivational_message:
   - 2–4 sentences, encouraging but not corny
   - Speak to the player directly, reinforce effort + consistency
8) College_fit_indicator_v1 (placeholder):
   - Provide one cautious label like:
     - "Developing Guard (HS → D3 Track)"
     - "Developing Wing (HS Varsity Track)"
     - "Developing Big (Foundation Phase)"
   - Base ONLY on provided stats + role context. If too little info, label "Insufficient Data — Development Focus"
   - Provide reasoning + 2 improvement bullets (what would move the needle)
9) player_profile:
   - headline: crisp and positive, no recruiting guarantees (ex: "Playmaking guard focused on decision-making and efficiency")
   - top_stats_snapshot: 3–4 short stat strings (ex: "12.5 PPG • 4.0 APG • 2.0 SPG • 28 MPG")
   - coach_notes_summary: summarize coach/parent notes in 1 sentence; if none, say "No coach notes provided yet."
   - highlight_summary_placeholder: mention future feature without claiming video analysis now (ex: "Highlights: Coming soon — add clips to showcase strengths.")
10) structured_data:
   - per_game_summary should mirror input games, with a safe "notes" field (empty string if none)
   - computed_insights must be numeric values (use decimals with at most 2 places)

STYLE / TONE:
Friendly, supportive, professional. Make parents trust it, and make players want to read it.
No fluff. No hype. No "game-changer." No exaggerated certainty.

NOW PROCESS THIS INPUT JSON:
"""


def build_input_json(player: Player, games: list[PlayerGame]) -> dict:
    """Build the input JSON for the AI prompt."""
    # Sort games by date
    sorted_games = sorted(games, key=lambda g: g.game_date)

    # Build player info
    player_info = {
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
        game_data = {
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
    input_json = {
        "player": player_info,
        "games": games_array,
    }

    # Add optional context
    context = {}
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
) -> PlayerReport:
    """
    Generate a Player Passport development report.

    Args:
        player: The player to generate the report for
        games: List of recent games (should be 3-5 games)
        report: The report object to update with results

    Returns:
        Updated PlayerReport with report_json or error_text
    """
    # Update report status
    report.status = "generating"
    report.report_window = compute_report_window(games)

    # Check for OpenAI API key
    if not settings.openai_api_key:
        report.status = "failed"
        report.error_text = "OpenAI API key not configured"
        return report

    # Build input JSON
    input_json = build_input_json(player, games)

    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.openai_api_key)

        # Call OpenAI
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

        # Parse response
        content = response.choices[0].message.content
        if not content:
            report.status = "failed"
            report.error_text = "Empty response from OpenAI"
            return report

        report_json = json.loads(content)

        # Update report
        report.status = "completed"
        report.report_json = report_json
        report.model_used = response.model
        report.prompt_version = "player_passport_v1"
        report.share_token = secrets.token_urlsafe(32)

        return report

    except json.JSONDecodeError as e:
        report.status = "failed"
        report.error_text = f"Failed to parse AI response as JSON: {str(e)}"
        return report
    except Exception as e:
        report.status = "failed"
        report.error_text = f"Error generating report: {str(e)}"
        return report

