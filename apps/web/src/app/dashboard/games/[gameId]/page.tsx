"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  getGame,
  getStats,
  createStats,
  getGameReport,
  generateReport,
  submitFeedback,
  type FeedbackInput,
} from "@/lib/api";
import type { Game, BasketballStats, Report } from "@/types/api";
import { ReportSkeleton } from "@/components/ui/skeleton";

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[confidence]}`}>
      {confidence}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}

function FeedbackForm({ reportId, onSubmitted }: { reportId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [accurate, setAccurate] = useState<boolean | null>(null);
  const [missingText, setMissingText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const input: FeedbackInput = {
        rating_1_5: rating,
        accurate_bool: accurate ?? undefined,
        missing_text: missingText.trim() || undefined,
      };
      await submitFeedback(reportId, input);
      toast.success("Thanks for your feedback!", {
        description: "Your feedback helps improve future reports.",
      });
      onSubmitted();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit feedback";
      toast.error("Failed to submit feedback", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="mb-1 font-semibold">Rate this report</h3>
        <p className="text-sm text-muted-foreground">Help us improve by providing feedback</p>
      </div>

      {/* Star Rating */}
      <div>
        <label className="mb-2 block text-sm font-medium">How helpful was this report?</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`h-10 w-10 rounded-lg transition-all ${
                star <= rating
                  ? "bg-yellow-500 text-yellow-950"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <svg className="mx-auto h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy */}
      <div>
        <label className="mb-2 block text-sm font-medium">Was the report accurate?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAccurate(true)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              accurate === true
                ? "border-green-500 bg-green-500/20 text-green-400"
                : "border-border hover:bg-secondary"
            }`}
          >
            Yes, accurate
          </button>
          <button
            type="button"
            onClick={() => setAccurate(false)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              accurate === false
                ? "border-red-500 bg-red-500/20 text-red-400"
                : "border-border hover:bg-secondary"
            }`}
          >
            Not quite
          </button>
        </div>
      </div>

      {/* Missing info */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Anything missing? <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={missingText}
          onChange={(e) => setMissingText(e.target.value)}
          placeholder="Tell us what could be improved..."
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

function ShareButton({ reportId }: { reportId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = `${window.location.origin}/share/report/${reportId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!", {
        description: "Share this link with your team members.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Report
        </>
      )}
    </button>
  );
}

function StatsDisplay({ stats }: { stats: BasketballStats }) {
  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="text-center">
        <p className="text-5xl font-bold">
          <span
            className={
              stats.points_for > stats.points_against
                ? "text-green-400"
                : stats.points_for < stats.points_against
                  ? "text-red-400"
                  : ""
            }
          >
            {stats.points_for}
          </span>
          <span className="mx-3 text-muted-foreground">-</span>
          <span>{stats.points_against}</span>
        </p>
        <p
          className={`mt-2 text-lg font-medium ${
            stats.points_for > stats.points_against
              ? "text-green-400"
              : stats.points_for < stats.points_against
                ? "text-red-400"
                : "text-muted-foreground"
          }`}
        >
          {stats.points_for > stats.points_against
            ? "Win"
            : stats.points_for < stats.points_against
              ? "Loss"
              : "Tie"}{" "}
          ({stats.points_for > stats.points_against ? "+" : ""}
          {stats.points_for - stats.points_against})
        </p>
      </div>

      {/* Shooting Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-secondary/50 p-4 text-center">
          <p className="text-2xl font-bold">{stats.fg_percentage?.toFixed(1) || "-"}%</p>
          <p className="text-xs text-muted-foreground">
            FG ({stats.fg_made}/{stats.fg_att})
          </p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-4 text-center">
          <p className="text-2xl font-bold">{stats.three_percentage?.toFixed(1) || "-"}%</p>
          <p className="text-xs text-muted-foreground">
            3PT ({stats.three_made}/{stats.three_att})
          </p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-4 text-center">
          <p className="text-2xl font-bold">{stats.ft_percentage?.toFixed(1) || "-"}%</p>
          <p className="text-xs text-muted-foreground">
            FT ({stats.ft_made}/{stats.ft_att})
          </p>
        </div>
      </div>

      {/* Other Stats */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xl font-bold">{stats.total_rebounds || 0}</p>
          <p className="text-xs text-muted-foreground">REB</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xl font-bold">{stats.assists}</p>
          <p className="text-xs text-muted-foreground">AST</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xl font-bold">{stats.steals}</p>
          <p className="text-xs text-muted-foreground">STL</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xl font-bold">{stats.turnovers}</p>
          <p className="text-xs text-muted-foreground">TO</p>
        </div>
      </div>
    </div>
  );
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<
    (Game & { basketball_stats?: { id: string; points_for: number; points_against: number } }) | null
  >(null);
  const [stats, setStats] = useState<BasketballStats | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [statsForm, setStatsForm] = useState({
    points_for: 0,
    points_against: 0,
    fg_made: 0,
    fg_att: 0,
    three_made: 0,
    three_att: 0,
    ft_made: 0,
    ft_att: 0,
    rebounds_off: 0,
    rebounds_def: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const gameData = await getGame(gameId);
      setGame(gameData);

      if (gameData.basketball_stats) {
        try {
          const statsData = await getStats(gameId);
          setStats(statsData);
        } catch {
          // No stats yet
        }
      }

      try {
        const reportData = await getGameReport(gameId);
        setReport(reportData);
      } catch {
        // No report yet
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load game";
      toast.error("Failed to load game", { description: message });
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveStats(e: React.FormEvent) {
    e.preventDefault();
    setSavingStats(true);

    try {
      const newStats = await createStats(gameId, statsForm);
      setStats(newStats);
      setShowStatsForm(false);
      toast.success("Stats saved!", {
        description: "You can now generate an AI report.",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save stats";
      toast.error("Failed to save stats", { description: message });
    } finally {
      setSavingStats(false);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);

    try {
      const response = await generateReport(gameId);
      setReport(response.report);
      toast.success("Report generated!", {
        description: "Your AI coaching report is ready.",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate report";
      toast.error("Failed to generate report", { description: message });
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8 animate-pulse">
          <div className="h-6 w-24 rounded bg-muted" />
          <div className="mt-4 h-8 w-64 rounded bg-muted" />
          <div className="mt-2 h-5 w-48 rounded bg-muted" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
          <ReportSkeleton />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <svg className="mb-4 h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold">Game not found</h2>
        <p className="mt-2 text-muted-foreground">This game may have been deleted or you don&apos;t have access.</p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/teams/${game.team_id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Team
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">vs {game.opponent_name}</h1>
            <p className="mt-1 text-muted-foreground">
              {new Date(game.game_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {game.location && ` • ${game.location}`}
            </p>
          </div>
          {report && <ShareButton reportId={report.id} />}
        </div>
        {game.notes && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">{game.notes}</p>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Stats Section */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">Game Stats</h2>
            {!stats && !showStatsForm && (
              <button onClick={() => setShowStatsForm(true)} className="text-sm font-medium text-primary hover:underline">
                + Add Stats
              </button>
            )}
          </div>
          <div className="p-4">
            {showStatsForm ? (
              <form onSubmit={handleSaveStats} className="space-y-6">
                {/* Score */}
                <div>
                  <p className="mb-3 font-medium">Final Score</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Points For</label>
                      <input
                        type="number"
                        min="0"
                        value={statsForm.points_for}
                        onChange={(e) => setStatsForm({ ...statsForm, points_for: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-lg font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Points Against</label>
                      <input
                        type="number"
                        min="0"
                        value={statsForm.points_against}
                        onChange={(e) => setStatsForm({ ...statsForm, points_against: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-lg font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Shooting */}
                <div>
                  <p className="mb-3 font-medium">Shooting</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "FG Made", key: "fg_made" },
                      { label: "FG Att", key: "fg_att" },
                      { label: "3PT Made", key: "three_made" },
                      { label: "3PT Att", key: "three_att" },
                      { label: "FT Made", key: "ft_made" },
                      { label: "FT Att", key: "ft_att" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={statsForm[key as keyof typeof statsForm]}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, [key]: parseInt(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Stats */}
                <div>
                  <p className="mb-3 font-medium">Other Stats</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Off Reb", key: "rebounds_off" },
                      { label: "Def Reb", key: "rebounds_def" },
                      { label: "Assists", key: "assists" },
                      { label: "Steals", key: "steals" },
                      { label: "Blocks", key: "blocks" },
                      { label: "Turnovers", key: "turnovers" },
                      { label: "Fouls", key: "fouls" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={statsForm[key as keyof typeof statsForm]}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, [key]: parseInt(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStatsForm(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStats}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingStats ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Stats"
                    )}
                  </button>
                </div>
              </form>
            ) : stats ? (
              <div className="space-y-6">
                <StatsDisplay stats={stats} />

                {!report && (
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="w-full rounded-lg bg-gradient-to-r from-primary to-orange-500 px-4 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {generatingReport ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating AI Report...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate AI Report
                      </span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 14l4-4 4 4 5-5" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold">No stats yet</h3>
                <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                  Add your game stats to unlock AI-powered coaching insights.
                </p>
                <button
                  onClick={() => setShowStatsForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Game Stats
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Report Section */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">AI Report</h2>
              {report && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Generated
                </span>
              )}
            </div>
            <div className="p-4">
              {report ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="rounded-lg bg-gradient-to-r from-primary/10 to-orange-500/10 p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Summary
                    </h3>
                    <p className="text-sm leading-relaxed">{report.summary}</p>
                  </div>

                  {/* Key Insights */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Key Insights</h3>
                    <div className="space-y-3">
                      {report.key_insights.map((insight, i) => (
                        <div key={i} className="rounded-lg border border-border p-4 transition-all hover:border-primary/50">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-medium">{insight.title}</span>
                            <ConfidenceBadge confidence={insight.confidence} />
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">{insight.description}</p>
                          <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
                            <span className="text-lg">📊</span>
                            <p className="text-xs text-muted-foreground">{insight.evidence}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Action Items</h3>
                    <div className="space-y-3">
                      {report.action_items.map((item, i) => (
                        <div key={i} className="rounded-lg border border-border p-4 transition-all hover:border-primary/50">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-medium">{item.title}</span>
                            <PriorityBadge priority={item.priority} />
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
                            <span className="text-lg">📏</span>
                            <p className="text-xs text-muted-foreground">Measure: {item.metric}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Practice Focus */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Practice Focus</h3>
                    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎯</span>
                        <p className="text-sm leading-relaxed">{report.practice_focus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Questions for Next Game</h3>
                    <div className="space-y-2">
                      {report.questions_for_next_game.map((q, i) => (
                        <div key={i} className="rounded-lg border border-border p-4">
                          <p className="mb-1 font-medium">❓ {q.question}</p>
                          <p className="text-sm text-muted-foreground">{q.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                    <p>
                      Generated by {report.model_used}
                      {report.generation_time_ms && ` • ${report.generation_time_ms}ms`}
                    </p>
                    {report.risk_flags && report.risk_flags.length > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {report.risk_flags.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 font-semibold">No report yet</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {stats
                      ? "Click the button above to generate your AI coaching report."
                      : "Add game stats first to generate an AI report."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {report && showFeedback && !feedbackSubmitted && (
            <FeedbackForm
              reportId={report.id}
              onSubmitted={() => {
                setFeedbackSubmitted(true);
                setShowFeedback(false);
              }}
            />
          )}

          {feedbackSubmitted && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-400">Thanks for your feedback!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
