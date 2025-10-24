/**
 * Home Page
 * Purpose:
 * - Provide a welcoming hero with clear entrances to key flows.
 * - Serve as a non-empty, informative landing per project rules.
 */

import React from 'react';
import { Gamepad2, Trophy, BarChart3 } from 'lucide-react';

/**
 * CTA button rendered as an anchor that works with hash-based routing.
 */
function ButtonLink(props: { href: string; label: string; variant?: 'primary' | 'secondary' }) {
  const { href, label, variant = 'primary' } = props;
  const base =
    'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600'
      : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white';
  return (
    <a
      href={href}
      className={`${base} ${styles} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      {label}
    </a>
  );
}

/**
 * Feature highlight card.
 */
function FeatureCard(props: { icon: React.ReactNode; title: string; desc: string }) {
  const { icon, title, desc } = props;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/70">{desc}</p>
    </div>
  );
}

/**
 * Home component with hero and feature grid.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/18f37807-0594-44b5-b434-61eb61d1c702.jpg" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 px-6 py-20 md:flex-row md:gap-16 md:py-24">
          <div className="w-full md:w-1/2">
            <span className="mb-3 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              Multiplayer · Drafts · Leaderboards
            </span>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Organize matches, draft teams, and climb the leaderboard
            </h1>
            <p className="mt-4 max-w-prose text-base text-white/80">
              Run tournaments, manage lobbies, and track ELO—seamlessly integrated with Discord.
              Start an activity or try the demo page to verify your setup.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="#/activity" label="Open Activity" variant="primary" />
              <ButtonLink href="#/test" label="Open Test Page" variant="secondary" />
            </div>
            <p className="mt-3 text-xs text-white/60">
              Tip: Use the Test page to quickly validate routing and UI.
            </p>
          </div>

          <div className="w-full md:w-1/2">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl">
              <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/53a6735a-776e-44e7-9a98-35eb43b6adaf.jpg" className="h-64 w-full rounded-xl object-cover md:h-80" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<Gamepad2 className="h-5 w-5" />}
            title="Smart Lobbies"
            desc="Public or pro lobbies with matchmaking and owner controls."
          />
          <FeatureCard
            icon={<Trophy className="h-5 w-5" />}
            title="Draft Modes"
            desc="Snake and auction drafts with bracket visualization."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="ELO + Stats"
            desc="Upload CSVs, compute ELO, and display leaderboards."
          />
        </div>
      </section>
    </main>
  );
}
