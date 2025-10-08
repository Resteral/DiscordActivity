/**
 * File: src/types.ts
 * Purpose: Shared TypeScript types for players, stats, lobbies, drafts, tournaments, and betting.
 */

export interface StatLine {
  /** Team number or identifier from CSV */
  team: string;
  /** Unique account id string */
  accountId: string;
  /** Steals or turnovers metric (can be negative in source data) */
  stealsOrTurnovers: number;
  /** Goals scored */
  goals: number;
  /** Assists made */
  assists: number;
  /** Shots taken */
  shots: number;
  /** Puck pickups */
  pickups: number;
  /** Passes made */
  passes: number;
  /** Passes received */
  passesReceived: number;
  /** Possession time or index (float) */
  possession: number;
  /** Shots allowed */
  shotsAllowed: number;
  /** Saves made */
  saves: number;
  /** Goalie time in seconds */
  goalieTime: number;
  /** Skater time in seconds */
  skaterTime: number;
}

export interface AggregatedStats extends StatLine {
  /** Number of rows combined to produce this aggregate */
  entries: number;
}

export interface Player {
  /** Stable identifier for player; sourced from CSV `accountId` or generated */
  id: string;
  /** Display name (fallback to accountId) */
  name: string;
  /** Elo rating */
  elo: number;
  /** Virtual wallet for buy-ins and betting */
  wallet: number;
  /** Optional aggregated stats */
  stats?: AggregatedStats;
}

export interface Team {
  name: string;
  playerIds: string[];
}

export interface MatchResult {
  /** Winner team name */
  winner: string;
  /** Loser team name */
  loser: string;
  /** Score in "X-Y" format or any text */
  score?: string;
}

export type DraftMode = 'snake' | 'auction';

export interface Owner {
  id: string;
  name: string;
  wallet: number;
  teamName: string;
  playerIds: string[];
  /** Remaining budget for auction */
  budget?: number;
}

export interface Bet {
  bettorId: string;
  teamName: string;
  amount: number;
}

export interface BracketNode {
  id: string;
  round: number;
  teamA?: string;
  teamB?: string;
  winner?: string;
  score?: string;
  nextId?: string;
}

/** Clan System Types */
export interface Clan {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  memberIds: string[];
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  createdAt: Date;
  color: string;
}

export interface ClanMatch {
  id: string;
  clanAId: string;
  clanBId: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  scheduledTime?: Date;
  result?: {
    winnerClanId?: string;
    score?: string;
    isDraw?: boolean;
  };
  bets: ClanBet[];
  totalPool: number;
}

export interface ClanBet {
  bettorId: string;
  clanId: string;
  amount: number;
  placedAt: Date;
}
