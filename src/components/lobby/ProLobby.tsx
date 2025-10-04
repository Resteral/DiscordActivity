/**
 * File: src/components/lobby/ProLobby.tsx
 * Purpose: Pro lobby with captain draft and vote-to-start system (requires 5 votes and 9+ players).
 * - Vote system: at least 5 players must vote to start when 9+ players are in the pool.
 * - Captain draft: two captains pick teams alternately.
 * - Team lock flash animation when draft completes.
 * - Confetti burst when match results are reported.
 * - Simple Betting Market: connected user can place pari-mutuel bets on Team A/B during draft/live.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Player } from '../../types';
import { expectedScore, updateTeamElo } from '../../lib/elo';
import ConfettiBurst from '../animations/ConfettiBurst';
import TeamLockFlash from '../animations/TeamLockFlash';

interface ProLobbyProps {
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
 * ProLobby: Captain draft with vote-to-start system (5 votes + 9+ players required).
 */
export default function ProLobby({
  players,
  setPlayers,
  requestJoinId,
  onConsumeJoin,
  onMatchReported,
  connectedId,
}: ProLobbyProps) {
  // Pool of available players (ids) and derived Player[] list
  const [poolIds, setPoolIds] = useState<string[]>([]);
  const pool = poolIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];

  // Vote state and draft state
  const [votes, setVotes] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [draftComplete, setDraftComplete] = useState<boolean>(false);
  const [showTeamLock, setShowTeamLock] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Draft state
  const [captainA, setCaptainA] = useState<string | null>(null);
  const [captainB, setCaptainB] = useState<string | null>(null);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('A');
  const [draftOrder, setDraftOrder] = useState<number>(0);

  // Betting market
  const [bets, setBets] = useState<LobbyBet[]>([]);
  const [betAmount, setBetAmount] = useState<number>(50);

  /** Explicit join request handler (one-shot) */
  useEffect(() => {
    if (!requestJoinId) return;
    const exists = players.some((p) => p.id === requestJoinId);
    const already = poolIds.includes(requestJoinId);
    if (exists && !already) {
      setPoolIds((prev) => [...prev, requestJoinId]);
    }
    onConsumeJoin?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestJoinId]);

  /** Toggle pool membership */
  function togglePool(id: string) {
    if (inProgress) return;
    setPoolIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** Toggle vote to start */
  function toggleVote(id: string) {
    if (inProgress) return;
    setVotes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** Auto-select captains: top 2 Elo players in pool */
  const captains = useMemo(() => {
    const sorted = [...pool].sort((a, b) => b.elo - a.elo).slice(0, 2);
    return sorted;
  }, [pool]);

  /** Watch for vote conditions to start countdown */
  useEffect(() => {
    if (inProgress) return;

    const hasEnoughPlayers = pool.length >= 9;
    const hasEnoughVotes = votes.length >= 5;

    if (hasEnoughPlayers && hasEnoughVotes && countdown === null) {
      setCountdown(5); // 5-second countdown to draft start
    }

    if ((!hasEnoughPlayers || !hasEnoughVotes) && countdown !== null) {
      setCountdown(null); // cancel countdown if conditions no longer met
    }
  }, [pool.length, votes.length, inProgress, countdown]);

  /** Countdown ticker: at 0, start draft with captains */
  useEffect(() => {
    if (countdown === null) return;

    const id = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return c;
        if (c <= 1) {
          // Start draft with top 2 Elo as captains
          if (captains.length >= 2) {
            setCaptainA(captains[0].id);
            setCaptainB(captains[1].id);
            setInProgress(true);
            setDraftComplete(false);
            setTeamA([captains[0]]);
            setTeamB([captains[1]]);
            setCurrentTurn('A');
            setDraftOrder(0);
          }
          return null;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [countdown, captains]);

  /** Draft a player to the current team */
  function draftPlayer(playerId: string) {
    if (!inProgress || draftComplete) return;

    const player = pool.find((p) => p.id === playerId);
    if (!player) return;

    if (currentTurn === 'A') {
      setTeamA((prev) => [...prev, player]);
      setCurrentTurn('B');
    } else {
      setTeamB((prev) => [...prev, player]);
      setCurrentTurn('A');
    }

    setDraftOrder((prev) => prev + 1);
  }

  /** Check if draft is complete (4 players per team including captains) */
  useEffect(() => {
    if (teamA.length === 4 && teamB.length === 4 && !draftComplete) {
      setDraftComplete(true);
      setShowTeamLock(true);
      setTimeout(() => setShowTeamLock(false), 700);
    }
  }, [teamA.length, teamB.length, draftComplete]);

  /** Available players for drafting (pool minus already drafted players) */
  const availablePlayers = useMemo(() => {
    const draftedIds = new Set([...teamA.map((p) => p.id), ...teamB.map((p) => p.id)]);
    return pool.filter((p) => !draftedIds.has(p.id));
  }, [pool, teamA, teamB]);

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

  /** Report match result */
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

    // Reset lobby
    setPoolIds([]);
    setVotes([]);
    setCaptainA(null);
    setCaptainB(null);
    setTeamA([]);
    setTeamB([]);
    setInProgress(false);
    setDraftComplete(false);
    setCountdown(null);
    setBets([]);

    // Notify parent about match reported
    onMatchReported?.();
  }

  // For the progress bar: stepwise fill based on integer countdown (5 -> 0).
  const countdownTotal = 5;
  const progress = countdown === null ? 0 : (countdownTotal - countdown) / countdownTotal;

  // Elo and odds display
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 1000);
  const eloA = avg(teamA.map((p) => p.elo));
  const eloB = avg(teamB.map((p) => p.elo));
  const probA = expectedScore(eloA, eloB);
  const probB = 1 - probA;
  const betPool = bets.reduce((s, b) => s + b.amount, 0);
  const wallet =
    connectedId ? players.find((p) => p.id === connectedId)?.wallet ?? 0 : 0;

  return (
    <div className="relative rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur text-slate-100">
      {/* Team lock flash animation */}
      {showTeamLock && <TeamLockFlash tint="violet" />}

      {/* Confetti overlay when reporting results */}
      {showConfetti && <ConfettiBurst />}

      <header className="p-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Pro Lobby</h3>
            <p className="text-sm text-slate-400">
              Captain draft. Requires 5 votes and 9+ players to start.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-md bg-slate-700/40 text-slate-200 border border-slate-500/50 px-2 py-0.5 text-xs font-semibold"
              title="Players currently in pool"
            >
              Pool {poolIds.length}
            </span>
            <span
              className="inline-flex items-center rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/50 px-2 py-0.5 text-xs font-semibold"
              title="Votes to start"
            >
              Votes {votes.length}/5
            </span>
            {countdown !== null && !inProgress && (
              <span
                className="inline-flex items-center rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 text-xs font-semibold animate-pulse"
                aria-live="polite"
              >
                Starting in {countdown}s
              </span>
            )}
            {inProgress && !draftComplete && (
              <span className="inline-flex items-center rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/50 px-2 py-0.5 text-xs font-semibold animate-pulse">
                Drafting...
              </span>
            )}
            {draftComplete && (
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
        {/* Pool and vote controls */}
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const inPool = poolIds.includes(p.id);
            const hasVoted = votes.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePool(p.id)}
                disabled={inProgress}
                className={`px-3 py-1.5 rounded-md border text-sm transition-all active:scale-95 ${
                  inPool
                    ? hasVoted
                      ? 'bg-blue-900/40 border-blue-500 text-blue-200 hover:bg-blue-900/60'
                      : 'bg-indigo-900/40 border-indigo-500 text-indigo-200 hover:bg-indigo-900/60'
                    : 'bg-slate-950/40 border-slate-700 hover:bg-slate-900/60'
                } ${inProgress ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={`Elo ${p.elo} — click to ${inPool ? 'leave' : 'join'} pool`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (inPool && !inProgress) toggleVote(p.id);
                }}
              >
                {p.name} <span className="text-slate-400">({p.elo})</span>
                {hasVoted && ' ✓'}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400">
          Right-click to vote/remove vote. Need 5 votes and 9+ players to start.
        </div>

        {/* Draft interface */}
        {inProgress && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamCard 
                name="Team A" 
                players={teamA} 
                isCaptain={captainA}
                currentTurn={currentTurn === 'A' && !draftComplete}
              />
              <TeamCard 
                name="Team B" 
                players={teamB} 
                isCaptain={captainB}
                currentTurn={currentTurn === 'B' && !draftComplete}
              />
            </div>

            {!draftComplete && (
              <div>
                <div className="text-sm font-medium mb-2">
                  {currentTurn === 'A' ? 'Team A' : 'Team B'} to pick ({4 - teamA.length} vs {4 - teamB.length} remaining)
                </div>
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => draftPlayer(p.id)}
                      className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 text-sm transition-colors"
                    >
                      {p.name} <span className="text-slate-400">({p.elo})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Betting Market */}
        {inProgress && (
          <div className="rounded-lg border border-slate-800/60 p-3 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-100">Betting Market</div>
              <div className="text-xs text-slate-400">
                Pool: {betPool} • Your wallet: {wallet}
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
        )}

        {/* Match result reporting */}
        {draftComplete && (
          <div className="flex gap-2">
            <button
              onClick={() => reportResult('A')}
              className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold transition-transform active:scale-95"
            >
              Report Team A Win
            </button>
            <button
              onClick={() => reportResult('B')}
              className="px-3 py-1.5 rounded-md bg-rose-500 hover:bg-rose-400 text-slate-900 font-semibold transition-transform active:scale-95"
            >
              Report Team B Win
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Team card with captain indicator and turn highlight */
function TeamCard({
  name,
  players,
  isCaptain,
  currentTurn = false,
}: {
  name: string;
  players: Player[];
  isCaptain: string | null;
  currentTurn?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 bg-slate-950/40 transition-all ${
      currentTurn 
        ? 'border-purple-500 ring-2 ring-purple-500/20' 
        : 'border-slate-800/60 hover:border-slate-700'
    }`}>
      <div className="font-medium text-slate-100 flex items-center gap-2">
        {name}
        {currentTurn && (
          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded animate-pulse">
            Picking...
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {players.map((p) => (
          <li key={p.id} className="flex justify-between text-sm text-slate-200">
            <span className={p.id === isCaptain ? 'text-amber-300 font-medium' : ''}>
              {p.name} {p.id === isCaptain && ' ©'}
            </span>
            <span className="text-slate-400">{p.elo}</span>
          </li>
        ))}
        {players.length === 0 && <li className="text-slate-500 text-sm">Waiting for draft...</li>}
      </ul>
    </div>
  );
}
