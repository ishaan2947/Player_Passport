"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getPlayers, createPlayer, deletePlayer, seedDemoPlayers } from "@/lib/api";
import type { Player, CreatePlayerInput } from "@/types/api";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { PlayerModal } from "@/components/PlayerModal";

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
      {/* Background gradient - pointer-events-none so it doesn't block clicks */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      
      {/* Main clickable area */}
      <Link href={`/dashboard/players/${player.id}`} className="relative block p-6">
        <div className="flex items-start gap-4 pr-8">
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
          {/* Arrow inside the link */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <svg
              className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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

      {/* Delete button - top right corner, above everything */}
      <div className="absolute right-2 top-2 z-20">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("");

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

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = !searchQuery || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.goals?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPosition = !filterPosition || player.position === filterPosition;
    const matchesGrade = !filterGrade || player.grade === filterGrade;
    return matchesSearch && matchesPosition && matchesGrade;
  });

  // Get unique values for filters
  const positions = Array.from(new Set(players.map(p => p.position).filter(Boolean))) as string[];
  const grades = Array.from(new Set(players.map(p => p.grade).filter(Boolean))) as string[];

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

      {/* Search and Filters */}
      {players.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, team, or goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Positions</option>
              {positions.sort().map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Grades</option>
              {grades.sort().map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {(searchQuery || filterPosition || filterGrade) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterPosition("");
                  setFilterGrade("");
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results count */}
          {filteredPlayers.length !== players.length && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredPlayers.length} of {players.length} players
            </p>
          )}
        </div>
      )}

      {/* Players Grid */}
      {players.length === 0 ? (
        <EmptyPlayersState 
          onAddPlayer={() => setShowAddModal(true)} 
          onLoadDemo={handleLoadDemoPlayers}
          isLoadingDemo={isLoadingDemo}
        />
      ) : filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-4 font-semibold">No players found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterPosition("");
              setFilterGrade("");
            }}
            className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} onDelete={handleDeletePlayer} />
          ))}
        </div>
      )}

      {/* Add Player Modal */}
      <PlayerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreatePlayer}
        isLoading={isCreating}
      />
    </div>
  );
}

