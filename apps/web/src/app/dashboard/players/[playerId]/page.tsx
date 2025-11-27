"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getPlayer,
  addPlayerGame,
  generatePlayerReport,
  getPlayerReportByPlayerId,
  getPlayerReports,
} from "@/lib/api";
import type {
  PlayerWithGames,
  PlayerGame,
  PlayerReport,
  CreatePlayerGameInput,
} from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function AddGameModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerGameInput) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    game_label: "",
    game_date: new Date().toISOString().split("T")[0] ?? "",
    opponent: "",
    minutes: undefined as number | undefined,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    notes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.opponent.trim()) {
      toast.error("Opponent is required");
      return;
    }
    const submitData: CreatePlayerGameInput = {
      ...formData,
      game_label: formData.game_label || undefined,
      notes: formData.notes || undefined,
    };
    onSubmit(submitData);
  }

  function handleNumberChange(field: keyof CreatePlayerGameInput, value: string) {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setFormData({ ...formData, [field]: num });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">Add Game Stats</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Game Label *</label>
              <input
                type="text"
                value={formData.game_label}
                onChange={(e) => setFormData({ ...formData, game_label: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g., Game 1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date *</label>
              <input
                type="date"
                value={formData.game_date}
                onChange={(e) => setFormData({ ...formData, game_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Opponent *</label>
              <input
                type="text"
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g., Lincoln HS"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Minutes Played</label>
            <input
              type="number"
              value={formData.minutes ?? ""}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g., 28"
              min={0}
            />
          </div>

          {/* Basic Stats */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Basic Stats</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { key: "pts", label: "PTS" },
                { key: "reb", label: "REB" },
                { key: "ast", label: "AST" },
                { key: "stl", label: "STL" },
                { key: "blk", label: "BLK" },
                { key: "tov", label: "TOV" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    type="number"
                    value={formData[key as keyof CreatePlayerGameInput] ?? 0}
                    onChange={(e) => handleNumberChange(key as keyof CreatePlayerGameInput, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Shooting Stats */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Shooting</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FGM</label>
                  <input
                    type="number"
                    value={formData.fgm ?? 0}
                    onChange={(e) => handleNumberChange("fgm", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FGA</label>
                  <input
                    type="number"
                    value={formData.fga ?? 0}
                    onChange={(e) => handleNumberChange("fga", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">3PM</label>
                  <input
                    type="number"
                    value={formData.tpm ?? 0}
                    onChange={(e) => handleNumberChange("tpm", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">3PA</label>
                  <input
                    type="number"
                    value={formData.tpa ?? 0}
                    onChange={(e) => handleNumberChange("tpa", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FTM</label>
                  <input
                    type="number"
                    value={formData.ftm ?? 0}
                    onChange={(e) => handleNumberChange("ftm", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FTA</label>
                  <input
                    type="number"
                    value={formData.fta ?? 0}
                    onChange={(e) => handleNumberChange("fta", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-center"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium">Game Notes</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Any observations, matchups, playing time context..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Game"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GameCard({ game }: { game: PlayerGame }) {
  const fgPct = game.fga > 0 ? ((game.fgm / game.fga) * 100).toFixed(1) : "-";
  const tpPct = game.tpa > 0 ? ((game.tpm / game.tpa) * 100).toFixed(1) : "-";
  const ftPct = game.fta > 0 ? ((game.ftm / game.fta) * 100).toFixed(1) : "-";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{game.game_label || `vs ${game.opponent}`}</h4>
          <p className="text-sm text-muted-foreground">
            vs {game.opponent} • {new Date(game.game_date).toLocaleDateString()}
          </p>
        </div>
        {game.minutes > 0 && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
            {game.minutes} MIN
          </span>
        )}
      </div>
      <div className="grid grid-cols-6 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-orange-500">{game.pts}</p>
          <p className="text-xs text-muted-foreground">PTS</p>
        </div>
        <div>
          <p className="text-lg font-bold">{game.reb}</p>
          <p className="text-xs text-muted-foreground">REB</p>
        </div>
        <div>
          <p className="text-lg font-bold">{game.ast}</p>
          <p className="text-xs text-muted-foreground">AST</p>
        </div>
        <div>
          <p className="text-lg font-bold">{game.stl}</p>
          <p className="text-xs text-muted-foreground">STL</p>
        </div>
        <div>
          <p className="text-lg font-bold">{game.blk}</p>
          <p className="text-xs text-muted-foreground">BLK</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-400">{game.tov}</p>
          <p className="text-xs text-muted-foreground">TOV</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>FG: {game.fgm}/{game.fga} ({fgPct}%)</span>
        <span>3P: {game.tpm}/{game.tpa} ({tpPct}%)</span>
        <span>FT: {game.ftm}/{game.fta} ({ftPct}%)</span>
      </div>
      {game.notes && (
        <p className="mt-3 text-sm text-muted-foreground italic border-t border-border pt-3">
          &ldquo;{game.notes}&rdquo;
        </p>
      )}
    </div>
  );
}

function ReportCard({ report, playerId }: { report: PlayerReport; playerId: string }) {
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-500",
    generating: "bg-blue-500/20 text-blue-500",
    completed: "bg-green-500/20 text-green-500",
    failed: "bg-red-500/20 text-red-500",
  };

  return (
    <Link
      href={`/dashboard/players/${playerId}/reports/${report.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-orange-500/50 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Development Report</p>
          <p className="text-sm text-muted-foreground">
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[report.status]}`}>
          {report.status}
        </span>
      </div>
      {report.status === "completed" && report.report_json && (
        <div className="mt-3 text-sm text-muted-foreground">
          <p className="line-clamp-2">{report.report_json.growth_summary}</p>
        </div>
      )}
      {report.status === "failed" && report.error_text && (
        <p className="mt-2 text-sm text-red-400">{report.error_text}</p>
      )}
    </Link>
  );
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerWithGames | null>(null);
  const [reports, setReports] = useState<PlayerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const loadPlayer = useCallback(async () => {
    try {
      const [playerData, reportsData] = await Promise.all([
        getPlayer(playerId),
        getPlayerReports(playerId),
      ]);
      setPlayer(playerData);
      setReports(reportsData);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load player";
      toast.error("Failed to load player", { description: message });
      router.push("/dashboard/players");
    } finally {
      setLoading(false);
    }
  }, [playerId, router]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  async function handleAddGame(data: CreatePlayerGameInput) {
    setIsAddingGame(true);
    try {
      const newGame = await addPlayerGame(playerId, data);
      setPlayer((prev) => prev ? { ...prev, games: [...prev.games, newGame] } : prev);
      setShowAddGameModal(false);
      toast.success("Game added!", { description: `${data.game_label} has been recorded.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add game";
      toast.error("Failed to add game", { description: message });
    } finally {
      setIsAddingGame(false);
    }
  }

  async function handleGenerateReport() {
    if (!player) return;
    if (player.games.length < 3) {
      toast.error("Not enough games", { description: "Please add at least 3 games to generate a development report." });
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Take the most recent 5 games for the report
      const recentGames = player.games
        .slice()
        .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
        .slice(0, 5);
      
      const response = await generatePlayerReport(playerId, {
        game_ids: recentGames.map((g) => g.id),
      });
      toast.success("Report generation started!");

      // Poll for report completion
      const checkReport = async () => {
        try {
          const report = await getPlayerReportByPlayerId(playerId, response.id);
          if (report.status === "completed" || report.status === "failed") {
            await loadPlayer();
            if (report.status === "completed") {
              toast.success("Report ready!", { description: "Your development report is now available." });
              router.push(`/dashboard/players/${playerId}/reports/${report.id}`);
            } else {
              toast.error("Report generation failed", { description: report.error_text || "Unknown error" });
            }
          } else {
            setTimeout(checkReport, 2000);
          }
        } catch {
          await loadPlayer();
        }
      };
      setTimeout(checkReport, 2000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to generate report";
      toast.error("Failed to generate report", { description: message });
    } finally {
      setIsGeneratingReport(false);
    }
  }

  if (loading) return <DashboardSkeleton />;
  if (!player) return null;

  // Calculate averages
  const games = player.games;
  const gamesCount = games.length;
  const avgPts = gamesCount > 0 ? (games.reduce((s, g) => s + g.pts, 0) / gamesCount).toFixed(1) : "-";
  const avgReb = gamesCount > 0 ? (games.reduce((s, g) => s + g.reb, 0) / gamesCount).toFixed(1) : "-";
  const avgAst = gamesCount > 0 ? (games.reduce((s, g) => s + g.ast, 0) / gamesCount).toFixed(1) : "-";

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

      {/* Player Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-3xl font-bold text-white">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{player.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
              {player.position && (
                <span className="rounded-full bg-orange-500/20 px-3 py-0.5 text-sm font-medium text-orange-500">
                  {player.position}
                </span>
              )}
              {player.grade && <span>{player.grade}</span>}
              {player.height && <span>• {player.height}</span>}
              {player.team && <span>• {player.team}</span>}
            </div>
            {player.goals && player.goals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {player.goals.map((goal, i) => (
                  <span key={i} className="text-xs text-muted-foreground">
                    🎯 {goal}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {gamesCount > 0 && (
          <div className="flex gap-6 rounded-xl border border-border bg-card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{avgPts}</p>
              <p className="text-xs text-muted-foreground">PPG</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{avgReb}</p>
              <p className="text-xs text-muted-foreground">RPG</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{avgAst}</p>
              <p className="text-xs text-muted-foreground">APG</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{gamesCount}</p>
              <p className="text-xs text-muted-foreground">Games</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Games Section */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Game Log</h2>
            <button
              onClick={() => setShowAddGameModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Game
            </button>
          </div>

          {games.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 font-semibold">No games recorded yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add game stats to start tracking development
              </p>
              <button
                onClick={() => setShowAddGameModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Add First Game
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {games
                .slice()
                .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
                .map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Development Reports</h2>

          {/* Generate Report Card */}
          <div className="mb-4 rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-4">
            <h3 className="font-semibold">Generate AI Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {games.length < 3
                ? `Add ${3 - games.length} more game(s) to generate a development report.`
                : "Analyze recent games and get personalized coaching insights."}
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={games.length < 3 || isGeneratingReport}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>

          {/* Previous Reports */}
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((report) => (
                  <ReportCard key={report.id} report={report} playerId={playerId} />
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reports generated yet. Add games and generate your first report!
            </p>
          )}
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        onSubmit={handleAddGame}
        isLoading={isAddingGame}
      />
    </div>
  );
}

