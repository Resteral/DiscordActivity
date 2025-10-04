/**
 * File: src/components/animations/ConfettiBurst.tsx
 * Purpose: Lightweight, dependency-free confetti animation using emoji and CSS transitions.
 * Usage:
 *   - Render when you want a quick celebration effect.
 *   - It auto-animates on mount and fades out; caller controls mount/unmount.
 */

import React, { useEffect, useMemo, useRef } from 'react';

/** Single confetti particle model. */
interface Particle {
  id: number;
  left: number; // 0-100 vw% within container
  hue: number;
  rotate: number; // start rotation
  distance: number; // vertical travel px
  delay: number; // ms
  emoji: string;
}

/**
 * ConfettiBurst renders an absolutely-positioned layer with animated emoji confetti.
 * It uses a one-time requestAnimationFrame to trigger transitions per particle.
 */
export default function ConfettiBurst({
  count = 60,
  duration = 900,
}: {
  /** Number of particles to render */
  count?: number;
  /** Duration of the animation in ms */
  duration?: number;
}) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  const particles = useMemo<Particle[]>(() => {
    const emojis = ['🎉', '✨', '🎊', '⭐', '💫'];
    const arr: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      hue: Math.floor(Math.random() * 360),
      rotate: Math.random() * 90 - 45,
      distance: 80 + Math.random() * 160,
      delay: Math.random() * 120,
      emoji: emojis[i % emojis.length],
    }));
    return arr;
  }, [count]);

  useEffect(() => {
    // Kick transitions on mount
    const frame = requestAnimationFrame(() => {
      const layer = layerRef.current;
      if (!layer) return;
      const children = Array.from(layer.children) as HTMLDivElement[];
      children.forEach((el) => {
        el.style.transform = el.dataset.to || '';
        el.style.opacity = '0';
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => {
        const from = `translate3d(${p.left}%, 0, 0) rotate(${p.rotate}deg)`;
        const to = `translate3d(${p.left + (Math.random() * 16 - 8)}%, -${p.distance}px, 0) rotate(${p.rotate + (Math.random() * 120 - 60)}deg)`;
        return (
          <div
            key={p.id}
            data-to={to}
            className="absolute top-1/2 text-2xl will-change-transform select-none"
            style={{
              transform: from,
              transition: `transform ${duration}ms ease-out ${p.delay}ms, opacity ${duration}ms ease-out ${p.delay}ms`,
              filter: `drop-shadow(0 1px 0 hsl(${p.hue} 80% 60% / 0.5))`,
            }}
          >
            {p.emoji}
          </div>
        );
      })}
    </div>
  );
}
