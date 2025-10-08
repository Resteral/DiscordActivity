/**
 * Home page component
 * Main landing page for the Zealot Hockey application
 */

import React from 'react';
import { Hero } from '../components/Hero';
import { TopBar } from '../components/layout/TopBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      <TopBar />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        <div className="mt-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Zealot Hockey Tournament System</h2>
          <p className="text-lg opacity-90">
            Professional tournament management with Discord integration
          </p>
        </div>
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="text-cyan-300 font-semibold mb-2">Tournament Manager</h4>
                <p className="text-slate-300 text-sm">Create and manage tournaments with snake or auction drafts</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="text-cyan-300 font-semibold mb-2">Matchmaking</h4>
                <p className="text-slate-300 text-sm">Join public or pro lobbies for quick matches</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}