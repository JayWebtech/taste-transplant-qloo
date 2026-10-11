"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VoteStats {
  total: number;
  qloo_wins: number;
  baseline_wins: number;
  qloo_win_rate: number;
  baseline_win_rate: number;
}

export default function ResultsPage() {
  const [stats, setStats] = useState<VoteStats | null>(null);

  useEffect(() => {
    fetch("/api/vote")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <main className="flex-1 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Blind Test Results</h1>
        <p className="mt-2 text-muted-foreground">
          Aggregate results from blind taste tests comparing Qloo-powered vs
          LLM-only recommendations.
        </p>

        {!stats ? (
          <Card className="mt-8">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading results...
            </CardContent>
          </Card>
        ) : stats.total === 0 ? (
          <Card className="mt-8">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No votes yet. Run a blind test from the main page to start
              collecting data.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall</CardTitle>
                <CardDescription>{stats.total} total votes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4 text-center">
                    <Badge className="mb-2">Qloo-Powered</Badge>
                    <p className="text-3xl font-bold">{stats.qloo_win_rate}%</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.qloo_wins} wins
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <Badge variant="secondary" className="mb-2">
                      LLM-Only
                    </Badge>
                    <p className="text-3xl font-bold">
                      {stats.baseline_win_rate}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats.baseline_wins} wins
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex h-6 overflow-hidden rounded-full bg-muted">
                    {stats.qloo_win_rate > 0 && (
                      <div
                        className="flex items-center justify-center bg-primary text-xs font-medium text-primary-foreground"
                        style={{ width: `${stats.qloo_win_rate}%` }}
                      >
                        {stats.qloo_win_rate > 15 && `${stats.qloo_win_rate}%`}
                      </div>
                    )}
                    {stats.baseline_win_rate > 0 && (
                      <div
                        className="flex items-center justify-center bg-muted-foreground/30 text-xs font-medium"
                        style={{ width: `${stats.baseline_win_rate}%` }}
                      >
                        {stats.baseline_win_rate > 15 &&
                          `${stats.baseline_win_rate}%`}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Methodology</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Each blind test presents two sets of place recommendations for
                  the same origin/destination pair. One set is powered by
                  Qloo&apos;s taste intelligence API, the other by Claude
                  (Sonnet 5.5) alone with no external data. Sets are randomly
                  labeled &ldquo;A&rdquo; and &ldquo;B&rdquo; to prevent bias.
                </p>
                <p className="mt-2">
                  Votes are stored in-memory on the server (reset on deploy).
                  This is a hackathon demo, not a rigorous study.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
