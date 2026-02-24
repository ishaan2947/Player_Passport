"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PlayerGame } from "@/types/api";

type StatKey = "pts" | "reb" | "ast" | "stl" | "fg_pct" | "tov";

const STAT_CONFIG: Record<StatKey, { label: string; color: string }> = {
  pts: { label: "Points", color: "#f97316" },
  reb: { label: "Rebounds", color: "#3b82f6" },
  ast: { label: "Assists", color: "#10b981" },
  stl: { label: "Steals", color: "#a855f7" },
  fg_pct: { label: "FG%", color: "#eab308" },
  tov: { label: "Turnovers", color: "#ef4444" },
};

const PRESETS: { label: string; stats: StatKey[] }[] = [
  { label: "Scoring", stats: ["pts", "fg_pct"] },
  { label: "All-Around", stats: ["pts", "reb", "ast"] },
  { label: "Efficiency", stats: ["fg_pct", "ast", "tov"] },
];

interface SeasonStatsChartProps {
  games: PlayerGame[];
}

export function SeasonStatsChart({ games }: SeasonStatsChartProps) {
  const [activeStats, setActiveStats] = useState<StatKey[]>(["pts", "reb", "ast"]);

  const chartData = useMemo(() => {
    return games
      .slice()
      .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
      .map((game) => ({
        name: `vs ${game.opponent}`,
        date: new Date(game.game_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pts: game.pts,
        reb: game.reb,
        ast: game.ast,
        stl: game.stl,
        tov: game.tov,
        fg_pct: game.fga > 0 ? Math.round((game.fgm / game.fga) * 100) : 0,
      }));
  }, [games]);

  // Compute season averages
  const averages = useMemo(() => {
    if (games.length === 0) return null;
    const n = games.length;
    const totalFgm = games.reduce((s, g) => s + g.fgm, 0);
    const totalFga = games.reduce((s, g) => s + g.fga, 0);
    return {
      pts: (games.reduce((s, g) => s + g.pts, 0) / n).toFixed(1),
      reb: (games.reduce((s, g) => s + g.reb, 0) / n).toFixed(1),
      ast: (games.reduce((s, g) => s + g.ast, 0) / n).toFixed(1),
      stl: (games.reduce((s, g) => s + g.stl, 0) / n).toFixed(1),
      tov: (games.reduce((s, g) => s + g.tov, 0) / n).toFixed(1),
      fg_pct: totalFga > 0 ? ((totalFgm / totalFga) * 100).toFixed(1) : "0.0",
    };
  }, [games]);

  function toggleStat(stat: StatKey) {
    setActiveStats((prev) =>
      prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
    );
  }

  function applyPreset(stats: StatKey[]) {
    setActiveStats(stats);
  }

  if (games.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Season Trends</h3>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.stats)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat toggle chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.entries(STAT_CONFIG) as [StatKey, { label: string; color: string }][]).map(
          ([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => toggleStat(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeStats.includes(key)
                  ? "text-white shadow-sm"
                  : "border border-border text-muted-foreground hover:border-foreground/30"
              }`}
              style={activeStats.includes(key) ? { backgroundColor: color } : undefined}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              iconType="circle"
              iconSize={8}
            />
            {activeStats.map((stat) => (
              <Line
                key={stat}
                type="monotone"
                dataKey={stat}
                name={STAT_CONFIG[stat].label}
                stroke={STAT_CONFIG[stat].color}
                strokeWidth={2}
                dot={{ r: 4, fill: STAT_CONFIG[stat].color }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Season Averages */}
      {averages && (
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 sm:grid-cols-6">
          {(Object.entries(STAT_CONFIG) as [StatKey, { label: string; color: string }][]).map(
            ([key, { label, color }]) => (
              <div key={key} className="text-center">
                <p className="text-lg font-bold" style={{ color }}>
                  {averages[key]}{key === "fg_pct" ? "%" : ""}
                </p>
                <p className="text-xs text-muted-foreground">{label} Avg</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
