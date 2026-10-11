const EXAMPLES = [
  {
    label: "NYC Foodie → Portland",
    origin: "New York",
    destination: "Portland",
    places: [
      "Joe's Pizza",
      "Please Don't Tell",
      "Brooklyn Bowl",
      "Russ & Daughters",
      "House of Yes",
    ],
  },
  {
    label: "SF Tech → Austin",
    origin: "San Francisco",
    destination: "Austin",
    places: ["Tartine Bakery", "Smuggler's Cove", "The Fillmore"],
  },
  {
    label: "LA Creative → Chicago",
    origin: "Los Angeles",
    destination: "Chicago",
    places: ["Gjusta", "The Varnish", "Hollywood Bowl", "Sqirl"],
  },
];

export { EXAMPLES };

export function Hero({
  onLoadExample,
}: {
  onLoadExample: (ex: (typeof EXAMPLES)[number]) => void;
}) {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-8 md:pt-40 md:pb-16">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2">
        <div className="animate-float h-[420px] w-[700px] rounded-full bg-gradient-to-br from-accent/15 via-orange-300/20 to-amber-200/10 blur-[80px]" />
      </div>
      <div className="pointer-events-none absolute -top-20 left-[20%]">
        <div className="animate-float-delayed h-[300px] w-[400px] rounded-full bg-gradient-to-r from-rose-200/15 to-purple-200/10 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.06] px-4 py-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            Powered by Qloo
          </span>
        </div>

        <h1 className="mt-8 font-serif text-[3.25rem] leading-[1.05] tracking-tight md:text-[4.5rem]">
          Your taste,
          <br />
          <span className="bg-gradient-to-r from-accent via-orange-500 to-amber-500 bg-clip-text italic text-transparent">
            transplanted.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-md text-[15px] leading-relaxed text-foreground/70">
          Moving to a new city? Tell us the places you love and we&apos;ll find
          their taste-equivalent in your destination.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => onLoadExample(ex)}
              className="rounded-full border border-foreground/[0.08] bg-foreground/[0.03] px-4 py-2 text-[13px] font-medium text-foreground/80 transition-all hover:border-foreground/[0.15] hover:bg-foreground/[0.06] hover:text-foreground"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
