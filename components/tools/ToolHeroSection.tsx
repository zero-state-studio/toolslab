'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { getCurrentHoliday } from '@/lib/utils/holidays';
import { HolidayOverlay } from '@/components/ui/HolidayOverlay';
import type { HolidayDecoration } from '@/lib/utils/holidays';

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

// ─── Small hover badge ─────────────────────────────────────────────────────────

interface HolidayBadgeProps {
  holiday: HolidayDecoration;
  onHover: (v: boolean) => void;
  badgeSizeClass: string;
}

function HolidayBadge({ holiday, onHover, badgeSizeClass }: HolidayBadgeProps) {
  return (
    <span
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`absolute -bottom-1 -right-1 z-20 flex cursor-default items-center justify-center rounded-full bg-white shadow-md ring-1 ring-white/80 dark:bg-slate-800 dark:ring-slate-700 ${badgeSizeClass}`}
      title={holiday.greeting}
      aria-hidden="true"
      style={{ lineHeight: 1 }}
    >
      {holiday.emoji}
    </span>
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
  locale?: string;
}

// Localized label for the "About this tool" disclosure. The descriptive copy
// itself comes from the per-tool i18n JSON; only this summary toggle label
// lives here, so it's translated inline (same pattern as other hub UI strings).
const aboutLabelByLocale: Record<string, string> = {
  en: 'About this tool',
  it: 'Informazioni sullo strumento',
  es: 'Acerca de esta herramienta',
  fr: 'À propos de cet outil',
  de: 'Über dieses Tool',
  pt: 'Sobre esta ferramenta',
};

export default function ToolHeroSection({
  toolId,
  toolName,
  toolDescription,
  toolTagline,
  toolPageDescription,
  categoryColor,
  categoryId,
  favoriteButton,
  categoryBadge,
  labelBadge,
  className = '',
  locale = 'en',
}: ToolHeroSectionProps) {
  const aboutLabel = aboutLabelByLocale[locale] ?? aboutLabelByLocale.en;
  const gradient = categoryGradients[categoryId || ''] || 'from-violet-500 to-purple-500';
  const [isVisible, setIsVisible] = useState(false);
  const [holidayHovered, setHolidayHovered] = useState(false);
  const holiday = getCurrentHoliday();

  const tagline = toolTagline || toolDescription;
  const pageDescription = toolPageDescription;

  useEffect(() => { setIsVisible(true); }, []);

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
              holiday={holiday}
              onHover={setHolidayHovered}
              badgeSizeClass="h-6 w-6 text-sm"
            />
          )}
        </div>

        {holiday && (
          <HolidayOverlay
            holiday={holiday}
            open={holidayHovered}
            emojiRadius={160}
          />
        )}

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
    <div className={`mb-2 ${className}`}>
      {holiday && (
        <HolidayOverlay
          holiday={holiday}
          open={holidayHovered}
          emojiRadius={160}
        />
      )}

      <div className="mb-1.5 flex items-start gap-2.5 sm:items-center">
        {/* z-10 ensures stacking above sibling flex items */}
        <div className="relative z-10 flex-shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md transition-all duration-300 sm:h-10 sm:w-10 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          {holiday && (
            <HolidayBadge
              holiday={holiday}
              onHover={setHolidayHovered}
              badgeSizeClass="h-5 w-5 text-xs sm:h-6 sm:w-6 sm:text-sm"
            />
          )}
        </div>

        {/* Title and badges */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 pt-1.5 sm:gap-x-3 sm:pt-0">
          <h1
            className={`text-lg font-bold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-2xl ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            } transition-all delay-75 duration-300`}
          >
            {toolName}
          </h1>
          {labelBadge && <div className="flex items-center">{labelBadge}</div>}
          {favoriteButton && (
            <div className="hidden items-center sm:flex">{favoriteButton}</div>
          )}
          {categoryBadge && (
            <div className="hidden items-center sm:flex">{categoryBadge}</div>
          )}
        </div>
      </div>

      <p
        className={`text-sm text-slate-600 transition-all delay-100 duration-300 dark:text-slate-400 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        {tagline}
      </p>

      {pageDescription && (
        <details className="group mt-2 max-w-4xl">
          <summary className="cursor-pointer list-none text-xs font-medium text-pg-muted transition-colors hover:text-pg-text">
            <span className="inline-flex items-center gap-1">
              {aboutLabel}
              <span className="transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {pageDescription}
          </p>
        </details>
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
