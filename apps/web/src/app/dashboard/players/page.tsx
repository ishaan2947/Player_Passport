"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getPlayers, createPlayer, deletePlayer, seedDemoPlayers } from "@/lib/api";
import type { Player, CreatePlayerInput } from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function AddPlayerModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerInput) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreatePlayerInput>({
    name: "",
    grade: "",
    position: "",
    height: "",
    team: "",
    goals: [],
  });
  const [goalsInput, setGoalsInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Player name is required");
      return;
    }
    const goals = goalsInput.split(",").map((g) => g.trim()).filter(Boolean);
    onSubmit({ ...formData, goals });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Add New Player</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Player Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Marcus Johnson"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Grade</label>
              <select
                value={formData.grade || ""}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select grade</option>
                <option value="6th">6th Grade</option>
                <option value="7th">7th Grade</option>
                <option value="8th">8th Grade</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Position</label>
              <select
                value={formData.position || ""}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select position</option>
                <option value="PG">Point Guard (PG)</option>
                <option value="SG">Shooting Guard (SG)</option>
                <option value="SF">Small Forward (SF)</option>
                <option value="PF">Power Forward (PF)</option>
                <option value="C">Center (C)</option>
                <option value="G">Guard (G)</option>
                <option value="F">Forward (F)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Height</label>
              <input
                type="text"
                value={formData.height || ""}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 5'10&quot;"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Team Name</label>
              <input
                type="text"
                value={formData.team || ""}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Central High"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Goals (comma-separated)</label>
            <input
              type="text"
              value={goalsInput}
              onChange={(e) => setGoalsInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Make varsity, Improve 3PT shooting"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyPlayersState({ 
  onAddPlayer, 
  onLoadDemo, 
  isLoadingDemo 
}: { 
  onAddPlayer: () => void; 
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20">
        <svg
          className="h-10 w-10 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-bold">No players yet</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Add your first player to start tracking their development, games, and get AI-powered coaching insights.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onAddPlayer}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-orange-500/25"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Player
        </button>
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isLoadingDemo ? "Loading Demo..." : "Try Demo Players"}
        </button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo players come with sample games so you can explore reports immediately
      </p>
    </div>
  );
}

function PlayerCard({ player, onDelete }: { player: Player; onDelete: (id: string) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      
      <Link href={`/dashboard/players/${player.id}`} className="block p-6 pr-12">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-bold text-white">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">{player.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {player.position && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium">
                  {player.position}
                </span>
              )}
              {player.grade && <span>{player.grade}</span>}
              {player.team && (
                <>
                  <span>•</span>
                  <span>{player.team}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {player.goals && player.goals.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Goals</p>
            <div className="flex flex-wrap gap-2">
              {player.goals.slice(0, 3).map((goal, i) => (
                <span key={i} className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-500">
                  {goal}
                </span>
              ))}
              {player.goals.length > 3 && (
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  +{player.goals.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </Link>

      {/* Arrow indicator - positioned on the right edge, vertically centered */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <svg
          className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Delete button - top right corner, separate from arrow */}
      <div className="absolute right-2 top-2 z-10">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1 rounded-lg bg-card border border-destructive/30 p-1 shadow-lg">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(player.id); }}
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
            title="Delete player"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

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

  async function handleCreatePlayer(data: CreatePlayerInput) {
    setIsCreating(true);
    try {
      const newPlayer = await createPlayer(data);
      setPlayers([...players, newPlayer]);
      setShowAddModal(false);
      toast.success("Player created!", {
        description: `${newPlayer.name} has been added to your roster.`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create player";
      toast.error("Failed to create player", { description: message });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeletePlayer(id: string) {
    try {
      await deletePlayer(id);
      setPlayers(players.filter((p) => p.id !== id));
      toast.success("Player deleted");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete player";
      toast.error("Failed to delete player", { description: message });
    }
  }

  async function handleLoadDemoPlayers() {
    setIsLoadingDemo(true);
    try {
      const demoPlayers = await seedDemoPlayers();
      if (demoPlayers.length === 0) {
        toast.info("Demo players already exist", {
          description: "The demo players have already been added to your account.",
        });
      } else {
        setPlayers([...players, ...demoPlayers]);
        toast.success(`Added ${demoPlayers.length} demo players!`, {
          description: "Each player has 4-5 sample games. Try generating a report!",
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load demo players";
      toast.error("Failed to load demo players", { description: message });
    } finally {
      setIsLoadingDemo(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Players</h1>
          <p className="mt-1 text-muted-foreground">
            Track player development and get AI-powered coaching insights
          </p>
        </div>
        {players.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-orange-500/25"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Player
          </button>
        )}
      </div>

      {/* Players Grid */}
      {players.length === 0 ? (
        <EmptyPlayersState 
          onAddPlayer={() => setShowAddModal(true)} 
          onLoadDemo={handleLoadDemoPlayers}
          isLoadingDemo={isLoadingDemo}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} onDelete={handleDeletePlayer} />
          ))}
        </div>
      )}

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreatePlayer}
        isLoading={isCreating}
      />
    </div>
  );
}

