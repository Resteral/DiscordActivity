/**
 * File: src/components/layout/TopBar.tsx
 * Purpose: Top navigation bar component
 */

import React from 'react';

/**
 * TopBar component
 * Navigation bar with app branding and user controls
 */
export function TopBar() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-white font-bold text-xl">Zealot Hockey</div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Tournaments</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Leaderboards</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Stats</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Clans</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-slate-300 text-sm">
              Connected Players: <span className="text-cyan-300 font-medium">6</span>
            </div>
            <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}