"use client";

import { useState, useCallback } from "react";
import type { AgentResult, BaselineResult } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Hero, EXAMPLES } from "@/components/hero";
import { TasteForm } from "@/components/taste-form";
import { ResultsView } from "@/components/results-view";

export default function Home() {
  const [originCity, setOriginCity] = useState("");
  const [destination, setDestination] = useState("");
  const [placeInputs, setPlaceInputs] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [baseline, setBaseline] = useState<BaselineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [loadingBaseline, setLoadingBaseline] = useState(false);

  const loadExample = (example: (typeof EXAMPLES)[number]) => {
    setOriginCity(example.origin);
    setDestination(example.destination);
    setPlaceInputs(example.places);
    setResult(null);
    setBaseline(null);
    setError(null);
  };

  const addPlaceInput = () => {
    if (placeInputs.length < 7) setPlaceInputs([...placeInputs, ""]);
  };

  const updatePlace = (index: number, value: string) => {
    const updated = [...placeInputs];
    updated[index] = value;
    setPlaceInputs(updated);
  };

  const removePlace = (index: number) => {
    if (placeInputs.length > 2) {
      setPlaceInputs(placeInputs.filter((_, i) => i !== index));
    }
  };

  const submit = useCallback(async () => {
    const places = placeInputs.filter((p) => p.trim());
    if (places.length < 2) {
      setError("Enter at least 2 places you love.");
      return;
    }
    if (!originCity.trim() || !destination.trim()) {
      setError("Enter both your current city and destination.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setBaseline(null);
    setShowCompare(false);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places,
          origin_city: originCity.trim(),
          destination: destination.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();
      setResult(data.qloo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [placeInputs, originCity, destination]);

  const loadBaseline = useCallback(async () => {
    if (!result) return;
    setLoadingBaseline(true);
    try {
      const places = placeInputs.filter((p) => p.trim());
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places,
          origin_city: originCity.trim(),
          destination: destination.trim(),
          include_baseline: true,
        }),
      });
      const data = await res.json();
      if (data.baseline) {
        setBaseline(data.baseline);
        setShowCompare(true);
      }
    } catch {
      // baseline is supplementary
    } finally {
      setLoadingBaseline(false);
    }
  }, [result, placeInputs, originCity, destination]);

  return (
    <main className="flex-1">
      <Navbar />

      <Hero onLoadExample={loadExample} />

      {/* Before search: centered form */}
      {!loading && !result && (
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-xl">
            <TasteForm
              originCity={originCity}
              destination={destination}
              placeInputs={placeInputs}
              loading={loading}
              error={error}
              onOriginChange={setOriginCity}
              onDestinationChange={setDestination}
              onPlaceUpdate={updatePlace}
              onPlaceRemove={removePlace}
              onPlaceAdd={addPlaceInput}
              onSubmit={submit}
            />
          </div>
        </section>
      )}

      {/* After search: 2-column layout */}
      {(loading || result) && (
        <section className="mx-auto max-w-[1400px] px-4 pb-20">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
            {/* Left column — form (sticky on desktop) */}
            <div className="lg:sticky lg:top-8">
              <TasteForm
                originCity={originCity}
                destination={destination}
                placeInputs={placeInputs}
                loading={loading}
                error={error}
                onOriginChange={setOriginCity}
                onDestinationChange={setDestination}
                onPlaceUpdate={updatePlace}
                onPlaceRemove={removePlace}
                onPlaceAdd={addPlaceInput}
                onSubmit={submit}
              />
            </div>

            {/* Right column — loading / results */}
            <div className="min-h-0">
              {loading && (
                <div className="flex h-80 flex-col items-center justify-center gap-6 rounded-2xl border border-foreground/[0.04] bg-white/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-2 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                    <div className="size-2 animate-bounce rounded-full bg-accent/70 [animation-delay:150ms]" />
                    <div className="size-2 animate-bounce rounded-full bg-accent/40 [animation-delay:300ms]" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Searching Qloo&apos;s taste graph for your matches...
                  </p>
                </div>
              )}

              {result && !loading && (
                <ResultsView
                  result={result}
                  baseline={baseline}
                  showCompare={showCompare}
                  onLoadBaseline={loadBaseline}
                  loadingBaseline={loadingBaseline}
                />
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-foreground/[0.04] px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[11px] text-foreground/25">
          <span>Built for the Qloo Hackathon</span>
          <div className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-accent/50" />
            <span>Taste Intelligence</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
