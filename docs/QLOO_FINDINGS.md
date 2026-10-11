# Qloo API Findings — Phase 0

Research date: 2026-10-07
Source: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide + API reference pages

## Base URL & Auth

- **Hackathon base URL**: `https://hackathon.api.qloo.com`
- **Auth**: `X-Api-Key` request header (not Bearer, not query param)
- **Rate limits**: "high enough for typical hackathon projects" — no hard numbers given. Contact Discord `#api-help` if hit.
- **Caching**: Server-side caching explicitly allowed with no TTL limit. Do not store data in public repos.
- **Key validity**: Through end of judging period.

## Endpoints

### 1. `GET /search` — Entity Search (resolve name → ID)

**Parameters:**
| Param | Type | Notes |
|---|---|---|
| `query` | string | Search text, e.g. "Blue Bottle Coffee" |
| `types` | array | `urn:entity:place`, `urn:entity:artist`, `urn:entity:brand`, etc. |
| `filter.location` | string | Lat/lon (`40.742,-74.003`), WKT, or Qloo UUID |
| `filter.radius` | number | Miles (default 10, max 100) |
| `filter.tags` | array | Tag URNs to narrow results |
| `filter.address` | string | Partial address match |
| `filter.rating` | number | Min business rating (0-5) |
| `filter.popularity` | number | Min popularity (0-1) |
| `sort_by` | string | `match` (default), `distance`, `popularity` |
| `page` | int | 1-100, default 1 |
| `take` | int | Max 199 |

**Response per entity:**
```json
{
  "id": "UUID",
  "name": "string",
  "type": "urn:entity:place",
  "tags": ["array of tag URNs"],
  "coordinates": { "lat": 40.72, "lon": -73.99 },
  "address": "string",
  "rating": 4.5,
  "popularity": 0.85,
  "external": {}
}
```

**Key takeaway**: This is how we resolve user-entered place names to Qloo entity IDs. Use `filter.location` with the user's current city coordinates to scope results.

### 2. `GET /v2/insights` — Taste-Based Recommendations (the core endpoint)

**Required**: `filter.type` (e.g. `urn:entity:place`)

