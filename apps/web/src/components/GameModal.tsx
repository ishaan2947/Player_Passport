"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PlayerGame, CreatePlayerGameInput } from "@/types/api";
import { gameSchema, type GameFormData } from "@/lib/validation";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerGameInput) => void;
  isLoading: boolean;
  game?: PlayerGame | null; // If provided, modal is in edit mode
}

export function GameModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  game,
}: GameModalProps) {
  const isEditMode = !!game;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      game_label: "",
      game_date: new Date().toISOString().split("T")[0] ?? "",
      opponent: "",
      minutes: undefined,
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
    },
    mode: "onChange", // Validate on change for better UX
  });

  const fga = watch("fga");
  const tpa = watch("tpa");
  const fta = watch("fta");

  // Initialize form data when game changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      if (game) {
        reset({
          game_label: game.game_label || "",
          game_date: game.game_date.split("T")[0] ?? "",
          opponent: game.opponent || "",
          minutes: game.minutes || undefined,
          pts: game.pts || 0,
          reb: game.reb || 0,
          ast: game.ast || 0,
          stl: game.stl || 0,
          blk: game.blk || 0,
          tov: game.tov || 0,
          fgm: game.fgm || 0,
          fga: game.fga || 0,
          tpm: game.tpm || 0,
          tpa: game.tpa || 0,
          ftm: game.ftm || 0,
          fta: game.fta || 0,
          notes: game.notes || "",
        });
      } else {
        reset({
          game_label: "",
          game_date: new Date().toISOString().split("T")[0] ?? "",
          opponent: "",
          minutes: undefined,
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
      }
    }
  }, [game, isOpen, reset]);

  function onSubmitForm(data: GameFormData) {
    const submitData: CreatePlayerGameInput = {
      game_date: data.game_date,
      opponent: data.opponent,
      game_label: data.game_label || undefined,
      minutes: data.minutes,
      pts: data.pts,
      reb: data.reb,
      ast: data.ast,
      stl: data.stl,
      blk: data.blk,
      tov: data.tov,
      fgm: data.fgm,
      fga: data.fga,
      tpm: data.tpm,
      tpa: data.tpa,
      ftm: data.ftm,
      fta: data.fta,
      notes: data.notes || undefined,
    };
    onSubmit(submitData);
  }

  function handleNumberChange(field: keyof GameFormData, value: string, onChange: (value: number) => void) {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">{isEditMode ? "Edit Game Stats" : "Add Game Stats"}</h2>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Game Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="game_label" className="mb-1 block text-sm font-medium">
                Game Label
              </label>
              <input
                id="game_label"
                type="text"
                {...register("game_label")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Game 1"
              />
            </div>
            <div>
              <label htmlFor="game_date" className="mb-1 block text-sm font-medium">
                Date *
              </label>
              <input
                id="game_date"
                type="date"
                {...register("game_date")}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.game_date
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-border focus:border-primary focus:ring-primary"
                }`}
              />
              {errors.game_date && (
                <p className="mt-1 text-xs text-red-500">{errors.game_date.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="opponent" className="mb-1 block text-sm font-medium">
                Opponent *
              </label>
              <input
                id="opponent"
                type="text"
                {...register("opponent")}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.opponent
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-border focus:border-primary focus:ring-primary"
                }`}
                placeholder="e.g., Lincoln HS"
              />
              {errors.opponent && (
                <p className="mt-1 text-xs text-red-500">{errors.opponent.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="minutes" className="mb-1 block text-sm font-medium">
              Minutes Played
            </label>
            <input
              id="minutes"
              type="number"
              {...register("minutes", { valueAsNumber: true })}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.minutes
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
              placeholder="e.g., 28"
              min={0}
              max={60}
            />
            {errors.minutes && (
              <p className="mt-1 text-xs text-red-500">{errors.minutes.message}</p>
            )}
          </div>

          {/* Basic Stats */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Basic Stats</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { key: "pts" as const, label: "PTS", max: 150 },
                { key: "reb" as const, label: "REB", max: 50 },
                { key: "ast" as const, label: "AST", max: 50 },
                { key: "stl" as const, label: "STL", max: 20 },
                { key: "blk" as const, label: "BLK", max: 20 },
                { key: "tov" as const, label: "TOV", max: 30 },
              ].map(({ key, label, max }) => (
                <div key={key}>
                  <label htmlFor={key} className="mb-1 block text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <input
                    id={key}
                    type="number"
                    {...register(key, { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors[key]
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={max}
                  />
                  {errors[key] && (
                    <p className="mt-1 text-xs text-red-500">{errors[key]?.message}</p>
                  )}
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
                  <label htmlFor="fgm" className="mb-1 block text-xs font-medium text-muted-foreground">
                    FGM
                  </label>
                  <input
                    id="fgm"
                    type="number"
                    {...register("fgm", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.fgm
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={fga}
                  />
                  {errors.fgm && (
                    <p className="mt-1 text-xs text-red-500">{errors.fgm.message}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="fga" className="mb-1 block text-xs font-medium text-muted-foreground">
                    FGA
                  </label>
                  <input
                    id="fga"
                    type="number"
                    {...register("fga", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.fga
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                  />
                  {errors.fga && (
                    <p className="mt-1 text-xs text-red-500">{errors.fga.message}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="tpm" className="mb-1 block text-xs font-medium text-muted-foreground">
                    3PM
                  </label>
                  <input
                    id="tpm"
                    type="number"
                    {...register("tpm", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.tpm
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={tpa}
                  />
                  {errors.tpm && (
                    <p className="mt-1 text-xs text-red-500">{errors.tpm.message}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="tpa" className="mb-1 block text-xs font-medium text-muted-foreground">
                    3PA
                  </label>
                  <input
                    id="tpa"
                    type="number"
                    {...register("tpa", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.tpa
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={fga}
                  />
                  {errors.tpa && (
                    <p className="mt-1 text-xs text-red-500">{errors.tpa.message}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="ftm" className="mb-1 block text-xs font-medium text-muted-foreground">
                    FTM
                  </label>
                  <input
                    id="ftm"
                    type="number"
                    {...register("ftm", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.ftm
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={fta}
                  />
                  {errors.ftm && (
                    <p className="mt-1 text-xs text-red-500">{errors.ftm.message}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="fta" className="mb-1 block text-xs font-medium text-muted-foreground">
                    FTA
                  </label>
                  <input
                    id="fta"
                    type="number"
                    {...register("fta", { valueAsNumber: true })}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      errors.fta
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                  />
                  {errors.fta && (
                    <p className="mt-1 text-xs text-red-500">{errors.fta.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              Game Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Any observations, matchups, playing time context..."
              rows={3}
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
              {isLoading ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Game")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
