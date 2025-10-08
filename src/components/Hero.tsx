/**
 * File: src/components/Hero.tsx
 * Purpose: Hero section for the main landing page
 */

import React from 'react';

/**
 * Hero component
 * Main banner section with app title and description
 */
export function Hero() {
  return (
    <div className="text-center space-y-6 py-12">
      <h1 className="text-5xl font-bold text-white">
        Zealot Hockey
      </h1>
      <p className="text-xl text-slate-300 max-w-2xl mx-auto">
        Advanced tournament management with Discord integration, real-time drafting, and competitive betting
      </p>
      <div className="flex justify-center gap-4 pt-6">
        <div className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium">
          Start Tournament
        </div>
        <div className="bg-transparent border border-slate-600 text-slate-300 px-6 py-3 rounded-lg font-medium">
          View Leaderboards
        </div>
      </div>
    </div>
  );
}