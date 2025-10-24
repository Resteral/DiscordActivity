/**
 * Discord Test Page
 * Simple test page for Discord activity links
 */

import React from 'react';

export default function DiscordTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-700 text-white p-4">
      <div className="max-w-md mx-auto text-center pt-16">
        <h1 className="text-4xl font-bold mb-4">🎯 Discord Activity Test</h1>
        <p className="text-lg mb-6">This page confirms the app is working in Discord</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Status Indicators</h2>
          <div className="space-y-2">
            <div className="bg-green-500/20 p-3 rounded">
              <p className="font-semibold">✅ React App Loaded</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded">
              <p className="font-semibold">🔗 Routing Working</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded">
              <p className="font-semibold">🎨 Styling Applied</p>
            </div>
          </div>
        </div>

        <a 
          href="#/" 
          className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}