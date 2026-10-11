import { NextRequest, NextResponse } from "next/server";
import { recordVote, getVoteStats } from "@/lib/votes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { winner } = body as { winner: "qloo" | "baseline" };

  if (winner !== "qloo" && winner !== "baseline") {
    return NextResponse.json({ error: "Invalid winner" }, { status: 400 });
  }

  recordVote(winner);
  return NextResponse.json({ ok: true, stats: getVoteStats() });
}

export async function GET() {
  return NextResponse.json(getVoteStats());
}
