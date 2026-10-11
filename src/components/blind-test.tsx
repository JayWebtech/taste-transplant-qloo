"use client";

import { useState, useMemo } from "react";
import type { AgentResult, BaselineResult } from "@/lib/types";

interface BlindTestProps {
  result: AgentResult;
  baseline: BaselineResult;
}

export function BlindTest({ result, baseline }: BlindTestProps) {
  const [voted, setVoted] = useState(false);
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isQlooA = useMemo(() => Math.random() > 0.5, []);

  const setA = isQlooA
    ? result.matches.slice(0, 8).map((p) => ({
        name: p.name,
        neighborhood: p.neighborhood,
        description: p.description || p.genre,
      }))
    : baseline.places.slice(0, 8).map((p) => ({
        name: p.name,
        neighborhood: p.neighborhood,
        description: p.description,
      }));

  const setB = isQlooA
    ? baseline.places.slice(0, 8).map((p) => ({
        name: p.name,
        neighborhood: p.neighborhood,
        description: p.description,
      }))
    : result.matches.slice(0, 8).map((p) => ({
        name: p.name,
        neighborhood: p.neighborhood,
        description: p.description || p.genre,
      }));

  const handleVote = async (pick: "A" | "B") => {
    setChoice(pick);
    setVoted(true);

    const qlooWon =
      (pick === "A" && isQlooA) || (pick === "B" && !isQlooA);

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: qlooWon ? "qloo" : "baseline" }),
      });
    } catch {
      // best-effort
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h3 className="font-serif text-2xl tracking-tight">Blind Taste Test</h3>
        <p className="mt-2 text-[13px] text-foreground/40">
          Two recommendation sets &mdash; one from Qloo, one from the LLM alone.
          Which would you actually visit?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SetCard
          label="Set A"
          places={setA}
          selected={voted && choice === "A"}
          dimmed={voted && choice !== "A"}
          revealed={revealed}
          source={isQlooA ? "Qloo" : "LLM-Only"}
          onClick={() => !voted && handleVote("A")}
        />
        <SetCard
          label="Set B"
          places={setB}
          selected={voted && choice === "B"}
          dimmed={voted && choice !== "B"}
          revealed={revealed}
          source={!isQlooA ? "Qloo" : "LLM-Only"}
          onClick={() => !voted && handleVote("B")}
        />
      </div>

      {voted && !revealed && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-[13px] text-foreground/40">
            Vote recorded. Ready to see which was which?
          </p>
          <button
            onClick={() => setRevealed(true)}
            className="rounded-full border border-foreground/[0.08] px-5 py-2.5 text-[13px] font-semibold transition-all hover:border-foreground/[0.15] hover:shadow-sm"
          >
            Reveal sources
          </button>
        </div>
      )}

      {revealed && (
        <div className="rounded-[24px] border border-foreground/[0.04] bg-white/50 p-8 text-center backdrop-blur-sm">
          <p className="font-serif text-xl tracking-tight">
            {(choice === "A" && isQlooA) || (choice === "B" && !isQlooA)
              ? "You preferred Qloo-powered recommendations!"
              : "You preferred the LLM-only recommendations."}
          </p>
          <p className="mt-2 text-[13px] text-foreground/40">
            Set A was{" "}
            <strong className="text-foreground/70">
              {isQlooA ? "Qloo" : "LLM-Only"}
            </strong>
            , Set B was{" "}
            <strong className="text-foreground/70">
              {!isQlooA ? "Qloo" : "LLM-Only"}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}

function SetCard({
  label,
  places,
  selected,
  dimmed,
  revealed,
  source,
  onClick,
}: {
  label: string;
  places: Array<{ name: string; neighborhood: string; description: string }>;
  selected: boolean;
  dimmed: boolean;
  revealed: boolean;
  source: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-[24px] border bg-white/50 backdrop-blur-sm transition-all ${
        selected
          ? "border-accent/30 ring-2 ring-accent/15"
          : dimmed
            ? "border-foreground/[0.04] opacity-40"
            : "cursor-pointer border-foreground/[0.06] hover:border-foreground/[0.12] hover:shadow-lg hover:shadow-black/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <span className="text-[14px] font-bold tracking-tight">{label}</span>
        {revealed && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              source === "Qloo"
                ? "bg-accent/10 text-accent"
                : "bg-foreground/[0.05] text-foreground/50"
            }`}
          >
            {source}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-4 pb-5">
        {places.map((p, i) => (
          <div
            key={i}
            className="rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.02]"
          >
            <span className="text-[13px] font-medium">{p.name}</span>
            <span className="ml-2 text-[11px] text-foreground/30">
              {p.neighborhood}
            </span>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground/25">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
