/**
 * Authentication Configuration Check
 * 
 * SECURITY NOTE:
 * --------------
 * This module validates that authentication is properly configured in production.
 * 
 * In LOCAL DEVELOPMENT (NODE_ENV=development):
 * - Auth bypass is allowed for convenience
 * - Missing Clerk keys show a warning but don't block
 * 
 * In PRODUCTION (NODE_ENV=production):
 * - Clerk keys MUST be configured
 * - App will fail to build/start without proper auth config
 * - NO silent bypass is allowed
 * 
 * This prevents accidental deployment without authentication enabled.
 */

const isProduction = process.env.NODE_ENV === "production";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

export const hasValidClerkKeys = !!(
  clerkPublishableKey &&
  clerkPublishableKey.startsWith("pk_") &&
  clerkSecretKey &&
  clerkSecretKey.startsWith("sk_")
);

export const isDevMode = !isProduction && !hasValidClerkKeys;

/**
 * Validates auth configuration at runtime.
 * 
 * MUST be called during app initialization.
 * In production without auth keys, this throws an error.
 */
export function validateAuthConfig(): void {
  if (isProduction && !hasValidClerkKeys) {
    const missingKeys: string[] = [];
    
    if (!clerkPublishableKey) {
      missingKeys.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    } else if (!clerkPublishableKey.startsWith("pk_")) {
      missingKeys.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (invalid format, should start with 'pk_')");
    }
    
    if (!clerkSecretKey) {
      missingKeys.push("CLERK_SECRET_KEY");
    } else if (!clerkSecretKey.startsWith("sk_")) {
      missingKeys.push("CLERK_SECRET_KEY (invalid format, should start with 'sk_')");
    }

    // SECURITY: Fail fast in production without auth
    throw new Error(
      `FATAL: Authentication is not configured in production!\n\n` +
      `Missing or invalid environment variables:\n` +
      `${missingKeys.map(k => `  - ${k}`).join("\n")}\n\n` +
      `Authentication bypass is ONLY allowed in development mode.\n` +
      `Set NODE_ENV=development for local testing, or configure Clerk keys for production.`
    );
  }

  // In development, log a warning if auth is bypassed
  if (isDevMode) {
    console.warn(
      "\n⚠️  DEVELOPMENT MODE: Authentication bypass is enabled.\n" +
      "   This is NOT available in production.\n" +
      "   Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable auth.\n"
    );
  }
}

// Export for use in middleware and layout
export { isProduction };

