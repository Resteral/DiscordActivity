/** 
 * File: src/components/lobby/PublicLobby.tsx
 * Purpose: Public lobby - auto-start when 8+ players are queued (no Ready system).
 * - When queue has 8 or more, start a 5s countdown and lock top 8 (by Elo) at 0.
 * - Result reporting updates Elo and resets lobby; shows confetti on report.
 * - Simple Betting Market: connected user can place pari-mutuel bets on Team A/B during countdown/live.
 * Visuals:
 * - Countdown badge, thin progress bar, pulsing "Match Live" badge,
 *   hover/press transitions for buttons, subtle team card hover, confetti burst on report.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Player } from '../../types';
import { updateTeamElo, expectedScore } from '../../lib/elo';
import ConfettiBurst from '../animations/ConfettiBurst';

interface PublicLobbyProps {
  players: Player[];
  setPlayers: (next: Player[] | ((p: Player[]) => Player[])) => void;
  requestJoinId?: string | null;
  onConsumeJoin?: () => void;
  onMatchReported?: () => void;
  /** Connected user id for betting/wallet UI */
  connectedId?: string | null;
}

/** Local bet structure for the lobby's pari-mutuel market */
interface LobbyBet {
  bettorId: string;
  side: 'A' | 'B';
  amount: number;
}

/**
 * PublicLobby: Queue first 8; no ready-check. Auto-starts when count >= 8.
 * Includes a simple betting market with pari-mutuel payouts when result is reported.
 */
