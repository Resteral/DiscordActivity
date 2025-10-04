/**
 * File: src/lib/elo.ts
 * Purpose: Elo rating utilities for team-based results.
 */

import type { Player } from '../types';

/**
 * Compute expected score for player/team A vs B using Elo formula.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update Elo for two teams based on a single result.
 * - winnerIds: ids of players on winning team
 * - loserIds: ids of players on losing team
 * - players: player map (id -> Player), mutated ratings are returned via returned map
 * - k: K-factor
 */
export function updateTeamElo(
  winnerIds: string[],
  loserIds: string[],
  players: Map<string, Player>,
  k = 28
): Map<string, Player> {
  const winnerAvg =
    avg(winnerIds.map((id) => players.get(id)?.elo ?? 1000)) || 1000;
  const loserAvg = avg(loserIds.map((id) => players.get(id)?.elo ?? 1000)) || 1000;

  const expWin = expectedScore(winnerAvg, loserAvg);
  const expLose = 1 - expWin;

  // Team score: winner=1, loser=0
  const winDeltaTeam = k * (1 - expWin);
  const loseDeltaTeam = k * (0 - expLose);

  // Distribute delta evenly across team members
  const winPerPlayer = winDeltaTeam / winnerIds.length;
  const losePerPlayer = loseDeltaTeam / loserIds.length;

  const next = new Map(players);
  winnerIds.forEach((id) => {
    const p = next.get(id);
    if (p) next.set(id, { ...p, elo: Math.round(p.elo + winPerPlayer) });
  });
  loserIds.forEach((id) => {
    const p = next.get(id);
    if (p) next.set(id, { ...p, elo: Math.round(p.elo + losePerPlayer) });
  });

  return next;
}

/** Average of a numeric array */
function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
