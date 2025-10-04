/**
 * File: src/components/animations/TeamLockFlash.tsx
 * Purpose: A subtle overlay ring/flash to indicate "teams locked".
 * Usage:
 *  - Render conditionally for ~700ms when teams lock.
 */

import React, { useEffect, useState } from 'react';

/**
 * TeamLockFlash overlays a tinted ring with a quick fade animation.
 */
export default function TeamLockFlash({
  tint = 'emerald',
  ms = 700,
}: {
  /** Tailwind-compatible tint keyword (emerald, violet, cyan) */
  tint?: 'emerald' | 'violet' | 'cyan' | 'amber' | 'blue';
  /** How long the flash should last (ms) */
  ms?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), ms);
    return () => clearTimeout(t);
  }, [ms]);

  if (!visible) return null;

  const colorMap: Record<string, string> = {
    emerald: 'ring-emerald-400/60 bg-emerald-500/5',
    violet: 'ring-violet-400/60 bg-violet-500/5',
    cyan: 'ring-cyan-400/60 bg-cyan-500/5',
    amber: 'ring-amber-400/60 bg-amber-500/5',
    blue: 'ring-blue-400/60 bg-blue-500/5',
  };

  return (
    <div
      className={[
        'pointer-events-none absolute inset-0 rounded-xl',
        'transition-opacity duration-700 ease-out',
        'backdrop-blur-[1px]',
        'ring-4',
        colorMap[tint] || colorMap.emerald,
      ].join(' ')}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    />
  );
}
