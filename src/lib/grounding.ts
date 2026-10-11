import type { MatchedPlace } from "./types";

export interface GroundingValidation {
  valid: boolean;
  violations: string[];
  verified_count: number;
  total_count: number;
}

export function validateGrounding(
  outputPlaces: Array<{ name: string; entity_id?: string }>,
  qlooResults: MatchedPlace[]
): GroundingValidation {
  const qlooIds = new Set(qlooResults.map((r) => r.entity_id));
  const violations: string[] = [];
  let verified = 0;

  for (const place of outputPlaces) {
    if (place.entity_id && qlooIds.has(place.entity_id)) {
      verified++;
    } else {
      violations.push(
        `"${place.name}" (id: ${place.entity_id || "none"}) is not in Qloo results — rejected`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    verified_count: verified,
    total_count: outputPlaces.length,
  };
}

export function filterToGroundedPlaces(
  places: MatchedPlace[],
  qlooEntityIds: Set<string>
): MatchedPlace[] {
  return places.filter((p) => qlooEntityIds.has(p.entity_id));
}
