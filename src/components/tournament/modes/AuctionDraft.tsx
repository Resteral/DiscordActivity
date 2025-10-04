/**
 * File: src/components/tournament/modes/AuctionDraft.tsx
 * Purpose: Basic auction draft flow where owners bid on each player until rosters are filled.
 */

import React, { useMemo, useState } from 'react';
import type { Owner, Player } from '../../../types';

/**
 * AuctionDraft: owners increment bids; highest wins and budget decreases.
 * Simplified for client-side demo.
 */
export function AuctionDraft({
  owners,
  players,
  onComplete,
}: {
  owners: Owner[];
  players: Player[];
  onComplete: (assignments: { [teamName: string]: string[] }) => void;
}) {
  const [rosterSize, setRosterSize] = useState<number>(3);
  const [index, setIndex] = useState<number>(0);
  const [bids, setBids] = useState<{ [ownerTeam: string]: number }>({});
  const [won, setWon] = useState<{ [ownerTeam: string]: string[] }>({});
  const taken = new Set(Object.values(won).flat());

  const candidates = players.filter((p) => !owners.some((o) => o.id === p.id) && !taken.has(p.id));
  const current = candidates[index];

  const canFinish = useMemo(() => {
    return owners.every((o) => (won[o.teamName]?.length ?? 0) >= rosterSize);
  }, [owners, rosterSize, won]);

  function bid(ownerTeam: string, step = 10) {
    const o = owners.find((x) => x.teamName === ownerTeam);
    const currentBid = bids[ownerTeam] ?? 0;
    const max = (o?.budget ?? 0);
    if (currentBid + step > max) return;
    setBids((prev) => ({ ...prev, [ownerTeam]: (prev[ownerTeam] ?? 0) + step }));
  }

  function award() {
    if (!current) return;
    const entries = Object.entries(bids);
    if (entries.length === 0) return;
    const [winnerTeam, price] = entries.sort((a, b) => b[1] - a[1])[0];

    setWon((prev) => ({
      ...prev,
      [winnerTeam]: [...(prev[winnerTeam] ?? []), current.id],
    }));
    // decrease budget
    owners.forEach((o) => {
      if (o.teamName === winnerTeam) o.budget = Math.max(0, (o.budget ?? 0) - price);
    });

    // next candidate
    setBids({});
    setIndex((i) => Math.min(i + 1, Math.max(0, candidates.length - 1)));
  }

  function finish() {
    onComplete(won);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Roster size:</label>
        <input
          type="number"
          min={1}
          max={6}
          value={rosterSize}
          onChange={(e) => setRosterSize(parseInt(e.target.value || '3', 10))}
          className="border rounded px-2 py-1 text-sm w-24"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border p-2">
          <div className="font-medium mb-2">On the block</div>
          {current ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{current.name}</div>
                <div className="text-slate-600 text-sm">Elo {current.elo}</div>
              </div>
              <div className="text-sm text-slate-600">#{index + 1} / {candidates.length}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No candidates.</div>
          )}
          <div className="mt-3 space-y-2">
            {owners.map((o) => (
              <div key={o.teamName} className="flex items-center justify-between">
                <div className="text-sm">{o.teamName} <span className="text-slate-500">({o.name})</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Budget: {o.budget}</span>
                  <button
                    disabled={!current}
                    onClick={() => bid(o.teamName, 10)}
                    className="px-2 py-1 rounded border text-xs"
                  >
                    Bid +10
                  </button>
                  <span className="text-sm font-medium">{bids[o.teamName] ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            disabled={!current || Object.keys(bids).length === 0}
            onClick={award}
            className="mt-3 px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
          >
            Award
          </button>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {owners.map((o) => (
            <div key={o.teamName} className="rounded border p-2">
              <div className="font-medium">{o.teamName}</div>
              <ul className="mt-2 text-sm space-y-1">
                {(won[o.teamName] ?? []).map((id) => (
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
        disabled={!canFinish}
        onClick={finish}
        className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
      >
        Complete Draft
      </button>
    </div>
  );
}