export function PublicLobby({
  players,
  setPlayers,
  requestJoinId,
  onConsumeJoin,
  onMatchReported,
  connectedId,
}: PublicLobbyProps) {
  // Current queue (ids) and derived Player[] list
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const queue = queueIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];

  // Autostart and match state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [lockedTeamA, setLockedTeamA] = useState<Player[]>([]);
  const [lockedTeamB, setLockedTeamB] = useState<Player[]>([]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Betting market
  const [bets, setBets] = useState<LobbyBet[]>([]);
  const [betAmount, setBetAmount] = useState<number>(50);

  /** Explicit join request handler (one-shot) */
  useEffect(() => {
    if (!requestJoinId) return;
    const exists = players.some((p) => p.id === requestJoinId);
    const already = queueIds.includes(requestJoinId);
    if (exists && !already) {
      setQueueIds((prev) => [...prev, requestJoinId]);
    }
    onConsumeJoin?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestJoinId]);

  // Compute tentative balanced teams by alternating sorted Elo (snake) when not in progress
  const tentativeTeams = useMemo(() => {
    const sorted = [...queue].sort((a, b) => b.elo - a.elo).slice(0, 8);
    const a: Player[] = [];
    const b: Player[] = [];
    sorted.forEach((p, i) => {
      if (i % 2 === 0) a.push(p);
      else b.push(p);
    });
    return { teamA: a, teamB: b };
  }, [queue]);

  // Current teams are tentative unless match already started (locked)
  const teamA = inProgress ? lockedTeamA : tentativeTeams.teamA;
  const teamB = inProgress ? lockedTeamB : tentativeTeams.teamB;

  /** Toggle membership in the queue. Disabled during a live match. */
  function toggleQueue(id: string) {
    if (inProgress) return; // prevent changes during live match
    setQueueIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** Watch player count to start/stop countdown (requires 8 or more) */
  useEffect(() => {
    if (inProgress) return;
    if (queue.length >= 8 && countdown === null) {
      setCountdown(5); // 5-second autostart once enough players are queued
    }
    if (queue.length < 8 && countdown !== null) {
      setCountdown(null); // cancel countdown if fewer than 8
    }
  }, [queue.length, inProgress, countdown, queue]);

  /** Countdown ticker: at 0, lock teams and go live */
  useEffect(() => {
    if (countdown === null) return;

    const id = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return c;
        if (c <= 1) {
          // Lock the top 8 at this moment and start the match
          const sorted = [...queue].sort((a, b) => b.elo - a.elo).slice(0, 8);
          const a: Player[] = [];
          const b: Player[] = [];
          sorted.forEach((p, i) => {
            if (i % 2 === 0) a.push(p);
            else b.push(p);
          });
          setLockedTeamA(a);
          setLockedTeamB(b);
          setInProgress(true);
          return null;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [countdown, queue]);

  /** Place a bet for the connected user */
  function placeBet(side: 'A' | 'B') {
    if (!connectedId) return;
    if (betAmount <= 0) return;
    const bettor = players.find((p) => p.id === connectedId);
    if (!bettor || bettor.wallet < betAmount) return;

    // Deduct from wallet
    setPlayers((prev) =>
      prev.map((p) => (p.id === connectedId ? { ...p, wallet: p.wallet - betAmount } : p))
    );
    // Record bet
    setBets((prev) => [...prev, { bettorId: connectedId, side, amount: betAmount }]);
  }

  /** Report match result: updates Elo, pays out bets, clears queue, resets state, triggers confetti */
  function reportResult(winner: 'A' | 'B') {
    const aIds = teamA.map((p) => p.id);
    const bIds = teamB.map((p) => p.id);
    if (aIds.length !== 4 || bIds.length !== 4) return;

    const map = new Map(players.map((p) => [p.id, p]));
    const updated = winner === 'A' ? updateTeamElo(aIds, bIds, map) : updateTeamElo(bIds, aIds, map);
    setPlayers((prev) => prev.map((p) => updated.get(p.id) || p));

    // Settle betting pool pari-mutuel
    const pool = bets.reduce((s, b) => s + b.amount, 0);
    const winners = bets.filter((b) => b.side === winner);
    const winnersSum = winners.reduce((s, b) => s + b.amount, 0);
    if (pool > 0 && winnersSum > 0) {
      // Distribute pool proportionally to winners
      const winningsByUser = new Map<string, number>();
      winners.forEach((b) => {
        const share = Math.floor((b.amount / winnersSum) * pool);
        winningsByUser.set(b.bettorId, (winningsByUser.get(b.bettorId) || 0) + share);
      });
      setPlayers((prev) =>
        prev.map((p) =>
          winningsByUser.has(p.id) ? { ...p, wallet: p.wallet + (winningsByUser.get(p.id) || 0) } : p
        )
      );
    }

    // Celebrate
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);

    // Reset lobby and bets
    setQueueIds([]);
    setLockedTeamA([]);
    setLockedTeamB([]);
    setInProgress(false);
    setCountdown(null);
    setBets([]);

    // Notify parent about match reported
    onMatchReported?.();
  }

  // For the progress bar: stepwise fill based on integer countdown (5 -> 0).
  const countdownTotal = 5;
  const progress = countdown === null ? 0 : (countdownTotal - countdown) / countdownTotal;

  // Team odds (indicative) from average Elo
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 1000);
  const eloA = avg(teamA.map((p) => p.elo));
  const eloB = avg(teamB.map((p) => p.elo));
  const probA = expectedScore(eloA, eloB);
  const probB = 1 - probA;
  const pool = bets.reduce((s, b) => s + b.amount, 0);

  const wallet =
    connectedId ? players.find((p) => p.id === connectedId)?.wallet ?? 0 : 0;

  return (
    <div className="relative rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur text-slate-100">
      {/* Confetti overlay when reporting results */}
      {showConfetti && <ConfettiBurst />}

      <header className="p-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Public Lobby</h3>
            <p className="text-sm text-slate-400">
              Auto-starts when 8+ are queued. Top 8 are locked by Elo balance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-md bg-slate-700/40 text-slate-200 border border-slate-500/50 px-2 py-0.5 text-xs font-semibold"
              title="Players currently queued"
            >
              Queued {queue.length}
            </span>
            {countdown !== null && !inProgress && (
              <span
                className="inline-flex items-center rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 text-xs font-semibold animate-pulse"
                aria-live="polite"
              >
                Auto-start in {countdown}s
              </span>
            )}
            {inProgress && (
              <span className="inline-flex items-center rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 px-2 py-0.5 text-xs font-semibold animate-pulse">
                Match Live
              </span>
            )}
          </div>
        </div>

        {/* Stepwise countdown progress bar (visible while counting and not yet live) */}
        {countdown !== null && !inProgress && (
          <div className="mt-3 h-1.5 w-full rounded bg-slate-800/70 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
            />
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Queue controls */}
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const inQueue = queueIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleQueue(p.id)}
                disabled={inProgress}
                className={`px-3 py-1.5 rounded-md border text-sm transition-all active:scale-95 ${
                  inQueue
                    ? 'bg-cyan-900/40 border-cyan-500 text-cyan-200 hover:bg-cyan-900/60'
                    : 'bg-slate-950/40 border-slate-700 hover:bg-slate-900/60'
                } ${inProgress ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={`Elo ${p.elo} — click to ${inQueue ? 'leave' : 'join'} queue`}
              >
                {p.name} <span className="text-slate-400">({p.elo})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamCard name="Team A" players={teamA} />
          <TeamCard name="Team B" players={teamB} />
        </div>

        {/* Betting Market */}
        <div className="rounded-lg border border-slate-800/60 p-3 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-slate-100">Betting Market</div>
            <div className="text-xs text-slate-400">
              Pool: {pool} • Your wallet: {wallet}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="rounded-md border border-slate-800/60 p-2">
              <div className="text-xs text-slate-400">Team A</div>
              <div className="text-slate-200">Avg Elo {Math.round(eloA)}</div>
              <div className="text-xs text-slate-400">Win chance {(probA * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-md border border-slate-800/60 p-2">
              <div className="text-xs text-slate-400">Team B</div>
              <div className="text-slate-200">Avg Elo {Math.round(eloB)}</div>
              <div className="text-xs text-slate-400">Win chance {(probB * 100).toFixed(1)}%</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <input
                type="number"
                min={1}
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value || '1', 10))}
                className="border border-slate-700 bg-slate-950/60 rounded px-2 py-1 text-sm w-24"
              />
              <button
                disabled={!connectedId || betAmount <= 0}
                onClick={() => placeBet('A')}
                className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
              >
                Bet Team A
              </button>
              <button
                disabled={!connectedId || betAmount <= 0}
                onClick={() => placeBet('B')}
                className="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
              >
                Bet Team B
              </button>
            </div>
          </div>

          {bets.length > 0 && (
            <div className="mt-3 text-sm text-slate-300">
              <div className="text-xs text-slate-400 mb-1">Placed bets</div>
              <ul className="list-disc ml-5 space-y-0.5">
                {bets.map((b, i) => (
                  <li key={i}>
                    {players.find((p) => p.id === b.bettorId)?.name || b.bettorId} bet {b.amount} on{' '}
                    <b>{b.side}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            disabled={!(teamA.length === 4 && teamB.length === 4 && inProgress)}
            onClick={() => reportResult('A')}
            className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
          >
            Report Team A Win
          </button>
          <button
            disabled={!(teamA.length === 4 && teamB.length === 4 && inProgress)}
            onClick={() => reportResult('B')}
            className="px-3 py-1.5 rounded-md bg-rose-500 hover:bg-rose-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
          >
            Report Team B Win
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small card for a team roster (without ready markers) */
function TeamCard({
  name,
  players,
}: {
  name: string;
  players: Player[];
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 p-3 bg-slate-950/40 transition-colors hover:border-slate-700">
      <div className="font-medium text-slate-100">{name}</div>
      <ul className="mt-2 space-y-1">
        {players.map((p) => (
          <li key={p.id} className="flex justify-between text-sm text-slate-200">
            <span>{p.name}</span>
            <span className="text-slate-400">{p.elo}</span>
          </li>
        ))}
        {players.length === 0 && <li className="text-slate-500 text-sm">Waiting for players…</li>}
      </ul>
    </div>
  );
}

export default PublicLobby;
