"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getPlayers } from "@/lib/api";
import type { PlayerWithGames } from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";

type StatKey = "pts" | "reb" | "ast" | "stl" | "blk" | "tov" | "fg_pct" | "tpm";

const STAT_CONFIG: Record<StatKey, { label: string; color: string; inverted?: boolean }> = {
  pts: { label: "PPG", color: "#f97316" },
  reb: { label: "RPG", color: "#3b82f6" },
  ast: { label: "APG", color: "#10b981" },
  stl: { label: "SPG", color: "#a855f7" },
  blk: { label: "BPG", color: "#06b6d4" },
  tov: { label: "TOV", color: "#ef4444", inverted: true },
  fg_pct: { label: "FG%", color: "#eab308" },
  tpm: { label: "3PM", color: "#ec4899" },
};

function computeAvg(games: PlayerWithGames["games"], key: StatKey): number {
  if (games.length === 0) return 0;
  const n = games.length;
  switch (key) {
    case "pts": return games.reduce((s, g) => s + g.pts, 0) / n;
    case "reb": return games.reduce((s, g) => s + g.reb, 0) / n;
    case "ast": return games.reduce((s, g) => s + g.ast, 0) / n;
    case "stl": return games.reduce((s, g) => s + g.stl, 0) / n;
    case "blk": return games.reduce((s, g) => s + g.blk, 0) / n;
    case "tov": return games.reduce((s, g) => s + g.tov, 0) / n;
    case "tpm": return games.reduce((s, g) => s + g.tpm, 0) / n;
    case "fg_pct": {
      const fgm = games.reduce((s, g) => s + g.fgm, 0);
      const fga = games.reduce((s, g) => s + g.fga, 0);
      return fga > 0 ? (fgm / fga) * 100 : 0;
    }
    default: return 0;
  }
}

const PLAYER_COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7"];

