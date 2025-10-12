/**
 * Discord Activity Page
 * Simplified version specifically for Discord embedding
 */

import React from 'react';

export default function DiscordActivity() {
  const isDiscordEmbedded = window.self !== window.top || 
                           navigator.userAgent.toLowerCase().includes('discord');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">🏒 Zealot Hockey</h1>
        <p className="text-xl opacity-90 mb-6">
          Tournament Management System
        </p>
        
        {/* Status Indicator */}
        <div className={`inline-block px-4 py-2 rounded-full mb-6 ${
          isDiscordEmbedded ? 'bg-green-500' : 'bg-yellow-500'
        }`}>
          {isDiscordEmbedded ? '✅ Running in Discord' : '🌐 Running in Browser'}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors">
            Create Tournament
          </button>
          <button className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors">
            Join Match
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors">
            View Leaderboards
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-black/20 rounded-lg max-w-md mx-auto">
          <h3 className="font-semibold mb-2">Activity Status</h3>
          <div className="text-sm space-y-1">
            <div>Client ID: <code className="bg-black/30 px-2 py-1 rounded">1425626912499175498</code></div>
            <div>URL: <code className="bg-black/30 px-2 py-1 rounded">discord-activity-lac.vercel.app</code></div>
            <div>User Agent: <code className="bg-black/30 px-2 py-1 rounded text-xs">{navigator.userAgent.slice(0, 50)}...</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}