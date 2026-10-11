"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AgentResult, BaselineResult } from "@/lib/types";
import { NeighborhoodCard } from "./neighborhood-card";
import { CompareView } from "./compare-view";
import { PlanView } from "./plan-view";
import { MapView } from "./map-view";
import { BlindTest } from "./blind-test";

type Tab = "neighborhoods" | "map" | "plan" | "compare" | "blind";

export function ResultsView({
  result,
  baseline,
  showCompare,
  onLoadBaseline,
  loadingBaseline,
}: {
  result: AgentResult;
  baseline: BaselineResult | null;
  showCompare: boolean;
  onLoadBaseline: () => void;
  loadingBaseline: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("neighborhoods");

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "neighborhoods", label: "Neighborhoods", show: true },
    { id: "map", label: "Map", show: true },
    { id: "plan", label: "Plan", show: true },
    { id: "compare", label: "Compare", show: showCompare },
    { id: "blind", label: "Blind Test", show: showCompare && !!baseline },
  ];

  return (
    <div className="mx-auto w-full">
      {result.warnings.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200/50 bg-amber-50/40 px-5 py-4 backdrop-blur-sm dark:border-amber-800/30 dark:bg-amber-950/20">
          <ul className="flex flex-col gap-1 text-[13px] text-amber-700 dark:text-amber-200">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <StatPill>
          {result.seeds_resolved}/{result.seeds_attempted} resolved
        </StatPill>
        <StatPill>{result.matches.length} matches</StatPill>
        <StatPill>{result.neighborhoods.length} neighborhoods</StatPill>
        {result.destination_disambiguation && (
          <StatPill accent>{result.destination_disambiguation}</StatPill>
        )}
      </div>

      {result.matches.length === 0 ? (
        <div className="rounded-[24px] border border-foreground/[0.04] bg-white/50 p-16 text-center backdrop-blur-sm">
          <p className="font-serif text-xl text-foreground/50">
            No taste matches found
          </p>
          <p className="mt-2 text-[13px] text-foreground/30">
            Try different seed places or a different destination.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 inline-flex rounded-full bg-foreground/[0.03] p-1">
            {tabs
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
                    activeTab === t.id
                      ? "bg-white text-foreground shadow-sm shadow-black/[0.04]"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </div>

          {activeTab === "neighborhoods" && (
            <div>
              <div className="flex flex-col gap-5">
                {result.neighborhoods.map((n, i) => (
                  <NeighborhoodCard
                    key={n.name}
                    neighborhood={n}
                    rank={i + 1}
                  />
                ))}
              </div>
              <Accordion className="mt-6">
                <AccordionItem>
                  <AccordionTrigger className="text-[13px] text-foreground/35">
                    How scores are calculated
                  </AccordionTrigger>
                  <AccordionContent className="text-[12px] leading-relaxed text-foreground/30">
                    <p>
                      Neighborhoods use Qloo&apos;s own labels. Each score:{" "}
                      <code className="rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[10px]">
                        (mean_affinity &times; 0.6) + (min(count/5, 1) &times;
                        0.4)
                      </code>
                      . This weights taste quality (60%) against concentration of
                      matches (40%, capped at 5). All affinities come from
                      Qloo&apos;s API.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {activeTab === "map" && (
            <div className="overflow-hidden rounded-[24px] border border-foreground/[0.04]">
              <MapView
                neighborhoods={result.neighborhoods}
                matches={result.matches}
              />
            </div>
          )}

          {activeTab === "plan" && (
            <PlanView
              planText={result.plan_text}
              destination={result.destination}
            />
          )}

          {activeTab === "compare" && showCompare && (
            <CompareView result={result} baseline={baseline} />
          )}

          {activeTab === "blind" && showCompare && baseline && (
            <BlindTest result={result} baseline={baseline} />
          )}

          {!showCompare && (
            <div className="mt-8 overflow-hidden rounded-[24px] border border-dashed border-foreground/[0.08] bg-foreground/[0.01] p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14px] font-semibold tracking-tight">
                    How does Qloo compare to LLM-only?
                  </p>
                  <p className="mt-1 text-[13px] text-foreground/40">
                    Run the same query through Claude without Qloo data.
                  </p>
                </div>
                <button
                  onClick={onLoadBaseline}
                  disabled={loadingBaseline}
                  className="shrink-0 rounded-full border border-foreground/[0.08] bg-white px-5 py-2.5 text-[13px] font-semibold transition-all hover:border-foreground/[0.15] hover:shadow-sm disabled:opacity-50"
                >
                  {loadingBaseline ? "Running..." : "Compare"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatPill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
        accent
          ? "bg-accent/8 text-accent"
          : "bg-foreground/[0.04] text-foreground/50"
      }`}
    >
      {children}
    </span>
  );
}
