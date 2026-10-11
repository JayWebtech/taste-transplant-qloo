import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/qloo";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const results = await searchPlaces(
      query,
      lat ? parseFloat(lat) : 40.7128,
      lon ? parseFloat(lon) : -74.006,
      lat ? 25 : 100
    );

    const simplified = results.slice(0, 8).map((r) => ({
      entity_id: r.entity_id,
      name: r.name,
      address: r.properties.address,
      neighborhood: r.properties.neighborhood || r.properties.geocode?.name,
      genre: r.properties.primary_genre?.name,
      description: r.properties.description,
      image_url: r.properties.image?.url || r.properties.images?.[0]?.url,
    }));

    return NextResponse.json({ results: simplified });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
