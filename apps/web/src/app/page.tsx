import Link from "next/link";

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Structured Reports",
    description: "Get consistent post-game reports with summary, key insights, action items, and practice focus areas.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: "Stats-Backed Insights",
    description: "Every insight is backed by your actual game statistics with evidence lines and confidence levels.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Team Management",
    description: "Create teams, track multiple seasons, and share reports with coaches, players, and parents.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "AI-Powered Analysis",
    description: "Advanced GPT-4 analysis identifies patterns and opportunities that humans might miss.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Practice Recommendations",
    description: "Get specific, actionable practice drills and focus areas tailored to your team's needs.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    title: "Shareable Reports",
    description: "Share reports with a simple link. Perfect for team discussions and parent updates.",
  },
];

const stats = [
  { value: "85%", label: "Time saved on post-game analysis" },
  { value: "3x", label: "More actionable insights per game" },
  { value: "100%", label: "Stats-backed recommendations" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BasketballIcon className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Explain My Game</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/sign-in"
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.2),transparent)]" />
          
          <div className="container flex flex-col items-center justify-center gap-8 py-20 text-center md:py-32">
            <div className="flex max-w-4xl flex-col items-center gap-6">
              {/* Badge */}
              <div className="animate-fade-in rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <span className="mr-2">🏀</span>
                AI-Powered Coaching Insights
              </div>
              
              {/* Headline */}
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Turn Game Stats Into{" "}
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  Winning Strategies
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="max-w-2xl animate-fade-in text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Enter your basketball game stats and notes, and let AI generate a 
                comprehensive post-game report with key insights, action items, 
                and practice focus areas in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex animate-fade-in flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Start Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-secondary"
              >
                See How It Works
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 grid w-full max-w-2xl animate-fade-in grid-cols-3 gap-4 rounded-xl border border-border bg-card/50 p-6 backdrop-blur">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-4 text-sm font-medium text-primary">Features</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need for Post-Game Analysis
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get consistent, stats-backed coaching insights after every game.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-4 text-sm font-medium text-primary">How It Works</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From Stats to Strategy in 3 Steps
              </h2>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Enter Stats",
                  description: "Input your game stats using our quick entry form. Score, shooting, rebounds, assists - all the basics.",
                },
                {
                  step: "2",
                  title: "Generate Report",
                  description: "Click generate and let AI analyze your stats. Takes just a few seconds.",
                },
                {
                  step: "3",
                  title: "Get Insights",
                  description: "Review key insights, action items, and practice recommendations tailored to your game.",
                },
              ].map((item, i) => (
                <div key={i} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {i < 2 && (
                    <div className="absolute left-[calc(50%+2rem)] top-7 hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-primary/50 to-transparent md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial/Quote Section */}
        <section className="border-y border-border bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <svg className="mx-auto mb-6 h-12 w-12 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <blockquote className="text-2xl font-medium leading-relaxed sm:text-3xl">
                &ldquo;Finally, a tool that gives me consistent, actionable insights after every game. 
                It&apos;s like having an analytics assistant at your fingertips.&rdquo;
              </blockquote>
              <p className="mt-6 text-muted-foreground">
                — Youth Basketball Coach
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-orange-500/10 p-8 text-center md:p-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Improve Your Game?
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Join coaches and teams who are using AI to get better insights after every game. 
                Start for free, no credit card required.
              </p>
              <Link
                href="/sign-up"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Get Started Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card required • Free forever for basic use
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BasketballIcon className="h-5 w-5" />
              </div>
              <span className="font-bold">Explain My Game</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="mailto:hello@explainmygame.com" className="hover:text-foreground">Contact</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 Explain My Game
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
