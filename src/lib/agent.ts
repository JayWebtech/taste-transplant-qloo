import Anthropic from "@anthropic-ai/sdk";
import { searchPlaces, getInsights, toSeedPlace, toMatchedPlace, geocodePlaces } from "./qloo";
import { clusterByNeighborhood } from "./clustering";
import { validateGrounding } from "./grounding";
import type { AgentResult, SeedPlace, MatchedPlace, Neighborhood } from "./types";

const anthropic = new Anthropic();

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "new york": { lat: 40.7128, lon: -74.006 },
  "los angeles": { lat: 34.0522, lon: -118.2437 },
  "san francisco": { lat: 37.7749, lon: -122.4194 },
  "chicago": { lat: 41.8781, lon: -87.6298 },
  "portland": { lat: 45.5152, lon: -122.6784 },
  "seattle": { lat: 47.6062, lon: -122.3321 },
  "austin": { lat: 30.2672, lon: -97.7431 },
  "miami": { lat: 25.7617, lon: -80.1918 },
  "boston": { lat: 42.3601, lon: -71.0589 },
  "nashville": { lat: 36.1627, lon: -86.7816 },
  "denver": { lat: 39.7392, lon: -104.9903 },
  "philadelphia": { lat: 39.9526, lon: -75.1652 },
  "london": { lat: 51.5074, lon: -0.1278 },
  "paris": { lat: 48.8566, lon: 2.3522 },
  "tokyo": { lat: 35.6762, lon: 139.6503 },
  "berlin": { lat: 52.52, lon: 13.405 },
  "barcelona": { lat: 41.3874, lon: 2.1686 },
  "mexico city": { lat: 19.4326, lon: -99.1332 },
  "toronto": { lat: 43.6532, lon: -79.3832 },
  "lisbon": { lat: 38.7223, lon: -9.1393 },
};

function getCityCoords(city: string): { lat: number; lon: number } | null {
  const normalized = city.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }
  return null;
}

