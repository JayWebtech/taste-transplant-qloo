import type { AgentResult, BaselineResult } from "@/lib/types";

export function CompareView({
  result,
  baseline,
}: {
  result: AgentResult;
  baseline: BaselineResult | null;
}) {
  if (!baseline) return null;

  const verifiedCount = baseline.places.filter((p) => p.verified).length;
  const totalBaseline = baseline.places.length;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="overflow-hidden rounded-[24px] border-2 border-accent/20 bg-white/60 backdrop-blur-sm">
        <div className="bg-gradient-to-r from-accent/8 to-transparent px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
              Qloo-Powered
            </span>
            <span className="text-[12px] text-foreground/40">
              {result.matches.length} results
            </span>
          </div>
          <p className="mt-2 text-[12px] text-foreground/45">
            Every place from Qloo&apos;s taste graph with affinity scores.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 px-4 pb-5">
          {result.matches.slice(0, 10).map((p) => (
            <div
              key={p.entity_id}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] transition-colors hover:bg-foreground/[0.02]"
            >
              <div className="min-w-0">
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-[11px] text-foreground/30">
                  {p.neighborhood}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-bold tabular-nums">
                  {Math.round(p.affinity * 100)}%
                </span>
                <span className="text-[10px] font-semibold text-emerald-500">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-foreground/[0.06] bg-white/40 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-bold text-foreground/60">
              LLM-Only
            </span>
            <span className="text-[12px] text-foreground/40">
              {totalBaseline} results
            </span>
          </div>
          <p className="mt-2 text-[12px] text-foreground/45">
            Same model, same prompt, no Qloo.{" "}
            <strong className="text-foreground/60">
              {verifiedCount}/{totalBaseline}
            </strong>{" "}
            verified against Qloo.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 px-4 pb-5">
          {baseline.places.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] transition-colors hover:bg-foreground/[0.02]"
            >
              <div className="min-w-0">
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-[11px] text-foreground/30">
                  {p.neighborhood}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold ${p.verified ? "text-emerald-500" : "text-red-400"}`}
              >
                {p.verified ? "Verified" : "Unverified"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
