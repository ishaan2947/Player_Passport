"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReport } from "@/lib/api";
import type { Report } from "@/types/api";
import { ReportSkeleton } from "@/components/ui/skeleton";

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[confidence]}`}>
      {confidence}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}

export default function SharedReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await getReport(reportId);
        setReport(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  if (loading) {
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
          </div>
        </header>
        <main className="container max-w-3xl py-8">
          <ReportSkeleton />
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Report Not Found</h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          {error || "This report may have been deleted or you don't have permission to view it."}
        </p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

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
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Shared Game Report</p>
            <p className="text-xs text-muted-foreground">
              Generated on {new Date(report.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            AI Generated
          </span>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Summary
            </h2>
            <p className="leading-relaxed text-muted-foreground">{report.summary}</p>
          </div>

          {/* Key Insights */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Key Insights
            </h2>
            <div className="space-y-4">
              {report.key_insights.map((insight, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium">{insight.title}</span>
                    <ConfidenceBadge confidence={insight.confidence} />
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{insight.description}</p>
                  <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
                    <span className="text-lg">📊</span>
                    <p className="text-xs text-muted-foreground">{insight.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Action Items
            </h2>
            <div className="space-y-4">
              {report.action_items.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
                    <span className="text-lg">📏</span>
                    <p className="text-xs text-muted-foreground">Measure: {item.metric}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Focus */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <span className="text-2xl">🎯</span>
              Practice Focus
            </h2>
            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="leading-relaxed">{report.practice_focus}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions for Next Game
            </h2>
            <div className="space-y-3">
              {report.questions_for_next_game.map((q, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <p className="mb-1 font-medium">❓ {q.question}</p>
                  <p className="text-sm text-muted-foreground">{q.context}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta & CTA */}
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Generated by {report.model_used} • Powered by Explain My Game
            </p>
            <div className="h-px w-full bg-border" />
            <h3 className="text-lg font-semibold">Want AI insights for your games?</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Create your free account and start generating AI-powered coaching reports for your basketball games.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© 2024 Explain My Game. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

