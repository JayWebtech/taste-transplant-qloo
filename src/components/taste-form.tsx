"use client";

interface TasteFormProps {
  originCity: string;
  destination: string;
  placeInputs: string[];
  loading: boolean;
  error: string | null;
  onOriginChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  onPlaceUpdate: (index: number, value: string) => void;
  onPlaceRemove: (index: number) => void;
  onPlaceAdd: () => void;
  onSubmit: () => void;
}

export function TasteForm({
  originCity,
  destination,
  placeInputs,
  loading,
  error,
  onOriginChange,
  onDestinationChange,
  onPlaceUpdate,
  onPlaceRemove,
  onPlaceAdd,
  onSubmit,
}: TasteFormProps) {
  const filledCount = placeInputs.filter((p) => p.trim()).length;

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/60 bg-white/50 p-7 shadow-xl shadow-black/[0.03] ring-1 ring-black/[0.04] backdrop-blur-xl md:p-10">
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-bold text-black">
              From
            </label>
            <input
              placeholder="New York"
              value={originCity}
              onChange={(e) => onOriginChange(e.target.value)}
              className="h-12 w-full rounded-lg ring ring-gray-200 px-4 text-[15px] font-medium text-foreground outline-none transition-colors placeholder:text-foreground/30  focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex h-12 shrink-0 items-center text-foreground/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14m-7-7 7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-bold text-black">
              To
            </label>
            <input
              placeholder="Portland"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              className="h-12 w-full rounded-lg ring ring-gray-200 px-4 text-[15px] font-medium text-foreground outline-none transition-colors placeholder:text-foreground/30  focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-bold text-black">
              Places you love
            </label>
            <span className="text-[11px] tabular-nums text-foreground/30">
              {filledCount}/{placeInputs.length}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {placeInputs.map((val, i) => (
              <div key={i} className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-foreground/20">
                  {i + 1}
                </span>
                <input
                  placeholder={placeholders[i % placeholders.length]}
                  value={val}
                  onChange={(e) => onPlaceUpdate(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                  }}
                  className="h-11 w-full rounded-lg ring ring-gray-200 pl-9 pr-10 text-[14px] text-foreground outline-none transition-colors placeholder:text-foreground/25  focus:ring-2 focus:ring-accent"
                />
                {placeInputs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onPlaceRemove(i)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground/20 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50 group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {placeInputs.length < 7 && (
            <button
              type="button"
              onClick={onPlaceAdd}
              className="mt-2.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-foreground/40 transition-colors hover:bg-foreground/[0.03] hover:text-foreground/60"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add another
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-destructive/8 px-4 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-foreground px-6 py-4 text-[15px] font-semibold text-background transition-all hover:shadow-lg hover:shadow-foreground/10 active:scale-[0.99] disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              {loading ? (
                <>
                  <LoadingDots />
                  <span>Finding your places</span>
                </>
              ) : (
                <>
                  <span>Find my places</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M5 12h14m-7-7 7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const placeholders = [
  "A favorite restaurant...",
  "A bar or coffee shop...",
  "A venue or cultural spot...",
  "Another place you'd miss...",
  "One more favorite...",
  "Keep going...",
  "Last one...",
];

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
    </span>
  );
}
