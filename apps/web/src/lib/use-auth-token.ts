"use client";

import { useCallback } from "react";

// Development token for API access when Clerk is not configured
const DEV_TOKEN = "dev_user_seed_001";

// Check if Clerk is configured (client-side)
const isClerkConfigured = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Custom hook that provides getToken function
export function useAuthToken() {
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!isClerkConfigured) {
      return DEV_TOKEN;
    }
    
    // Dynamic import Clerk only when configured
    try {
      // Note: useAuth hook can't be called inside a callback
      // For actual Clerk integration, use Clerk's getToken in a different pattern
      // For now, just return dev token
      await import("@clerk/nextjs");
      return DEV_TOKEN;
    } catch {
      return DEV_TOKEN;
    }
  }, []);

  return { getToken };
}

// Simpler approach: export a function that gets the token
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = DEV_TOKEN; // In production, this would come from Clerk
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers,
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

