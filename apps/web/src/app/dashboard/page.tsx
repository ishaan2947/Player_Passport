"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getTeams, getGames } from "@/lib/api";
import type { Team, Game } from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend === "up" && (
            <>
              <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-green-500">Trending up</span>
            </>
          )}
          {trend === "down" && (
            <>
              <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-red-500">Trending down</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyTeamsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold">No teams yet</h3>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">
        Create your first team to start tracking games and generating AI insights.
      </p>
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Your First Team
      </Link>
    </div>
  );
}

function EmptyGamesState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-8 w-8 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold">No games recorded</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Add games to your teams to start tracking stats and getting AI coaching insights.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentGames, setRecentGames] = useState<(Game & { teamName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const teamsData = await getTeams();
        setTeams(teamsData);
        
        // Show onboarding if no teams and hasn't been dismissed
        if (teamsData.length === 0) {
          const hasSeenOnboarding = localStorage.getItem("emg_onboarding_complete");
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        }

        // Get recent games from all teams
        const allGames: (Game & { teamName: string })[] = [];
        for (const team of teamsData.slice(0, 5)) {
          try {
            const games = await getGames(team.id);
            allGames.push(
              ...games.slice(0, 5).map((g) => ({ ...g, teamName: team.name }))
            );
          } catch {
            // Ignore errors for individual teams
          }
        }
        // Sort by date, newest first
        allGames.sort(
          (a, b) =>
            new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
        );
        setRecentGames(allGames.slice(0, 5));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load data";
        setError(message);
        toast.error("Failed to load dashboard data", {
          description: message,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleOnboardingComplete() {
    localStorage.setItem("emg_onboarding_complete", "true");
    setShowOnboarding(false);
    // Reload data after onboarding
    window.location.reload();
  }

  function handleOnboardingSkip() {
    localStorage.setItem("emg_onboarding_complete", "true");
    setShowOnboarding(false);
  }

  if (loading) return <DashboardSkeleton />;

  const gamesWithReports = recentGames.filter((g) => g.has_report).length;
  const gamesWithStats = recentGames.filter((g) => g.has_stats).length;
  const totalGames = recentGames.length;

  return (
    <div className="p-4 md:p-8">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s an overview of your teams and games.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium">Error loading data</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Teams"
          value={teams.length}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Recent Games"
          value={totalGames}
          subtitle="Last 5 games"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          }
        />
        <StatCard
          title="Games with Stats"
          value={gamesWithStats}
          subtitle={totalGames > 0 ? `${Math.round((gamesWithStats / totalGames) * 100)}% complete` : "No games yet"}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m19 9-5 5-4-4-3 3" />
            </svg>
          }
        />
        <StatCard
          title="Reports Generated"
          value={gamesWithReports}
          subtitle="AI insights ready"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teams */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">Your Teams</h2>
            <Link
              href="/dashboard/teams"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="p-4">
            {teams.length === 0 ? (
              <EmptyTeamsState />
            ) : (
              <div className="space-y-2">
                {teams.slice(0, 5).map((team) => (
                  <Link
                    key={team.id}
                    href={`/dashboard/teams/${team.id}`}
                    className="group flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <svg
                          className="h-5 w-5 text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm capitalize text-muted-foreground">
                          {team.sport}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">Recent Games</h2>
          </div>
          <div className="p-4">
            {recentGames.length === 0 ? (
              <EmptyGamesState />
            ) : (
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/dashboard/games/${game.id}`}
                    className="group flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">vs {game.opponent_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {game.teamName} •{" "}
                        {new Date(game.game_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.has_report ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Report
                        </span>
                      ) : game.has_stats ? (
                        <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                          </svg>
                          Stats
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          No data
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {teams.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/teams"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Team
            </Link>
            <Link
              href={`/dashboard/teams/${teams[0]?.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              </svg>
              Add Game
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
