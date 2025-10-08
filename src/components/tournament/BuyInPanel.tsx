/**
 * File: src/components/tournament/BuyInPanel.tsx
 * Purpose: Allow eligible players to buy-in and become team owners up to the team limit.
 */

import React, { useMemo } from 'react';
import type { Owner, Player } from '../../types';
import { Button } from '../ui/button';

/**
 * BuyInPanelProps
 * - players: all app players
 * - owners: current owners/teams
 * - teamCount: maximum number of teams allowed
 * - buyInAmount: cost to become an owner (also used as starting budget)
 * - setOwners: setter to add new owners
 * - setPlayers: setter to deduct wallets on buy-in
 */
interface BuyInPanelProps {
  players: Player[];
  owners: Owner[];
  teamCount: number;
  buyInAmount: number;
  setOwners: (updater: Owner[] | ((prev: Owner[]) => Owner[])) => void;
  setPlayers: (updater: Player[] | ((prev: Player[]) => Player[])) => void;
}

/**
 * BuyInPanel
 * Lists eligible players (not already owners). Each can buy in if they have enough wallet
 * and the team cap hasn't been reached.
 */
export function BuyInPanel({
  players,
  owners,
  teamCount,
  buyInAmount,
  setOwners,
  setPlayers,
}: BuyInPanelProps) {
  const ownerIds = useMemo(() => new Set(owners.map((o) => o.id)), [owners]);

  /** Compute a unique team name like "Team N" */
  function nextTeamName(existing: string[]): string {
    let n = 1;
    while (existing.includes(`Team ${n}`)) n++;
    return `Team ${n}`;
  }

  /** Perform a buy-in: deduct wallet and create owner entry if capacity allows */
  function handleBuyIn(player: Player) {
    if (owners.length >= teamCount) return;
    if (ownerIds.has(player.id)) return;
    if (player.wallet < buyInAmount) return;

    // Deduct wallet
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, wallet: p.wallet - buyInAmount } : p))
    );

    // Add owner
    setOwners((prev) => {
      const existingNames = prev.map((o) => o.teamName);
      const teamName = nextTeamName(existingNames);
      const newOwner: Owner = {
        id: player.id,
        name: player.name,
        wallet: player.wallet - buyInAmount, // reflect post-buy-in wallet locally
        teamName,
        playerIds: [],
        budget: buyInAmount, // starting budget equals buy-in
      };
      return [...prev, newOwner];
    });
  }

  const eligible = players.filter((p) => !ownerIds.has(p.id));
  const capacityLeft = Math.max(0, teamCount - owners.length);

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-400">
        Owners: <span className="text-cyan-300 font-medium">{owners.length}</span> / {teamCount}{' '}
        • Capacity left: <span className="text-cyan-300 font-medium">{capacityLeft}</span>
      </div>
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
        {eligible.map((p) => {
          const canBuyIn = capacityLeft > 0 && p.wallet >= buyInAmount;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700"
            >
              <div>
                <div className="text-slate-100 font-medium">{p.name}</div>
                <div className="text-slate-400 text-sm">Wallet: ${p.wallet}</div>
              </div>
              <Button
                variant="outline"
                className="bg-transparent border-slate-600 text-slate-300"
                disabled={!canBuyIn}
                onClick={() => handleBuyIn(p)}
                title={
                  capacityLeft === 0
                    ? 'Team capacity reached'
                    : p.wallet < buyInAmount
                    ? 'Insufficient wallet to buy in'
                    : 'Buy in and become an owner'
                }
              >
                Buy In (${buyInAmount})
              </Button>
            </div>
          );
        })}
        {eligible.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-4">Everyone is already an owner</div>
        )}
      </div>
    </div>
  );
}
