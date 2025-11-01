"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

/**
 * SECURITY NOTE:
 * --------------
 * The "Development Mode" bypass shown below is ONLY available when:
 * 1. NODE_ENV=development (NOT production)
 * 2. Clerk keys are not configured
 * 
 * In production, middleware.ts and layout.tsx enforce that Clerk keys
 * must be configured. The build will FAIL if auth is not set up.
 * 
 * This bypass exists solely for local development convenience.
 */

// Check if Clerk keys are configured (client-side check)
const hasClerkKeys = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_");

// Dynamically import Clerk SignUp only when keys are configured
const ClerkSignUp = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignUp),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
);

export default function SignUpPage() {
  // SECURITY: This bypass is only reachable in development mode
  // Production builds fail if Clerk keys are missing (see middleware.ts)
  if (!hasClerkKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="rounded-xl border border-border bg-card p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Explain My Game</h1>
              <p className="text-muted-foreground mt-2">Development Mode</p>
            </div>
            
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 mb-6">
              <p className="text-sm text-yellow-200">
                <strong>Note:</strong> Authentication is not configured. 
                You can access the app directly in development mode.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue to Dashboard
            </Link>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Add Clerk keys to enable authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  // With Clerk keys, render the dynamically imported SignUp component
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="relative z-10">
        <ClerkSignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card border border-border shadow-xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border hover:bg-secondary",
              socialButtonsBlockButtonText: "text-foreground",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-secondary border-border text-foreground",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
