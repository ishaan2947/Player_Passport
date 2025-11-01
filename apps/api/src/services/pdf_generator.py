"""PDF generation service for game reports."""

from fpdf import FPDF

import structlog

from src.models import Report, Game, BasketballGameStats

logger = structlog.get_logger()


class ReportPDF(FPDF):
    """Custom PDF class for game reports."""

    def __init__(self, game: Game, report: Report):
        super().__init__()
        self.game = game
        self.report = report
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        """Page header."""
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "Explain My Game", border=False, ln=True, align="C")
        self.set_font("Helvetica", "", 10)
        self.cell(
            0, 5, "AI-Powered Coaching Insights", border=False, ln=True, align="C"
        )
        self.ln(5)

    def footer(self):
        """Page footer."""
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", border=False, align="C")


def generate_report_pdf(
    game: Game,
    stats: BasketballGameStats,
    report: Report,
) -> bytes:
    """
    Generate a PDF for a game report.

    Args:
        game: Game model
        stats: Basketball stats model
        report: Report model with AI insights

    Returns:
        PDF content as bytes
    """
    pdf = ReportPDF(game, report)
    pdf.add_page()

    report_json = report.report_json or {}

    # Game Info Section
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"Game Report: vs {game.opponent_name}", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Date: {game.game_date.strftime('%B %d, %Y')}", ln=True)
    if game.location:
        pdf.cell(0, 6, f"Location: {game.location}", ln=True)
    pdf.ln(5)

    # Score Section
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Final Score", ln=True)
    pdf.set_font("Helvetica", "", 11)

    result = (
        "Win"
        if stats.points_for > stats.points_against
        else "Loss"
        if stats.points_for < stats.points_against
        else "Tie"
    )
    pdf.cell(
        0,
        6,
        f"Your Team: {stats.points_for}  |  {game.opponent_name}: {stats.points_against}  ({result})",
        ln=True,
    )
    pdf.ln(5)

    # Stats Summary
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Game Statistics", ln=True)
    pdf.set_font("Helvetica", "", 10)

    # Calculate percentages
    fg_pct = (stats.fg_made / stats.fg_att * 100) if stats.fg_att > 0 else 0
    three_pct = (stats.three_made / stats.three_att * 100) if stats.three_att > 0 else 0
    ft_pct = (stats.ft_made / stats.ft_att * 100) if stats.ft_att > 0 else 0

    # Two column stats
    col_width = 95
    pdf.cell(
        col_width, 6, f"Field Goals: {stats.fg_made}/{stats.fg_att} ({fg_pct:.1f}%)"
    )
    pdf.cell(
        col_width,
        6,
        f"Rebounds: {stats.rebounds_off + stats.rebounds_def} (Off: {stats.rebounds_off}, Def: {stats.rebounds_def})",
        ln=True,
    )

    pdf.cell(
        col_width,
        6,
        f"3-Pointers: {stats.three_made}/{stats.three_att} ({three_pct:.1f}%)",
    )
    pdf.cell(col_width, 6, f"Assists: {stats.assists}", ln=True)

    pdf.cell(
        col_width, 6, f"Free Throws: {stats.ft_made}/{stats.ft_att} ({ft_pct:.1f}%)"
    )
    pdf.cell(col_width, 6, f"Turnovers: {stats.turnovers}", ln=True)

    pdf.cell(col_width, 6, f"Steals: {stats.steals}")
    pdf.cell(col_width, 6, f"Blocks: {stats.blocks}", ln=True)

    pdf.cell(col_width, 6, f"Fouls: {stats.fouls}", ln=True)
    pdf.ln(8)

    # AI Analysis Section
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "AI Coaching Analysis", ln=True, fill=True)
    pdf.ln(3)

    # Summary
    summary = report_json.get("summary", "No summary available.")
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, summary)
    pdf.ln(5)

    # Key Insights
    insights = report_json.get("key_insights", [])
    if insights:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Key Insights", ln=True)
        pdf.set_font("Helvetica", "", 10)

        for i, insight in enumerate(insights, 1):
            title = insight.get("title", f"Insight {i}")
            description = insight.get("description", "")
            confidence = insight.get("confidence", "medium")
            evidence = insight.get("evidence", "")

            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 6, f"{i}. {title} [{confidence.upper()}]", ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, description)
            if evidence:
                pdf.set_font("Helvetica", "I", 9)
                pdf.multi_cell(0, 5, f"Evidence: {evidence}")
            pdf.ln(2)
        pdf.ln(3)

    # Action Items
    actions = report_json.get("action_items", [])
    if actions:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Action Items", ln=True)
        pdf.set_font("Helvetica", "", 10)

        for i, action in enumerate(actions, 1):
            title = action.get("title", f"Action {i}")
            description = action.get("description", "")
            priority = action.get("priority", "medium")
            metric = action.get("metric", "")

            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 6, f"{i}. {title} [Priority: {priority.upper()}]", ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, description)
            if metric:
                pdf.set_font("Helvetica", "I", 9)
                pdf.multi_cell(0, 5, f"Metric: {metric}")
            pdf.ln(2)
        pdf.ln(3)

    # Practice Focus
    practice_focus = report_json.get("practice_focus", "")
    if practice_focus:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Practice Focus", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, practice_focus)
        pdf.ln(5)

    # Questions for Next Game
    questions = report_json.get("questions_for_next_game", [])
    if questions:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Questions for Next Game", ln=True)
        pdf.set_font("Helvetica", "", 10)

        for i, q in enumerate(questions, 1):
            question = q.get("question", f"Question {i}")
            context = q.get("context", "")

            pdf.set_font("Helvetica", "B", 10)
            pdf.multi_cell(0, 5, f"{i}. {question}")
            if context:
                pdf.set_font("Helvetica", "I", 9)
                pdf.multi_cell(0, 5, f"   Context: {context}")
            pdf.ln(1)

    # Footer info
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(
        0,
        5,
        f"Generated by {report.model_used or 'AI'} on {report.created_at.strftime('%B %d, %Y at %H:%M')}",
        ln=True,
        align="C",
    )

    risk_flags = report_json.get("risk_flags", [])
    if risk_flags:
        pdf.set_text_color(200, 100, 0)
        pdf.cell(0, 5, f"Note: {', '.join(risk_flags)}", ln=True, align="C")

    # Output to bytes
    return bytes(pdf.output())
