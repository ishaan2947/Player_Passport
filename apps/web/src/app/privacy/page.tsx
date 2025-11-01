import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Explain My Game - AI basketball coaching insights",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <span className="text-xl font-bold">Explain My Game</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-12">
        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-muted-foreground">Last updated: December 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Explain My Game (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our basketball coaching insights platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Information We Collect</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-lg font-medium text-foreground">Account Information</h3>
                <p className="leading-relaxed">
                  When you create an account, we collect your email address and name. 
                  Authentication is handled securely through our authentication provider.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Game Data</h3>
                <p className="leading-relaxed">
                  We collect the basketball game statistics and notes you enter, including scores, 
                  shooting percentages, rebounds, assists, and other game metrics.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Usage Information</h3>
                <p className="leading-relaxed">
                  We may collect information about how you use our service, including pages visited, 
                  features used, and time spent on the platform.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Generate AI-powered coaching reports based on your game statistics</li>
              <li>Provide and maintain our service</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates and new features</li>
              <li>Ensure the security of our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>AI service providers (OpenAI) to generate coaching insights - only game statistics are shared, not personal information</li>
              <li>Service providers who help us operate our platform</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data, 
              including encryption in transit and at rest, secure authentication, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@explainmygame.com" className="text-primary hover:underline">
                privacy@explainmygame.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© 2024 Explain My Game. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

