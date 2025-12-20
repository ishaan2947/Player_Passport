"use client";

import { useState, useEffect } from "react";
import type { Player, CreatePlayerInput } from "@/types/api";

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerInput) => void;
  isLoading: boolean;
  player?: Player | null; // If provided, modal is in edit mode
}

export function PlayerModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  player,
}: PlayerModalProps) {
  const isEditMode = !!player;
  const [formData, setFormData] = useState<CreatePlayerInput>({
    name: "",
    grade: "",
    position: "",
    height: "",
    team: "",
    goals: [],
  });
  const [goalsInput, setGoalsInput] = useState("");

  // Initialize form data when player changes (for edit mode)
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || "",
        grade: player.grade || "",
        position: player.position || "",
        height: player.height || "",
        team: player.team || "",
        goals: player.goals || [],
      });
      setGoalsInput((player.goals || []).join(", "));
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        grade: "",
        position: "",
        height: "",
        team: "",
        goals: [],
      });
      setGoalsInput("");
    }
  }, [player, isOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    const goals = goalsInput.split(",").map((g) => g.trim()).filter(Boolean);
    onSubmit({ ...formData, goals });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">{isEditMode ? "Edit Player" : "Add New Player"}</h2>
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
              {isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Player" : "Create Player")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

