/**
 * File: src/lib/csv.ts
 * Purpose: CSV parsing and aggregation utilities for player statistics.
 */

import type { AggregatedStats, StatLine } from '../types';

/**
 * Parse CSV text where \\n delimits rows and columns are:
 * team,accountId,steals/turnovers,goals,assists,shots,pickups,passes,passes received,possession,shots allowed,saves,goalie time,skater time
 */
export function parseStatsCsv(text: string): StatLine[] {
  const lines = text
    .split(/\\n|\\r\\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: StatLine[] = [];
  for (const line of lines) {
    const cleaned = line.startsWith(',') ? line.slice(1) : line;
    const parts = cleaned.split(',').map((p) => p.trim());
    if (parts.length < 14) continue;

    const [
      team,
      accountId,
      stealsOrTurnovers,
      goals,
      assists,
      shots,
      pickups,
      passes,
      passesReceived,
      possession,
      shotsAllowed,
      saves,
      goalieTime,
      skaterTime,
    ] = parts;

    rows.push({
      team: String(team),
      accountId: String(accountId),
      stealsOrTurnovers: toNum(stealsOrTurnovers),
      goals: toNum(goals),
      assists: toNum(assists),
      shots: toNum(shots),
      pickups: toNum(pickups),
      passes: toNum(passes),
      passesReceived: toNum(passesReceived),
      possession: parseFloat(String(possession)),
      shotsAllowed: toNum(shotsAllowed),
      saves: toNum(saves),
      goalieTime: toNum(goalieTime),
      skaterTime: toNum(skaterTime),
    });
  }
  return rows;
}

/**
 * Aggregate stat lines by accountId and sum numeric fields.
 */
export function aggregateStats(lines: StatLine[]): Map<string, AggregatedStats> {
  const map = new Map<string, AggregatedStats>();
  for (const l of lines) {
    const prev = map.get(l.accountId);
    if (!prev) {
      map.set(l.accountId, { ...l, entries: 1 });
    } else {
      map.set(l.accountId, {
        team: l.team,
        accountId: l.accountId,
        stealsOrTurnovers: prev.stealsOrTurnovers + l.stealsOrTurnovers,
        goals: prev.goals + l.goals,
        assists: prev.assists + l.assists,
        shots: prev.shots + l.shots,
        pickups: prev.pickups + l.pickups,
        passes: prev.passes + l.passes,
        passesReceived: prev.passesReceived + l.passesReceived,
        possession: round(prev.possession + l.possession, 2),
        shotsAllowed: prev.shotsAllowed + l.shotsAllowed,
        saves: prev.saves + l.saves,
        goalieTime: prev.goalieTime + l.goalieTime,
        skaterTime: prev.skaterTime + l.skaterTime,
        entries: prev.entries + 1,
      });
    }
  }
  return map;
}

/** Round to decimals */
function round(n: number, d = 2): number {
  const m = Math.pow(10, d);
  return Math.round(n * m) / m;
}

/** Convert to integer if possible, else 0 */
function toNum(v: string | number): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
