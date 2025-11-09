"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTeam, getGames, createGame, deleteTeam, deleteGame } from "@/lib/api";
import type { TeamWithMembers, Game } from "@/types/api";
import { ListItemSkeleton } from "@/components/ui/skeleton";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGameForm, setShowGameForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [gameForm, setGameForm] = useState<{
    opponent_name: string;
    game_date: string;
    location: string;
    notes: string;
  }>({
    opponent_name: "",
    game_date: new Date().toISOString().split("T")[0] ?? "",
    location: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [teamData, gamesData] = await Promise.all([
        getTeam(teamId),
        getGames(teamId),
      ]);
      setTeam(teamData);
      setGames(gamesData.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load team";
      toast.error("Failed to load team", { description: message });
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    
    if (!gameForm.opponent_name.trim()) {
      setFormError("Opponent name is required");
      return;
    }

    setCreating(true);
    setFormError(null);

    try {
      const game = await createGame(teamId, {
        opponent_name: gameForm.opponent_name.trim(),
        game_date: gameForm.game_date,
        location: gameForm.location.trim() || undefined,
        notes: gameForm.notes.trim() || undefined,
      });
      setGames([game, ...games]);
      setGameForm({
        opponent_name: "",
        game_date: new Date().toISOString().split("T")[0] ?? "",
        location: "",
        notes: "",
      });
      setShowGameForm(false);
      toast.success("Game created!", {
        description: "Now add stats to generate your AI report.",
        action: {
          label: "Add Stats",
          onClick: () => router.push(`/dashboard/games/${game.id}`),
        },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create game";
      toast.error("Failed to create game", { description: message });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTeam() {
    if (!confirm(`Are you sure you want to delete "${team?.name}"? All games and reports will be permanently deleted.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted");
      router.push("/dashboard/teams");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete team";
      toast.error("Failed to delete team", { description: message });
      setDeleting(false);
    }
  }

  async function handleDeleteGame(game: Game) {
    if (!confirm(`Delete game vs ${game.opponent_name}? This cannot be undone.`)) {
      return;
    }

    setDeletingGameId(game.id);
    try {
      await deleteGame(game.id);
      setGames(games.filter((g) => g.id !== game.id));
      toast.success("Game deleted");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete game";
      toast.error("Failed to delete game", { description: message });
    } finally {
      setDeletingGameId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8 animate-pulse">
          <div className="h-6 w-24 rounded bg-muted" />
          <div className="mt-4 h-8 w-48 rounded bg-muted" />
          <div className="mt-2 h-5 w-32 rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <svg className="mb-4 h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold">Team not found</h2>
        <p className="mt-2 text-muted-foreground">This team may have been deleted.</p>
        <Link
          href="/dashboard/teams"
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Teams
        </Link>
      </div>
    );
  }

  const userRole = team.members[0]?.role || "member";
  const isOwner = userRole === "owner";
  const isCoachOrOwner = userRole === "owner" || userRole === "coach";

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/teams"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Teams
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{team.name}</h1>
              <p className="mt-1 capitalize text-muted-foreground">{team.sport}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isCoachOrOwner && (
              <button
                onClick={() => setShowGameForm(!showGameForm)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Game
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDeleteTeam}
                disabled={deleting}
                className="rounded-lg border border-destructive/50 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Game Form */}
      {showGameForm && (
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/50 px-6 py-4">
            <h2 className="text-lg font-semibold">Add New Game</h2>
            <p className="text-sm text-muted-foreground">Record a game to track stats and generate AI insights</p>
          </div>
          <form onSubmit={handleCreateGame} className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Opponent <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={gameForm.opponent_name}
                  onChange={(e) => {
                    setGameForm({ ...gameForm, opponent_name: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  placeholder="Opponent team name"
                  className={`w-full rounded-lg border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                    formError ? "border-destructive" : "border-border"
                  }`}
                  autoFocus
                />
                {formError && (
                  <p className="mt-1.5 text-sm text-destructive">{formError}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={gameForm.game_date}
                  onChange={(e) => setGameForm({ ...gameForm, game_date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Location</label>
                <input
                  type="text"
                  value={gameForm.location}
                  onChange={(e) => setGameForm({ ...gameForm, location: e.target.value })}
                  placeholder="Home, Away, or venue name"
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes</label>
                <input
                  type="text"
                  value={gameForm.notes}
                  onChange={(e) => setGameForm({ ...gameForm, notes: e.target.value })}
                  placeholder="Pre-game notes or context"
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowGameForm(false);
                  setFormError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Game"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Games List */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Games ({games.length})</h2>
        </div>
        <div className="p-4">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold">No games yet</h3>
              <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                Add your first game to start tracking stats and generating AI coaching insights.
              </p>
              {isCoachOrOwner && (
                <button
                  onClick={() => setShowGameForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Game
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="group relative flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-secondary/50"
                >
                  <Link href={`/dashboard/games/${game.id}`} className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-muted text-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(game.game_date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {new Date(game.game_date).getDate()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">vs {game.opponent_name}</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="sm:hidden">
                            {new Date(game.game_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline">
                            {new Date(game.game_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {game.location && ` • ${game.location}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    {game.has_report ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Report
                      </span>
                    ) : game.has_stats ? (
                      <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                        </svg>
                        Stats
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Needs Stats
                      </span>
                    )}
                    
                    {/* Delete button */}
                    {isCoachOrOwner && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteGame(game);
                        }}
                        disabled={deletingGameId === game.id}
                        className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                        title="Delete game"
                      >
                        {deletingGameId === game.id ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                    
                    <Link href={`/dashboard/games/${game.id}`}>
                      <svg className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="mt-6 rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {(member.user_email ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.user_email || "Unknown"}</p>
                    <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                {member.role === "owner" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
