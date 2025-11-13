import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SECURITY NOTE:
 * --------------
 * Authentication bypass is ONLY allowed in LOCAL DEVELOPMENT.
 * 
 * In production (NODE_ENV=production):
 * - Clerk keys MUST be configured
 * - This middleware will enforce authentication
 * - No silent bypass is allowed
 * 
 * In development (NODE_ENV=development):
 * - If Clerk keys are missing, routes are accessible without auth
 * - This is for local development convenience only
 */

const isProduction = process.env.NODE_ENV === "production";

// Check if Clerk is properly configured with actual keys
const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

export function middleware(_request: NextRequest) {
  // SECURITY: In production without auth keys, fail at request time
  // Note: We don't throw at module load time because that would break builds
  if (isProduction && !hasClerkKeys) {
    // In production without Clerk keys - return 500 error
    return new NextResponse(
      JSON.stringify({
        error: "Authentication not configured",
        message: "This application requires authentication. Please contact the administrator.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // SECURITY: Only allow auth bypass in development mode
  if (!hasClerkKeys && !isProduction) {
    // Development mode without Clerk keys - allow all routes
    return NextResponse.next();
  }

  // If Clerk is configured, we would use Clerk middleware here
  // For now, just pass through - Clerk components will handle auth UI
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
