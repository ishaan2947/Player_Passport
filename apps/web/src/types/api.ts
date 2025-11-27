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

// ============================================
// Player Passport Types
// ============================================

export interface Player {
  id: string;
  user_id: string;
  name: string;
  grade: string;
  position: string;
  height?: string;
  team?: string;
  goals?: string[];
  competition_level?: string;
  role?: string;
  injuries?: string;
  minutes_context?: string;
  coach_notes?: string;
  parent_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerGame {
  id: string;
  player_id: string;
  game_date: string;
  opponent: string;
  game_label?: string;
  minutes: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  notes?: string;
  fg_pct?: number;
  three_pct?: number;
  ft_pct?: number;
  created_at: string;
}

export interface PlayerReportMeta {
  player_name: string;
  report_window: string;
  confidence_level: "low" | "medium" | "high";
  confidence_reason: string;
  disclaimer: string;
}

export interface PlayerReportKeyMetric {
  label: string;
  value: string;
  note: string;
}

export interface PlayerReportDrill {
  title: string;
  why_this_drill: string;
  how_to_do_it: string;
  frequency: string;
  success_metric: string;
}

export interface PlayerReportCollegeFit {
  label: string;
  reasoning: string;
  what_to_improve_to_level_up: string[];
}

export interface PlayerProfileInfo {
  name: string;
  grade: string;
  position: string;
  height?: string;
  team?: string;
  goals: string[];
}

export interface PlayerProfile {
  headline: string;
  player_info: PlayerProfileInfo;
  top_stats_snapshot: string[];
  strengths_short: string[];
  development_areas_short: string[];
  coach_notes_summary: string;
  highlight_summary_placeholder: string;
}

export interface PlayerReportPerGameSummary {
  game_label: string;
  date: string;
  opponent: string;
  minutes?: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  notes: string;
}

export interface PlayerReportComputedInsights {
  games_count: number;
  pts_avg: number;
  reb_avg: number;
  ast_avg: number;
  tov_avg: number;
  minutes_avg: number;
  fg_pct: number;
  three_pct: number;
  ft_pct: number;
  ast_to_tov_ratio: number;
}

export interface PlayerReportStructuredData {
  per_game_summary: PlayerReportPerGameSummary[];
  computed_insights: PlayerReportComputedInsights;
}

export interface PlayerReportDevelopmentReport {
  strengths: string[];
  growth_areas: string[];
  trend_insights: string[];
  key_metrics: PlayerReportKeyMetric[];
  next_2_weeks_focus: string[];
}

export interface PlayerReportContent {
  meta: PlayerReportMeta;
  growth_summary: string;
  development_report: PlayerReportDevelopmentReport;
  drill_plan: PlayerReportDrill[];
  motivational_message: string;
  college_fit_indicator_v1: PlayerReportCollegeFit;
  player_profile: PlayerProfile;
  structured_data: PlayerReportStructuredData;
}

export interface PlayerReport {
  id: string;
  player_id: string;
  status: "pending" | "generating" | "completed" | "failed";
  report_json?: PlayerReportContent;
  model_used?: string;
  prompt_version?: string;
  error_text?: string;
  created_at: string;
}

export interface PlayerWithGames extends Player {
  games: PlayerGame[];
}

export interface PlayerWithReports extends Player {
  reports: PlayerReport[];
}

export interface PlayerWithGamesAndReports extends Player {
  games: PlayerGame[];
  reports: PlayerReport[];
}

// Player with full data for detail page
export interface PlayerDetail extends Player {
  games: PlayerGame[];
}

// Player Passport Input Types
export interface CreatePlayerInput {
  name: string;
  grade: string;
  position: string;
  height?: string;
  team?: string;
  goals?: string[];
  competition_level?: string;
  role?: string;
  injuries?: string;
  minutes_context?: string;
  coach_notes?: string;
  parent_notes?: string;
}

export interface CreatePlayerGameInput {
  game_date: string;
  opponent: string;
  game_label?: string;
  minutes?: number;
  pts?: number;
  reb?: number;
  ast?: number;
  stl?: number;
  blk?: number;
  tov?: number;
  fgm?: number;
  fga?: number;
  tpm?: number;
  tpa?: number;
  ftm?: number;
  fta?: number;
  notes?: string;
}

export interface GeneratePlayerReportInput {
  game_ids?: string[];
}

export interface GeneratePlayerReportResponse {
  id: string;
  player_id: string;
  status: "pending" | "generating" | "completed" | "failed";
}

