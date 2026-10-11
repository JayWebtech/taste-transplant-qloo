/**
 * Phase 0 probe: hit the real Qloo API with known places and print raw responses.
 * Usage: QLOO_API_KEY=xxx npx tsx scripts/probe.ts [city]
 * Default city: "New York"
 */

const API_KEY = process.env.QLOO_API_KEY;
if (!API_KEY) {
  console.error("ERROR: Set QLOO_API_KEY env var before running.");
  process.exit(1);
}

const BASE = "https://hackathon.api.qloo.com";

const SEED_PLACES: Record<string, { names: string[]; lat: number; lon: number }> = {
  "New York": {
    names: ["Joe's Pizza", "Please Don't Tell", "Brooklyn Bowl"],
    lat: 40.7128,
    lon: -74.006,
  },
  "San Francisco": {
    names: ["Tartine Bakery", "Smuggler's Cove", "The Fillmore"],
    lat: 37.7749,
    lon: -122.4194,
  },
  "Los Angeles": {
    names: ["Gjusta", "The Varnish", "Hollywood Bowl"],
    lat: 34.0522,
    lon: -118.2437,
  },
};

const DESTINATION = "Portland";
const DESTINATION_STATE = "Oregon";

async function qloo(path: string, params: Record<string, string>) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  console.log(`\n>>> ${url.toString()}\n`);
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": API_KEY! },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.error(text);
    return null;
  }
  const json = await res.json();
  return json;
}

function printJson(label: string, data: unknown) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const city = process.argv[2] || "New York";
  const seed = SEED_PLACES[city];
  if (!seed) {
    console.error(`Unknown city "${city}". Options: ${Object.keys(SEED_PLACES).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🔍 Phase 0 Probe — seeding from ${city}, destination: ${DESTINATION}, ${DESTINATION_STATE}\n`);

  // Step 1: Search for each seed place
  const resolvedIds: string[] = [];

  for (const name of seed.names) {
    const result = await qloo("/search", {
      query: name,
      types: "urn:entity:place",
      "filter.location": `${seed.lat},${seed.lon}`,
      "filter.radius": "25",
      take: "5",
      sort_by: "match",
    });
    printJson(`SEARCH: "${name}" in ${city}`, result);

    if (result?.results?.length) {
      const topMatch = result.results[0];
      resolvedIds.push(topMatch.entity_id);
      console.log(`  → Resolved to: ${topMatch.name} (${topMatch.entity_id})`);
    } else {
      console.log(`  → No results found for "${name}"`);
    }
  }

  if (resolvedIds.length === 0) {
    console.error("No places resolved. Cannot continue.");
    process.exit(1);
  }

  // Step 2: Tags search — discover tag URNs for place categories
  const tagResult = await qloo("/v2/tags", {
    "filter.query": "bar",
    "filter.tag.types": "urn:tag:category:place",
    take: "10",
  });
  printJson('TAGS: search for "bar" category tags', tagResult);

  const tagResult2 = await qloo("/v2/tags", {
    "filter.query": "restaurant",
    "filter.tag.types": "urn:tag:category:place",
    take: "10",
  });
  printJson('TAGS: search for "restaurant" category tags', tagResult2);

  // Step 3: Insights — taste-seeded recommendations in the destination
  const insightsResult = await qloo("/v2/insights", {
    "filter.type": "urn:entity:place",
    "signal.interests.entities": resolvedIds.join(","),
    "filter.location.query": DESTINATION,
    "filter.geocode.admin1_region": DESTINATION_STATE,
    "feature.explainability": "true",
    take: "10",
    page: "1",
  });
  printJson(
    `INSIGHTS: taste matches in ${DESTINATION} seeded by [${resolvedIds.join(", ")}]`,
    insightsResult
  );

  // Step 4: Entity lookup by ID — get full details for first seed
  const entityResult = await qloo("/entities", {
    entity_ids: resolvedIds[0],
  });
  printJson(`ENTITY LOOKUP: ${resolvedIds[0]}`, entityResult);

  // Summary
  console.log("\n\n=== PROBE SUMMARY ===");
  console.log(`Seeds resolved: ${resolvedIds.length}/${seed.names.length}`);
  if (insightsResult?.results?.entities) {
    console.log(`Insights returned: ${insightsResult.results.entities.length} places`);
    console.log(`Total available: ${insightsResult.results.total}`);
    const first = insightsResult.results.entities[0];
    if (first) {
      console.log(`Top match: ${first.name} (affinity: ${first.query?.affinity})`);
      console.log(`Geocode: ${JSON.stringify(first.properties?.geocode)}`);
      console.log(`Explainability: ${JSON.stringify(first.query?.explainability)}`);
      console.log(`Tags present: ${!!first.tags}`);
    }
  } else {
    console.log("Insights returned no results or errored.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
