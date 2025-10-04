/**
 * File: src/components/tournament/TournamentManager.tsx
 * Purpose: Manage tournament setup with owner selection, snake/auction draft, betting, and live bracket.
 */

import React, { useMemo, useState } from 'react';
import type { Bet, DraftMode, Owner, Player } from '../../types';
import { SnakeDraft } from './modes/SnakeDraft';
import { AuctionDraft } from './modes/AuctionDraft';
import { Bracket } from './bracket/Bracket';

/**
 * TournamentManager: wraps owners, draft mode switch, betting, and bracket controls.
 */
export function TournamentManager({
  players,
  setPlayers,
}: {
  players: Player[];
  setPlayers: (next: Player[] | ((p: Player[]) => Player[])) => void;
}) {
  const [mode, setMode] = useState<DraftMode>('snake');
  const [ownerCount, setOwnerCount] = useState<number>(4);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [teams, setTeams] = useState<{ [teamName: string]: string[] }>({}); // teamName -> playerIds

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  function createOwnersManual(ids: string[]) {
    const selected = ids.slice(0, ownerCount);
    setOwners(
      selected.map((id, i) => ({
        id,
        name: playerMap.get(id)?.name ?? id,
        wallet: playerMap.get(id)?.wallet ?? 0,
        teamName: `Team ${i + 1}`,
        playerIds: [],
        budget: 200,
      }))
    );
  }

  function createOwnersRandom() {
    const shuffled = [...players].sort(() => Math.random() - 0.5).slice(0, ownerCount);
    setOwners(
      shuffled.map((p, i) => ({
        id: p.id,
        name: p.name,
        wallet: p.wallet,
        teamName: `Team ${i + 1}`,
        playerIds: [],
        budget: 200,
      }))
    );
  }

  function buyOwnerSpot(buyerId: string, cost = 200) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === buyerId && p.wallet >= cost ? { ...p, wallet: p.wallet - cost } : p))
    );
    setOwners((prev) => {
      if (prev.length >= ownerCount) return prev;
      const buyer = playerMap.get(buyerId);
      if (!buyer) return prev;
      return [
        ...prev,
        {
          id: buyerId,
          name: buyer.name,
          wallet: buyer.wallet - cost,
          teamName: `Team ${prev.length + 1}`,
          playerIds: [],
          budget: 200,
        },
      ];
    });
  }

  function onDraftComplete(assignments: { [teamName: string]: string[] }) {
    setTeams(assignments);
  }

  function placeBet(bettorId: string, teamName: string, amount: number) {
    const bettor = playerMap.get(bettorId);
    if (!bettor || bettor.wallet < amount || amount <= 0) return;
    setPlayers((prev) =>
      prev.map((p) => (p.id === bettorId ? { ...p, wallet: p.wallet - amount } : p))
    );
    setBets((prev) => [...prev, { bettorId, teamName, amount }]);
  }

  /** Distribute winnings proportionally to bettors who bet on champion. */
  function settleBets(championTeam: string) {
    const pool = bets.reduce((s, b) => s + b.amount, 0);
    const winners = bets.filter((b) => b.teamName === championTeam);
    const winnersSum = winners.reduce((s, b) => s + b.amount, 0);
    if (winnersSum <= 0) return;

    setPlayers((prev) =>
      prev.map((p) => {
        const wBet = winners.filter((b) => b.bettorId === p.id).reduce((s, b) => s + b.amount, 0);
        if (wBet <= 0) return p;
        const payout = Math.floor((wBet / winnersSum) * pool);
        return { ...p, wallet: p.wallet + payout };
      })
    );
    setBets([]);
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">Draft mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as DraftMode)}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="snake">Snake Draft</option>
          <option value="auction">Auction Draft</option>
        </select>

        <label className="text-sm ml-4">Teams:</label>
        <input
          type="number"
          min={2}
          max={8}
          value={ownerCount}
          onChange={(e) => setOwnerCount(parseInt(e.target.value || '2', 10))}
          className="border rounded-md px-2 py-1 text-sm w-20"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-2">Owners</div>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1">
                {p.name} <span className="text-slate-500">({p.wallet})</span>
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={createOwnersRandom}
              className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
            >
              Random owners
            </button>
            <OwnerSelect players={players} onConfirm={createOwnersManual} ownerCount={ownerCount} />
            <BuyOwner owners={owners} players={players} buy={buyOwnerSpot} ownerCount={ownerCount} />
          </div>
          <div className="mt-3 space-y-2">
            {owners.map((o, i) => (
              <div key={o.id} className="flex justify-between text-sm border rounded px-2 py-1">
                <span>{o.teamName}</span>
                <span>{o.name} <span className="text-slate-500">({o.wallet})</span></span>
              </div>
            ))}
            {owners.length === 0 && <div className="text-sm text-slate-500">No owners yet.</div>}
          </div>
        </div>

        <div className="rounded-lg border p-3 md:col-span-2">
          {mode === 'snake' ? (
            <SnakeDraft owners={owners} players={players} onComplete={onDraftComplete} />
          ) : (
            <AuctionDraft owners={owners} players={players} onComplete={onDraftComplete} />
          )}
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="font-medium mb-2">Betting Market</div>
        <BettingPanel players={players} owners={owners} bets={bets} onBet={placeBet} />
      </div>

      <div className="rounded-lg border p-3">
        <div className="font-medium mb-2">Live Bracket</div>
        <Bracket teams={teams} onChampion={settleBets} />
      </div>
    </div>
  );
}

