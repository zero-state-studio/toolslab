'use client';

import { useEffect } from 'react';
import type { HolidayDecoration } from '@/lib/utils/holidays';

// ─── Orbital particles ────────────────────────────────────────────────────────

const ORBIT_COLORS = [
  '#FF4444', '#FF6B6B', '#FF8C00', '#FFA500',
  '#FFD700', '#FFE066', '#00DD55', '#44FF88',
  '#44AAFF', '#66CCFF', '#CC44FF', '#DD88FF',
  '#FF44AA', '#FF88CC', '#44DDFF', '#FFFFFF',
];

interface OrbitParticle {
  startAngle: number;
  radiusFactor: number;
  period: number;
  color: string;
  size: number;
}

function buildOrbitParticles(): OrbitParticle[] {
  const ps: OrbitParticle[] = [];

  for (let i = 0; i < 20; i++) {
    ps.push({
      startAngle: (i / 20) * 360,
      radiusFactor: 1.12 + (i % 4) * 0.03,
      period: 2800 + (i % 5) * 180,
      color: ORBIT_COLORS[i % ORBIT_COLORS.length],
      size: 5 + (i % 3),
    });
  }
  for (let i = 0; i < 16; i++) {
    ps.push({
      startAngle: (i / 16) * 360 + 11.25,
      radiusFactor: 1.45 + (i % 4) * 0.04,
      period: 4800 + (i % 4) * 350,
      color: ORBIT_COLORS[(i + 4) % ORBIT_COLORS.length],
      size: 6 + (i % 3),
    });
  }
  for (let i = 0; i < 12; i++) {
    ps.push({
      startAngle: (i / 12) * 360 + 15,
      radiusFactor: 1.78 + (i % 3) * 0.05,
      period: 7000 + (i % 3) * 500,
      color: ORBIT_COLORS[(i + 8) % ORBIT_COLORS.length],
      size: 7 + (i % 3),
    });
  }

  return ps;
}

const ORBIT_PARTICLES = buildOrbitParticles();

// Outermost ring factor (largest radiusFactor in ring 3)
const OUTER_RING = 1.78 + 2 * 0.05; // 1.88

// ─── Component ────────────────────────────────────────────────────────────────

interface HolidayOverlayProps {
  holiday: HolidayDecoration;
  open: boolean;
  /** Called when the backdrop is clicked or Escape is pressed */
  onClose?: () => void;
  /** Max emoji radius in px. Will be clamped to fit viewport. Default: 160 */
  emojiRadius?: number;
}

export function HolidayOverlay({
  holiday,
  open,
  onClose,
  emojiRadius = 160,
}: HolidayOverlayProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;

  // ── Responsive radius ──────────────────────────────────────────────────────
  // Total vertical space needed when centered at `cy`:
  //   above cy  → OUTER_RING × r
  //   below cy  → OUTER_RING × r  +  greetingCard (~100px) + gap (~20px)
  // So: cy - OUTER_RING×r ≥ 20   AND   cy + OUTER_RING×r + 120 ≤ vh
  // With cy = vh/2:
  //   r ≤ (vh/2 - 20)   / OUTER_RING   [top]
  //   r ≤ (vh/2 - 120)  / OUTER_RING   [bottom, tighter]
  //   r ≤  vw / (OUTER_RING * 2)        [horizontal]
  const maxByBottom = (vh / 2 - 120) / OUTER_RING;
  const maxByTop    = (vh / 2 - 20)  / OUTER_RING;
  const maxByWidth  =  vw / (OUTER_RING * 2);
  const r = Math.max(
    40, // absolute minimum so it's still visible
    Math.min(emojiRadius, maxByBottom, maxByTop, maxByWidth),
  );

  const cx = vw / 2;
  const cy = vh / 2;

  // Scale greeting font proportionally (range: 16–36px)
  const greetingFontSize = Math.round(Math.min(36, Math.max(16, r * 0.22)));
  // Card max-width: 85% of viewport, never wider than 440px
  const cardMaxWidth = Math.min(vw * 0.85, 440);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999]"
      aria-modal={onClose ? 'true' : undefined}
      role={onClose ? 'dialog' : undefined}
      aria-label={holiday.greeting}
    >
      <style>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes emoji-pop {
          0%   { transform: translate(-50%, -50%) scale(0.05); opacity: 0; }
          65%  { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
        @keyframes greeting-rise {
          0%   { opacity: 0; transform: translateX(-50%) translateY(16px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
      `}</style>

      {/* Holiday-themed radial background — always visible, holiday color only */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 70% at ${cx}px ${cy}px, ${holiday.bgColor}55 0%, ${holiday.bgColor}22 45%, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Backdrop — click-to-close (only in click mode) */}
      {onClose && (
        <div
          className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* All content anchored to viewport center */}
      <div
        className="pointer-events-none absolute"
        style={{ left: cx, top: cy }}
        aria-hidden="true"
      >
        {/* Large emoji */}
        <span
          style={{
            position: 'absolute',
            fontSize: r * 1.5,
            lineHeight: 1,
            userSelect: 'none',
            transform: 'translate(-50%, -50%)',
            animation: 'emoji-pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          {holiday.emoji}
        </span>

        {/* Orbital particles */}
        {ORBIT_PARTICLES.map((p, i) => {
          const radius = r * p.radiusFactor;
          const delay  = -((p.period * p.startAngle) / 360);
          const sz     = Math.max(3, Math.round(p.size * (r / 160)));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                transformOrigin: '0 0',
                animation: `orbit-spin ${p.period}ms linear ${delay}ms infinite`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  width: sz,
                  height: sz,
                  left: radius - sz / 2,
                  top: -sz / 2,
                  borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 ${sz * 2}px ${p.color}, 0 0 ${sz * 5}px ${p.color}55`,
                }}
              />
            </div>
          );
        })}

        {/* Greeting card — sits just below the outermost orbit ring */}
        <div
          style={{
            position: 'absolute',
            top: r * OUTER_RING + 12,
            left: 0,
            width: cardMaxWidth,
            transform: 'translateX(-50%)',
            pointerEvents: onClose ? 'auto' : 'none',
            animation: 'greeting-rise 400ms 200ms ease-out both',
          }}
        >
          <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center shadow-2xl backdrop-blur-md">
            <p
              className="font-bold text-white drop-shadow-lg"
              style={{ fontSize: greetingFontSize }}
            >
              {holiday.greeting}
            </p>
            {onClose && (
              <p className="mt-1.5 text-xs text-white/50">
                press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> or click to close
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
