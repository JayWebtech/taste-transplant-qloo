import type { MatchedPlace, Neighborhood } from "./types";

export function clusterByNeighborhood(
  places: MatchedPlace[]
): Neighborhood[] {
  const groups = new Map<string, MatchedPlace[]>();

  for (const place of places) {
    const key = place.neighborhood || "Other";
    const existing = groups.get(key) || [];
    existing.push(place);
    groups.set(key, existing);
  }

  const neighborhoods: Neighborhood[] = [];

  for (const [name, groupPlaces] of groups) {
    const lats = groupPlaces.filter((p) => p.lat).map((p) => p.lat);
    const lons = groupPlaces.filter((p) => p.lon).map((p) => p.lon);

    const centerLat =
      lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : 0;
    const centerLon =
      lons.length > 0 ? lons.reduce((a, b) => a + b, 0) / lons.length : 0;

    const affinities = groupPlaces.map((p) => p.affinity);
    const meanAffinity =
      affinities.reduce((a, b) => a + b, 0) / affinities.length;

    // Score: weighted combination of count and mean affinity
    const score = meanAffinity * 0.6 + Math.min(groupPlaces.length / 5, 1) * 0.4;

    neighborhoods.push({
      name,
      places: groupPlaces.sort((a, b) => b.affinity - a.affinity),
      score,
      center_lat: centerLat,
      center_lon: centerLon,
      place_count: groupPlaces.length,
    });
  }

  return neighborhoods.sort((a, b) => b.score - a.score);
}

export function getClusteringMethodDescription(): string {
  return `Neighborhoods are grouped using Qloo's own neighborhood labels (properties.neighborhood field). ` +
    `Each neighborhood is scored using: score = (mean_affinity × 0.6) + (min(place_count / 5, 1) × 0.4). ` +
    `This weights taste-match quality (60%) alongside concentration of matches (40%, capped at 5 places). ` +
    `Center coordinates are the centroid of all places in the neighborhood.`;
}
