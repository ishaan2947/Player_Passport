// API Types matching backend schemas

export interface Team {
  id: string;
  name: string;
  sport: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: "owner" | "coach" | "member";
  created_at: string;
  user_email?: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface Game {
  id: string;
  team_id: string;
  opponent_name: string;
  game_date: string;
  location?: string;
  notes?: string;
  created_at: string;
  has_stats: boolean;
  has_report: boolean;
}

export interface BasketballStats {
  id: string;
  game_id: string;
  points_for: number;
  points_against: number;
  fg_made: number;
  fg_att: number;
  three_made: number;
  three_att: number;
  ft_made: number;
  ft_att: number;
  rebounds_off: number;
  rebounds_def: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  pace_estimate?: number;
  total_rebounds?: number;
  fg_percentage?: number;
  three_percentage?: number;
  ft_percentage?: number;
  created_at: string;
}

export interface KeyInsight {
  title: string;
  description: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

export interface ActionItem {
  title: string;
  description: string;
  metric: string;
  priority: "high" | "medium" | "low";
}

export interface QuestionForNextGame {
  question: string;
  context: string;
}

export interface Report {
  id: string;
  game_id: string;
  status: string;
  summary?: string;
  key_insights: KeyInsight[];
  action_items: ActionItem[];
  practice_focus?: string;
  questions_for_next_game: QuestionForNextGame[];
  model_used?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  generation_time_ms?: number;
  risk_flags: string[];
  created_at: string;
}

export interface GenerateReportResponse {
  report: Report;
  was_regenerated: boolean;
}

// Form types
export interface CreateTeamInput {
  name: string;
  sport?: "basketball";
}

export interface CreateGameInput {
  opponent_name: string;
  game_date: string;
  location?: string;
  notes?: string;
}

export interface CreateStatsInput {
  points_for: number;
  points_against: number;
  fg_made?: number;
  fg_att?: number;
  three_made?: number;
  three_att?: number;
  ft_made?: number;
  ft_att?: number;
  rebounds_off?: number;
  rebounds_def?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  pace_estimate?: number;
}

