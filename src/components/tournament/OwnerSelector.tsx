/**
 * File: src/components/tournament/OwnerSelector.tsx
 * Purpose: Host-facing owner selection list to pick captains/owners for teams before draft.
 */

import React from 'react';
import type { Player } from '../../types';

/**
 * OwnerSelectorProps
 * - players: full player list to choose from
 * - selectedIds: currently selected owner player IDs
 * - onToggle: toggle a player in/out of owner selection
 * - teamCount: required number of owners (used to cap selection)
 */
interface OwnerSelectorProps {
  players: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  teamCount: number;
}

/**
 * OwnerSelector
 * Provides a checkbox list with a selection cap of teamCount.
 */
export function OwnerSelector({ players, selectedIds, onToggle, teamCount }: OwnerSelectorProps) {
  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {players.map((p) => {
        const checked = selectedIds.includes(p.id);
        const capReached = selectedCount >= teamCount && !checked;
        return (
          <label
            key={p.id}
            className={`flex items-center justify-between gap-3 p-2 rounded-lg border ${
              checked ? 'bg-slate-800/60 border-slate-600' : 'bg-slate-800/40 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                aria-label={`Select ${p.name} as owner`}
                type="checkbox"
                className="h-4 w-4 accent-cyan-500"
                checked={checked}
                disabled={capReached}
                onChange={() => onToggle(p.id)}
              />
              <div>
                <div className="text-slate-100 font-medium">{p.name}</div>
                <div className="text-slate-400 text-sm">Elo: {p.elo} • Wallet: ${p.wallet}</div>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                checked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {checked ? 'Selected' : capReached ? 'Full' : 'Available'}
            </span>
          </label>
        );
      })}
      {players.length === 0 && (
        <div className="text-sm text-slate-500 py-6 text-center">No players available</div>
      )}
    </div>
  );
}
