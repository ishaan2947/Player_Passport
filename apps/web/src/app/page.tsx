import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Player-Centric Tracking",
    description: "Track individual player development with detailed game logs, stats trends, and personalized insights.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: "Stats-Backed Development",
    description: "Every insight is backed by actual game statistics with clear trends and confidence levels.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: "Custom Drill Plans",
    description: "Get personalized practice drills based on each player's growth areas and position.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "AI-Powered Analysis",
    description: "Advanced GPT-4 analysis identifies patterns and opportunities tailored to each player.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: "College Fit Indicators",
    description: "Understand where players stand and what they need to develop for the next level.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    title: "Shareable Reports",
    description: "Share development reports with coaches, trainers, and family with a simple link.",
  },
];

const stats = [
  { value: "3-5", label: "Games for insights" },
  { value: "AI", label: "Powered analysis" },
  { value: "100%", label: "Parent-friendly" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Player Passport" 
              width={40} 
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold">Player Passport</span>
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
              className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-sm font-medium text-white shadow transition-colors hover:opacity-90"
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
              <div className="animate-fade-in rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-500">
                <span className="mr-2">🏀</span>
                AI-Powered Player Development
              </div>
              
              {/* Headline */}
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your Player&apos;s{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                  Development Journey
                </span>
                {" "}Starts Here
              </h1>
              
              {/* Subheadline */}
              <p className="max-w-2xl animate-fade-in text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Track game stats, get AI-powered development reports, and watch your 
                youth basketball player grow with personalized coaching insights and drill plans.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex animate-fade-in flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 text-base font-medium text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30"
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
                  <p className="text-2xl font-bold text-orange-500 sm:text-3xl">{stat.value}</p>
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
              <p className="mb-4 text-sm font-medium text-orange-500">Features</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything for Player Development
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Track progress, identify growth areas, and get actionable coaching insights.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500/20">
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
              <p className="mb-4 text-sm font-medium text-orange-500">How It Works</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From Stats to Strategy in 3 Steps
              </h2>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Add Player",
                  description: "Create a player profile with basic info like grade, position, and goals.",
                },
                {
                  step: "2",
                  title: "Log Games",
                  description: "Enter game stats after each game. Points, rebounds, assists - all the basics.",
                },
                {
                  step: "3",
                  title: "Get Report",
                  description: "Generate an AI development report with insights, drills, and growth areas.",
                },
              ].map((item, i) => (
                <div key={i} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-2xl font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {i < 2 && (
                    <div className="absolute left-[calc(50%+2rem)] top-7 hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-orange-500/50 to-transparent md:block" />
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
              <svg className="mx-auto mb-6 h-12 w-12 text-orange-500/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <blockquote className="text-2xl font-medium leading-relaxed sm:text-3xl">
                &ldquo;As a parent, I finally have a clear picture of my son&apos;s development. 
                The reports are honest, helpful, and give us real things to work on together.&rdquo;
              </blockquote>
              <p className="mt-6 text-muted-foreground">
                — Youth Basketball Parent
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10 p-8 text-center md:p-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Track Your Player&apos;s Growth?
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Join parents and coaches who are using AI to develop young basketball talent. 
                Start for free, no credit card required.
              </p>
              <Link
                href="/sign-up"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 text-base font-medium text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30"
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
              <Image 
                src="/logo.png" 
                alt="Player Passport" 
                width={36} 
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="font-bold">Player Passport</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="mailto:hello@playerpassport.io" className="hover:text-foreground">Contact</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 Player Passport
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
