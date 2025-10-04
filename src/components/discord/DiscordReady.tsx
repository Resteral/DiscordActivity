/**
 * File: src/components/discord/DiscordReady.tsx
 * Purpose: Discord Embedded App SDK integration with optional OAuth authorize flow and backend persistence.
 * - Initializes SDK if available (embedded in Discord).
 * - Authorize inside Discord to get code, exchange with backend (Supabase persistence).
 * - Shows identity hints and sets Activity when possible.
 * - Client ID persistence via localStorage; optional URL prefill (?dcid=...).
 * - Reset control for quick reconfiguration.
 *
 * Notes:
 * - This front-end talks to Vercel API routes:
 *   - POST /api/discord/exchange  (OAuth code exchange + Supabase upsert)
 *   - POST /api/activity/set      (optional activity logging)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

type DiscordIdentity = {
  discord_user_id: string;
  username: string;
  avatar?: string | null;
} | null;

export function DiscordReady() {
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [clientId, setClientId] = useState('YOUR_DISCORD_CLIENT_ID');
  const [error, setError] = useState<string | null>(null);
  const [embeddedDetected, setEmbeddedDetected] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<DiscordIdentity>(null);

  // Store a ref-ish state for the sdk object without importing types (keep lightweight)
  const [sdk, setSdk] = useState<any>(null);

  const LS_KEY = 'discord_client_id';

  /** Heuristic for embedded detection. */
  useEffect(() => {
    const ua = navigator?.userAgent?.toLowerCase?.() ?? '';
    const likelyEmbedded = ua.includes('discord') || (window.self !== window.top);
    setEmbeddedDetected(likelyEmbedded);
  }, []);

  /** Prefill client ID via URL (?dcid=) or localStorage */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('dcid');
      if (q && q.trim()) {
        setClientId(q.trim());
        localStorage.setItem(LS_KEY, q.trim());
        return;
      }
      const fromLS = localStorage.getItem(LS_KEY);
      if (fromLS && fromLS.trim()) {
        setClientId(fromLS.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  /** Persist client ID for future sessions. */
  useEffect(() => {
    try {
      if (clientId && clientId !== 'YOUR_DISCORD_CLIENT_ID') {
        localStorage.setItem(LS_KEY, clientId);
      }
    } catch {
      // ignore
    }
  }, [clientId]);

  /**
   * Initialize the Discord Embedded SDK via dynamic import (avoids bundling issues outside Discord).
   */
  const connect = useCallback(async () => {
    setError(null);
    try {
      const mod = await import('@discord/embedded-app-sdk');
      const createDiscordSDK = (mod as any).createDiscordSDK ?? (mod as any).default;
      if (!createDiscordSDK) {
        throw new Error('createDiscordSDK not found on @discord/embedded-app-sdk');
      }
      const client = createDiscordSDK({ clientId: clientId.trim() || undefined });

      await client.ready(); // succeeds only when embedded inside Discord

      setSdk(client);
      setSdkReady(true);
      setConnected(true);
      setStatus('Connected');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to initialize Discord SDK');
      setSdk(null);
      setSdkReady(false);
      setConnected(false);
      setStatus('Idle');
    }
  }, [clientId]);

  /**
   * Authorize via Discord inside the embedded app (scope: identify),
   * then call backend to exchange the code and upsert into Supabase.
   */
  const authorize = useCallback(async () => {
    setError(null);
    if (!sdk) {
      setError('SDK not initialized. Click Connect first.');
      return;
    }
    try {
      // Request code with identify scope
      const authResp = await sdk.commands?.authorize?.({
        client_id: clientId.trim(),
        response_type: 'code',
        prompt: 'none',
        scope: ['identify'],
      });

      const code: string | undefined = authResp?.code;
      if (!code) {
        setError('No authorization code returned.');
        return;
      }

      // Exchange code via backend (Vercel API)
      const redirectUri = window.location.origin; // must match Discord config
      const exResp = await fetch('/api/discord/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      const json = await exResp.json();
      if (!exResp.ok || !json?.ok) {
        setError(json?.error || 'Exchange failed');
        return;
      }

      const user = json?.user;
      setAuthorizedUser(user);
      setStatus('Authorized');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Authorization failed');
    }
  }, [sdk, clientId]);

  /**
   * Update Activity (presence-like) via Embedded App SDK.
   * Also log an activity record via backend (optional analytics).
   */
  const updateActivity = useCallback(async () => {
    setError(null);
    if (!sdk) {
      setError('SDK not initialized. Click Connect first.');
      return;
    }
    try {
      const payload = {
        details: status,
        state: 'Zealot Hockey',
        timestamps: { start: Math.floor(Date.now() / 1000) },
        assets: {
          large_image: 'activity-default',
          large_text: 'Matchmaking & Tournaments',
        },
        buttons: [{ label: 'Open App', url: window.location.origin }],
      };

      await sdk.commands?.setActivity?.({ activity: payload });
      setStatus('Activity Updated');

      // Optional: Log this activity into Supabase via backend
      if (authorizedUser?.discord_user_id) {
        await fetch('/api/activity/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discord_user_id: authorizedUser.discord_user_id,
            details: payload.details,
            state: payload.state,
            buttons: payload.buttons,
          }),
        });
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to set activity. Ensure the app runs inside Discord.');
      return;
    }
  }, [sdk, status, authorizedUser]);

  /** Clear local client setup. */
  const resetClientId = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
    setClientId('YOUR_DISCORD_CLIENT_ID');
    setSdk(null);
    setSdkReady(false);
    setConnected(false);
    setStatus('Idle');
    setError(null);
    setAuthorizedUser(null);
  }, []);

  const embeddedHint = useMemo(
    () =>
      embeddedDetected
        ? 'Discord environment detected.'
        : 'Not running inside Discord. Connect and Authorize will only work within Discord.',
    [embeddedDetected]
  );

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="font-medium">Discord Activity</div>

      <div className="text-xs text-slate-600">{embeddedHint}</div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Discord Client ID"
          className="px-2 py-1 border rounded text-sm"
          title="Provide your Discord Application Client ID"
        />
        <button
          onClick={connect}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
        >
          {connected ? (sdkReady ? 'Connected' : 'Connecting…') : 'Connect'}
        </button>
        <button
          disabled={!sdkReady}
          onClick={authorize}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
          title="Authorize inside Discord and persist to Supabase"
        >
          Authorize
        </button>
        <button
          disabled={!sdkReady}
          onClick={updateActivity}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
        >
          Update Activity
        </button>
        <button
          onClick={resetClientId}
          className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
          title="Clear local client ID and reset"
        >
          Reset
        </button>
      </div>

      {authorizedUser && (
        <div className="flex items-center gap-2 text-sm">
          {authorizedUser.avatar && (
            <img
              src={authorizedUser.avatar}
              className="object-cover"
              style={{ width: 24, height: 24, borderRadius: 999 }}
            />
          )}
          <span>
            Authorized as <b>{authorizedUser.username}</b> ({authorizedUser.discord_user_id})
          </span>
        </div>
      )}

      {error && <div className="text-xs text-rose-600">Error: {error}</div>}

      <div className="text-xs text-slate-500 space-y-1">
        <p>
          Tip: You can prefill Client ID via URL: <code>?dcid=YOUR_CLIENT_ID</code>. The value is
          persisted to localStorage for future visits.
        </p>
        <p>
          The Activity is only set when running inside Discord as an embedded app. Authorization is
          performed via the embedded SDK, then persisted through a Vercel API into Supabase.
        </p>
      </div>
    </div>
  );
}
