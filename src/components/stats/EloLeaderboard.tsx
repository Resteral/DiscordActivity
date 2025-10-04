/**
 * File: src/components/stats/EloLeaderboard.tsx
 * Purpose: Dedicated Elo MMR leaderboard for ranking players by rating.
 */

import React, { useMemo } from 'react';
import type { Player } from '../../types';

/**
 * EloLeaderboard lists the top players by Elo MMR.
 */
export function EloLeaderboard({ players, limit = 20 }: { players: Player[]; limit?: number }) {
  const rows = useMemo(() => {
    return [...players].sort((a, b) => b.elo - a.elo).slice(0, limit);
  }, [players, limit]);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur p-4">
      <div className="font-semibold text-slate-100 mb-2">Elo MMR Leaderboard</div>
      <ol className="space-y-1">
        {rows.length === 0 && <li className="text-slate-400 text-sm">No players yet.</li>}
        {rows.map((p, i) => (
          <li key={p.id} className="flex justify-between text-sm text-slate-100">
            <span className="text-slate-300">{i + 1}.</span>
            <span className="flex-1 ml-2">{p.name}</span>
            <span className="font-semibold text-cyan-400">{p.elo}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default EloLeaderboard;
