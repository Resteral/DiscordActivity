/**
 * File: src/components/auth/ConnectAccount.tsx
 * Purpose: Simple sign-in/connect UI by accountId (CSV id) with optional display name.
 */

import React, { useState } from 'react';

/**
 * ConnectAccount allows users to connect an accountId that maps to CSV stats and Player records.
 */
export default function ConnectAccount({
  connectedId,
  onConnect,
  onDisconnect,
}: {
  /** Currently connected account id (if any) */
  connectedId?: string | null;
  /** Callback when the user connects an account id */
  onConnect: (accountId: string, displayName?: string) => void;
  /** Optional disconnect callback */
  onDisconnect?: () => void;
}) {
  const [accountId, setAccountId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  function handleConnect() {
    if (!accountId.trim()) return;
    onConnect(accountId.trim(), displayName.trim() || undefined);
    setAccountId('');
    setDisplayName('');
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur p-4 space-y-3 text-slate-100">
      <div className="font-semibold">Connect Account</div>
      {!connectedId ? (
        <>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Account ID (e.g., 1-S2-1-6820063)"
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.6)]"
            >
              Connect
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Your Account ID should match the CSV <code>accountId</code> to auto-link your stats.
          </p>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            Connected as <span className="font-semibold text-cyan-400">{connectedId}</span>
          </div>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 text-sm"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
