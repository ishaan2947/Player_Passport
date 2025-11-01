import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Explain My Game - AI basketball coaching insights",
};

export default function TermsPage() {
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
        <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-muted-foreground">Last updated: December 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Explain My Game, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Explain My Game is a platform that uses artificial intelligence to analyze basketball 
              game statistics and provide coaching insights. Our service includes:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Team and game management</li>
              <li>Basketball statistics tracking</li>
              <li>AI-generated post-game reports</li>
              <li>Coaching insights and recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">User Accounts</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                To use certain features of our service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious code or content</li>
              <li>Violate the rights of others</li>
              <li>Use the service to harass, abuse, or harm others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">AI-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service uses artificial intelligence to generate coaching insights. You acknowledge that:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>AI-generated content is for informational purposes only</li>
              <li>Insights should not replace professional coaching advice</li>
              <li>AI may occasionally produce inaccurate or incomplete information</li>
              <li>You are responsible for verifying and applying any recommendations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The service and its original content, features, and functionality are owned by 
              Explain My Game and are protected by international copyright, trademark, and other 
              intellectual property laws. Your game data and statistics remain your property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Explain My Game shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of 
              profits, data, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the service immediately, 
              without prior notice or liability, for any reason, including breach of these Terms. 
              Upon termination, your right to use the service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these terms at any time. We will provide 
              notice of any material changes. Your continued use of the service after such 
              modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@explainmygame.com" className="text-primary hover:underline">
                legal@explainmygame.com
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
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

