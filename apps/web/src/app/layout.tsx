import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Explain My Game - AI Basketball Coaching Insights",
    template: "%s | Explain My Game",
  },
  description:
    "Transform your basketball game stats into actionable coaching insights with AI. Get post-game reports, key insights, action items, and practice focus areas.",
  keywords: [
    "basketball",
    "coaching",
    "analytics",
    "AI",
    "sports",
    "game analysis",
    "basketball stats",
    "coaching insights",
    "post-game report",
    "basketball training",
  ],
  authors: [{ name: "Explain My Game" }],
  creator: "Explain My Game",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://explainmygame.com",
    title: "Explain My Game - AI Basketball Coaching Insights",
    description:
      "Transform your basketball game stats into actionable coaching insights with AI.",
    siteName: "Explain My Game",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explain My Game - AI Basketball Coaching Insights",
    description:
      "Transform your basketball game stats into actionable coaching insights with AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * SECURITY NOTE:
 * --------------
 * Authentication bypass is ONLY allowed in LOCAL DEVELOPMENT.
 * 
 * In production (NODE_ENV=production):
 * - Clerk keys MUST be configured
 * - App will fail to build without proper auth
 * - No silent bypass is allowed
 * 
 * In development (NODE_ENV=development):
 * - App works without Clerk keys for convenience
 * - This is for local development only
 */
const isProduction = process.env.NODE_ENV === "production";

// Check if Clerk is properly configured with actual keys
const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

// SECURITY: Fail fast in production if auth is not configured
if (isProduction && !hasClerkKeys) {
  throw new Error(
    "FATAL: Authentication is not configured in production!\n" +
    "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.\n" +
    "Authentication bypass is ONLY allowed in development mode."
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );

  // Only import and use ClerkProvider if keys are configured
  if (hasClerkKeys) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
