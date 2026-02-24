"use client";

import { useState, useMemo } from "react";
import type { PlayerGame } from "@/types/api";

// Stat-based goal definitions that can be auto-tracked
const GOAL_TEMPLATES = [
  { label: "Average PPG", stat: "pts", unit: "PPG" },
  { label: "Average RPG", stat: "reb", unit: "RPG" },
  { label: "Average APG", stat: "ast", unit: "APG" },
  { label: "FG%", stat: "fg_pct", unit: "%" },
  { label: "3PT%", stat: "three_pct", unit: "%" },
  { label: "FT%", stat: "ft_pct", unit: "%" },
  { label: "Average SPG", stat: "stl", unit: "SPG" },
  { label: "Keep TOV under", stat: "tov_under", unit: "TOV" },
] as const;

type StatType = (typeof GOAL_TEMPLATES)[number]["stat"];

interface TrackedGoal {
  id: string;
  label: string;
  target: number;
  stat: StatType;
  unit: string;
}

function computeStatValue(games: PlayerGame[], stat: StatType): number {
  if (games.length === 0) return 0;
  const n = games.length;
  switch (stat) {
    case "pts":
      return games.reduce((s, g) => s + g.pts, 0) / n;
    case "reb":
      return games.reduce((s, g) => s + g.reb, 0) / n;
    case "ast":
      return games.reduce((s, g) => s + g.ast, 0) / n;
    case "stl":
      return games.reduce((s, g) => s + g.stl, 0) / n;
    case "tov_under":
      return games.reduce((s, g) => s + g.tov, 0) / n;
    case "fg_pct": {
      const fgm = games.reduce((s, g) => s + g.fgm, 0);
      const fga = games.reduce((s, g) => s + g.fga, 0);
      return fga > 0 ? (fgm / fga) * 100 : 0;
    }
    case "three_pct": {
      const tpm = games.reduce((s, g) => s + g.tpm, 0);
      const tpa = games.reduce((s, g) => s + g.tpa, 0);
      return tpa > 0 ? (tpm / tpa) * 100 : 0;
    }
    case "ft_pct": {
      const ftm = games.reduce((s, g) => s + g.ftm, 0);
      const fta = games.reduce((s, g) => s + g.fta, 0);
      return fta > 0 ? (ftm / fta) * 100 : 0;
    }
    default:
      return 0;
  }
}

function getProgress(current: number, target: number, stat: StatType): number {
  if (target === 0) return 0;
  // For turnovers, lower is better
  if (stat === "tov_under") {
    if (current <= target) return 100;
    // If current is double the target, 0% progress
    return Math.max(0, Math.round((1 - (current - target) / target) * 100));
  }
  return Math.min(100, Math.round((current / target) * 100));
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return "bg-green-500";
  if (progress >= 75) return "bg-emerald-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-red-500";
}

// Persistence key for localStorage
function storageKey(playerId: string) {
  return `pp_goals_${playerId}`;
}

function loadGoals(playerId: string): TrackedGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(storageKey(playerId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGoals(playerId: string, goals: TrackedGoal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(playerId), JSON.stringify(goals));
}

interface GoalsTrackerProps {
  playerId: string;
  games: PlayerGame[];
}

export function GoalsTracker({ playerId, games }: GoalsTrackerProps) {
  const [goals, setGoals] = useState<TrackedGoal[]>(() => loadGoals(playerId));
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatType>("pts");
  const [targetValue, setTargetValue] = useState("");

  // Recent games for progress (last 5)
  const recentGames = useMemo(() => {
    return games
      .slice()
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, 5);
  }, [games]);

  function addGoal() {
    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) return;

    const template = GOAL_TEMPLATES.find((t) => t.stat === selectedStat);
    if (!template) return;

    const newGoal: TrackedGoal = {
      id: crypto.randomUUID(),
      label: template.label,
      target,
      stat: selectedStat,
      unit: template.unit,
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    saveGoals(playerId, updated);
    setShowAddForm(false);
    setTargetValue("");
  }

  function removeGoal(goalId: string) {
    const updated = goals.filter((g) => g.id !== goalId);
    setGoals(updated);
    saveGoals(playerId, updated);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Goals Tracker</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Stat</label>
              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value as StatType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {GOAL_TEMPLATES.map((t) => (
                  <option key={t.stat} value={t.stat}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Target</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 15"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addGoal}
                disabled={!targetValue || parseFloat(targetValue) <= 0}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddForm(false); setTargetValue(""); }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No goals set yet. Add a goal to track your progress!
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Progress is calculated from your last 5 games.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const current = computeStatValue(recentGames, goal.stat);
            const progress = getProgress(current, goal.target, goal.stat);
            const isInverse = goal.stat === "tov_under";
            const displayCurrent = current.toFixed(1);
            const displayTarget = goal.target.toFixed(1);

            return (
              <div key={goal.id} className="group relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {goal.label}: {isInverse ? "<" : ""}{displayTarget}{goal.unit === "%" ? "%" : ""}
                    </span>
                    {progress >= 100 && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
                        Achieved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Current: {displayCurrent}{goal.unit === "%" ? "%" : ""}
                    </span>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title="Remove goal"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-xs text-muted-foreground">{progress}%</p>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Based on last {recentGames.length} game{recentGames.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
