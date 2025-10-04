/**
 * File: src/components/matchmaking/MatchResultsCsvUploader.tsx
 * Purpose: CSV paste component for submitting match results to update stats AND Elo/team outcomes.
 * Features:
 * - Appears after match results are reported.
 * - Uses same CSV format as stats uploader.
 * - Updates player statistics immediately (via onStatsUpdate).
 * - Infers winner by summing team goals from CSV and applies Elo change to all listed players.
 * - Provides success/error feedback.
 */

import React, { useState } from 'react';
import { parseStatsCsv, aggregateStats } from '../../lib/csv';
import type { AggregatedStats, Player } from '../../types';
import { updateTeamElo } from '../../lib/elo';

interface MatchResultsCsvUploaderProps {
  players: Player[];
  /** Update aggregated stats in parent */
  onStatsUpdate: (agg: Map<string, AggregatedStats>) => void;
  /** Apply Elo and add new players if not present */
  setPlayers: (next: Player[] | ((p: Player[]) => Player[])) => void;
  /** Match type for UI label */
  matchType: 'public' | 'pro';
}

/**
 * MatchResultsCsvUploader: Component for pasting match results CSV to update player statistics and Elo.
 */
export function MatchResultsCsvUploader({
  players,
  onStatsUpdate,
  setPlayers,
  matchType,
}: MatchResultsCsvUploaderProps) {
  const [text, setText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sample CSV represents 4v4 per team with per-player metrics
  const sample = String.raw`,1,1-S2-1-6820063,8,2,0,7,35,17,16,1.32,0,0,0,719
,1,1-S2-1-10300134,1,1,1,4,33,16,22,1.13,0,0,0,719
,1,1-S2-1-4122701,5,1,0,1,28,12,11,0.45,0,0,0,719
,1,1-S2-1-1520631,0,0,1,1,8,9,5,0.42,9,7,696,23
,2,1-S2-1-6347815,2,0,0,2,34,19,11,0.63,0,0,0,719
,2,1-S2-1-4964615,0,0,0,0,12,7,4,0.75,12,8,672,42
,2,1-S2-1-4096795,-6,1,0,4,31,12,20,1.55,1,1,35,680
,2,1-S2-1-6218367,-10,1,1,3,34,14,17,1.17,0,0,0,715`;

  /**
   * Parse CSV, update stats, infer winner and apply Elo delta to team members.
   * - We infer teams from the `team` column, track goals per team, and decide winner by total goals.
   * - Elo is updated across all rows listed for each team (any team size supported).
   */
  const handleSubmit = async () => {
    if (!text.trim()) {
      setMessage({ type: 'error', text: 'Please paste CSV data first' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const lines = parseStatsCsv(text);
      if (lines.length === 0) {
        setMessage({ type: 'error', text: 'No valid CSV data found' });
        return;
      }

      // Aggregate and push to parent for stats
      const agg = aggregateStats(lines);
      onStatsUpdate(agg);

      // Build team groupings and goal totals from raw lines
      const teamIds = new Set<string>();
      const teamGoals = new Map<string, number>();
      const teamMembers = new Map<string, Set<string>>();

      for (const l of lines) {
        const t = String(l.team);
        teamIds.add(t);
        teamGoals.set(t, (teamGoals.get(t) || 0) + (l.goals || 0));
        if (!teamMembers.has(t)) teamMembers.set(t, new Set());
        teamMembers.get(t)!.add(l.accountId);
      }

      const teams = Array.from(teamIds);
      if (teams.length < 2) {
        setMessage({
          type: 'error',
          text: 'Need at least two teams in CSV to infer result.',
        });
        setIsSubmitting(false);
        return;
      }

      // Choose two teams with highest participant counts (fallback)
      const byCount = [...teams].sort(
        (a, b) => (teamMembers.get(b)?.size || 0) - (teamMembers.get(a)?.size || 0)
      );
      const tA = byCount[0];
      const tB = byCount[1];
      const goalsA = teamGoals.get(tA) || 0;
      const goalsB = teamGoals.get(tB) || 0;

      let winnerSide: 'A' | 'B' | null = null;
      if (goalsA > goalsB) winnerSide = 'A';
      else if (goalsB > goalsA) winnerSide = 'B';
      else winnerSide = null; // tie: do not change Elo

      // Collect ids for Elo update
      const aIds = Array.from(teamMembers.get(tA) || []);
      const bIds = Array.from(teamMembers.get(tB) || []);

      // Ensure unknown players are created before Elo update
      setPlayers((prev) => {
        const next = [...prev];
        const exists = new Set(prev.map((p) => p.id));
        [...aIds, ...bIds].forEach((id) => {
          if (!exists.has(id)) {
            next.push({
              id,
              name: id,
              elo: 1000,
              wallet: 1000,
            });
          }
        });
        return next;
      });

      // Apply Elo if there is a winner
      if (winnerSide) {
        setPlayers((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          const updated =
            winnerSide === 'A'
              ? updateTeamElo(aIds, bIds, map)
              : updateTeamElo(bIds, aIds, map);
          return prev.map((p) => updated.get(p.id) || p);
        });
      }

      setMessage({
        type: 'success',
        text:
          `Imported ${lines.length} rows • ` +
          `Teams ${tA}(${goalsA}) vs ${tB}(${goalsB})` +
          (winnerSide ? ` • Winner: ${winnerSide === 'A' ? tA : tB} (Elo updated)` : ' • Tie (no Elo change)'),
      });
      setText('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to parse CSV. Please check the format.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur p-4 space-y-3 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Submit Match Results</div>
        <span className="text-xs px-2 py-1 rounded bg-slate-800/60 text-slate-300">
          {matchType === 'public' ? 'Public Match' : 'Pro Match'}
        </span>
      </div>

      <p className="text-sm text-slate-400">
        Paste CSV stats from your match. We will update stats and apply Elo based on the inferred winner.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste match CSV stats here..."
        rows={4}
        className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim()}
          className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
        >
          {isSubmitting ? 'Importing...' : 'Import Match Stats'}
        </button>

        <button
          onClick={() => setText(sample)}
          className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 text-sm transition-colors"
        >
          Load Sample
        </button>
      </div>

      {message && (
        <div
          className={`text-sm p-2 rounded ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Format: team,accountId,steals/turnovers,goals,assists,shots,pickups,passes,passes received,possession,shots allowed,saves,goalie time,skater time
      </p>
    </div>
  );
}
