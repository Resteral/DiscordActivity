/**
 * DiscordTest Page
 * Purpose:
 * - Simple sanity-check screen to verify routing and UI rendering.
 */

import React from 'react';

/**
 * Minimal test page with a back link to Home.
 */
export default function DiscordTest() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Test Page</h1>
        <p className="mt-2 text-slate-300">
          If you can see this, routing and rendering are working.
        </p>
        <div className="mt-6">
          <a
            href="#/"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
