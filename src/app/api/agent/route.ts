import { NextRequest, NextResponse } from "next/server";
import { runAgent, runBaseline } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      places,
      origin_city,
      destination,
      include_baseline,
    }: {
      places: string[];
      origin_city: string;
      destination: string;
      include_baseline?: boolean;
    } = body;

    if (!places?.length || !origin_city || !destination) {
      return NextResponse.json(
        { error: "Missing required fields: places, origin_city, destination" },
        { status: 400 }
      );
    }

    if (places.length < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 places" },
        { status: 400 }
      );
    }

    if (places.length > 7) {
      return NextResponse.json(
        { error: "Maximum 7 places allowed" },
        { status: 400 }
      );
    }

    const [agentResult, baselineResult] = await Promise.all([
      runAgent(places, origin_city, destination),
      include_baseline
        ? runBaseline(places, origin_city, destination)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      qloo: agentResult,
      baseline: baselineResult,
    });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent failed" },
      { status: 500 }
    );
  }
}
