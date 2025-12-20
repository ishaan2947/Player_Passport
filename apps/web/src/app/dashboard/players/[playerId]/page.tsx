"use client";

import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getPlayer,
  updatePlayer,
  addPlayerGame,
  updatePlayerGame,
  deletePlayerGame,
  generatePlayerReport,
  getPlayerReportByPlayerId,
  getPlayerReports,
  deletePlayerReport,
} from "@/lib/api";
import { PlayerModal } from "@/components/PlayerModal";
import { GameModal } from "@/components/GameModal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type {
  PlayerWithGames,
  PlayerGame,
  PlayerReport,
  CreatePlayerGameInput,
  CreatePlayerInput,
} from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";


const GameCard = memo(function GameCard({ 
  game, 
  onEdit, 
  onDelete 
}: { 
  game: PlayerGame; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fgPct = game.fga > 0 ? ((game.fgm / game.fga) * 100).toFixed(1) : "-";
  const tpPct = game.tpa > 0 ? ((game.tpm / game.tpa) * 100).toFixed(1) : "-";
  const ftPct = game.fta > 0 ? ((game.ftm / game.fta) * 100).toFixed(1) : "-";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{game.game_label || `vs ${game.opponent}`}</h4>
          <p className="text-sm text-muted-foreground">
            vs {game.opponent} • {new Date(game.game_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {game.minutes > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {game.minutes} MIN
            </span>
          )}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Edit game"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {showDeleteConfirm ? (
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this game? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(false); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); setShowDeleteConfirm(false); }}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Delete game"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
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
});

const ReportCard = memo(function ReportCard({ 
  report, 
  playerId, 
  onDelete 
}: { 
  report: PlayerReport; 
  playerId: string;
  onDelete: (reportId: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-500",
    generating: "bg-blue-500/20 text-blue-500",
    completed: "bg-green-500/20 text-green-500",
    failed: "bg-red-500/20 text-red-500",
  };

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-all hover:border-orange-500/50 hover:shadow-lg">
      <Link
        href={`/dashboard/players/${playerId}/reports/${report.id}`}
        className="block"
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
      {/* Delete button */}
      <div className="absolute right-2 top-2 z-20">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1 rounded-lg bg-card border border-destructive/30 p-1 shadow-lg">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(report.id); }}
              className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              Delete
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            title="Delete report"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerWithGames | null>(null);
  const [reports, setReports] = useState<PlayerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<PlayerGame | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isUpdatingGame, setIsUpdatingGame] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [isUpdatingPlayer, setIsUpdatingPlayer] = useState(false);

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

  async function handleUpdatePlayer(data: CreatePlayerInput) {
    if (!player) return;
    setIsUpdatingPlayer(true);
    try {
      const updatedPlayer = await updatePlayer(playerId, data);
      setPlayer({ ...updatedPlayer, games: player.games });
      setShowEditPlayerModal(false);
      toast.success("Player updated!", { description: `${updatedPlayer.name} has been updated.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update player";
      toast.error("Failed to update player", { description: message });
    } finally {
      setIsUpdatingPlayer(false);
    }
  }

  async function handleGameSubmit(data: CreatePlayerGameInput) {
    if (editingGame) {
      // Update existing game
      setIsUpdatingGame(true);
      try {
        const updatedGame = await updatePlayerGame(playerId, editingGame.id, data);
        setPlayer((prev) => prev ? { 
          ...prev, 
          games: prev.games.map(g => g.id === editingGame.id ? updatedGame : g)
        } : prev);
        setShowGameModal(false);
        setEditingGame(null);
        toast.success("Game updated!", { description: `${data.game_label} has been updated.` });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update game";
        toast.error("Failed to update game", { description: message });
      } finally {
        setIsUpdatingGame(false);
      }
    } else {
      // Add new game
      setIsAddingGame(true);
      try {
        const newGame = await addPlayerGame(playerId, data);
        setPlayer((prev) => prev ? { ...prev, games: [...prev.games, newGame] } : prev);
        setShowGameModal(false);
        toast.success("Game added!", { description: `${data.game_label} has been recorded.` });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to add game";
        toast.error("Failed to add game", { description: message });
      } finally {
        setIsAddingGame(false);
      }
    }
  }

  async function handleDeleteGame(gameId: string) {
    try {
      await deletePlayerGame(playerId, gameId);
      setPlayer((prev) => prev ? { 
        ...prev, 
        games: prev.games.filter(g => g.id !== gameId)
      } : prev);
      toast.success("Game deleted");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete game";
      toast.error("Failed to delete game", { description: message });
    }
  }

  function handleEditGame(game: PlayerGame) {
    setEditingGame(game);
    setShowGameModal(true);
  }

  function handleAddGameClick() {
    setEditingGame(null);
    setShowGameModal(true);
  }

  async function handleDeleteReport(reportId: string) {
    try {
      await deletePlayerReport(playerId, reportId);
      setReports(reports.filter((r) => r.id !== reportId));
      toast.success("Report deleted");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete report";
      toast.error("Failed to delete report", { description: message });
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

  // Calculate averages (aligned with dashboard PlayerCard stats)
  const games = player.games;
  const gamesCount = games.length;
  const reportsCount = reports.length;
  const avgPts = gamesCount > 0 ? (games.reduce((s, g) => s + g.pts, 0) / gamesCount).toFixed(1) : "0.0";

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
          <button
            onClick={() => setShowEditPlayerModal(true)}
            className="ml-auto rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            title="Edit player"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Stats Summary - Aligned with dashboard PlayerCard */}
        {gamesCount > 0 && (
          <div className="flex gap-6 rounded-xl border border-border bg-card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{avgPts}</p>
              <p className="text-xs text-muted-foreground">PPG</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{gamesCount}</p>
              <p className="text-xs text-muted-foreground">Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{reportsCount}</p>
              <p className="text-xs text-muted-foreground">Reports</p>
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
                onClick={handleAddGameClick}
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
                  <GameCard 
                    key={game.id} 
                    game={game}
                    onEdit={() => handleEditGame(game)}
                    onDelete={() => handleDeleteGame(game.id)}
                  />
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
                  <ReportCard key={report.id} report={report} playerId={playerId} onDelete={handleDeleteReport} />
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reports generated yet. Add games and generate your first report!
            </p>
          )}
        </div>
      </div>

      {/* Game Modal (Add/Edit) */}
      <GameModal
        isOpen={showGameModal}
        onClose={() => {
          setShowGameModal(false);
          setEditingGame(null);
        }}
        onSubmit={handleGameSubmit}
        isLoading={isAddingGame || isUpdatingGame}
        game={editingGame}
      />

      {/* Edit Player Modal */}
      <PlayerModal
        isOpen={showEditPlayerModal}
        onClose={() => setShowEditPlayerModal(false)}
        onSubmit={handleUpdatePlayer}
        isLoading={isUpdatingPlayer}
        player={player}
      />
    </div>
  );
}

