/**
 * File: src/components/tournament/modes/SnakeDraft.tsx
 * Purpose: Snake draft implementation for owners selecting players in serpentine order.
 */

import React, { useMemo, useState } from 'react';
import type { Owner, Player } from '../../../types';

/**
 * SnakeDraft: provides serpentine draft with dynamic order and team assignments.
 */
export function SnakeDraft({
  owners,
  players,
  onComplete,
}: {
  owners: Owner[];
  players: Player[];
  onComplete: (assignments: { [teamName: string]: string[] }) => void;
}) {
  const [rounds, setRounds] = useState<number>(3); // players per team
  const [picks, setPicks] = useState<{ [team: string]: string[] }>({});
  const taken = new Set(Object.values(picks).flat());

  const ownerOrder = useMemo(() => owners.map((o) => o.teamName), [owners]);

  const available = players.filter((p) => !owners.some((o) => o.id === p.id) && !taken.has(p.id));

  function currentPicker(): string | undefined {
    const totalPicks = Object.values(picks).reduce((s, arr) => s + arr.length, 0);
    const round = Math.floor(totalPicks / owners.length);
    const index = totalPicks % owners.length;
    const forward = round % 2 === 0;
    const order = forward ? ownerOrder : [...ownerOrder].reverse();
    return order[index];
  }

  function pick(playerId: string) {
    const team = currentPicker();
    if (!team) return;
    setPicks((prev) => {
      const arr = prev[team] ?? [];
      if (arr.length >= rounds) return prev;
      return { ...prev, [team]: [...arr, playerId] };
    });
  }

  function finish() {
    onComplete(picks);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Players per team:</label>
        <input
          type="number"
          min={1}
          max={6}
          value={rounds}
          onChange={(e) => setRounds(parseInt(e.target.value || '3', 10))}
          className="border rounded px-2 py-1 text-sm w-24"
        />
        <div className="text-sm text-slate-600">Current: <b>{currentPicker() ?? '—'}</b></div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border p-2">
          <div className="font-medium mb-2">Available</div>
          <div className="flex flex-wrap gap-2">
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                className="px-2 py-1 rounded border text-xs bg-white hover:bg-slate-50"
              >
                {p.name} <span className="text-slate-500">({p.elo})</span>
              </button>
            ))}
            {available.length === 0 && <div className="text-sm text-slate-500">No players available</div>}
          </div>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {owners.map((o) => (
            <div key={o.teamName} className="rounded border p-2">
              <div className="font-medium">{o.teamName}</div>
              <ul className="mt-2 text-sm space-y-1">
                {(picks[o.teamName] ?? []).map((id) => (
                  <li key={id} className="flex justify-between">
                    <span>{players.find((p) => p.id === id)?.name ?? id}</span>
                    <span className="text-slate-500">{players.find((p) => p.id === id)?.elo ?? ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={finish}
        className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
      >
        Complete Draft
      </button>
    </div>
  );
}
