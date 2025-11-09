"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTeam, createGame, createStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "Welcome",
    description: "Let's get you started with Explain My Game",
  },
  {
    id: 2,
    title: "Create Team",
    description: "Create your first team to start tracking games",
  },
  {
    id: 3,
    title: "Add Game",
    description: "Add your first game with stats",
  },
  {
    id: 4,
    title: "All Set!",
    description: "You're ready to generate AI insights",
  },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 2: Team creation
  const [teamName, setTeamName] = useState("");
  const [createdTeam, setCreatedTeam] = useState<{ id: string; name: string } | null>(null);
  
  // Step 3: Game creation
  const [opponentName, setOpponentName] = useState("");
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split("T")[0] ?? "");
  const [location, setLocation] = useState("");
  const [createdGame, setCreatedGame] = useState<{ id: string } | null>(null);
  
  // Step 3: Stats
  const [pointsFor, setPointsFor] = useState<number>(0);
  const [pointsAgainst, setPointsAgainst] = useState<number>(0);

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    
    setLoading(true);
    try {
      const team = await createTeam({ name: teamName.trim() });
      setCreatedTeam({ id: team.id, name: team.name });
      toast.success(`Team "${team.name}" created!`);
      setCurrentStep(3);
    } catch (error: any) {
      toast.error("Failed to create team", {
        description: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGame() {
    if (!opponentName.trim() || !createdTeam) {
      toast.error("Please enter the opponent's name");
      return;
    }
    
    setLoading(true);
    try {
      const game = await createGame(createdTeam.id, {
        opponent_name: opponentName.trim(),
        game_date: gameDate,
        location: location.trim() || undefined,
      });
      
      // Create basic stats
      await createStats(game.id, {
        points_for: pointsFor,
        points_against: pointsAgainst,
        fg_made: 0,
        fg_att: 0,
        three_made: 0,
        three_att: 0,
        ft_made: 0,
        ft_att: 0,
        rebounds_off: 0,
        rebounds_def: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
      });
      
      setCreatedGame({ id: game.id });
      toast.success("Game and stats created!");
      setCurrentStep(4);
    } catch (error: any) {
      toast.error("Failed to create game", {
        description: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    onComplete();
    if (createdGame) {
      router.push(`/dashboard/games/${createdGame.id}`);
    } else if (createdTeam) {
      router.push(`/dashboard/teams/${createdTeam.id}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex h-2 w-16 rounded-full transition-colors",
                currentStep >= step.id ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <svg
                className="h-10 w-10 text-primary"
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
            <h2 className="mb-2 text-2xl font-bold">Welcome to Explain My Game!</h2>
            <p className="mb-8 text-muted-foreground">
              Transform your basketball game stats into actionable coaching insights powered by AI.
            </p>
            <div className="mb-6 grid gap-4 text-left">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Track Your Games</p>
                  <p className="text-sm text-muted-foreground">
                    Record game stats and keep a complete history of your season
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  🤖
                </div>
                <div>
                  <p className="font-medium">AI-Powered Insights</p>
                  <p className="text-sm text-muted-foreground">
                    Get personalized coaching advice and identify areas for improvement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  📊
                </div>
                <div>
                  <p className="font-medium">Share & Export</p>
                  <p className="text-sm text-muted-foreground">
                    Share reports with your team and export PDFs for practice planning
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                Skip for Now
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create Team */}
        {currentStep === 2 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold">Create Your First Team</h2>
            <p className="mb-6 text-muted-foreground">
              Give your team a name to get started. You can always change this later.
            </p>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Varsity Eagles, JV Warriors"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={loading || !teamName.trim()}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Game */}
        {currentStep === 3 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold">Add Your First Game</h2>
            <p className="mb-6 text-muted-foreground">
              Record a game for {createdTeam?.name}. Just add the basics - you can fill in more details later.
            </p>
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Opponent Name</label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="e.g., Central High, Lakers"
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Game Date</label>
                  <input
                    type="date"
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Location (optional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Home, Away"
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-medium">Final Score</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Your Team</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsFor}
                      onChange={(e) => setPointsFor(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Opponent</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsAgainst}
                      onChange={(e) => setPointsAgainst(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={handleCreateGame}
                disabled={loading || !opponentName.trim()}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Add Game"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/20">
              <svg
                className="h-10 w-10 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold">You&apos;re All Set!</h2>
            <p className="mb-8 text-muted-foreground">
              Your team and first game are ready. Now you can add more stats and generate your first AI coaching report!
            </p>
            <div className="space-y-3">
              <button
                onClick={handleFinish}
                className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View Game & Generate Report
              </button>
              <button
                onClick={() => {
                  onComplete();
                  router.push("/dashboard");
                }}
                className="w-full rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

