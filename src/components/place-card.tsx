import type { MatchedPlace } from "@/lib/types";

export function PlaceCard({ place }: { place: MatchedPlace }) {
  const topSeed = place.seed_contributions[0];

  return (
    <div className="group relative flex gap-4 rounded-2xl border border-foreground/[0.04] bg-white/60 p-4 backdrop-blur-sm transition-all hover:border-foreground/[0.08] hover:bg-white/80 hover:shadow-lg hover:shadow-black/[0.03]">
      {place.image_url && (
        <img
          src={place.image_url}
          alt={place.name}
          className="size-20 shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-[14px] font-semibold leading-tight tracking-tight">
              {place.name}
            </h4>
            <p className="mt-0.5 text-[12px] text-foreground/40">
              {place.genre}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-bold tabular-nums text-foreground/60">
            {Math.round(place.affinity * 100)}%
          </span>
        </div>

        {place.description && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-foreground/45">
            {place.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {topSeed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/8 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
              Like your {topSeed.seed_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
