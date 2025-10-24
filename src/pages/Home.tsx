/**
 * Home Page
 * Purpose:
 * - Provide a welcoming landing page with clear entrances
 * - Quick access to Activity and Test pages
 */

import React from 'react';

/**
 * Simple card link component for navigation
 */
function NavCard(props: { title: string; description: string; href: string; icon: string }) {
  return (
    <a
      href={props.href}
      className="group block rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={props.title}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-blue-600 text-white grid place-items-center text-2xl">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{props.title}</div>
          <div className="text-sm text-slate-600">{props.description}</div>
        </div>
      </div>
    </a>
  );
}

/**
 * Home component with hero and navigation
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
      <header className="max-w-5xl mx-auto px-6 pt-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Zealot Hockey Tournaments
            </h1>
            <p className="mt-4 text-slate-200">
              Professional tournament management with seamless Discord integration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#/activity"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium"
              >
                Open Activity
              </a>
              <a
                href="#/test"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-lg font-medium"
              >
                Test Page
              </a>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden ring-1 ring-white/10">
            <img
              src="https://pub-cdn.sider.ai/u/U005HEVRO98/web-coder/68e03ea56cd86d39750c1cbd/resource/6f74fa8d-7c3c-408b-9173-bace3349f126.jpg"
              alt="Hockey Arena"
              className="object-cover h-64 w-full"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          <NavCard
            title="Discord Activity"
            description="Minimal page optimized for Discord embed and activity updates."
            href="#/activity"
            icon="🔗"
          />
          <NavCard
            title="Diagnostics / Test"
            description="Verify routing, styles, and environment quickly."
            href="#/test"
            icon="🧪"
          />
        </div>
      </main>
    </div>
  );
}
