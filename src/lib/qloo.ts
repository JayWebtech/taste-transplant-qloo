import type {
  QlooSearchResult,
  QlooInsightsResponse,
  QlooInsightEntity,
  MatchedPlace,
  SeedPlace,
} from "./types";

const BASE_URL = process.env.QLOO_API_URL || "https://hackathon.api.qloo.com";
const API_KEY = process.env.QLOO_API_KEY;

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

async function qlooFetch<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  if (!API_KEY) throw new Error("QLOO_API_KEY not set");

  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": API_KEY },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(url.toString(), {
      headers: { "X-Api-Key": API_KEY },
    });
    if (!retry.ok)
      throw new Error(`Qloo API error after retry: ${retry.status}`);
    const data = (await retry.json()) as T;
    setCache(cacheKey, data);
    return data;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Qloo API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as T;
  setCache(cacheKey, data);
  return data;
}

export async function searchPlaces(
  query: string,
  cityLat: number,
  cityLon: number,
  radius: number = 25
): Promise<QlooSearchResult[]> {
  const response = await qlooFetch<{ results: QlooSearchResult[] }>(
    "/search",
    {
      query,
      types: "urn:entity:place",
      "filter.location": `${cityLat},${cityLon}`,
      "filter.radius": String(radius),
      take: "10",
      sort_by: "match",
    }
  );
  return response.results || [];
}

export async function getInsights(
  seedEntityIds: string[],
  destinationQuery: string,
  take: number = 30
): Promise<QlooInsightsResponse> {
  return qlooFetch<QlooInsightsResponse>("/v2/insights", {
    "filter.type": "urn:entity:place",
    "signal.interests.entities": seedEntityIds.join(","),
    "filter.location.query": destinationQuery,
    "feature.explainability": "true",
    take: String(take),
  });
}

export function toSeedPlace(result: QlooSearchResult): SeedPlace {
  const p = result.properties;
  return {
    name: result.name,
    entity_id: result.entity_id,
    neighborhood:
      p.neighborhood || p.geocode?.name || undefined,
    genre: p.primary_genre?.name || undefined,
    description: p.description || undefined,
    image_url: p.image?.url || p.images?.[0]?.url || undefined,
    lat: p.location?.lat,
    lon: p.location?.lon,
    address: p.address || undefined,
  };
}

export function toMatchedPlace(
  entity: QlooInsightEntity,
  seeds: SeedPlace[]
): MatchedPlace {
  const p = entity.properties;
  const seedContributions =
    entity.query?.explainability?.["signal.interests.entities"]?.map((e) => {
      const seed = seeds.find((s) => s.entity_id === e.entity_id);
      return {
        seed_entity_id: e.entity_id,
        seed_name: seed?.name || "Unknown",
        score: e.score,
      };
    }) || [];

  seedContributions.sort((a, b) => b.score - a.score);

  const externalRatings: MatchedPlace["external_ratings"] = {};
  const ext = p.external;
  if (ext?.resy?.rating)
    externalRatings.resy = {
      rating: ext.resy.rating,
      count: ext.resy.rating_count || 0,
    };
  if (ext?.tripadvisor?.rating)
    externalRatings.tripadvisor = {
      rating: ext.tripadvisor.rating,
      count: ext.tripadvisor.rating_count || 0,
    };
  if (ext?.michelin) externalRatings.michelin = true;

  return {
    name: entity.name,
    entity_id: entity.entity_id,
    affinity: entity.query?.affinity || 0,
    neighborhood:
      p.neighborhood || p.geocode?.name || "Unknown",
    genre: p.primary_genre?.name || "Place",
    description: p.description || "",
    image_url: p.image?.url || p.images?.[0]?.url,
    lat: 0,
    lon: 0,
    address: p.address || "",
    price_level: p.price_level,
    seed_contributions: seedContributions,
    good_for: p.good_for?.map((g) => g.name),
    specialty_dishes: p.specialty_dishes?.map((s) => s.name),
    resy_why: ext?.resy?.why_we_like_it,
    external_ratings:
      Object.keys(externalRatings).length > 0
        ? externalRatings
        : undefined,
    source: "qloo",
  };
}

export async function geocodePlaces(
  places: MatchedPlace[]
): Promise<MatchedPlace[]> {
  const toGeocode = places.filter((p) => p.address && p.lat === 0);
  const batchSize = 5;

  for (let i = 0; i < toGeocode.length; i += batchSize) {
    const batch = toGeocode.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (place) => {
        const cacheKey = `geo:${place.address}`;
        const cached = getCached<{ lat: number; lon: number }>(cacheKey);
        if (cached) {
          place.lat = cached.lat;
          place.lon = cached.lon;
          return;
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place.address)}`,
            { headers: { "User-Agent": "TasteTransplant/1.0 (hackathon demo)" } }
          );
          const data = await res.json();
          if (data[0]) {
            place.lat = parseFloat(data[0].lat);
            place.lon = parseFloat(data[0].lon);
            setCache(cacheKey, { lat: place.lat, lon: place.lon });
          }
        } catch {
          // geocoding is best-effort
        }
      })
    );
    void results;
    if (i + batchSize < toGeocode.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return places;
}
