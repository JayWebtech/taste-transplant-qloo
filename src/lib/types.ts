export interface QlooSearchResult {
  name: string;
  entity_id: string;
  types: string[];
  properties: {
    address?: string;
    description?: string;
    business_rating?: number;
    neighborhood?: string;
    is_closed?: boolean;
    price_level?: number;
    phone?: string;
    website?: string;
    image?: { url: string };
    images?: { url: string }[];
    location?: { lat: number; lon: number };
    geocode?: QlooGeocode;
    primary_genre?: QlooTag;
    good_for?: QlooTag[];
    specialty_dishes?: QlooTag[];
    hours?: Record<string, { opens: string; closes: string; closed: boolean }[]>;
    external?: {
      resy?: {
        rating?: number;
        rating_count?: number;
        cuisine?: string;
        why_we_like_it?: string;
        url?: string;
        neighborhood?: string;
      };
      tripadvisor?: { rating?: number; rating_count?: number };
      michelin?: { id?: string };
      google_place?: { place_id?: string };
    };
  };
}

export interface QlooGeocode {
  name?: string;
  city?: string;
  admin1_region?: string;
  admin2_region?: string;
  country_code?: string;
  country?: string;
  metro?: string;
  latitude?: number;
  longitude?: number;
}

export interface QlooTag {
  id: string;
  name: string;
  type?: string;
  weight?: number;
}

export interface QlooInsightEntity {
  name: string;
  entity_id: string;
  type: string;
  subtype?: string;
  properties: QlooSearchResult["properties"];
  query?: {
    affinity?: number;
    affinity_rank?: number;
    explainability?: {
      "signal.interests.entities"?: Array<{
        entity_id: string;
        score: number;
      }>;
    };
  };
}

export interface QlooInsightsResponse {
  success: boolean;
  results: {
    entities: QlooInsightEntity[];
    duration?: number;
    page?: number;
    total?: number;
  };
  query?: {
    localities?: {
      filter?: Array<{
        entity_id: string;
        name: string;
        subtype?: string;
        location?: { lat: number; lon: number };
        popularity?: number;
        disambiguation?: string;
      }>;
    };
    explainability?: {
      "signal.interests.entities"?: {
        effect_on_top3_recs?: Array<{ entity_id: string; avg_score: number }>;
        effect_on_top5_recs?: Array<{ entity_id: string; avg_score: number }>;
        effect_on_all_recs?: Array<{ entity_id: string; avg_score: number }>;
      };
    };
  };
  warnings?: Array<{ type: string }>;
}

export interface SeedPlace {
  name: string;
  entity_id: string;
  neighborhood?: string;
  genre?: string;
  description?: string;
  image_url?: string;
  lat?: number;
  lon?: number;
  address?: string;
}

export interface MatchedPlace {
  name: string;
  entity_id: string;
  affinity: number;
  neighborhood: string;
  genre: string;
  description: string;
  image_url?: string;
  lat: number;
  lon: number;
  address: string;
  price_level?: number;
  seed_contributions: Array<{
    seed_entity_id: string;
    seed_name: string;
    score: number;
  }>;
  good_for?: string[];
  specialty_dishes?: string[];
  resy_why?: string;
  external_ratings?: {
    resy?: { rating: number; count: number };
    tripadvisor?: { rating: number; count: number };
    michelin?: boolean;
  };
  source: "qloo";
}

export interface Neighborhood {
  name: string;
  places: MatchedPlace[];
  score: number;
  center_lat: number;
  center_lon: number;
  place_count: number;
}

export interface AgentResult {
  seeds: SeedPlace[];
  matches: MatchedPlace[];
  neighborhoods: Neighborhood[];
  destination: string;
  destination_disambiguation?: string;
  plan_text?: string;
  seeds_resolved: number;
  seeds_attempted: number;
  warnings: string[];
}

export interface BaselineResult {
  places: Array<{
    name: string;
    description: string;
    neighborhood: string;
    verified: boolean;
    verification_note: string;
  }>;
  plan_text: string;
}

export interface VoteRecord {
  timestamp: number;
  winner: "qloo" | "baseline";
}
