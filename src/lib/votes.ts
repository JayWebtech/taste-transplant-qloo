import type { VoteRecord } from "./types";

const votes: VoteRecord[] = [];

export function recordVote(winner: "qloo" | "baseline") {
  votes.push({ timestamp: Date.now(), winner });
}

export function getVoteStats() {
  const qlooWins = votes.filter((v) => v.winner === "qloo").length;
  const baselineWins = votes.filter((v) => v.winner === "baseline").length;
  const total = votes.length;
  return {
    total,
    qloo_wins: qlooWins,
    baseline_wins: baselineWins,
    qloo_win_rate: total > 0 ? Math.round((qlooWins / total) * 100) : 0,
    baseline_win_rate: total > 0 ? Math.round((baselineWins / total) * 100) : 0,
  };
}
