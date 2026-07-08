'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tools as allTools } from '@/lib/tools';
import { TLMascot } from '@/components/icons/TLMascot';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';

// Loaded on first open — keeps the palette + radix dialog out of the
// homepage first-load bundle.
const CommandPalette = dynamic(
  () =>
    import('@/components/CommandPalette').then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false }
);

interface PGHeroProps {
  title?: string;
  subtitle?: string;
  toolCount?: number;
}

const quickChips = [
  { label: 'JSON Formatter', q: 'json' },
  { label: 'Base64',         q: 'base64' },
  { label: 'JPG to PDF',     q: 'jpg pdf' },
  { label: 'cURL to Code',   q: 'curl' },
  { label: 'UUID',           q: 'uuid' },
];

export function PGHero({
  title = 'Every dev tool,',
  subtitle = 'Fast, free, no sign-up. Every file stays on your machine.',
  toolCount,
}: PGHeroProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Latch: mount the (lazy) palette on first open, keep it mounted afterwards
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [, setLocalQ] = useState('');

  useEffect(() => {
    if (paletteOpen) setPaletteLoaded(true);
  }, [paletteOpen]);
  const router = useRouter();
  const { createHref } = useLocalizedRouter();
  const total = toolCount ?? allTools.filter((t) => t.label !== 'coming-soon').length;

  return (
    <section className="relative overflow-hidden">
      {/* Playful blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-10 h-[280px] w-[280px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, var(--pg-accent-2) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-20 top-16 h-[200px] w-[200px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, var(--pg-accent) 0%, transparent 70%)' }}
      />

      <div className="pg-container relative pt-14 pb-12">
        <div className="mx-auto max-w-[960px] text-center">
          {/* pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pg-border bg-pg-surface px-3 py-1.5 text-[13px] text-pg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-pg-accent-4" />
            {total} tools · runs entirely in your browser
          </div>

          {/* mascot */}
          <div className="mb-2 flex justify-center">
            <TLMascot size={110} />
          </div>

          {/* headline */}
          <h1 className="mb-4 text-[clamp(40px,7vw,68px)] font-bold leading-[1.02] tracking-[-0.045em] text-pg-text">
            {title}
            <br />
            <span className="pg-headline-gradient">one tidy lab.</span>
          </h1>

          <p className="mx-auto mb-7 max-w-[560px] text-[18px] leading-[1.5] text-pg-muted">
            {subtitle}
          </p>

          {/* Big search trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            onMouseEnter={() => setPaletteLoaded(true)}
            onFocus={() => setPaletteLoaded(true)}
            className={cn(
              'mx-auto flex w-full max-w-[560px] items-center gap-3 rounded-[14px] border border-pg-border-hi bg-pg-surface px-[18px] py-[14px] text-left',
              'shadow-[var(--pg-shadow-search-glow),0_1px_0_rgba(255,255,255,0.03)_inset]',
              'transition-colors hover:border-pg-accent/40'
            )}
            aria-label="Open search"
          >
            <Search className="h-[18px] w-[18px] text-pg-muted" />
            <span className="flex-1 text-[16px] text-pg-muted">
              Type to find a tool — try ‘json’ or ‘base64’
            </span>
            <span className="pg-kbd">⌘K</span>
          </button>

          {/* Quick chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {quickChips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => { setLocalQ(c.q); setPaletteOpen(true); }}
                className="rounded-full border border-pg-border bg-pg-surface-hi px-3 py-1.5 text-[12px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {paletteLoaded && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </section>
  );
}

export default PGHero;
