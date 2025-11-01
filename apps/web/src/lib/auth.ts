// Auth utilities for development and production

// Check if Clerk is configured
export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Development token for API access when Clerk is not configured
export const DEV_TOKEN = "dev_user_seed_001";

// Get auth token - returns dev token when Clerk is not configured
export async function getAuthToken(getToken?: () => Promise<string | null>): Promise<string | null> {
  if (!isClerkConfigured) {
    return DEV_TOKEN;
  }
  
  if (getToken) {
    return getToken();
  }
  
  return null;
}

