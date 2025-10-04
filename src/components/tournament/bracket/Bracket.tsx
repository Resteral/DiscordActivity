/**
 * File: src/components/tournament/bracket/Bracket.tsx
 * Purpose: Live single-elimination bracket builder with result entry and champion callback.
 */

import React, { useEffect, useMemo, useState } from 'react';

interface Props {
  teams: { [teamName: string]: string[] };
  onChampion?: (teamName: string) => void;
}

/**
 * Bracket: Generates a single-elimination bracket from input teams, supports result entry.
 */
export function Bracket({ teams, onChampion }: Props) {
  const [results, setResults] = useState<{ [id: string]: { winner?: string; score?: string } }>({});

  const teamNames = Object.keys(teams);
  const slots = nextPowerOfTwo(teamNames.length);
  const firstRound = useMemo(() => {
    const padded = [...teamNames];
    while (padded.length < slots) padded.push('BYE');
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < padded.length; i += 2) {
      pairs.push([padded[i], padded[i + 1]]);
    }
    return pairs;
  }, [teamNames, slots]);

  const rounds = useMemo(() => {
    const r: Array<Array<{ id: string; a?: string; b?: string }>> = [];
    let current = firstRound.map((pair, i) => ({ id: `R1-${i}`, a: pair[0], b: pair[1] }));
    r.push(current);
    let round = 2;
    while (current.length > 1) {
      const next: Array<{ id: string; a?: string; b?: string }> = [];
      for (let i = 0; i < current.length; i += 2) {
        next.push({ id: `R${round}-${i / 2}` });
      }
      r.push(next);
      current = next;
      round++;
    }
    return r;
  }, [firstRound]);

  /** Compute winners flow */
  const computed = useMemo(() => {
    const layers = rounds.map((round) => round.map((m) => ({ ...m })));
    // Fill round 1 from pairs
    // For subsequent rounds, propagate winners
    for (let r = 0; r < layers.length; r++) {
      const round = layers[r];
      for (let i = 0; i < round.length; i++) {
        const match = round[i];
        if (r === 0) {
          // BYE auto-advance
          if (match.a === 'BYE' && match.b) setResult(match.id, match.b, '');
          else if (match.b === 'BYE' && match.a) setResult(match.id, match.a, '');
        } else {
          const prevLeft = layers[r - 1][i * 2];
          const prevRight = layers[r - 1][i * 2 + 1];
          const wA = results[prevLeft.id]?.winner;
          const wB = results[prevRight.id]?.winner;
          match.a = wA;
          match.b = wB;
        }
      }
    }
    return layers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, results, teamNames.join(',')]);

  useEffect(() => {
    const last = rounds[rounds.length - 1]?.[0];
    const champ = last && results[last.id]?.winner;
    if (champ && onChampion) onChampion(champ);
  }, [results, rounds, onChampion]);

  function setResult(id: string, winner: string, score: string) {
    setResults((prev) => ({ ...prev, [id]: { winner, score } }));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max">
        {computed.map((round, rIndex) => (
          <div key={rIndex} className="space-y-3">
            <div className="font-medium">Round {rIndex + 1}</div>
            {round.map((m, i) => (
              <div key={m.id} className="rounded border p-2 w-56 bg-white">
                <div className="text-sm">{m.a ?? '—'}</div>
                <div className="text-sm">{m.b ?? '—'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={results[m.id]?.winner ?? ''}
                    onChange={(e) => setResult(m.id, e.target.value, results[m.id]?.score ?? '')}
                    className="border rounded px-2 py-1 text-sm w-full"
                  >
                    <option value="">Select winner</option>
                    {m.a && <option value={m.a}>{m.a}</option>}
                    {m.b && <option value={m.b}>{m.b}</option>}
                  </select>
                </div>
                <input
                  placeholder="Score (e.g., 3-2)"
                  value={results[m.id]?.score ?? ''}
                  onChange={(e) => setResult(m.id, results[m.id]?.winner ?? '', e.target.value)}
                  className="mt-2 border rounded px-2 py-1 text-sm w-full"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Given n, return next power of two >= n */
function nextPowerOfTwo(n: number): number {
  if (n < 1) return 1;
  return 1 << Math.ceil(Math.log2(n));
}
