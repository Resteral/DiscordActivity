/**
 * File: src/components/discord/DiscordReady.tsx
 * Purpose: Discord Embedded App SDK integration with activity tracking
 * - Initializes SDK when running inside Discord
 * - Provides activity updates for tournament states
 * - Optional OAuth authorization flow
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
  updateTournamentActivity: () => {}
});

interface DiscordReadyProps {
  children?: React.ReactNode;
}

export function DiscordReady({ children }: DiscordReadyProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [embeddedDetected, setEmbeddedDetected] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<DiscordIdentity>(null);
  const [sdk, setSdk] = useState<any>(null);

  const LS_KEY = 'discord_client_id';

  /** Detect if running inside Discord */
  useEffect(() => {
    const ua = navigator?.userAgent?.toLowerCase?.() ?? '';
    const likelyEmbedded = ua.includes('discord') || (window.self !== window.top);
    setEmbeddedDetected(likelyEmbedded);
  }, []);

  /** Load client ID from localStorage */
  useEffect(() => {
    try {
      const fromLS = localStorage.getItem(LS_KEY);
      if (fromLS && fromLS.trim()) {
        setClientId(fromLS.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  /** Persist client ID */
  useEffect(() => {
    try {
      if (clientId) {
        localStorage.setItem(LS_KEY, clientId);
      }
    } catch {
      // ignore
    }
  }, [clientId]);

  /**
   * Initialize Discord SDK
   */
  const connect = useCallback(async () => {
    setError(null);
    if (!clientId.trim()) {
      setError('Please enter your Discord Client ID first');
      return;
    }

    try {
      const mod = await import('@discord/embedded-app-sdk');
      const createDiscordSDK = (mod as any).createDiscordSDK ?? (mod as any).default;
      if (!createDiscordSDK) {
        throw new Error('Discord SDK not found');
      }
      
      const client = createDiscordSDK({ clientId: clientId.trim() });
      await client.ready();

      setSdk(client);
      setSdkReady(true);
      setConnected(true);
      setStatus('Connected to Discord');
    } catch (e: any) {
      console.error('Discord SDK Error:', e);
      setError('Failed to connect to Discord. Make sure you are running this inside Discord.');
      setSdk(null);
      setSdkReady(false);
      setConnected(false);
      setStatus('Connection Failed');
    }
  }, [clientId]);

  /**
   * Authorize user via Discord OAuth
   */
  const authorize = useCallback(async () => {
    setError(null);
    if (!sdk) {
      setError('SDK not initialized. Click Connect first.');
      return;
    }
    try {
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

      // In a real app, you would exchange this code with your backend
      // For demo purposes, we'll simulate a successful auth
      setAuthorizedUser({
        discord_user_id: 'demo_user_123',
        username: 'DemoUser',
        avatar: null
      });
      setStatus('Authorized');
    } catch (e: any) {
      console.error(e);
      setError('Authorization failed: ' + (e?.message || 'Unknown error'));
    }
  }, [sdk, clientId]);

  /**
   * Update Discord Activity
   */
  const updateActivity = useCallback(async (customState?: any) => {
    setError(null);
    if (!sdk) {
      setError('SDK not initialized. Click Connect first.');
      return;
    }
    try {
      const activityPayload = {
        details: customState?.details || 'Managing Hockey Tournaments',
        state: customState?.state || 'Zealot Hockey Pro',
        timestamps: { start: Math.floor(Date.now() / 1000) },
        assets: {
          large_image: 'hockey-activity',
          large_text: 'Tournament Management',
        },
        buttons: [
          { label: 'Join Tournament', url: window.location.href },
          { label: 'Learn More', url: 'https://zealothockey.com' }
        ],
      };

      await sdk.commands?.setActivity?.({ activity: activityPayload });
      setStatus('Activity Updated');
    } catch (e: any) {
      console.error(e);
      setError('Failed to update activity: ' + (e?.message || 'Unknown error'));
    }
  }, [sdk]);

  /**
   * Update tournament activity (for other components to use)
   */
  const updateTournamentActivity = useCallback((state: any) => {
    if (sdkReady && connected) {
      updateActivity({
        details: `Tournament: ${state.phase || 'Setup'}`,
        state: state.tournamentName || `Teams: ${state.teamCount || 0}`,
      });
    }
  }, [sdkReady, connected, updateActivity]);

  /** Reset client setup */
  const resetClientId = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
    setClientId('');
    setSdk(null);
    setSdkReady(false);
    setConnected(false);
    setStatus('Idle');
    setError(null);
    setAuthorizedUser(null);
  }, []);

  const embeddedHint = embeddedDetected
    ? '✅ Running inside Discord - Ready to connect!'
    : '⚠️ Not in Discord environment. Connect will only work inside Discord.';

  return (
    <DiscordActivityContext.Provider value={{ updateTournamentActivity }}>
      {children}
      
      {/* Discord Activity Panel */}
      <div className="fixed bottom-4 right-4 w-80 rounded-xl border bg-white p-4 space-y-3 shadow-lg z-50">
        <div className="font-medium text-slate-800">Discord Activity</div>
        
        <div className="text-xs text-slate-600">{embeddedHint}</div>

        {/* Client ID Input */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter Discord Client ID"
            className="px-2 py-1 border rounded text-sm flex-1 min-w-0"
          />
          <button
            onClick={connect}
            disabled={!clientId.trim()}
            className="px-3 py-1.5 rounded-md border bg-blue-500 text-white hover:bg-blue-600 text-sm disabled:opacity-50"
          >
            {connected ? 'Connected' : 'Connect'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            disabled={!sdkReady}
            onClick={authorize}
            className="px-3 py-1.5 rounded-md border bg-green-500 text-white hover:bg-green-600 text-sm disabled:opacity-50 flex-1"
          >
            Authorize
          </button>
          <button
            disabled={!sdkReady}
            onClick={() => updateActivity()}
            className="px-3 py-1.5 rounded-md border bg-purple-500 text-white hover:bg-purple-600 text-sm disabled:opacity-50 flex-1"
          >
            Update Activity
          </button>
        </div>

        {/* Status Display */}
        <div className="text-xs">
          <div className="font-medium">Status: {status}</div>
          {authorizedUser && (
            <div className="text-green-600">
              ✅ Authorized as {authorizedUser.username}
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={resetClientId}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Reset Settings
        </button>
      </div>
    </DiscordActivityContext.Provider>
  );
}