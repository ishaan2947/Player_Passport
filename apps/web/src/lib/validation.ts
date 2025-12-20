import { z } from "zod";

// Player form validation schema
export const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  grade: z.string().optional(),
  position: z.string().optional(),
  height: z.string().optional(),
  team: z.string().optional(),
  goals: z.array(z.string()).optional().default([]),
  goalsInput: z.string().optional(), // For the comma-separated input field
});

export type PlayerFormData = z.infer<typeof playerSchema>;

// Game form validation schema with logical validations
export const gameSchema = z
  .object({
    game_label: z.string().optional(),
    game_date: z.string().min(1, "Game date is required"),
    opponent: z.string().min(1, "Opponent is required").max(255, "Opponent name is too long"),
    minutes: z.number().min(0, "Minutes must be 0 or greater").max(60, "Minutes cannot exceed 60").optional().or(z.null()),
    pts: z.number().min(0, "Points must be 0 or greater").max(150, "Points must be 150 or less").default(0),
    reb: z.number().min(0, "Rebounds must be 0 or greater").max(50, "Rebounds must be 50 or less").default(0),
    ast: z.number().min(0, "Assists must be 0 or greater").max(50, "Assists must be 50 or less").default(0),
    stl: z.number().min(0, "Steals must be 0 or greater").max(20, "Steals must be 20 or less").default(0),
    blk: z.number().min(0, "Blocks must be 0 or greater").max(20, "Blocks must be 20 or less").default(0),
    tov: z.number().min(0, "Turnovers must be 0 or greater").max(30, "Turnovers must be 30 or less").default(0),
    fgm: z.number().min(0, "FGM must be 0 or greater").default(0),
    fga: z.number().min(0, "FGA must be 0 or greater").default(0),
    tpm: z.number().min(0, "3PM must be 0 or greater").default(0),
    tpa: z.number().min(0, "3PA must be 0 or greater").default(0),
    ftm: z.number().min(0, "FTM must be 0 or greater").default(0),
    fta: z.number().min(0, "FTA must be 0 or greater").default(0),
    notes: z.string().optional(),
  })
  .refine((data) => data.fgm <= data.fga, {
    message: "Field goals made (FGM) cannot exceed field goals attempted (FGA)",
    path: ["fgm"],
  })
  .refine((data) => data.tpm <= data.tpa, {
    message: "Three-pointers made (3PM) cannot exceed three-pointers attempted (3PA)",
    path: ["tpm"],
  })
  .refine((data) => data.ftm <= data.fta, {
    message: "Free throws made (FTM) cannot exceed free throws attempted (FTA)",
    path: ["ftm"],
  })
  .refine((data) => data.tpa <= data.fga, {
    message: "Three-pointers attempted (3PA) cannot exceed field goals attempted (FGA)",
    path: ["tpa"],
  });

export type GameFormData = z.infer<typeof gameSchema>;

