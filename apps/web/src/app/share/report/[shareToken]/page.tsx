"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSharedReport } from "@/lib/api";
import type { Player, PlayerReport } from "@/types/api";

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

export default function SharedReportPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [report, setReport] = useState<(PlayerReport & { player: Player }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSharedReport(shareToken);
        setReport(data);
      } catch {
        setError("This report is no longer available or the link is invalid.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Report Not Found</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-medium text-white"
          >
            Learn About Player Passport
          </Link>
        </div>
      </div>
    );
  }

  const content = report.report_json;
  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Report Not Ready</h2>
          <p className="mt-2 text-muted-foreground">This report is still being generated. Check back soon.</p>
        </div>
      </div>
    );
  }

  const { meta, growth_summary, development_report, drill_plan, motivational_message, college_fit_indicator_v1, player_profile, structured_data } = content;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Public Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Player Passport" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-bold">Player Passport</span>
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1.5 text-sm font-medium text-white"
          >
            Create Your Own
          </Link>
        </div>
      </header>

      <main className="container py-8">
        {/* Shared badge */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Shared Player Development Report
        </div>

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-card to-amber-500/10 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-bold text-white">
                {player_profile.player_info.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">{player_profile.player_info.name}</h1>
                <p className="text-muted-foreground">{player_profile.headline}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge level={meta.confidence_level} />
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{meta.report_window}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            {player_profile.top_stats_snapshot.map((stat: string, i: number) => (
              <span key={i} className="rounded-lg bg-background/50 px-3 py-1.5 text-sm font-medium">{stat}</span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Growth Summary */}
            <Section title="Growth Summary">
              <p className="leading-relaxed text-muted-foreground">{growth_summary}</p>
            </Section>

            {/* Strengths & Growth Areas */}
            <Section title="Development Report">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-medium text-green-500">Strengths</h3>
                  <ul className="space-y-2">
                    {development_report.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-medium text-amber-500">Growth Areas</h3>
                  <ul className="space-y-2">
                    {development_report.growth_areas.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="mt-6">
                <h3 className="mb-3 font-medium">Key Metrics</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {development_report.key_metrics.map((metric: { label: string; value: string; note: string }, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-bold text-orange-500">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Drill Plan */}
            <Section title="Recommended Drills">
              <div className="grid gap-4 md:grid-cols-2">
                {drill_plan.map((drill: { title: string; why_this_drill: string; how_to_do_it: string; frequency: string; success_metric: string }, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-orange-500">{drill.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{drill.why_this_drill}</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p><span className="font-medium">How:</span> {drill.how_to_do_it}</p>
                      <p><span className="font-medium">Frequency:</span> {drill.frequency}</p>
                      <p><span className="font-medium">Goal:</span> {drill.success_metric}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Game Summary Table */}
            <Section title="Game Summary">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium">Game</th>
                      <th className="pb-2 text-center font-medium">PTS</th>
                      <th className="pb-2 text-center font-medium">REB</th>
                      <th className="pb-2 text-center font-medium">AST</th>
                      <th className="pb-2 text-center font-medium">STL</th>
                      <th className="pb-2 text-center font-medium">BLK</th>
                      <th className="pb-2 text-center font-medium">FG%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structured_data.per_game_summary.map((game: { game_label: string; opponent: string; pts: number; reb: number; ast: number; stl: number; blk: number; fgm: number; fga: number }, i: number) => {
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
                          <td className="py-2 text-center">{fgPct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Motivational */}
            <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-6">
              <h3 className="mb-3 font-semibold">Keep Going!</h3>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{motivational_message}&rdquo;
              </p>
            </div>

            {/* College Fit */}
            <Section title="College Fit Indicator">
              <div className="mb-3 rounded-lg bg-secondary p-3">
                <p className="font-semibold text-orange-500">{college_fit_indicator_v1.label}</p>
              </div>
              <p className="text-sm text-muted-foreground">{college_fit_indicator_v1.reasoning}</p>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">To Level Up:</p>
                <ul className="space-y-2">
                  {college_fit_indicator_v1.what_to_improve_to_level_up.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-500">&#8594;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            {/* Player Info */}
            <Section title="Player Profile">
              <div className="space-y-3 text-sm">
                <p>
                  {player_profile.player_info.grade} &bull; {player_profile.player_info.position}
                  {player_profile.player_info.height && ` \u00B7 ${player_profile.player_info.height}`}
                </p>
                {player_profile.player_info.team && (
                  <p className="text-muted-foreground">{player_profile.player_info.team}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {player_profile.strengths_short.map((s: string, i: number) => (
                    <span key={i} className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500">{s}</span>
                  ))}
                  {player_profile.development_areas_short.map((s: string, i: number) => (
                    <span key={i} className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-500">{s}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Disclaimer */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
              <p className="font-medium">Disclaimer</p>
              <p className="mt-1">{meta.disclaimer}</p>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-6 text-center">
              <p className="mb-2 font-semibold">Want reports like this?</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Track your player&apos;s development with AI-powered insights.
              </p>
              <Link
                href="/sign-up"
                className="inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>Powered by <Link href="/" className="font-medium text-orange-500 hover:underline">Player Passport</Link></p>
      </footer>
    </div>
  );
}
