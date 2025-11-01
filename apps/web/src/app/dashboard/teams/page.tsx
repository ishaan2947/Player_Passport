"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getTeams, createTeam, deleteTeam } from "@/lib/api";
import type { Team } from "@/types/api";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load teams";
      toast.error("Failed to load teams", { description: message });
    } finally {
      setLoading(false);
    }
  }

  function validateTeamName(name: string): string | null {
    if (!name.trim()) return "Team name is required";
    if (name.trim().length < 2) return "Team name must be at least 2 characters";
    if (name.trim().length > 50) return "Team name must be less than 50 characters";
    if (teams.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
      return "A team with this name already exists";
    }
    return null;
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    
    const validationError = validateTeamName(newTeamName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setCreating(true);
    setNameError(null);

    try {
      const team = await createTeam({ name: newTeamName.trim() });
      setTeams([team, ...teams]);
      setNewTeamName("");
      setShowForm(false);
      toast.success("Team created!", {
        description: `${team.name} has been created successfully.`,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create team";
      toast.error("Failed to create team", { description: message });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTeam(team: Team) {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(team.id);
    try {
      await deleteTeam(team.id);
      setTeams(teams.filter((t) => t.id !== team.id));
      toast.success("Team deleted", {
        description: `${team.name} has been deleted.`,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete team";
      toast.error("Failed to delete team", { description: message });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Teams</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your teams and view games.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Team
        </button>
      </div>

      {/* Create Team Form */}
      {showForm && (
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/50 px-6 py-4">
            <h2 className="text-lg font-semibold">Create New Team</h2>
            <p className="text-sm text-muted-foreground">
              Give your team a name to get started
            </p>
          </div>
          <form onSubmit={handleCreateTeam} className="p-6">
            <div className="mb-4">
              <label
                htmlFor="teamName"
                className="mb-2 block text-sm font-medium"
              >
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={newTeamName}
                onChange={(e) => {
                  setNewTeamName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Enter team name"
                className={`w-full rounded-lg border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                  nameError ? "border-destructive" : "border-border"
                }`}
                autoFocus
              />
              {nameError && (
                <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {nameError}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewTeamName("");
                  setNameError(null);
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Team"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold">No teams yet</h3>
          <p className="mb-6 text-muted-foreground">
            Create your first team to start tracking games and generating AI coaching insights.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <Link href={`/dashboard/teams/${team.id}`} className="block p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-semibold transition-colors group-hover:text-primary">
                  {team.name}
                </h3>
                <p className="text-sm capitalize text-muted-foreground">
                  {team.sport}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(team.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteTeam(team);
                }}
                disabled={deletingId === team.id}
                className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                title="Delete team"
              >
                {deletingId === team.id ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {teams.length > 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium">Tip: Click on a team to add games</p>
            <p className="text-sm text-muted-foreground">
              Once you add games and their stats, you can generate AI coaching reports for each game.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
