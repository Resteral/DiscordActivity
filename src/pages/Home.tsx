/**
 * Home Page
 * Purpose:
 * - Provide a welcoming landing with clear entrances to key areas.
 * - Showcase features with a clean, accessible layout and strong contrast.
 */

import React from 'react';
import { Rocket, Activity, TestTube2, Trophy, Users, LineChart } from 'lucide-react';

/**
 * CTAButton
 * Description: Simple anchor-based CTA that works with hash routing (no react-router-dom).
 */
function CTAButton({
  href,
  label,
  icon: Icon,
  variant = 'primary',
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const styles =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-400'
      : 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50 border border-white/20';
  return (
    <a href={href} className={`${base} ${styles}`} aria-label={label}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
}

/**
 * FeatureCard
 * Description: Small, reusable card for highlighting a feature.
 */
function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

/**
 * Home
 * Description: Main landing. Uses anchors to navigate to hash routes.
 */
export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/d2b3e410-1671-4ff2-b533-01f7d36dafd8.jpg" className="h-full w-full object-cover opacity-30" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300">
                <Rocket className="h-3.5 w-3.5" />
                Ready to launch
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                Build tournaments, lobbies, and stats with ease
              </h1>
              <p className="mt-3 max-w-prose text-slate-600 dark:text-slate-400">
                Manage drafts, leaderboards, and Discord activity from one polished interface. Navigate using the
                buttons below to explore live features.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <CTAButton href="#/activity" label="Open Discord Activity" icon={Activity} variant="primary" />
                <CTAButton href="#/test" label="Run Test Page" icon={TestTube2} variant="secondary" />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <img src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/30bd3dbb-15f7-469b-b899-16c559f18b7b.jpg" className="h-72 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Trophy}
            title="Tournament Modes"
            desc="Auction and snake drafts with intuitive controls and clear visuals."
          />
          <FeatureCard
            icon={Users}
            title="Lobby System"
            desc="Public and pro lobbies with smooth matchmaking and results upload."
          />
          <FeatureCard
            icon={LineChart}
            title="Stats & ELO"
            desc="Leaderboards, CSV importers, and robust ELO calculations."
          />
        </div>
      </section>
    </div>
  );
}
