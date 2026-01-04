"use client";

import { useMemo } from "react";
import type { PlayerGame, PlayerReport } from "@/types/api";

interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

interface MilestoneBadgesProps {
  games: PlayerGame[];
  reports: PlayerReport[];
}

function computeBadges(games: PlayerGame[], reports: PlayerReport[]): Badge[] {
  const sorted = games
    .slice()
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

  const totalGames = games.length;
  const completedReports = reports.filter((r) => r.status === "completed");

  // Pre-compute season totals
  const totalFgm = games.reduce((s, g) => s + g.fgm, 0);
  const totalFga = games.reduce((s, g) => s + g.fga, 0);
  const seasonFgPct = totalFga >= 20 ? (totalFgm / totalFga) * 100 : null;

  // Best game stats
  const bestPts = Math.max(...games.map((g) => g.pts), 0);
  const bestAst = Math.max(...games.map((g) => g.ast), 0);
  const bestReb = Math.max(...games.map((g) => g.reb), 0);
  const bestStl = Math.max(...games.map((g) => g.stl), 0);
  const bestBlk = Math.max(...games.map((g) => g.blk), 0);

  // Double-double check: 10+ in two of pts/reb/ast
  const hasDoubleDouble = games.some(
    (g) =>
      [g.pts >= 10, g.reb >= 10, g.ast >= 10].filter(Boolean).length >= 2
  );
  const firstDoubleDouble = games.find(
    (g) => [g.pts >= 10, g.reb >= 10, g.ast >= 10].filter(Boolean).length >= 2
  );

  // Triple-double: 10+ in all three of pts/reb/ast
  const hasTripleDouble = games.some(
    (g) => g.pts >= 10 && g.reb >= 10 && g.ast >= 10
  );

  // Scoring streak: 20+ pts in 3 consecutive games
  let scoringStreak = 0;
  let maxScoringStreak = 0;
  for (const g of sorted) {
    if (g.pts >= 20) {
      scoringStreak++;
      maxScoringStreak = Math.max(maxScoringStreak, scoringStreak);
    } else {
      scoringStreak = 0;
    }
  }

  // 50%+ FG% over last 5 games (min 5 FGA each)
  const last5 = sorted.slice(-5);
  const last5Fgm = last5.reduce((s, g) => s + g.fgm, 0);
  const last5Fga = last5.reduce((s, g) => s + g.fga, 0);
  const last5FgPct = last5Fga >= 15 ? (last5Fgm / last5Fga) * 100 : null;

  // First game date helpers
  const firstGame = sorted[0];
  const bestPtsGame = games.find((g) => g.pts === bestPts);
  const bestStlGame = games.find((g) => g.stl === bestStl);
  const bestBlkGame = games.find((g) => g.blk === bestBlk);
  const firstReport = completedReports[0];

  return [
    {
      id: "first_game",
      emoji: "🏀",
      title: "First Game",
      description: "Log your first game",
      earned: totalGames >= 1,
      earnedDate: firstGame?.game_date,
    },
    {
      id: "five_games",
      emoji: "📅",
      title: "Getting Started",
      description: "Log 5 games",
      earned: totalGames >= 5,
      earnedDate: sorted[4]?.game_date,
    },
    {
      id: "ten_games",
      emoji: "🔟",
      title: "Season Veteran",
      description: "Log 10 games",
      earned: totalGames >= 10,
      earnedDate: sorted[9]?.game_date,
    },
    {
      id: "scorer_20",
      emoji: "🔥",
      title: "Scorer",
      description: "Score 20+ pts in a game",
      earned: bestPts >= 20,
      earnedDate: bestPtsGame?.game_date,
    },
    {
      id: "scorer_30",
      emoji: "💥",
      title: "Bucket Getter",
      description: "Score 30+ pts in a game",
      earned: bestPts >= 30,
      earnedDate: bestPts >= 30 ? games.find((g) => g.pts >= 30)?.game_date : undefined,
    },
    {
      id: "hot_hand",
      emoji: "🌶️",
      title: "Hot Hand",
      description: "Score 20+ pts in 3 consecutive games",
      earned: maxScoringStreak >= 3,
    },
    {
      id: "playmaker",
      emoji: "🎯",
      title: "Playmaker",
      description: "Record 8+ assists in a game",
      earned: bestAst >= 8,
      earnedDate: bestAst >= 8 ? games.find((g) => g.ast >= 8)?.game_date : undefined,
    },
    {
      id: "glass_cleaner",
      emoji: "🪟",
      title: "Glass Cleaner",
      description: "Grab 12+ rebounds in a game",
      earned: bestReb >= 12,
      earnedDate: bestReb >= 12 ? games.find((g) => g.reb >= 12)?.game_date : undefined,
    },
    {
      id: "lockdown",
      emoji: "🔒",
      title: "Lockdown",
      description: "Record 4+ steals in a game",
      earned: bestStl >= 4,
      earnedDate: bestStlGame?.game_date,
    },
    {
      id: "rim_protector",
      emoji: "🛡️",
      title: "Rim Protector",
      description: "Record 4+ blocks in a game",
      earned: bestBlk >= 4,
      earnedDate: bestBlkGame?.game_date,
    },
    {
      id: "double_double",
      emoji: "✌️",
      title: "Double-Double",
      description: "10+ in two stat categories in one game",
      earned: hasDoubleDouble,
      earnedDate: firstDoubleDouble?.game_date,
    },
    {
      id: "triple_double",
      emoji: "3️⃣",
      title: "Triple-Double",
      description: "10+ pts, reb, and ast in one game",
      earned: hasTripleDouble,
      earnedDate: hasTripleDouble ? games.find((g) => g.pts >= 10 && g.reb >= 10 && g.ast >= 10)?.game_date : undefined,
    },
    {
      id: "efficient",
      emoji: "⚡",
      title: "Efficient",
      description: "50%+ FG% on 20+ attempts (season)",
      earned: seasonFgPct !== null && seasonFgPct >= 50,
    },
    {
      id: "hot_shooter",
      emoji: "🎯",
      title: "Hot Shooter",
      description: "50%+ FG% over last 5 games (15+ FGA)",
      earned: last5FgPct !== null && last5FgPct >= 50,
    },
    {
      id: "first_report",
      emoji: "📊",
      title: "Report Unlocked",
      description: "Generate your first AI report",
      earned: completedReports.length >= 1,
      earnedDate: firstReport?.created_at,
    },
    {
      id: "three_reports",
      emoji: "📈",
      title: "Data Driven",
      description: "Generate 3 AI reports",
      earned: completedReports.length >= 3,
    },
  ];
}

export function MilestoneBadges({ games, reports }: MilestoneBadgesProps) {
  const badges = useMemo(() => computeBadges(games, reports), [games, reports]);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  if (games.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Milestones</h3>
          <p className="text-xs text-muted-foreground">
            {earnedBadges.length} / {badges.length} earned
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20">
          <span className="text-lg">🏆</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
          style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
        />
      </div>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Earned
          </p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="group relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3 py-1.5"
                title={badge.description}
              >
                <span className="text-sm">{badge.emoji}</span>
                <span className="text-xs font-medium text-orange-500">{badge.title}</span>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-card border border-border px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {badge.description}
                  {badge.earnedDate && (
                    <span className="ml-1 text-muted-foreground">
                      · {new Date(badge.earnedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {lockedBadges.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Locked
          </p>
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="group relative flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 opacity-40"
                title={badge.description}
              >
                <span className="text-sm grayscale">{badge.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">{badge.title}</span>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-card border border-border px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
