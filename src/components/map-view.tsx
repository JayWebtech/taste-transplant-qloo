"use client";

import { useEffect, useRef } from "react";
import type { Neighborhood, MatchedPlace } from "@/lib/types";
import type { Map as MLMap } from "maplibre-gl";

interface MapViewProps {
  neighborhoods: Neighborhood[];
  matches: MatchedPlace[];
}

export function MapView({ neighborhoods, matches }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || matches.length === 0) return;

    let cancelled = false;

    async function init() {
      const ml = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      ml.setWorkerUrl("/maplibre-gl-worker.js");

      if (cancelled || !containerRef.current) return;

      const hasCoords = (m: MatchedPlace) => m.lat !== 0 || m.lon !== 0;

      const bounds = new ml.LngLatBounds();
      for (const m of matches) {
        if (hasCoords(m)) bounds.extend([m.lon, m.lat]);
      }

      const map = new ml.Map({
        container: containerRef.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        bounds: bounds.isEmpty() ? undefined : bounds,
        fitBoundsOptions: { padding: 50 },
        center: bounds.isEmpty() ? [0, 0] : undefined,
        zoom: bounds.isEmpty() ? 2 : undefined,
      });

      mapRef.current = map;

      map.on("load", () => {
        const colors = [
          "#6366f1",
          "#f97316",
          "#14b8a6",
          "#ec4899",
          "#84cc16",
          "#a855f7",
          "#f59e0b",
          "#06b6d4",
        ];

        for (const m of matches) {
          if (!hasCoords(m)) continue;

          const nIdx = neighborhoods.findIndex((n) => n.name === m.neighborhood);
          const color = colors[nIdx % colors.length] || "#6366f1";
          const topSeed = m.seed_contributions[0];

          const popup = new ml.Popup({ offset: 25 }).setHTML(
            `<div style="font-family:system-ui;max-width:220px">
              <strong>${m.name}</strong>
              <div style="color:#666;font-size:12px">${m.genre}</div>
              <div style="font-size:12px;margin-top:4px">
                Affinity: <strong>${Math.round(m.affinity * 100)}%</strong>
              </div>
              ${topSeed ? `<div style="font-size:12px">Like your <strong>${topSeed.seed_name}</strong></div>` : ""}
              <div style="font-size:11px;color:#888;margin-top:2px">${m.neighborhood}</div>
            </div>`
          );

          const el = document.createElement("div");
          el.style.width = "14px";
          el.style.height = "14px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = color;
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          el.style.cursor = "pointer";

          new ml.Marker({ element: el })
            .setLngLat([m.lon, m.lat])
            .setPopup(popup)
            .addTo(map);
        }

        for (const n of neighborhoods) {
          if (!n.center_lon || !n.center_lat) continue;
          const nIdx = neighborhoods.indexOf(n);
          const color = colors[nIdx % colors.length] || "#6366f1";

          const el = document.createElement("div");
          el.style.padding = "2px 8px";
          el.style.borderRadius = "999px";
          el.style.backgroundColor = color;
          el.style.color = "white";
          el.style.fontSize = "11px";
          el.style.fontWeight = "600";
          el.style.whiteSpace = "nowrap";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          el.textContent = n.name;

          new ml.Marker({ element: el, anchor: "bottom" })
            .setLngLat([n.center_lon, n.center_lat])
            .addTo(map);
        }
      });

      map.addControl(new ml.NavigationControl(), "top-right");
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [neighborhoods, matches]);

  if (matches.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        No places with coordinates to show on map.
      </div>
    );
  }

  return <div ref={containerRef} className="h-96 w-full" />;
}