/** Owner selection control for manual selection */
function OwnerSelect({
  players,
  onConfirm,
  ownerCount,
}: {
  players: Player[];
  onConfirm: (ids: string[]) => void;
  ownerCount: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`px-2 py-1 rounded border text-xs ${selected.includes(p.id) ? 'bg-amber-100 border-amber-300' : 'bg-white hover:bg-slate-50'}`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => onConfirm(selected)}
        className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
      >
        Set owners ({selected.length}/{ownerCount})
      </button>
    </div>
  );
}

/** Buy owner spot using wallet balance */
function BuyOwner({
  owners,
  players,
  buy,
  ownerCount,
}: {
  owners: Owner[];
  players: Player[];
  buy: (buyerId: string, cost?: number) => void;
  ownerCount: number;
}) {
  const [buyerId, setBuyerId] = useState<string>('');
  const [cost, setCost] = useState<number>(200);
  return (
    <div className="flex items-center gap-2">
      <select
        value={buyerId}
        onChange={(e) => setBuyerId(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Select buyer</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.wallet})
          </option>
        ))}
      </select>
      <input
        type="number"
        value={cost}
        onChange={(e) => setCost(parseInt(e.target.value || '200', 10))}
        className="border rounded px-2 py-1 text-sm w-24"
      />
      <button
        disabled={!buyerId || owners.length >= ownerCount}
        onClick={() => buy(buyerId, cost)}
        className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
      >
        Buy owner spot
      </button>
    </div>
  );
}

/** Simple betting panel */
function BettingPanel({
  players,
  owners,
  bets,
  onBet,
}: {
  players: Player[];
  owners: Owner[];
  bets: Bet[];
  onBet: (bettorId: string, teamName: string, amount: number) => void;
}) {
  const [bettorId, setBettorId] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);

  const pool = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={bettorId} onChange={(e) => setBettorId(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">Select bettor</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.wallet})</option>
          ))}
        </select>
        <select value={teamName} onChange={(e) => setTeamName(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">Select team</option>
          {owners.map((o) => (
            <option key={o.teamName} value={o.teamName}>{o.teamName} ({o.name})</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || '1', 10))}
          className="border rounded px-2 py-1 text-sm w-24"
        />
        <button
          disabled={!bettorId || !teamName}
          onClick={() => onBet(bettorId, teamName, amount)}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
        >
          Place bet
        </button>
      </div>
      <div className="text-sm text-slate-600">Pool: {pool}</div>
      <div className="text-sm">
        {bets.length === 0 ? (
          <span className="text-slate-500">No bets yet.</span>
        ) : (
          <ul className="list-disc ml-5 space-y-1">
            {bets.map((b, i) => (
              <li key={i}>
                <span className="text-slate-700">{players.find((p) => p.id === b.bettorId)?.name ?? b.bettorId}</span> bet <b>{b.amount}</b> on <b>{b.teamName}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-slate-500">Bets settle automatically when a champion is selected in the bracket.</p>
    </div>
  );
}