export default function ComparePage() {
  const [players, setPlayers] = useState<PlayerWithGames[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const loadPlayers = useCallback(async () => {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load players";
      toast.error("Failed to load players", { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  function togglePlayer(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.info("Max 4 players", { description: "Remove a player before adding another." });
        return prev;
      }
      return [...prev, id];
    });
  }

  if (loading) return <DashboardSkeleton />;

  const selectedPlayers = selected
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as PlayerWithGames[];

  // Compute all stats for selected players
  const statsData = selectedPlayers.map((p) => ({
    player: p,
    stats: Object.fromEntries(
      (Object.keys(STAT_CONFIG) as StatKey[]).map((key) => [key, computeAvg(p.games, key)])
    ) as Record<StatKey, number>,
  }));

  // Find max value per stat (for bar scaling)
  const maxStats = Object.fromEntries(
    (Object.keys(STAT_CONFIG) as StatKey[]).map((key) => [
      key,
      Math.max(...statsData.map((d) => d.stats[key]), 0.1),
    ])
  ) as Record<StatKey, number>;

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard/players"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Players
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Player Comparison</h1>
        <p className="mt-1 text-muted-foreground">
          Select up to 4 players to compare their season averages side by side.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">No players found. Add players to compare them.</p>
          <Link
            href="/dashboard/players"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to Players
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Player selector */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Select Players ({selected.length}/4)
            </h2>
            <div className="space-y-2">
              {players.map((player) => {
                const isSelected = selected.includes(player.id);
                const selIdx = selected.indexOf(player.id);
                const color = selIdx >= 0 ? PLAYER_COLORS[selIdx] : undefined;
                const hasGames = player.games.length > 0;
                return (
                  <button
                    key={player.id}
                    onClick={() => hasGames && togglePlayer(player.id)}
                    disabled={!hasGames}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-transparent shadow-sm"
                        : hasGames
                        ? "border-border hover:border-foreground/20 hover:bg-secondary/50"
                        : "border-border opacity-40 cursor-not-allowed"
                    }`}
                    style={isSelected && color ? { borderColor: color, backgroundColor: `${color}15` } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: isSelected && color ? color : "#6b7280" }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{player.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {player.position} • {player.grade}
                          {!hasGames && " • No games"}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {selIdx + 1}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison area */}
          <div>
            {selectedPlayers.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                <span className="text-4xl">📊</span>
                <p className="mt-3 font-medium">Select players to compare</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose 2–4 players from the list to see a side-by-side stat breakdown.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Player headers */}
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedPlayers.length}, 1fr)` }}>
                  {selectedPlayers.map((p, i) => (
                    <div
                      key={p.id}
                      className="rounded-xl border p-4 text-center"
                      style={{ borderColor: `${PLAYER_COLORS[i]}40`, backgroundColor: `${PLAYER_COLORS[i]}10` }}
                    >
                      <div
                        className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={{ backgroundColor: PLAYER_COLORS[i] }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.position} · {p.grade}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.games.length} game{p.games.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Stats comparison */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {(Object.entries(STAT_CONFIG) as [StatKey, typeof STAT_CONFIG[StatKey]][]).map(
                    ([key, config], rowIdx) => (
                      <div
                        key={key}
                        className={`p-4 ${rowIdx % 2 === 0 ? "" : "bg-secondary/20"}`}
                      >
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {config.label}
                          {config.inverted && (
                            <span className="ml-1 text-muted-foreground/60">(lower is better)</span>
                          )}
                        </p>
                        <div className="space-y-2">
                          {statsData.map((d, i) => {
                            const value = d.stats[key];
                            const maxVal = maxStats[key];
                            // For inverted stats (TOV), better = lower
                            const pct = config.inverted
                              ? maxVal > 0 ? Math.max(0, 100 - (value / maxVal) * 100) : 100
                              : maxVal > 0 ? (value / maxVal) * 100 : 0;

                            // Find best player for this stat
                            const best = config.inverted
                              ? statsData.reduce((min, d2) => d2.stats[key] < min.stats[key] ? d2 : min, statsData[0]!)
                              : statsData.reduce((max, d2) => d2.stats[key] > max.stats[key] ? d2 : max, statsData[0]!);
                            const isBest = best && d.player.id === best.player.id;

                            return (
                              <div key={d.player.id} className="flex items-center gap-3">
                                <div className="w-20 shrink-0 text-right">
                                  <span
                                    className={`text-sm font-bold ${isBest && selectedPlayers.length > 1 ? "text-foreground" : "text-muted-foreground"}`}
                                    style={isBest && selectedPlayers.length > 1 ? { color: PLAYER_COLORS[i] } : undefined}
                                  >
                                    {key === "fg_pct" ? value.toFixed(1) + "%" : value.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: PLAYER_COLORS[i],
                                        opacity: 0.8,
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="w-24 shrink-0">
                                  <p className="truncate text-xs text-muted-foreground">{d.player.name.split(" ")[0]}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Summary table */}
                <div className="rounded-xl border border-border bg-card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stat</th>
                        {selectedPlayers.map((p, i) => (
                          <th key={p.id} className="px-4 py-3 text-center font-medium" style={{ color: PLAYER_COLORS[i] }}>
                            {p.name.split(" ")[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.entries(STAT_CONFIG) as [StatKey, typeof STAT_CONFIG[StatKey]][]).map(
                        ([key, config], rowIdx) => {
                          const best = config.inverted
                            ? statsData.reduce((min, d) => d.stats[key] < min.stats[key] ? d : min, statsData[0]!)
                            : statsData.reduce((max, d) => d.stats[key] > max.stats[key] ? d : max, statsData[0]!);
                          return (
                            <tr key={key} className={rowIdx % 2 === 0 ? "" : "bg-secondary/20"}>
                              <td className="px-4 py-2.5 font-medium text-muted-foreground">{config.label}</td>
                              {statsData.map((d, i) => {
                                const value = d.stats[key];
                                const isBest = best && d.player.id === best.player.id && selectedPlayers.length > 1;
                                return (
                                  <td
                                    key={d.player.id}
                                    className="px-4 py-2.5 text-center font-semibold"
                                    style={isBest ? { color: PLAYER_COLORS[i] } : undefined}
                                  >
                                    {key === "fg_pct" ? value.toFixed(1) + "%" : value.toFixed(1)}
                                    {isBest && <span className="ml-1 text-xs">★</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }
                      )}
                      <tr className="border-t border-border font-medium">
                        <td className="px-4 py-2.5 text-muted-foreground">Games</td>
                        {selectedPlayers.map((p, i) => (
                          <td key={p.id} className="px-4 py-2.5 text-center" style={{ color: PLAYER_COLORS[i] }}>
                            {p.games.length}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
