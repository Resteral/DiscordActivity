/**
 * File: src/components/layout/TopBar.tsx
 * Purpose: Global top bar with app title, quick anchors, and connected user's wallet at top-right.
 */

import React, { useMemo } from 'react';
import type { Player } from '../../types';

/**
 * TopBar shows app brand, quick navigation anchors, and the connected user's wallet balance.
 */
export default function TopBar({
  connectedId,
  players,
}: {
  connectedId: string | null;
  players: Player[];
}) {
  const current = useMemo(
    () => players.find((p) => p.id === connectedId) || null,
    [players, connectedId]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          <span className="font-semibold text-slate-100">ZH Arena</span>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a href="#lobbies" className="text-slate-300 hover:text-white transition-colors">Matchmaking</a>
          <a href="#tournaments" className="text-slate-300 hover:text-white transition-colors">Tournaments</a>
          <a href="#stats" className="text-slate-300 hover:text-white transition-colors">Stats</a>
          <a href="#discord" className="text-slate-300 hover:text-white transition-colors">Discord</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {current ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">{current.name}</span>
              <span
                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-xs"
                title="Wallet balance"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                  <path d="M21 7H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18V7Zm-2 6h-5a1 1 0 1 1 0-2h5v2Z" />
                </svg>
                {current.wallet}
              </span>
            </div>
          ) : (
            <a
              href="#lobbies"
              className="text-xs md:text-sm rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 px-2 py-1 text-slate-300"
            >
              Connect account below
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