export async function runAgent(
  placeNames: string[],
  originCity: string,
  destination: string
): Promise<AgentResult> {
  const warnings: string[] = [];
  const originCoords = getCityCoords(originCity);

  if (!originCoords) {
    warnings.push(`Could not find coordinates for "${originCity}". Search results may be less accurate.`);
  }

  // Step 1: Resolve seed places
  const seeds: SeedPlace[] = [];
  const seedsAttempted = placeNames.length;

  for (const name of placeNames) {
    try {
      const results = await searchPlaces(
        name,
        originCoords?.lat || 40.7128,
        originCoords?.lon || -74.006,
        originCoords ? 25 : 100
      );

      if (results.length === 0) {
        warnings.push(`"${name}" was not found in Qloo's database. Skipping.`);
        continue;
      }

      const topResult = results[0];
      if (topResult.properties.is_closed) {
        warnings.push(`"${topResult.name}" appears to be permanently closed. Including it as a taste signal anyway.`);
      }

      seeds.push(toSeedPlace(topResult));
    } catch (err) {
      warnings.push(`Error searching for "${name}": ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (seeds.length < 2) {
    return {
      seeds,
      matches: [],
      neighborhoods: [],
      destination,
      seeds_resolved: seeds.length,
      seeds_attempted: seedsAttempted,
      warnings: [
        ...warnings,
        `Only ${seeds.length} place(s) could be resolved. Need at least 2 for meaningful results. Please add more places.`,
      ],
    };
  }

  // Step 2: Get taste-based recommendations in destination
  let matches: MatchedPlace[] = [];
  let destinationDisambiguation: string | undefined;

  try {
    const insights = await getInsights(
      seeds.map((s) => s.entity_id),
      destination,
      50
    );

    if (insights.query?.localities?.filter?.[0]) {
      destinationDisambiguation =
        insights.query.localities.filter[0].disambiguation;
    }

    matches = insights.results.entities.map((e) => toMatchedPlace(e, seeds));

    if (insights.warnings?.length) {
      for (const w of insights.warnings) {
        warnings.push(`Qloo warning: ${w.type}`);
      }
    }
  } catch (err) {
    warnings.push(
      `Error getting recommendations: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  if (matches.length === 0) {
    warnings.push(
      `No taste matches found in ${destination}. This may mean Qloo has thin coverage for this destination.`
    );
  }

  // Step 2b: Geocode places (API doesn't return coordinates)
  if (matches.length > 0) {
    matches = await geocodePlaces(matches);
  }

  // Step 3: Validate grounding
  const validation = validateGrounding(matches, matches);
  if (!validation.valid) {
    for (const v of validation.violations) {
      warnings.push(v);
    }
  }

  // Step 4: Cluster by neighborhood
  const neighborhoods = clusterByNeighborhood(matches);

  // Step 5: Generate plan text via LLM
  let planText: string | undefined;
  if (neighborhoods.length > 0) {
    planText = await generatePlan(seeds, neighborhoods, destination);
  }

  return {
    seeds,
    matches,
    neighborhoods,
    destination,
    destination_disambiguation: destinationDisambiguation,
    plan_text: planText,
    seeds_resolved: seeds.length,
    seeds_attempted: seedsAttempted,
    warnings,
  };
}

async function generatePlan(
  seeds: SeedPlace[],
  neighborhoods: Neighborhood[],
  destination: string
): Promise<string> {
  const seedSummary = seeds
    .map((s) => `- ${s.name} (${s.genre || "place"}, ${s.neighborhood || s.address || "location unknown"})`)
    .join("\n");

  const neighborhoodSummary = neighborhoods
    .slice(0, 5)
    .map((n) => {
      const topPlaces = n.places
        .slice(0, 4)
        .map((p) => {
          const topSeed = p.seed_contributions[0];
          const seedNote = topSeed
            ? `most connected to ${topSeed.seed_name} (${Math.round(topSeed.score * 100)}%)`
            : "";
          return `  - ${p.name} (${p.genre}, affinity: ${Math.round(p.affinity * 100)}%, ${seedNote})${p.good_for?.length ? ` — good for: ${p.good_for.join(", ")}` : ""}`;
        })
        .join("\n");
      return `### ${n.name} (score: ${Math.round(n.score * 100)}/100, ${n.place_count} matches)\n${topPlaces}`;
    })
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are writing a friendly, practical guide for someone moving to ${destination}. They love these places in their current city:

${seedSummary}

Based on their taste profile, here are the best-matching neighborhoods and places in ${destination}, ranked by taste affinity:

${neighborhoodSummary}

Write a short, warm "where you'll feel at home" guide. For each of the top 3-4 neighborhoods:
- One sentence on the vibe and why it matches their taste
- Name the 2-3 specific places that match and what makes them their kind of spot
- Reference which of their favorite places each one corresponds to, using the seed contribution data

Keep it conversational and practical. Do NOT invent any places — only mention places from the data above. Do NOT make up reasons for matches — only use the genre, good_for, and affinity data provided. End with one line of honest disclosure: "All recommendations come from Qloo's taste intelligence API. Match percentages reflect taste affinity scores."

Keep the whole thing under 400 words.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "";
}

export async function runBaseline(
  placeNames: string[],
  originCity: string,
  destination: string
): Promise<{
  places: Array<{
    name: string;
    description: string;
    neighborhood: string;
    verified: boolean;
    verification_note: string;
  }>;
  plan_text: string;
}> {
  const seedList = placeNames
    .map((n) => `- ${n}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Someone is moving from ${originCity} to ${destination}. They love these places:

${seedList}

Recommend 10-15 specific, real places in ${destination} that would match their taste. For each place, provide:
1. The exact place name
2. The neighborhood it's in
3. A one-sentence description of why it matches

Then write a short "where you'll feel at home" guide for ${destination} based on these matches. Group by neighborhood.

Respond in this exact JSON format:
{
  "places": [
    {"name": "Place Name", "neighborhood": "Neighborhood", "description": "Why it matches"}
  ],
  "plan_text": "Your guide text here"
}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock?.text || "{}";

  let parsed: { places?: Array<{ name: string; neighborhood: string; description: string }>; plan_text?: string };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    parsed = {};
  }

  const baselinePlaces = parsed.places || [];

  // Cross-check LLM-only picks against Qloo search
  const verified = await Promise.all(
    baselinePlaces.map(async (p) => {
      try {
        const destCoords = getCityCoords(destination);
        const results = await searchPlaces(
          p.name,
          destCoords?.lat || 0,
          destCoords?.lon || 0,
          50
        );
        const found = results.some(
          (r) => r.name.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
        );
        return {
          name: p.name,
          description: p.description,
          neighborhood: p.neighborhood,
          verified: found,
          verification_note: found
            ? "Found in Qloo database"
            : "Not found in Qloo — may be hallucinated or closed",
        };
      } catch {
        return {
          name: p.name,
          description: p.description,
          neighborhood: p.neighborhood,
          verified: false,
          verification_note: "Could not verify (search error)",
        };
      }
    })
  );

  return {
    places: verified,
    plan_text: parsed.plan_text || "Could not generate baseline plan.",
  };
}
