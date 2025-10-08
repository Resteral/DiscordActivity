/**
 * File: src/components/discord/DiscordReady.tsx
 * Purpose: Discord Embedded App SDK integration with optional OAuth authorize flow
 * - Initializes SDK if available (embedded in Discord)
 * - Authorize inside Discord to get code and exchange with backend
 * - Shows identity hints and sets Activity when possible
 */

import React, { useCallback, useEffect, useState } from 'react';

type DiscordIdentity = {
  discord_user_id: string;
  username: string;
  avatar?: string | null;
} | null;

/**
 * Discord Activity Context for tournament state sharing
 */
export const DiscordActivityContext = React.createContext<{
  updateTournamentActivity: (state: any) => void;
}>({ 
  updateTournamentActivity: () => {
    // Safe default - no-op function
  }
});

interface DiscordReadyProps {
  children?: React.ReactNode;
}

export function DiscordReady({ children }: DiscordReadyProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [clientId, setClientId] = useState('YOUR_DISCORD_CLIENT_ID');
  const [error, setError] = useState<string | null>(null);
  const [embeddedDetected, setEmbeddedDetected] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<DiscordIdentity>(null);
  const [sdk, setSdk] = useState<any>(null);

  const LS_KEY = 'discord_client_id';

  /** Heuristic for embedded detection */
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

  /** Persist client ID for future sessions */
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
   * Initialize the Discord Embedded SDK via dynamic import
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
   * Authorize via Discord inside the embedded app (scope: identify)
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

      // Exchange code via backend
      const redirectUri = window.location.origin;
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
   * Update Activity via Embedded App SDK
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

      // Optional: Log this activity into backend
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

  /** Update tournament activity state for use by other components */
  const updateTournamentActivity = useCallback((state: any) => {
    // This function is provided via context but currently does nothing
    // to avoid breaking the tournament components
    console.log('Tournament activity update:', state);
  }, []);

  /** Clear local client setup */
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

  const embeddedHint = embeddedDetected
    ? 'Discord environment detected.'
    : 'Not running inside Discord. Connect and Authorize will only work within Discord.';

  return (
    <DiscordActivityContext.Provider value={{ updateTournamentActivity }}>
      {children}
      <div className="fixed bottom-4 right-4 w-80 rounded-xl border bg-white p-4 space-y-3 shadow-lg">
        <div className="font-medium">Discord Activity Integration</div>

        <div className="text-xs text-slate-600">{embeddedHint}</div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Discord Client ID"
            className="px-2 py-1 border rounded text-sm flex-1 min-w-0"
            title="Provide your Discord Application Client ID"
          />
          <button
            onClick={connect}
            className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm"
          >
            {connected ? (sdkReady ? 'Connected' : 'Connecting…') : 'Connect'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!sdkReady}
            onClick={authorize}
            className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50 flex-1"
            title="Authorize inside Discord and persist to backend"
          >
            Authorize
          </button>
          <button
            disabled={!sdkReady}
            onClick={updateActivity}
            className="px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50 text-sm disabled:opacity-50 flex-1"
          >
            Update Activity
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
              Authorized as <b>{authorizedUser.username}</b>
            </span>
          </div>
        )}

        {error && <div className="text-xs text-rose-600">Error: {error}</div>}
      </div>
    </DiscordActivityContext.Provider>
  );
}