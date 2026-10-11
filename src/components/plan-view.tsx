export function PlanView({
  planText,
  destination,
}: {
  planText?: string;
  destination: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-foreground/[0.04] bg-white/50 backdrop-blur-sm">
      <div className="border-b border-foreground/[0.04] px-8 py-6 md:px-10 md:py-8">
        <h3 className="font-serif text-2xl tracking-tight">
          Your First Two Weeks in {destination}
        </h3>
        <p className="mt-1.5 text-[13px] text-foreground/40">
          A taste-matched guide using only Qloo-verified places
        </p>
      </div>

      <div className="px-8 py-8 md:px-10">
        {planText ? (
          <PlanText text={planText} />
        ) : (
          <p className="text-foreground/40">
            Not enough matches to generate a plan.
          </p>
        )}
      </div>

      <div className="border-t border-foreground/[0.04] px-8 py-4 md:px-10">
        <p className="flex items-center gap-2.5 text-[11px] text-foreground/25">
          <span className="rounded-full border border-foreground/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
            LLM-generated
          </span>
          Written by Claude using only Qloo-sourced data
        </p>
      </div>
    </div>
  );
}

function PlanText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-2 text-[14px] leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("# "))
          return (
            <h2 key={i} className="mt-5 font-serif text-xl tracking-tight">
              {trimmed.slice(2)}
            </h2>
          );
        if (trimmed.startsWith("## "))
          return (
            <h3 key={i} className="mt-4 font-serif text-lg tracking-tight">
              {trimmed.slice(3)}
            </h3>
          );
        if (trimmed.startsWith("### "))
          return (
            <h4 key={i} className="mt-3 text-[14px] font-semibold">
              {trimmed.slice(4)}
            </h4>
          );

        const formatted = trimmed
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");

        if (trimmed.startsWith("- "))
          return (
            <p
              key={i}
              className="ml-5 text-foreground/60 before:mr-2 before:text-accent before:content-['\2022']"
              dangerouslySetInnerHTML={{ __html: formatted.slice(2) }}
            />
          );

        return (
          <p
            key={i}
            className="text-foreground/60"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      })}
    </div>
  );
}
