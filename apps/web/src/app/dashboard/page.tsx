"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getPlayers } from "@/lib/api";
import type { PlayerWithGames } from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: "primary" | "green" | "blue" | "purple";
}) {
  const colorClasses = {
    primary: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20",
    green: "bg-green-500/10 text-green-500 group-hover:bg-green-500/20",
    blue: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20",
  };

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
          <div className={`rounded-lg p-2 transition-colors ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerWithGames }) {
  const gamesCount = player.games?.length || 0;
  const reportsCount = player.reports?.length || 0;
  const avgPts = gamesCount > 0
    ? (player.games.reduce((sum, g) => sum + (g.pts || 0), 0) / gamesCount).toFixed(1)
    : "0.0";

  return (
    <Link
      href={`/dashboard/players/${player.id}`}
      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-lg font-bold text-white">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold group-hover:text-primary">{player.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {player.position && <span>{player.position}</span>}
            {player.grade && <span>• {player.grade}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-lg font-bold text-orange-500">{avgPts}</p>
          <p className="text-xs text-muted-foreground">PPG</p>
        </div>
        <div>
          <p className="font-semibold">{gamesCount}</p>
          <p className="text-xs text-muted-foreground">Games</p>
        </div>
        <div>
          <p className="font-semibold">{reportsCount}</p>
          <p className="text-xs text-muted-foreground">Reports</p>
        </div>
        <svg
          className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20">
        <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-semibold">Welcome to Player Passport</h3>
      <p className="mb-6 max-w-md text-muted-foreground">
        Create your first player profile to start tracking stats and generating AI development reports.
      </p>
      <Link
        href="/dashboard/players"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-orange-500/25"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Your First Player
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const [players, setPlayers] = useState<PlayerWithGames[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error("Failed to load players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <DashboardSkeleton />;

  // Calculate stats
  const totalPlayers = players.length;
  const totalGames = players.reduce((sum, p) => sum + (p.games?.length || 0), 0);
  const totalReports = players.reduce((sum, p) => sum + (p.reports?.length || 0), 0);
  const avgGamesPerPlayer = totalPlayers > 0 ? (totalGames / totalPlayers).toFixed(1) : "0";

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Track your players, log games, and generate AI development reports.
        </p>
      </div>

      {players.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Players"
              value={totalPlayers}
              subtitle="Player profiles created"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              color="primary"
            />
            <StatCard
              title="Total Games"
              value={totalGames}
              subtitle={`${avgGamesPerPlayer} avg per player`}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="blue"
            />
            <StatCard
              title="Reports Generated"
              value={totalReports}
              subtitle="AI development reports"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              color="green"
            />
            <StatCard
              title="Ready for Reports"
              value={players.filter(p => (p.games?.length || 0) >= 3).length}
              subtitle="Players with 3+ games"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="purple"
            />
          </div>

          {/* Players List */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
              <div>
                <h2 className="text-lg font-semibold">Your Players</h2>
                <p className="text-sm text-muted-foreground">
                  {totalPlayers} player{totalPlayers !== 1 ? "s" : ""} • {totalGames} game{totalGames !== 1 ? "s" : ""} logged
                </p>
              </div>
              <Link
                href="/dashboard/players"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Player
              </Link>
            </div>
            <div className="divide-y divide-border">
              {players.slice(0, 5).map((player) => (
                <div key={player.id} className="p-2">
                  <PlayerCard player={player} />
                </div>
              ))}
            </div>
            {players.length > 5 && (
              <div className="border-t border-border p-4 text-center">
                <Link
                  href="/dashboard/players"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all {players.length} players →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-8 rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-card to-amber-500/5 p-6">
            <h3 className="mb-4 font-semibold">Quick Tips</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  1
                </div>
                <div>
                  <p className="font-medium">Create Player Profiles</p>
                  <p className="text-sm text-muted-foreground">Add your players with their position and grade.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  2
                </div>
                <div>
                  <p className="font-medium">Log Game Stats</p>
                  <p className="text-sm text-muted-foreground">Add at least 3 games per player to generate reports.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  3
                </div>
                <div>
                  <p className="font-medium">Generate AI Reports</p>
                  <p className="text-sm text-muted-foreground">Get personalized development insights and drill plans.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
