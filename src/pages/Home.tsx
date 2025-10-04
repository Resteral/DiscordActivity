/**
 * File: src/pages/Home.tsx
 * Purpose: Page orchestrating sign-in, matchmaking (with explicit join buttons), tournaments, stats, and Discord readiness.
 * Changes:
 * - Adds JoinPanel with explicit join actions (no forced auto-join).
 * - Adds one-shot join requests to Public and Pro lobbies via props.
 * - Adds localStorage persistence for connected account and players.
 * - Keeps sci‑fi theme and sections.
 * - Adds MatchResultsCsvUploader for submitting match stats with Elo updates from CSV.
 * - Adds TopBar to show wallet at top-right and quick anchors.
 * - Passes connectedId to lobbies to enable betting.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Hero from '../components/Hero';
import type { AggregatedStats, Player, StatLine } from '../types';
import { parseStatsCsv, aggregateStats } from '../lib/csv';
import { PublicLobby } from '../components/lobby/PublicLobby';
import ProLobby from '../components/lobby/ProLobby';
import { TournamentManager } from '../components/tournament/TournamentManager';
import { CsvUploader } from '../components/stats/CsvUploader';
import { Leaderboards } from '../components/stats/Leaderboards';
import { DiscordReady } from '../components/discord/DiscordReady';
import ConnectAccount from '../components/auth/ConnectAccount';
import EloLeaderboard from '../components/stats/EloLeaderboard';
import JoinPanel from '../components/matchmaking/JoinPanel';
import { MatchResultsCsvUploader } from '../components/matchmaking/MatchResultsCsvUploader';
import TopBar from '../components/layout/TopBar';

/** Home page orchestrates the main features and holds page-level state. */
export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState(new Map<string, AggregatedStats>());
  const [connectedId, setConnectedId] = useState<string | null>(null);

  // One-shot join request signals (consumed by each lobby)
  const [requestPublicJoinId, setRequestPublicJoinId] = useState<string | null>(null);
  const [requestProJoinId, setRequestProJoinId] = useState<string | null>(null);

  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [showMatchResultsUploader, setShowMatchResultsUploader] = useState(false);
  const [lastMatchType, setLastMatchType] = useState<'public' | 'pro'>('public');

  // Load persisted state
  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem('zh_players');
      const savedConnected = localStorage.getItem('zh_connected');
      if (savedPlayers) {
        const parsed: Player[] = JSON.parse(savedPlayers);
        if (Array.isArray(parsed)) setPlayers(parsed);
      }
      if (savedConnected) setConnectedId(savedConnected || null);
    } catch {
      // ignore
    }
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('zh_players', JSON.stringify(players));
      localStorage.setItem('zh_connected', connectedId ?? '');
    } catch {
      // ignore
    }
  }, [players, connectedId]);

  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    players.forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  /** Merge aggregated stats into players list, creating new players if needed. */
  function upsertPlayersFromStats(agg: Map<string, AggregatedStats>) {
    setPlayers((prev) => {
      const existing = new Map(prev.map((p) => [p.id, p]));
      for (const [accountId, stats] of agg) {
        const p = existing.get(accountId);
        if (p) {
          existing.set(accountId, { ...p, stats });
        } else {
          existing.set(accountId, {
            id: accountId,
            name: accountId,
            elo: 1000,
            wallet: 1000,
            stats,
          });
        }
      }
      return Array.from(existing.values());
    });
  }

  /** Import CSV and recompute aggregates and players. */
  function handleCsv(text: string) {
    const lines: StatLine[] = parseStatsCsv(text);
    const agg = aggregateStats(lines);
    setStatsMap(agg);
    upsertPlayersFromStats(agg);
  }

  /** Handle match results CSV submission (stats merged in uploader; Elo updated there too) */
  function handleMatchResultsStats(agg: Map<string, AggregatedStats>) {
    // Merge with existing stats
    setStatsMap((prev) => {
      const merged = new Map(prev);
      for (const [accountId, newStats] of agg) {
        const existing = merged.get(accountId);
        if (existing) {
          // Merge stats by summing values
          merged.set(accountId, {
            ...existing,
            stealsOrTurnovers: existing.stealsOrTurnovers + newStats.stealsOrTurnovers,
            goals: existing.goals + newStats.goals,
            assists: existing.assists + newStats.assists,
            shots: existing.shots + newStats.shots,
            pickups: existing.pickups + newStats.pickups,
            passes: existing.passes + newStats.passes,
            passesReceived: existing.passesReceived + newStats.passesReceived,
            possession: existing.possession + newStats.possession,
            shotsAllowed: existing.shotsAllowed + newStats.shotsAllowed,
            saves: existing.saves + newStats.saves,
            goalieTime: existing.goalieTime + newStats.goalieTime,
            skaterTime: existing.skaterTime + newStats.skaterTime,
            entries: existing.entries + newStats.entries,
          });
        } else {
          merged.set(accountId, newStats);
        }
      }
      return merged;
    });

    // Update players with new stats
    upsertPlayersFromStats(agg);

    // Hide the uploader after successful submission
    setTimeout(() => setShowMatchResultsUploader(false), 2000);
  }

  /** Seed mock players if none exist. */
  function seedMock() {
    const mock: Player[] = Array.from({ length: 16 }).map((_, i) => ({
      id: `P${i + 1}`,
      name: `Player ${i + 1}`,
      elo: 980 + Math.floor(Math.random() * 80),
      wallet: 1000,
    }));
    setPlayers(mock);
  }

  /** Update players helper */
  function updatePlayers(next: Player[] | ((p: Player[]) => Player[])) {
    setPlayers(next as any);
  }

  /** Handle connect by accountId; attach stats if exists; create if missing */
  function handleConnect(accountId: string, displayName?: string) {
    setPlayers((prev) => {
      const exists = prev.find((p) => p.id === accountId);
      const stats = statsMap.get(accountId);
      if (exists) {
        return prev.map((p) =>
          p.id === accountId ? { ...p, name: displayName || p.name, stats: stats ?? p.stats } : p
        );
      } else {
        return [
          ...prev,
          {
            id: accountId,
            name: displayName || accountId,
            elo: 1000,
            wallet: 1000,
            stats,
          },
        ];
      }
    });
    setConnectedId(accountId);
  }

  function handleDisconnect() {
    setConnectedId(null);
  }

  /** Open the join panel (no auto-join). */
  function handleQuickMatch() {
    setShowJoinPanel((s) => !s);
    // Optional: scroll to lobbies if the panel is opened
    const el = document.getElementById('lobbies');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Join selection handler from the JoinPanel. */
  function handleJoinChoice(target: 'public' | 'pro') {
    if (!connectedId) return;
    if (target === 'public') {
      setRequestPublicJoinId(connectedId);
    } else {
      setRequestProJoinId(connectedId);
    }
    setShowJoinPanel(false);
  }

  /** Show match results uploader after reporting match results */
  function handleMatchReported(matchType: 'public' | 'pro') {
    setLastMatchType(matchType);
    setShowMatchResultsUploader(true);

    // Scroll to the uploader
    setTimeout(() => {
      const el = document.getElementById('match-results-uploader');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  return (
    <div className="relative">
      {/* Sci‑fi backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-[#070b16] to-[#0b1225]" />
      <div className="absolute inset-0 -z-10 opacity-25">
        <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/0abc162c-05a8-4933-8914-7d8607652b94.jpg" className="object-cover w-full h-full" />
      </div>

      <TopBar connectedId={connectedId} players={players} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <Hero onQuickMatch={handleQuickMatch} />

        {showJoinPanel && (
          <JoinPanel
            connectedId={connectedId}
            onJoin={handleJoinChoice}
            onDismiss={() => setShowJoinPanel(false)}
            panelId="1422066214666244227"
          />
        )}

        <section className="grid md:grid-cols-3 gap-6">
          <ConnectAccount connectedId={connectedId} onConnect={handleConnect} onDisconnect={handleDisconnect} />
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur p-4 text-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={seedMock}
                  className="rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 px-3 py-1.5 text-sm"
                >
                  Seed 16 mock players
                </button>
                <button
                  onClick={() => setPlayers([])}
                  className="rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 px-3 py-1.5 text-sm"
                >
                  Clear players
                </button>
                <div className="text-xs text-slate-400 ml-auto">
                  Connected: {connectedId ? <b className="text-cyan-400">{connectedId}</b> : 'None'}
                </div>
              </div>
            </div>
            <EloLeaderboard players={players} />
          </div>
        </section>

        <section id="lobbies" className="space-y-6">
          <SectionHeader
            title="Matchmaking Lobbies"
            subtitle="Public (first 8) and Pro (captain draft). Click Join above to add yourself. Includes betting markets."
          />

          {showMatchResultsUploader && (
            <div id="match-results-uploader">
              <MatchResultsCsvUploader
                players={players}
                onStatsUpdate={handleMatchResultsStats}
                setPlayers={updatePlayers}
                matchType={lastMatchType}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <PublicLobby
              players={players}
              setPlayers={updatePlayers}
              requestJoinId={requestPublicJoinId}
              onConsumeJoin={() => setRequestPublicJoinId(null)}
              onMatchReported={() => handleMatchReported('public')}
              connectedId={connectedId}
            />
            <ProLobby
              players={players}
              setPlayers={updatePlayers}
              requestJoinId={requestProJoinId}
              onConsumeJoin={() => setRequestProJoinId(null)}
              onMatchReported={() => handleMatchReported('pro')}
              connectedId={connectedId}
            />
          </div>
        </section>

        <section id="tournaments" className="space-y-6">
          <SectionHeader
            title="Tournaments"
            subtitle="Auction and Snake drafts with live brackets and betting"
          />
          <TournamentManager players={players} setPlayers={updatePlayers} />
        </section>

        <section id="stats" className="space-y-6">
          <SectionHeader
            title="CSV Stats & Leaderboards"
            subtitle="Paste raw CSV text; we aggregate, display filters and leaderboards"
          />
          <CsvUploader onCsv={handleCsv} />
          <Leaderboards players={players} statsMap={statsMap} />
        </section>

        <section id="discord" className="space-y-6">
          <SectionHeader
            title="Discord Activity Ready"
            subtitle="Embedded SDK support for identity and activity (best-effort demo)"
          />
          <DiscordReady />
        </section>

        <footer className="text-xs text-slate-400 pt-8 border-t border-slate-800">
          Built for Zealot Hockey communities • Elo and betting are client-side prototypes. For real
          money or persistence, integrate a backend and compliance.
        </footer>
      </div>
    </div>
  );
}

/** Section header with title/subtitle */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h2 className="text-xl md:text-2xl font-semibold text-slate-100">{title}</h2>
      {subtitle ? <p className="text-slate-400">{subtitle}</p> : null}
    </header>
  );
}
