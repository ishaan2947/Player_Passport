"""Reports API router."""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response

import structlog

from src.core import (
    CurrentUser,
    DbSession,
    GameMemberAccess,
    GameCoachAccess,
    ReportAccess,
)
from src.models import Game, Report, Feedback, BasketballGameStats
from src.schemas import (
    ReportOut,
    GenerateReportRequest,
    GenerateReportResponse,
    FeedbackCreate,
    FeedbackOut,
    KeyInsight,
    ActionItem,
    QuestionForNextGame,
)
from src.services.report_generator import generate_game_report
from src.services.pdf_generator import generate_report_pdf

logger = structlog.get_logger()

router = APIRouter(tags=["Reports"])


def _report_to_out(report: Report) -> ReportOut:
    """Convert a Report model to ReportOut schema."""
    # Extract data from report_json if available
    report_json = report.report_json or {}

    key_insights = []
    for insight in report_json.get("key_insights", []):
        key_insights.append(KeyInsight(**insight))

    action_items = []
    for item in report_json.get("action_items", []):
        action_items.append(ActionItem(**item))

    questions = []
    for q in report_json.get("questions_for_next_game", []):
        questions.append(QuestionForNextGame(**q))

    return ReportOut(
        id=report.id,
        game_id=report.game_id,
        status=report.status,
        summary=report_json.get("summary"),
        key_insights=key_insights,
        action_items=action_items,
        practice_focus=report_json.get("practice_focus"),
        questions_for_next_game=questions,
        model_used=report.model_used or report_json.get("model_used"),
        prompt_tokens=report_json.get("prompt_tokens"),
        completion_tokens=report_json.get("completion_tokens"),
        generation_time_ms=report_json.get("generation_time_ms"),
        risk_flags=report_json.get("risk_flags", []),
        created_at=report.created_at,
    )


@router.post(
    "/games/{game_id}/generate-report",
    response_model=GenerateReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_report(
    request: GenerateReportRequest,
    game: GameCoachAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    """
    Generate an AI report for a game.

    Requires coach or owner role. Will use existing report if available
    unless force_regenerate is True.
    """
    # Check if stats exist
    stats = (
        db.query(BasketballGameStats)
        .filter(BasketballGameStats.game_id == game.id)
        .first()
    )
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate report without game stats. Add stats first.",
        )

    # Check for existing report
    existing_report = db.query(Report).filter(Report.game_id == game.id).first()

    if existing_report and not request.force_regenerate:
        logger.info(
            "Returning existing report",
            game_id=str(game.id),
            report_id=str(existing_report.id),
        )
        return {
            "report": _report_to_out(existing_report),
            "was_regenerated": False,
        }

    # Generate new report
    try:
        report = await generate_game_report(
            db=db,
            game=game,
            stats=stats,
            additional_context=request.additional_context,
            existing_report=existing_report,
        )
    except Exception as e:
        logger.error(
            "Failed to generate report",
            game_id=str(game.id),
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )

    logger.info(
        "Report generated",
        game_id=str(game.id),
        report_id=str(report.id),
    )

    return {
        "report": _report_to_out(report),
        "was_regenerated": existing_report is not None,
    }


@router.get("/reports/{report_id}", response_model=ReportOut)
async def get_report(
    report: ReportAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> ReportOut:
    """
    Get a report by ID.

    Requires team membership.
    """
    return _report_to_out(report)


@router.get("/games/{game_id}/report", response_model=ReportOut)
async def get_game_report(
    game: GameMemberAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> ReportOut:
    """
    Get the report for a game.

    Requires team membership.
    """
    report = db.query(Report).filter(Report.game_id == game.id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report found for this game",
        )

    return _report_to_out(report)


@router.post(
    "/reports/{report_id}/feedback",
    response_model=FeedbackOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_feedback(
    feedback_in: FeedbackCreate,
    report: ReportAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> Feedback:
    """
    Submit feedback on a report.

    Requires team membership. One feedback per user per report.
    """
    # Check for existing feedback (one per report)
    existing = db.query(Feedback).filter(Feedback.report_id == report.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback has already been submitted for this report",
        )

    # Create feedback
    feedback = Feedback(
        report_id=report.id,
        rating_1_5=feedback_in.rating,
        accurate_bool=feedback_in.accurate,
        missing_text=feedback_in.missing_info,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    logger.info(
        "Feedback submitted",
        report_id=str(report.id),
        rating=feedback_in.rating,
    )

    return feedback


@router.get(
    "/reports/{report_id}/pdf",
    response_class=Response,
    summary="Export report as PDF",
)
async def export_report_pdf(
    report: ReportAccess,
    current_user: CurrentUser,
    db: DbSession,
) -> Response:
    """
    Export a report as a PDF file.

    Requires team membership.
    """
    # Get game and stats
    game = db.query(Game).filter(Game.id == report.game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    stats = (
        db.query(BasketballGameStats)
        .filter(BasketballGameStats.game_id == game.id)
        .first()
    )
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate PDF without game stats",
        )

    # Generate PDF
    try:
        pdf_bytes = generate_report_pdf(game, stats, report)
    except Exception as e:
        logger.error(
            "Failed to generate PDF",
            report_id=str(report.id),
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )

    # Create filename
    game_date_str = game.game_date.strftime("%Y-%m-%d")
    opponent_slug = game.opponent_name.replace(" ", "_")[:20]
    filename = f"game_report_{game_date_str}_{opponent_slug}.pdf"

    logger.info(
        "PDF exported",
        report_id=str(report.id),
        filename=filename,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
