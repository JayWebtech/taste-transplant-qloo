import type { Neighborhood } from "@/lib/types";
import { PlaceCard } from "./place-card";

const RANK_COLORS = [
  "from-accent to-orange-500",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-pink-500 to-rose-600",
];

export function NeighborhoodCard({
  neighborhood,
  rank,
}: {
  neighborhood: Neighborhood;
  rank: number;
}) {
  const gradient = RANK_COLORS[(rank - 1) % RANK_COLORS.length];

  return (
    <div className="overflow-hidden rounded-[24px] border border-foreground/[0.04] bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-7 pt-7 pb-5">
        <div className="flex items-center gap-4">
          <span
            className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-lg shadow-black/10`}
          >
            {rank}
          </span>
          <div>
            <h3 className="font-serif text-xl tracking-tight">
              {neighborhood.name}
            </h3>
            <p className="text-[12px] text-foreground/40">
              {neighborhood.place_count} taste match
              {neighborhood.place_count !== 1 && "es"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground/80">
            {Math.round(neighborhood.score * 100)}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/25">
            Score
          </p>
        </div>
      </div>

      <div className="grid gap-2.5 px-5 pb-6 md:grid-cols-2">
        {neighborhood.places.slice(0, 6).map((place) => (
          <PlaceCard key={place.entity_id} place={place} />
        ))}
      </div>
    </div>
  );
}
