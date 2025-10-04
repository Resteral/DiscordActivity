/**
 * File: src/components/stats/Leaderboards.tsx
 * Purpose: Leaderboards with filters over aggregated player stats and Elo.
 */

import React, { useMemo, useState } from 'react';
import type { AggregatedStats, Player } from '../../types';

/**
 * Leaderboards: sortable views across key stats and Elo, with role/team filters.
 */
export function Leaderboards({
  players,
  statsMap,
}: {
  players: Player[];
  statsMap: Map<string, AggregatedStats>;
}) {
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [role, setRole] = useState<'all' | 'goalie' | 'skater'>('all');
  const rows = useMemo(() => {
    return players
      .map((p) => ({
        ...p,
        stats: p.stats ?? statsMap.get(p.id),
      }))
      .filter((p) => {
        if (!p.stats) return false;
        if (teamFilter && String(p.stats.team) !== String(teamFilter)) return false;
        if (role === 'goalie' && p.stats.goalieTime <= 0) return false;
        if (role === 'skater' && p.stats.skaterTime <= 0) return false;
        return true;
      });
  }, [players, statsMap, teamFilter, role]);

  const teams = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.stats && s.add(String(r.stats.team)));
    return Array.from(s.values());
  }, [rows]);

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Team:</label>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="skater">Skater</option>
            <option value="goalie">Goalie</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Board title="Top Elo" rows={rows} metric={(p) => p.elo} fmt={(v) => v.toString()} />
        <Board title="Goals" rows={rows} metric={(p) => p.stats?.goals ?? 0} />
        <Board title="Assists" rows={rows} metric={(p) => p.stats?.assists ?? 0} />
        <Board title="Shots" rows={rows} metric={(p) => p.stats?.shots ?? 0} />
        <Board title="Passes" rows={rows} metric={(p) => p.stats?.passes ?? 0} />
        <Board title="Passes Received" rows={rows} metric={(p) => p.stats?.passesReceived ?? 0} />
        <Board title="Pickups" rows={rows} metric={(p) => p.stats?.pickups ?? 0} />
        <Board title="Saves" rows={rows} metric={(p) => p.stats?.saves ?? 0} />
        <Board title="Possession" rows={rows} metric={(p) => p.stats?.possession ?? 0} fmt={(v) => v.toFixed(2)} />
        <Board title="Steals/Turnovers" rows={rows} metric={(p) => p.stats?.stealsOrTurnovers ?? 0} />
      </div>
    </div>
  );
}

/** A single leaderboard card */
function Board({
  title,
  rows,
  metric,
  fmt,
}: {
  title: string;
  rows: Array<Player & { stats?: AggregatedStats }>;
  metric: (p: Player & { stats?: AggregatedStats }) => number;
  fmt?: (v: number) => string;
}) {
  const sorted = [...rows].sort((a, b) => metric(b) - metric(a)).slice(0, 10);
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="font-medium mb-2">{title}</div>
      <ol className="space-y-1">
        {sorted.length === 0 && <li className="text-slate-500 text-sm">No data.</li>}
        {sorted.map((p, i) => (
          <li key={p.id} className="flex justify-between text-sm">
            <span className="text-slate-700">{i + 1}. {p.name}</span>
            <span className="font-medium">{fmt ? fmt(metric(p)) : metric(p)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
