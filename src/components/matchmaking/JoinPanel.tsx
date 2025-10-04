/**
 * File: src/components/matchmaking/JoinPanel.tsx
 * Purpose: Compact panel to explicitly join a matchmaking lobby (Public or Pro) with a visible panel ID badge.
 * Enhancements:
 * - Slide/fade-in entrance animation with a gentle scale.
 * - Pulsing panel ID badge to draw attention subtly.
 */

import React, { useEffect, useState } from 'react';

/**
 * JoinPanel renders explicit join options so users are never auto-forced into lobbies.
 * Animations:
 * - On mount: fade in, slide up, and scale from 95% to 100%.
 * - Panel ID badge: subtle pulse to indicate identity context.
 */
export default function JoinPanel({
  connectedId,
  onJoin,
  onDismiss,
  panelId,
}: {
  /** Current connected account id (if any) */
  connectedId?: string | null;
  /** Callback when user chooses a lobby target */
  onJoin: (target: 'public' | 'pro') => void;
  /** Optional dismiss */
  onDismiss?: () => void;
  /** Optional UI badge id for the panel */
  panelId?: string;
}) {
  const disabled = !connectedId;

  // Animate-in control: apply a small delay so the transition is visible when the element mounts.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={[
        'rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur p-4 text-slate-100',
        'transition-all duration-300 ease-out transform',
        entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="font-semibold">Join Lobby</div>
          {panelId && (
            <span
              className="inline-flex items-center rounded-md bg-violet-500/20 text-violet-300 border border-violet-400/50 px-2 py-0.5 text-xs animate-pulse"
              title="Panel ID"
            >
              #{panelId}
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-2 py-1 text-xs rounded-md border border-slate-700 bg-slate-950/60 hover:bg-slate-900/60 transition-colors"
          >
            Close
          </button>
        )}
      </div>
      {!connectedId ? (
        <p className="text-sm text-amber-300">Connect your account first to join matchmaking.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={disabled}
            onClick={() => onJoin('public')}
            className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
          >
            Join Public 8
          </button>
          <button
            disabled={disabled}
            onClick={() => onJoin('pro')}
            className="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-slate-900 font-semibold disabled:opacity-50 transition-transform active:scale-95"
          >
            Join Pro Draft
          </button>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-2">
        You will be added to the chosen lobby immediately. No auto-joining without clicking here.
      </p>
    </div>
  );
}
