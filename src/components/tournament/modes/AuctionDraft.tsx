/**
 * File: src/components/tournament/modes/AuctionDraft.tsx
 * Purpose: Nomination-based auction draft with a bidding-round timer. Captains nominate one player at a time,
 *          all captains bid, time extends per bid, highest bid wins or pass on timeout.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Owner, Player } from '../../../types';

/**
 * AuctionDraft
 * - Turn-based nomination: each owner nominates a single player when it's their turn.
 * - All owners can place bids on the nominated player, limited by their remaining budget.
 * - A round timer counts down; each bid extends time by +3s.
 * - On timeout: award to highest bid (if any) or pass to next nominator (no sale).
 * - Draft completes when every team reaches the chosen roster size.
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
  /** Desired roster size (players per team) */
  const [rosterSize, setRosterSize] = useState<number>(3);

  /** Config: round timer and extension per bid */
  const [baseRoundSeconds, setBaseRoundSeconds] = useState<number>(15);
  const extendPerBidSeconds = 3;

  /** Map of teamName -> remaining budget (local state; do not mutate owners) */
  const [budgets, setBudgets] = useState<Record<string, number>>(
    () =>
      owners.reduce((acc, o) => {
        acc[o.teamName] = o.budget ?? 200;
        return acc;
      }, {} as Record<string, number>)
  );

  /** Current nominator index (turn order cycles over owners) */
  const [nominatorIndex, setNominatorIndex] = useState<number>(0);

  /** Currently nominated player id (on the block) */
  const [nominatedId, setNominatedId] = useState<string | null>(null);

  /** Current bids: teamName -> amount */
  const [bids, setBids] = useState<Record<string, number>>({});

  /** Results: teamName -> drafted playerIds */
  const [won, setWon] = useState<Record<string, string[]>>({});

  /** Timer state for the current bidding round */
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  /** Fast lookups */
  const taken = useMemo(() => new Set(Object.values(won).flat()), [won]);
  const ownerTeams = useMemo(() => owners.map((o) => o.teamName), [owners]);

  /** Available players: not owners themselves and not already drafted */
  const available = useMemo(
    () => players.filter((p) => !owners.some((o) => o.id === p.id) && !taken.has(p.id)),
    [players, owners, taken]
  );

  /** Currently nominated player object */
  const nominated = useMemo(
    () => (nominatedId ? players.find((p) => p.id === nominatedId) ?? null : null),
    [nominatedId, players]
  );

  /** Whether all rosters are filled */
  const canFinish = useMemo(
    () => owners.every((o) => (won[o.teamName]?.length ?? 0) >= rosterSize),
    [owners, rosterSize, won]
  );

  /** Get current nominator team name */
  const currentNominatorTeam = ownerTeams.length > 0 ? ownerTeams[nominatorIndex % ownerTeams.length] : undefined;

  /**
   * Clear the ticking interval for the round timer.
   */
  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  /**
   * Start (or restart) the round timer when a player is nominated.
   */
  function startRoundTimer() {
    clearTimer();
    setTimerSeconds(baseRoundSeconds);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
  }

  /**
   * Extend the current round timer by a given number of seconds (default +3s).
   */
  function extendRoundTimer(seconds = extendPerBidSeconds) {
    setTimerSeconds((prev) => Math.max(0, prev) + seconds);
  }

  /**
   * Proceed to next nominator (cyclic over owners).
   */
  function nextNominator() {
    setNominatorIndex((i) => (i + 1) % Math.max(1, owners.length));
  }

  /**
   * Reset current bids for the nominated player.
   */
  function resetBids() {
    setBids({});
  }

  /**
   * Award the nominated player to highest bidder (if any),
   * consume budget, then clear round and advance turn.
   */
  function awardToHighestOrPass() {
    if (!nominated) return;

    const entries = Object.entries(bids);
    if (entries.length === 0) {
      // No bids -> no sale (pass)
      setNominatedId(null);
      resetBids();
      nextNominator();
      return;
    }

    const [winnerTeam, price] = entries.sort((a, b) => b[1] - a[1])[0];

    // Assign player
    setWon((prev) => ({
      ...prev,
      [winnerTeam]: [...(prev[winnerTeam] ?? []), nominated.id],
    }));

    // Consume budget
    setBudgets((prev) => ({
      ...prev,
      [winnerTeam]: Math.max(0, (prev[winnerTeam] ?? 0) - price),
    }));

    // Clear round and advance
    setNominatedId(null);
    resetBids();
    nextNominator();
  }

  /**
   * Manual award action from UI. Requires at least one bid.
   */
  function award() {
    if (Object.keys(bids).length === 0) return;
    clearTimer();
    awardToHighestOrPass();
  }

  /**
   * Place a bid for a given team, ensuring budget constraint and extending the timer.
   * @param teamName Team placing the bid
   * @param step Increment amount (default 10)
   */
  function bid(teamName: string, step = 10) {
    if (!nominated || timerSeconds <= 0) return;

    setBids((prev) => {
      const current = prev[teamName] ?? 0;
      const next = current + step;
      if (next > (budgets[teamName] ?? 0)) return prev;
      return { ...prev, [teamName]: next };
    });

    // Each bid extends the timer
    extendRoundTimer();
  }

  /**
   * Complete the draft and return assignments to the parent.
   */
  function finish() {
    clearTimer();
    onComplete(won);
  }

  /**
   * Compute remaining slots per team to visualize progress.
   */
  const remainingSlots: Record<string, number> = useMemo(() => {
    return owners.reduce((acc, o) => {
      const current = won[o.teamName]?.length ?? 0;
      acc[o.teamName] = Math.max(0, rosterSize - current);
      return acc;
    }, {} as Record<string, number>);
  }, [owners, rosterSize, won]);

  /**
   * Side-effect: When a player gets nominated, start the round timer.
   * Cleanup on nomination change or unmount.
   */
  useEffect(() => {
    if (nominatedId) {
      startRoundTimer();
    } else {
      clearTimer();
      setTimerSeconds(0);
    }
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominatedId, baseRoundSeconds]);

  /**
   * Side-effect: Auto resolve the round when time runs out.
   */
  useEffect(() => {
    if (!nominated) return;
    if (timerSeconds <= 0) {
      clearTimer();
      awardToHighestOrPass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds]);

  /** Progress width for a minimal visual indicator (clamped to base %) */
  const progressPct = useMemo(() => {
    if (!nominated) return 0;
    if (baseRoundSeconds <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((timerSeconds / baseRoundSeconds) * 100)));
  }, [timerSeconds, baseRoundSeconds, nominated]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">Roster size</label>
          <input
            type="number"
            min={1}
            max={8}
            value={rosterSize}
            onChange={(e) => setRosterSize(parseInt(e.target.value || '3', 10))}
            className="border rounded px-2 py-1 text-sm w-24"
          />

          <div className="flex items-center gap-2 ml-2">
            <label className="text-sm text-slate-600">Round timer (s)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={baseRoundSeconds}
              onChange={(e) => setBaseRoundSeconds(Math.max(5, parseInt(e.target.value || '15', 10)))}
              className="border rounded px-2 py-1 text-sm w-28"
              title="Initial time per nomination round"
            />
            <span className="text-xs text-slate-500">+{extendPerBidSeconds}s per bid</span>
          </div>

          <div className="text-sm text-slate-600">
            Nominator: <b className="text-slate-800">{currentNominatorTeam ?? '—'}</b>
          </div>
        </div>
        <button
          onClick={finish}
          disabled={!canFinish}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
          title={canFinish ? 'Complete Draft' : 'All teams must fill their rosters'}
        >
          Complete Draft
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Nomination + Bidding Panel */}
        <div className="rounded border p-3 bg-white/90">
          <div className="font-medium mb-2">Nomination &amp; Bidding</div>

          {/* If a player is nominated, show bidding UI */}
          {nominated ? (
            <>
              <div className="flex items-start justify-between p-2 rounded border bg-slate-50">
                <div>
                  <div className="font-semibold">{nominated.name}</div>
                  <div className="text-slate-500 text-xs">Elo {nominated.elo}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">ID: {nominated.id}</div>
                  <div className="mt-1 text-sm font-medium">
                    Time left: <span className="tabular-nums">{Math.max(0, timerSeconds)}s</span>
                  </div>
                  <div className="mt-1 h-1.5 w-28 rounded bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {owners.map((o) => {
                  const team = o.teamName;
                  const bidAmt = bids[team] ?? 0;
                  const budget = budgets[team] ?? 0;
                  const canAdd5 = bidAmt + 5 <= budget && timerSeconds > 0;
                  const canAdd10 = bidAmt + 10 <= budget && timerSeconds > 0;
                  const canAdd25 = bidAmt + 25 <= budget && timerSeconds > 0;
                  return (
                    <div key={team} className="flex items-center justify-between">
                      <div className="text-sm">
                        {team} <span className="text-slate-500">({o.name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Budget: {budget}</span>
                        <button
                          onClick={() => bid(team, 5)}
                          disabled={!canAdd5}
                          className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                          title={canAdd5 ? 'Bid +5' : 'Insufficient budget or time up'}
                        >
                          +5
                        </button>
                        <button
                          onClick={() => bid(team, 10)}
                          disabled={!canAdd10}
                          className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                          title={canAdd10 ? 'Bid +10' : 'Insufficient budget or time up'}
                        >
                          +10
                        </button>
                        <button
                          onClick={() => bid(team, 25)}
                          disabled={!canAdd25}
                          className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                          title={canAdd25 ? 'Bid +25' : 'Insufficient budget or time up'}
                        >
                          +25
                        </button>
                        <span className="text-sm font-medium w-10 text-right">{bidAmt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={award}
                  disabled={Object.keys(bids).length === 0}
                  className="px-3 py-1.5 rounded-md border bg-emerald-600 text-white text-sm disabled:opacity-50 hover:bg-emerald-500"
                  title="Award to highest bid now"
                >
                  Award to Highest Bid
                </button>
                <button
                  onClick={() => {
                    clearTimer();
                    setNominatedId(null);
                    resetBids();
                    nextNominator();
                  }}
                  className="px-3 py-1.5 rounded-md border bg-slate-100 text-slate-800 text-sm"
                  title="No sale — advance to next nominator"
                >
                  Pass (No Sale)
                </button>
                <button
                  onClick={resetBids}
                  className="px-3 py-1.5 rounded-md border bg-slate-100 text-slate-800 text-sm"
                  title="Clear all bids for current nominee"
                >
                  Reset Bids
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-600 mb-2">
                It&apos;s <b>{currentNominatorTeam ?? '—'}</b>&apos;s turn to nominate a player.
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {available.length === 0 && (
                  <div className="text-sm text-slate-500">No available players to nominate.</div>
                )}
                {available.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded border bg-slate-50"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-slate-500 text-xs">Elo {p.elo}</div>
                    </div>
                    <button
                      onClick={() => setNominatedId(p.id)}
                      className="px-2 py-1 rounded-md border bg-white text-xs hover:bg-slate-50"
                      title={`Nominate ${p.name}`}
                    >
                      Nominate
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button
                  onClick={() => nextNominator()}
                  className="px-3 py-1.5 rounded-md border bg-slate-100 text-slate-800 text-sm"
                  title="Skip nomination to next team"
                >
                  Skip Turn
                </button>
              </div>
            </>
          )}
        </div>

        {/* Team Panels */}
        <div className="md:col-span-2 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {owners.map((o) => {
            const team = o.teamName;
            const drafted = won[team] ?? [];
            return (
              <div key={team} className="rounded border p-3 bg-white/90">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{team}</div>
                  <div className="text-xs text-slate-500">
                    Budget: <b>{budgets[team] ?? 0}</b>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Slots: {drafted.length}/{rosterSize} • Remaining: {remainingSlots[team]}
                </div>
                <ul className="mt-1 text-sm space-y-1">
                  {drafted.length === 0 && (
                    <li className="text-slate-500 text-xs">No players drafted yet</li>
                  )}
                  {drafted.map((id) => {
                    const p = players.find((x) => x.id === id);
                    return (
                      <li key={id} className="flex justify-between">
                        <span>{p?.name ?? id}</span>
                        <span className="text-slate-500">{p?.elo ?? ''}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
