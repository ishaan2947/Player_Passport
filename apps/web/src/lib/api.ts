// API Client for backend communication

import type {
  Team,
  TeamWithMembers,
  Game,
  BasketballStats,
  Report,
  GenerateReportResponse,
  CreateTeamInput,
  CreateGameInput,
  CreateStatsInput,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEV_TOKEN = "dev_user_seed_001";

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Use dev token if no token provided (for development)
  const authToken = token || DEV_TOKEN;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Teams
export async function getTeams(token?: string | null): Promise<Team[]> {
  return fetchApi<Team[]>("/teams", {}, token);
}

export async function getTeam(teamId: string, token?: string | null): Promise<TeamWithMembers> {
  return fetchApi<TeamWithMembers>(`/teams/${teamId}`, {}, token);
}

export async function createTeam(input: CreateTeamInput, token?: string | null): Promise<Team> {
  return fetchApi<Team>("/teams", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export async function deleteTeam(teamId: string, token?: string | null): Promise<void> {
  await fetchApi<void>(`/teams/${teamId}`, {
    method: "DELETE",
  }, token);
}

// Games
export async function getGames(teamId: string, token?: string | null): Promise<Game[]> {
  return fetchApi<Game[]>(`/teams/${teamId}/games`, {}, token);
}

export async function getGame(gameId: string, token?: string | null): Promise<Game & { basketball_stats?: { id: string; points_for: number; points_against: number } }> {
  return fetchApi(`/games/${gameId}`, {}, token);
}

export async function createGame(teamId: string, input: CreateGameInput, token?: string | null): Promise<Game> {
  return fetchApi<Game>(`/teams/${teamId}/games`, {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export async function deleteGame(gameId: string, token?: string | null): Promise<void> {
  await fetchApi<void>(`/games/${gameId}`, {
    method: "DELETE",
  }, token);
}

// Stats
export async function getStats(gameId: string, token?: string | null): Promise<BasketballStats> {
  return fetchApi<BasketballStats>(`/games/${gameId}/stats/basketball`, {}, token);
}

export async function createStats(gameId: string, input: CreateStatsInput, token?: string | null): Promise<BasketballStats> {
  return fetchApi<BasketballStats>(`/games/${gameId}/stats/basketball`, {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export async function updateStats(gameId: string, input: Partial<CreateStatsInput>, token?: string | null): Promise<BasketballStats> {
  return fetchApi<BasketballStats>(`/games/${gameId}/stats/basketball`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, token);
}

// Reports
export async function getReport(reportId: string, token?: string | null): Promise<Report> {
  return fetchApi<Report>(`/reports/${reportId}`, {}, token);
}

export async function getGameReport(gameId: string, token?: string | null): Promise<Report> {
  return fetchApi<Report>(`/games/${gameId}/report`, {}, token);
}

export async function generateReport(
  gameId: string,
  forceRegenerate: boolean = false,
  additionalContext?: string,
  token?: string | null
): Promise<GenerateReportResponse> {
  return fetchApi<GenerateReportResponse>(`/games/${gameId}/generate-report`, {
    method: "POST",
    body: JSON.stringify({
      force_regenerate: forceRegenerate,
      additional_context: additionalContext,
    }),
  }, token);
}

// Feedback
export interface FeedbackInput {
  rating_1_5: number;
  accurate_bool?: boolean;
  missing_text?: string;
}

export interface Feedback {
  id: string;
  report_id: string;
  rating_1_5: number;
  accurate_bool: boolean | null;
  missing_text: string | null;
  created_at: string;
}

export async function submitFeedback(
  reportId: string, 
  input: FeedbackInput, 
  token?: string | null
): Promise<Feedback> {
  return fetchApi<Feedback>(`/reports/${reportId}/feedback`, {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

// User
export interface UserInfo {
  id: string;
  email: string;
  clerk_id: string | null;
  created_at: string;
  team_count: number;
  owned_teams_count: number;
}

export async function getCurrentUser(token?: string | null): Promise<UserInfo> {
  return fetchApi<UserInfo>("/users/me", {}, token);
}

export async function deleteAccount(token?: string | null): Promise<void> {
  await fetchApi<void>("/users/me", {
    method: "DELETE",
  }, token);
}

export async function exportUserData(token?: string | null): Promise<any> {
  return fetchApi<any>("/users/me/data-export", {}, token);
}

// PDF Export
export function getReportPdfUrl(reportId: string): string {
  return `${API_URL}/reports/${reportId}/pdf`;
}

// CSV Template
export function getCsvTemplateUrl(): string {
  return `${API_URL}/stats/csv-template`;
}

export { ApiError };
