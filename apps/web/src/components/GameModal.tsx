"use client";

import { useState, useEffect } from "react";
import type { PlayerGame, CreatePlayerGameInput } from "@/types/api";

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data when game changes (for edit mode)
  useEffect(() => {
    if (game) {
      setFormData({
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
      // Reset form for add mode
      setFormData({
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
    setValidationErrors({});
  }, [game, isOpen]);

  function validateStats(): boolean {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.opponent.trim()) {
      errors.opponent = "Opponent is required";
    }

    // Stats validation: FGM <= FGA
    if (formData.fgm > formData.fga) {
      errors.fgm = "Field goals made cannot exceed field goals attempted";
    }

    // Stats validation: TPM <= TPA
    if (formData.tpm > formData.tpa) {
      errors.tpm = "Three-pointers made cannot exceed three-pointers attempted";
    }

    // Stats validation: FTM <= FTA
    if (formData.ftm > formData.fta) {
      errors.ftm = "Free throws made cannot exceed free throws attempted";
    }

    // TPA <= FGA (3-point attempts are part of field goal attempts)
    if (formData.tpa > formData.fga) {
      errors.tpa = "Three-point attempts cannot exceed field goal attempts";
    }

    // Reasonable ranges
    if (formData.pts < 0 || formData.pts > 100) {
      errors.pts = "Points must be between 0 and 100";
    }
    if (formData.reb < 0 || formData.reb > 50) {
      errors.reb = "Rebounds must be between 0 and 50";
    }
    if (formData.ast < 0 || formData.ast > 30) {
      errors.ast = "Assists must be between 0 and 30";
    }
    if (formData.minutes !== undefined && (formData.minutes < 0 || formData.minutes > 48)) {
      errors.minutes = "Minutes must be between 0 and 48";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStats()) {
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
      // Clear validation error for this field when user types
      if (validationErrors[field]) {
        setValidationErrors({ ...validationErrors, [field]: "" });
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">{isEditMode ? "Edit Game Stats" : "Add Game Stats"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Game Label *</label>
              <input
                type="text"
                value={formData.game_label}
                onChange={(e) => setFormData({ ...formData, game_label: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Opponent *</label>
              <input
                type="text"
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  validationErrors.opponent ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                }`}
                placeholder="e.g., Lincoln HS"
                required
              />
              {validationErrors.opponent && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.opponent}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Minutes Played</label>
            <input
              type="number"
              value={formData.minutes ?? ""}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value ? parseInt(e.target.value) : undefined })}
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                validationErrors.minutes ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
              }`}
              placeholder="e.g., 28"
              min={0}
              max={48}
            />
            {validationErrors.minutes && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.minutes}</p>
            )}
          </div>

          {/* Basic Stats */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Basic Stats</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { key: "pts", label: "PTS", max: 100 },
                { key: "reb", label: "REB", max: 50 },
                { key: "ast", label: "AST", max: 30 },
                { key: "stl", label: "STL", max: 20 },
                { key: "blk", label: "BLK", max: 20 },
                { key: "tov", label: "TOV", max: 20 },
              ].map(({ key, label, max }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    type="number"
                    value={formData[key as keyof CreatePlayerGameInput] ?? 0}
                    onChange={(e) => handleNumberChange(key as keyof CreatePlayerGameInput, e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors[key] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={max}
                  />
                  {validationErrors[key] && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors[key]}</p>
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
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FGM</label>
                  <input
                    type="number"
                    value={formData.fgm ?? 0}
                    onChange={(e) => handleNumberChange("fgm", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.fgm ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={formData.fga}
                  />
                  {validationErrors.fgm && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.fgm}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FGA</label>
                  <input
                    type="number"
                    value={formData.fga ?? 0}
                    onChange={(e) => {
                      handleNumberChange("fga", e.target.value);
                      // Re-validate FGM and TPA when FGA changes
                      if (formData.fgm > parseInt(e.target.value || "0")) {
                        setValidationErrors({ ...validationErrors, fgm: "Field goals made cannot exceed field goals attempted" });
                      }
                      if (formData.tpa > parseInt(e.target.value || "0")) {
                        setValidationErrors({ ...validationErrors, tpa: "Three-point attempts cannot exceed field goal attempts" });
                      }
                    }}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.fga ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                  />
                  {validationErrors.fga && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.fga}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">3PM</label>
                  <input
                    type="number"
                    value={formData.tpm ?? 0}
                    onChange={(e) => handleNumberChange("tpm", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.tpm ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={formData.tpa}
                  />
                  {validationErrors.tpm && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.tpm}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">3PA</label>
                  <input
                    type="number"
                    value={formData.tpa ?? 0}
                    onChange={(e) => {
                      handleNumberChange("tpa", e.target.value);
                      // Re-validate TPM when TPA changes
                      if (formData.tpm > parseInt(e.target.value || "0")) {
                        setValidationErrors({ ...validationErrors, tpm: "Three-pointers made cannot exceed three-pointers attempted" });
                      }
                      // Re-validate TPA <= FGA
                      if (parseInt(e.target.value || "0") > formData.fga) {
                        setValidationErrors({ ...validationErrors, tpa: "Three-point attempts cannot exceed field goal attempts" });
                      }
                    }}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.tpa ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={formData.fga}
                  />
                  {validationErrors.tpa && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.tpa}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FTM</label>
                  <input
                    type="number"
                    value={formData.ftm ?? 0}
                    onChange={(e) => handleNumberChange("ftm", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.ftm ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                    max={formData.fta}
                  />
                  {validationErrors.ftm && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.ftm}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">FTA</label>
                  <input
                    type="number"
                    value={formData.fta ?? 0}
                    onChange={(e) => {
                      handleNumberChange("fta", e.target.value);
                      // Re-validate FTM when FTA changes
                      if (formData.ftm > parseInt(e.target.value || "0")) {
                        setValidationErrors({ ...validationErrors, ftm: "Free throws made cannot exceed free throws attempted" });
                      }
                    }}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 ${
                      validationErrors.fta ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-border focus:border-primary focus:ring-primary"
                    }`}
                    min={0}
                  />
                  {validationErrors.fta && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.fta}</p>
                  )}
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
              {isLoading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Game" : "Add Game")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

