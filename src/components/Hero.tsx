/**
 * File: src/components/Hero.tsx
 * Purpose: Dark sci‑fi hockey-themed hero with Quick Match CTA.
 */

import { Trophy, Users, BarChart3 } from 'lucide-react';
import React from 'react';

/**
 * Hero banner. Accepts onQuickMatch to join the user to matchmaking pools.
 */
export function Hero({ onQuickMatch }: { onQuickMatch?: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-[#0b0f19] via-[#0a0f2d] to-black text-white">
      {/* Starfield / Nebula background */}
      <div className="absolute inset-0 opacity-30">
        <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/2b720636-bd35-40e7-ac6a-01e975a3f4a8.jpg" className="object-cover w-full h-full" />
      </div>
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
      <div className="relative p-6 md:p-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Zealot Hockey Matchmaking &amp; Tournaments
        </h1>
        <p className="mt-3 text-slate-200/90 max-w-2xl">
          Public and Pro lobbies with Elo MMR, captain draft, auction &amp; snake tournaments, live brackets,
          betting markets, and CSV-powered leaderboards.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#lobbies"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 font-semibold text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            <Users size={18} /> Lobbies
          </a>
          <a
            href="#tournaments"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-semibold text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <Trophy size={18} /> Tournaments
          </a>
          <a
            href="#stats"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
          >
            <BarChart3 size={18} /> Leaderboards
          </a>
          <button
            onClick={onQuickMatch}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/50 px-4 py-2 font-semibold bg-slate-950/40 hover:bg-slate-900/60"
            title="Join matchmaking queues automatically"
          >
            ⚡ Quick Match
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
