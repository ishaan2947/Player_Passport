"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Player, CreatePlayerInput } from "@/types/api";
import { playerSchema, type PlayerFormData } from "@/lib/validation";

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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      grade: "",
      position: "",
      height: "",
      team: "",
      goals: [],
      goalsInput: "",
    },
  });

  const goalsInput = watch("goalsInput");

  // Initialize form data when player changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      if (player) {
        reset({
          name: player.name || "",
          grade: player.grade || "",
          position: player.position || "",
          height: player.height || "",
          team: player.team || "",
          goals: player.goals || [],
          goalsInput: (player.goals || []).join(", "),
        });
      } else {
        reset({
          name: "",
          grade: "",
          position: "",
          height: "",
          team: "",
          goals: [],
          goalsInput: "",
        });
      }
    }
  }, [player, isOpen, reset]);

  function onSubmitForm(data: PlayerFormData) {
    const goals = data.goalsInput
      ? data.goalsInput.split(",").map((g) => g.trim()).filter(Boolean)
      : [];
    const submitData: CreatePlayerInput = {
      name: data.name,
      grade: data.grade || undefined,
      position: data.position || undefined,
      height: data.height || undefined,
      team: data.team || undefined,
      goals,
    };
    onSubmit(submitData);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">{isEditMode ? "Edit Player" : "Add New Player"}</h2>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Player Name *
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
              placeholder="e.g., Marcus Johnson"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade" className="mb-1 block text-sm font-medium">
                Grade
              </label>
              <select
                id="grade"
                {...register("grade")}
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
              <label htmlFor="position" className="mb-1 block text-sm font-medium">
                Position
              </label>
              <select
                id="position"
                {...register("position")}
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
              <label htmlFor="height" className="mb-1 block text-sm font-medium">
                Height
              </label>
              <input
                id="height"
                type="text"
                {...register("height")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 5'10&quot;"
              />
            </div>
            <div>
              <label htmlFor="team" className="mb-1 block text-sm font-medium">
                Team Name
              </label>
              <input
                id="team"
                type="text"
                {...register("team")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Central High"
              />
            </div>
          </div>
          <div>
            <label htmlFor="goalsInput" className="mb-1 block text-sm font-medium">
              Goals (comma-separated)
            </label>
            <input
              id="goalsInput"
              type="text"
              {...register("goalsInput")}
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
