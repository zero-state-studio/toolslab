'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { getCurrentHoliday } from '@/lib/utils/holidays';

const categoryGradients: Record<string, string> = {
  data: 'from-blue-500 to-cyan-500',
  encoding: 'from-emerald-500 to-green-500',
  base64: 'from-teal-500 to-cyan-500',
  text: 'from-purple-500 to-pink-500',
  web: 'from-pink-500 to-rose-500',
  dev: 'from-amber-500 to-orange-500',
  generators: 'from-orange-500 to-red-500',
  formatters: 'from-indigo-500 to-purple-500',
  pdf: 'from-red-600 to-orange-600',
};

// ─── Orbital fireworks ────────────────────────────────────────────────────────

const ORBIT_COLORS = [
  '#FF4444', '#FF6B6B', '#FF8C00', '#FFA500',
  '#FFD700', '#FFE066', '#00DD55', '#44FF88',
  '#44AAFF', '#66CCFF', '#CC44FF', '#DD88FF',
  '#FF44AA', '#FF88CC', '#44DDFF', '#FFFFFF',
];

interface OrbitParticle {
  startAngle: number; // degrees
  radiusFactor: number; // multiplied by emojiRadius at render time
  period: number; // ms
  color: string;
  size: number; // px
}

function buildOrbitParticles(): OrbitParticle[] {
  const ps: OrbitParticle[] = [];

  // Ring 1 — 20 particles, just outside the emoji, fast
  for (let i = 0; i < 20; i++) {
    ps.push({
      startAngle: (i / 20) * 360,
      radiusFactor: 1.12 + (i % 4) * 0.03, // 1.12 – 1.21
      period: 2800 + (i % 5) * 180,
      color: ORBIT_COLORS[i % ORBIT_COLORS.length],
      size: 5 + (i % 3),
    });
  }

  // Ring 2 — 16 particles, medium distance, medium speed
  for (let i = 0; i < 16; i++) {
    ps.push({
      startAngle: (i / 16) * 360 + 11.25,
      radiusFactor: 1.45 + (i % 4) * 0.04, // 1.45 – 1.57
      period: 4800 + (i % 4) * 350,
      color: ORBIT_COLORS[(i + 4) % ORBIT_COLORS.length],
      size: 6 + (i % 3),
    });
  }

  // Ring 3 — 12 particles, far out, slow
  for (let i = 0; i < 12; i++) {
    ps.push({
      startAngle: (i / 12) * 360 + 15,
      radiusFactor: 1.78 + (i % 3) * 0.05, // 1.78 – 1.88
      period: 7000 + (i % 3) * 500,
      color: ORBIT_COLORS[(i + 8) % ORBIT_COLORS.length],
      size: 7 + (i % 3),
    });
  }

  return ps;
}

const ORBIT_PARTICLES = buildOrbitParticles();

// ─── HolidayBadge ─────────────────────────────────────────────────────────────

interface HolidayBadgeProps {
  emoji: string;
  name: string;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  /** How much the visual emoji is scaled relative to the badge element */
  scale: number;
  badgeSizeClass: string;
}

interface EmojiCenter {
  x: number;
  y: number;
  emojiRadius: number;
}

