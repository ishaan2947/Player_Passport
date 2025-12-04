// API Client for Player Passport

import type {
  Player,
  PlayerGame,
  PlayerReport,
  PlayerWithGames,
  CreatePlayerInput,
  CreatePlayerGameInput,
  GeneratePlayerReportInput,
  GeneratePlayerReportResponse,
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

// ============================================
// Player Passport API
// ============================================

// Players
export async function getPlayers(token?: string | null): Promise<PlayerWithGames[]> {
  return fetchApi<PlayerWithGames[]>("/players", {}, token);
}

export async function getPlayer(playerId: string, token?: string | null): Promise<PlayerWithGames> {
  return fetchApi<PlayerWithGames>(`/players/${playerId}`, {}, token);
}

export async function createPlayer(input: CreatePlayerInput, token?: string | null): Promise<Player> {
  return fetchApi<Player>("/players", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export async function updatePlayer(playerId: string, input: Partial<CreatePlayerInput>, token?: string | null): Promise<Player> {
  return fetchApi<Player>(`/players/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  }, token);
}

export async function deletePlayer(playerId: string, token?: string | null): Promise<void> {
  await fetchApi<void>(`/players/${playerId}`, {
    method: "DELETE",
  }, token);
}

// Player Games
export async function getPlayerGames(playerId: string, token?: string | null): Promise<PlayerGame[]> {
  return fetchApi<PlayerGame[]>(`/players/${playerId}/games`, {}, token);
}

export async function addPlayerGame(playerId: string, input: CreatePlayerGameInput, token?: string | null): Promise<PlayerGame> {
  return fetchApi<PlayerGame>(`/players/${playerId}/games`, {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export async function deletePlayerGame(playerId: string, gameId: string, token?: string | null): Promise<void> {
  await fetchApi<void>(`/players/${playerId}/games/${gameId}`, {
    method: "DELETE",
  }, token);
}

// Player Reports
export async function getPlayerReports(playerId: string, token?: string | null): Promise<PlayerReport[]> {
  return fetchApi<PlayerReport[]>(`/players/${playerId}/reports`, {}, token);
}

export async function getPlayerReportByPlayerId(playerId: string, reportId: string, token?: string | null): Promise<PlayerReport> {
  return fetchApi<PlayerReport>(`/players/${playerId}/reports/${reportId}`, {}, token);
}

export async function generatePlayerReport(
  playerId: string,
  request?: GeneratePlayerReportInput,
  token?: string | null
): Promise<GeneratePlayerReportResponse> {
  return fetchApi<GeneratePlayerReportResponse>(`/players/${playerId}/reports`, {
    method: "POST",
    body: JSON.stringify(request || {}),
  }, token);
}

// Shared Reports (public access via share token)
export async function getSharedReport(shareToken: string): Promise<PlayerReport & { player: Player }> {
  return fetchApi<PlayerReport & { player: Player }>(`/players/share/${shareToken}`, {});
}

// User
export interface UserInfo {
  id: string;
  email: string;
  clerk_id: string | null;
  created_at: string;
}

export async function getCurrentUser(token?: string | null): Promise<UserInfo> {
  return fetchApi<UserInfo>("/users/me", {}, token);
}

export { ApiError };