**Seed/Signal params:**
| Param | Notes |
|---|---|
| `signal.interests.entities` | Comma-separated entity IDs (the user's loved places) |
| `signal.interests.entities.weight` | Influence strength |
| `signal.interests.tags` | Tag IDs as signals |
| `signal.location` | WKT POINT or locality UUID — influences taste, not filters |
| `signal.location.query` | Fuzzy locality name for signal |
| `signal.demographics.age` | Age bracket |
| `signal.demographics.gender` | male/female |

**Destination/location filters (how we target the new city):**
| Param | Notes |
|---|---|
| `filter.location` | Lat/lon, WKT, or UUID |
| `filter.location.query` | Fuzzy city name, e.g. "Portland" |
| `filter.location.radius` | Meters (default 15000, max 800000) |
| `filter.geocode.name` | Exact city name |
| `filter.geocode.admin1_region` | State code, e.g. "OR" |
| `filter.geocode.country_code` | Two-letter code, e.g. "US" |
| `filter.location.metro` | Metro area name |

**Place-specific filters:**
- `filter.tags` — cuisine/category tags
- `filter.price_level.min/max` — 1-4
- `filter.hours` — day of week
- `filter.external.exists` — resy, michelin, tablet

**Explainability (critical for our UX):**
- `feature.explainability=true` — adds per-result explainability
- Each result's `query.explainability` maps input entity IDs → contribution scores (0-1)
- Aggregate explainability at top level: top_3, top_5, top_10, all breakdowns

**Pagination:** `page` (1-100), `take` (1-50, default 20), `offset`

**Response per entity:**
```json
{
  "id": "UUID",
  "type": "urn:entity:place",
  "name": "Balthazar",
  "description": "French brasserie in SoHo",
  "properties": {
    "image": "https://...",
    "description": "...",
    "geocode": {
      "name": "New York",
      "admin1_region": "NY",
      "admin2_region": "Manhattan",
      "country_code": "US",
      "metro": "New York",
      "latitude": 40.7234,
      "longitude": -73.9973
    }
  },
  "query": {
    "affinity": 0.94,
    "affinity_rank": 0.98,
    "explainability": {
      "<seed_entity_id>": 0.87
    }
  },
  "external": {
    "resy": { "rating": 4.6, "count": 1240 },
    "michelin": true
  }
}
```

**Top-level response also includes:**
- `results.total` — total result count
- `results.duration` — query time in ms
- `query.locality.signal` — resolved locality with id and name

### 3. `GET /v2/tags` — Tag Search

Used to find valid tag IDs for filtering (e.g. cuisines, place categories).
- `filter.query` — search text
- `filter.tag.types` — filter by tag type URN
- `feature.typo_tolerance` — fuzzy matching
- `feature.semantic_search` — semantic similarity (beta)

### 4. `GET /entities` — Entity Lookup by ID

Look up full entity details by known IDs.
- `entity_ids` — array of UUIDs
- Also supports external ID lookups (Resy, Michelin, Spotify, IMDB, etc.)

## Supported Entity Types

`urn:entity:place` (restaurants, bars, cafes, venues, hotels, landmarks)
`urn:entity:brand` (chains, brands)
`urn:entity:artist` (musicians)
`urn:entity:movie`, `urn:entity:tv_show`, `urn:entity:book`
`urn:entity:podcast`, `urn:entity:videogame`
`urn:entity:person`, `urn:entity:locality`, `urn:entity:destination`

## What the API Gives Us

1. **Entity resolution**: Search by name + location → UUID + metadata
2. **Taste-seeded recommendations**: Seed with entity IDs, filter to destination city → ranked results with affinity scores
3. **Explainability**: Per-result breakdown of which seed entity contributed most to the match (0-1 score per seed)
4. **Geocode data**: City, state, country, metro, lat/lon per result
5. **Tags**: Cuisine types, categories, amenities per entity
6. **External ratings**: Resy, TripAdvisor, Michelin star status
7. **Cross-domain**: Can seed with artists/movies and get place recommendations (the taste graph connects domains)
8. **Diversity controls**: `diversify.by` can cap results per city/metro/subtype

## What the API Does NOT Give Us

1. **No "why it matched" text**: Explainability gives numeric scores per seed entity, not natural language reasons. We can say "35% driven by your love of Place X" but not "because both serve natural wine in an intimate setting" — that would require reading tags and generating text.
2. **No place-subtype filter param**: Bars and restaurants are all `urn:entity:place`. Use `filter.tags` with URNs like `urn:tag:category:place:bar`, `urn:tag:category:place:restaurant` to distinguish.
3. **No `total` or `page` in Insights results**: Pagination metadata was not returned in our test (unlike docs suggestion). The results just come back as an array.
4. **No `affinity_rank` in actual response**: Only `affinity` (0-1 score) is returned per entity.

## Confirmed Available (correcting initial assumptions)

1. **Neighborhoods ARE returned**: `properties.neighborhood` field (e.g., "West Village", "Buckman", "Eliot") AND `properties.geocode.name` (same value). No need to compute neighborhoods — Qloo provides them.
2. **Coordinates ARE returned**: `properties.location.lat/lon` for both Search and Insights results. Maps will work directly.
3. **Rich metadata**: `primary_genre` (with URN), `specialty_dishes`, `good_for` tags, `description`, `hours`, `phone`, `website`, `price_level`, `image.url`, `is_closed`.
4. **External ratings**: Resy (rating, count, cuisine, `why_we_like_it` text!), TripAdvisor (rating, count), Michelin, Google Place ID.

## Surprises & Design Implications

1. **Resy `why_we_like_it`**: Some places have editorial text from Resy explaining why they're notable. We can display this as verified third-party description.

2. **Explainability structure differs from docs**: Actual format is `query.explainability.signal.interests.entities: [{entity_id, score}, ...]` — an array of {entity_id, score} objects, not a flat map. The aggregate uses `effect_on_top3_recs`, `effect_on_top5_recs`, etc. with `avg_score`.

3. **`entity_id` not `id`**: Search and Insights both use `entity_id` as the ID field name (not `id` as docs examples suggested).

4. **`filter.geocode.admin1_region` expects full state name**: "Oregon" not "OR". Or use `filter.location.query` which does fuzzy matching on city name.

5. **Cross-domain works**: Can seed with artists/movies and get place recommendations.

6. **`/search` uses miles for radius, `/v2/insights` uses meters**: Different units.

7. **POST variant available for `/v2/insights`**: Supports `signal.interests.entities.query` for inline name resolution.

8. **Max 50 per page for insights, 199 for search**: Plenty for our use case.

## Recommended API Flow for Taste Transplant

```
1. User enters "Blue Bottle Coffee, San Francisco"
   → GET /search?query=Blue+Bottle+Coffee&types=urn:entity:place
       &filter.location=37.7749,-122.4194&filter.radius=25
   → Returns entity_id, name, neighborhood, coordinates, genre, description
   → Show disambiguation if multiple results

2. Repeat for all 3-5 seed places

3. User enters destination "Portland"
   → GET /v2/insights?filter.type=urn:entity:place
       &signal.interests.entities=ID1,ID2,ID3,ID4,ID5
       &filter.location.query=Portland
       &feature.explainability=true
       &take=50
   → Returns ranked places with:
     - affinity score (0-1)
     - explainability per seed entity (which of your places drove this match)
     - neighborhood name, coordinates, address
     - genre, description, price_level, good_for, specialty_dishes
     - Resy/TripAdvisor ratings

4. Group results by properties.neighborhood (already provided by Qloo!)
   → Score neighborhoods by count + mean affinity of top matches

5. LLM writes plan text using ONLY the returned data
   → Can reference: genre, good_for, specialty_dishes, description
   → Must cite affinity scores and seed-entity contribution honestly
```