function HolidayBadge({
  emoji,
  name,
  hovered,
  onEnter,
  onLeave,
  scale,
  badgeSizeClass,
}: HolidayBadgeProps) {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [center, setCenter] = useState<EmojiCenter | null>(null);

  const handleEnter = () => {
    if (badgeRef.current) {
      const r = badgeRef.current.getBoundingClientRect();
      const emojiRadius = (r.width * scale) / 2;
      setCenter({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        emojiRadius,
      });
    }
    onEnter();
  };

  return (
    <>
      {/* ── Fixed overlay: large emoji + orbital particles ── */}
      {hovered && center && (
        <div
          className="pointer-events-none fixed z-[999]"
          style={{ left: center.x, top: center.y }}
          aria-hidden="true"
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
          `}</style>

          {/* Large emoji — centered on orbit origin */}
          <span
            style={{
              position: 'absolute',
              fontSize: center.emojiRadius * 1.5,
              lineHeight: 1,
              userSelect: 'none',
              animation: 'emoji-pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          />
          {/* We render the emoji as text content in a sibling so the keyframe applies correctly */}
          <span
            style={{
              position: 'absolute',
              fontSize: center.emojiRadius * 1.5,
              lineHeight: 1,
              userSelect: 'none',
              transform: 'translate(-50%, -50%)',
              animation: 'emoji-pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            {emoji}
          </span>

          {/* Orbital particles — each is a zero-size rotating arm with a dot at its tip */}
          {ORBIT_PARTICLES.map((p, i) => {
            const radius = center.emojiRadius * p.radiusFactor;
            // Negative delay = start at startAngle position
            const delay = -((p.period * p.startAngle) / 360);
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
                    width: p.size,
                    height: p.size,
                    left: radius - p.size / 2,
                    top: -p.size / 2,
                    borderRadius: '50%',
                    background: p.color,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 5}px ${p.color}55`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Small stable trigger badge ── */}
      <span
        ref={badgeRef}
        onMouseEnter={handleEnter}
        onMouseLeave={onLeave}
        className={`absolute -bottom-1 -right-1 z-20 flex cursor-default items-center justify-center rounded-full bg-white shadow-md ring-1 ring-white/80 dark:bg-slate-800 dark:ring-slate-700 ${badgeSizeClass}`}
        title={name}
        aria-hidden="true"
        style={{ lineHeight: 1 }}
      >
        {emoji}
      </span>
    </>
  );
}

// ─── ToolHeroSectionProps ──────────────────────────────────────────────────────

interface ToolHeroSectionProps {
  toolId: string;
  toolName: string;
  toolDescription?: string;
  toolTagline?: string;
  toolPageDescription?: string;
  categoryColor: string;
  categoryId?: string;
  categoryName?: string;
  favoriteButton?: React.ReactNode;
  categoryBadge?: React.ReactNode;
  labelBadge?: React.ReactNode;
  className?: string;
}

export default function ToolHeroSection({
  toolId,
  toolName,
  toolDescription,
  toolTagline,
  toolPageDescription,
  categoryColor,
  categoryId,
  categoryName,
  favoriteButton,
  categoryBadge,
  labelBadge,
  className = '',
}: ToolHeroSectionProps) {
  const gradient = categoryGradients[categoryId || ''] || 'from-violet-500 to-purple-500';
  const [isVisible, setIsVisible] = useState(false);
  const [holidayHovered, setHolidayHovered] = useState(false);
  const holiday = getCurrentHoliday();

  const tagline = toolTagline || toolDescription;
  const pageDescription = toolPageDescription;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ── Fallback layout (no SEO data) ──────────────────────────────────────────
  if (!toolTagline && !toolPageDescription) {
    return (
      <div className={`mb-8 text-center ${className}`}>
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-all duration-500 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <Zap className="h-10 w-10 text-white" />
          </div>
          {holiday && (
            <HolidayBadge
              emoji={holiday.emoji}
              name={holiday.name}
              hovered={holidayHovered}
              onEnter={() => setHolidayHovered(true)}
              onLeave={() => setHolidayHovered(false)}
              scale={16}
              badgeSizeClass="h-6 w-6 text-sm"
            />
          )}
        </div>
        <h1
          className={`mb-2 text-3xl font-bold text-slate-900 transition-all delay-100 duration-500 dark:text-white sm:text-4xl lg:text-5xl ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {toolName}
        </h1>
        <p
          className={`mb-4 text-xl text-slate-700 transition-all delay-150 duration-500 dark:text-slate-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Professional tool for developers and power users
        </p>
        <p
          className={`mx-auto max-w-3xl text-slate-600 transition-all delay-200 duration-500 dark:text-slate-400 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Streamline your workflow with this powerful development tool designed
          for efficiency and ease of use.
        </p>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className={`mb-3 md:mb-5 ${className}`}>
      <div className="mb-2 flex items-center gap-2 sm:gap-3">
        {/* z-10 ensures the badge overlay stacks above sibling flex items */}
        <div className="relative z-10 flex-shrink-0">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-all duration-300 sm:h-14 sm:w-14 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <Sparkles className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
          {holiday && (
            <HolidayBadge
              emoji={holiday.emoji}
              name={holiday.name}
              hovered={holidayHovered}
              onEnter={() => setHolidayHovered(true)}
              onLeave={() => setHolidayHovered(false)}
              scale={14}
              badgeSizeClass="h-5 w-5 text-xs sm:h-6 sm:w-6 sm:text-sm"
            />
          )}
        </div>

        {/* Title and badges */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <h1
            className={`text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl lg:text-4xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            } transition-all delay-75 duration-300`}
          >
            {toolName}
          </h1>
          {labelBadge && <div className="flex items-center">{labelBadge}</div>}
          {favoriteButton && <div className="flex items-center">{favoriteButton}</div>}
          {categoryBadge && <div className="flex items-center">{categoryBadge}</div>}
        </div>
      </div>

      <p
        className={`mb-2 text-base text-slate-700 transition-all delay-100 duration-300 dark:text-slate-300 sm:text-lg md:mb-4 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        {tagline}
      </p>

      {pageDescription && (
        <p
          className={`hidden max-w-4xl text-sm leading-relaxed text-slate-600 transition-all delay-150 duration-300 dark:text-slate-400 sm:text-base md:block ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          {pageDescription}
        </p>
      )}

      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${categoryColor}03 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
