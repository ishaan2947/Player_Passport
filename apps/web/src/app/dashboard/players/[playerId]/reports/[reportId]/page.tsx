"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getPlayerReportByPlayerId, getPlayer } from "@/lib/api";
import type { PlayerReport, PlayerWithGames } from "@/types/api";
import { DashboardSkeleton, PlayerReportSkeleton } from "@/components/ui/skeleton";

function ConfidenceBadge({ level }: { level: "low" | "medium" | "high" }) {
  const colors = {
    low: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    medium: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    high: "bg-green-500/20 text-green-500 border-green-500/30",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${colors[level]}`}>
      {level} Confidence
    </span>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-orange-500">{icon}</span>}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DrillCard({ drill }: { drill: { title: string; why_this_drill: string; how_to_do_it: string; frequency: string; success_metric: string } }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <h4 className="font-semibold text-orange-500">{drill.title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{drill.why_this_drill}</p>
      <div className="mt-3 space-y-2 text-sm">
        <p><span className="font-medium">How:</span> {drill.how_to_do_it}</p>
        <p><span className="font-medium">Frequency:</span> {drill.frequency}</p>
        <p><span className="font-medium">Success metric:</span> {drill.success_metric}</p>
      </div>
    </div>
  );
}

export default function PlayerReportPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;
  const reportId = params.reportId as string;

  const [report, setReport] = useState<PlayerReport | null>(null);
  const [player, setPlayer] = useState<PlayerWithGames | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string>("");

  // Generate share URL when report is loaded
  useEffect(() => {
    if (report?.share_token) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${baseUrl}/share/report/${report.share_token}`);
    }
  }, [report]);

  const loadData = useCallback(async () => {
    try {
      const [reportData, playerData] = await Promise.all([
        getPlayerReportByPlayerId(playerId, reportId),
        getPlayer(playerId),
      ]);
      setReport(reportData);
      setPlayer(playerData);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load report";
      toast.error("Failed to load report", { description: message });
      router.push(`/dashboard/players/${playerId}`);
    } finally {
      setLoading(false);
    }
  }, [reportId, playerId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for report completion if status is generating or pending
  useEffect(() => {
    if (!report) return;
    
    if (report.status === "generating" || report.status === "pending") {
      const interval = setInterval(() => {
        loadData();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [report, loadData]);

  if (loading) return <DashboardSkeleton />;
  if (!report || !player) return null;

  const content = report.report_json;

  // Show skeleton while generating
  if (report.status === "generating" || report.status === "pending") {
    return <PlayerReportSkeleton />;
  }

  // Show error state if failed
  if (report.status === "failed" || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Report Generation Failed</h2>
          <p className="mt-2 text-muted-foreground">
            {report.error_text || "An error occurred while generating the report. Please try again."}
          </p>
          <Link
            href={`/dashboard/players/${playerId}`}
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ← Back to Player
          </Link>
        </div>
      </div>
    );
  }

  const { meta, growth_summary, development_report, drill_plan, motivational_message, college_fit_indicator_v1, player_profile, structured_data } = content;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8 print:p-0 print:bg-white">
      {/* Breadcrumb */}
      <div className="mb-6 no-print">
        <Link
          href={`/dashboard/players/${playerId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {player.name}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-card to-amber-500/10 p-6 md:p-8 print:border print:bg-white print:rounded-lg print-break-inside-avoid">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-bold text-white">
                {player_profile.player_info.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">{player_profile.player_info.name}</h1>
                <p className="text-muted-foreground">{player_profile.headline}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge level={meta.confidence_level} />
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {meta.report_window}
            </span>
            {shareUrl && (
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Share link copied to clipboard!");
                  } catch {
                    toast.error("Failed to copy link");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-orange-500/25"
                title="Copy share link"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Report
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 flex flex-wrap gap-4">
          {player_profile.top_stats_snapshot.map((stat, i) => (
            <span key={i} className="rounded-lg bg-background/50 px-3 py-1.5 text-sm font-medium">
              {stat}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Growth Summary */}
          <Section
            title="Growth Summary"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          >
            <p className="text-muted-foreground leading-relaxed">{growth_summary}</p>
          </Section>

          {/* Development Report */}
          <Section
            title="Development Report"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium text-green-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {development_report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium text-amber-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Growth Areas
                </h3>
                <ul className="space-y-2">
                  {development_report.growth_areas.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Trend Insights */}
            <div className="mt-6">
              <h3 className="mb-3 font-medium">Trend Insights</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {development_report.trend_insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                    <span className="text-orange-500">📊</span>
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-6">
              <h3 className="mb-3 font-medium">Key Metrics</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {development_report.key_metrics.map((metric, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-bold text-orange-500">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next 2 Weeks Focus */}
            <div className="mt-6 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <h3 className="mb-3 font-medium text-orange-500">🎯 Next 2 Weeks Focus</h3>
              <ul className="space-y-2">
                {development_report.next_2_weeks_focus.map((focus, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-orange-500">{i + 1}.</span>
                    {focus}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Drill Plan */}
          <Section
            title="Recommended Drills"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              {drill_plan.map((drill, i) => (
                <DrillCard key={i} drill={drill} />
              ))}
            </div>
          </Section>

          {/* Game Log */}
          <Section
            title="Game Summary"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium">Game</th>
                    <th className="pb-2 font-medium text-center">PTS</th>
                    <th className="pb-2 font-medium text-center">REB</th>
                    <th className="pb-2 font-medium text-center">AST</th>
                    <th className="pb-2 font-medium text-center">STL</th>
                    <th className="pb-2 font-medium text-center">BLK</th>
                    <th className="pb-2 font-medium text-center">TOV</th>
                    <th className="pb-2 font-medium text-center">FG%</th>
                  </tr>
                </thead>
                <tbody>
                  {structured_data.per_game_summary.map((game, i) => {
                    const fgPct = game.fga > 0 ? ((game.fgm / game.fga) * 100).toFixed(0) : "-";
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">
                          <div className="font-medium">{game.game_label}</div>
                          <div className="text-xs text-muted-foreground">vs {game.opponent}</div>
                        </td>
                        <td className="py-2 text-center font-bold text-orange-500">{game.pts}</td>
                        <td className="py-2 text-center">{game.reb}</td>
                        <td className="py-2 text-center">{game.ast}</td>
                        <td className="py-2 text-center">{game.stl}</td>
                        <td className="py-2 text-center">{game.blk}</td>
                        <td className="py-2 text-center text-red-400">{game.tov}</td>
                        <td className="py-2 text-center">{fgPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-medium">
                    <td className="pt-3">Averages</td>
                    <td className="pt-3 text-center text-orange-500">{structured_data.computed_insights.pts_avg}</td>
                    <td className="pt-3 text-center">{structured_data.computed_insights.reb_avg}</td>
                    <td className="pt-3 text-center">{structured_data.computed_insights.ast_avg}</td>
                    <td className="pt-3 text-center">-</td>
                    <td className="pt-3 text-center">-</td>
                    <td className="pt-3 text-center text-red-400">{structured_data.computed_insights.tov_avg}</td>
                    <td className="pt-3 text-center">{structured_data.computed_insights.fg_pct}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Motivational Message */}
          <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-6">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="text-2xl">🔥</span>
              Keep Going!
            </h3>
            <p className="text-muted-foreground italic leading-relaxed">
              &ldquo;{motivational_message}&rdquo;
            </p>
          </div>

          {/* College Fit Indicator */}
          <Section title="College Fit Indicator">
            <div className="mb-3 rounded-lg bg-secondary p-3">
              <p className="font-semibold text-orange-500">{college_fit_indicator_v1.label}</p>
            </div>
            <p className="text-sm text-muted-foreground">{college_fit_indicator_v1.reasoning}</p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                To Level Up:
              </p>
              <ul className="space-y-2">
                {college_fit_indicator_v1.what_to_improve_to_level_up.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Player Profile Summary */}
          <Section title="Player Profile">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Info</p>
                <p className="mt-1">
                  {player_profile.player_info.grade} • {player_profile.player_info.position}
                  {player_profile.player_info.height && ` • ${player_profile.player_info.height}`}
                </p>
                {player_profile.player_info.team && (
                  <p className="text-muted-foreground">{player_profile.player_info.team}</p>
                )}
              </div>
              
              {player_profile.player_info.goals.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Goals</p>
                  <ul className="mt-1 space-y-1">
                    {player_profile.player_info.goals.map((goal, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-orange-500">🎯</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Strengths</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {player_profile.strengths_short.map((s, i) => (
                    <span key={i} className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Development Areas</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {player_profile.development_areas_short.map((s, i) => (
                    <span key={i} className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Coach Notes</p>
                <p className="mt-1 text-muted-foreground">{player_profile.coach_notes_summary}</p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">{player_profile.highlight_summary_placeholder}</p>
              </div>
            </div>
          </Section>

          {/* Disclaimer */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium">⚠️ Disclaimer</p>
            <p className="mt-1">{meta.disclaimer}</p>
            <p className="mt-2 text-xs opacity-75">
              Confidence: {meta.confidence_level} — {meta.confidence_reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

