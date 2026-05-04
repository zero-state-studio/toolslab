'use client';

import { useEffect } from 'react';
import { Sparkles, Github, ArrowRight } from 'lucide-react';
import { TLMascot } from '@/components/icons/TLMascot';
import { catChipVars, catHeroVars } from '@/lib/categoryTheme';
import { trackEngagement } from '@/lib/analytics';

type Tag = 'beta' | 'new' | 'alpha' | 'stable';

interface Experiment {
  name: string;
  desc: string;
  tag: Tag;
  hue: number;
  href?: string;
}

const FEATURED = {
  name: 'AI Regex Builder',
  description:
    "Describe the pattern in plain English. We'll give you the regex, a live test bed, and explain each group.",
  promptLabel: '# describe',
  promptText: 'email addresses from common providers',
  outputLabel: '# regex',
  outputText: '/^[\\w.-]+@(gmail|outlook|yahoo)\\.\\w+$/',
};

const EXPERIMENTS: Experiment[] = [
  { name: 'AI Regex Builder',       desc: 'Describe what you want to match, get the regex',  tag: 'beta',   hue: 280 },
  { name: 'Image Background Remover', desc: 'One click, fully local, no upload',              tag: 'new',    hue: 200 },
  { name: 'SVG Animator',           desc: 'Animate SVG paths with a timeline UI',             tag: 'alpha',  hue: 45  },
  { name: 'Color Palette Gen',      desc: 'Extract palettes from any image, OKLCH ready',     tag: 'stable', hue: 150 },
  { name: 'Markdown ↔ Slides',      desc: 'Turn markdown into a presentation, live preview',  tag: 'beta',   hue: 330 },
  { name: 'Database Schema Viz',    desc: 'Paste SQL, get an ER diagram',                     tag: 'alpha',  hue: 8   },
];

const TAG_STYLE: Record<Tag, { bg: string; color: string }> = {
  alpha:  { bg: 'color-mix(in oklab, var(--pg-accent-2) 22%, transparent)', color: 'var(--pg-accent-2)' },
  beta:   { bg: 'color-mix(in oklab, var(--pg-accent-3) 22%, transparent)', color: 'var(--pg-accent-3)' },
  new:    { bg: 'color-mix(in oklab, var(--pg-accent)   22%, transparent)', color: 'var(--pg-accent)'   },
  stable: { bg: 'color-mix(in oklab, var(--pg-accent-4) 22%, transparent)', color: 'var(--pg-accent-4)' },
};

export default function NewLabHubContent() {
  useEffect(() => {
    trackEngagement('lab-page-viewed', { variant: 'experiments' });
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--pg-bg)]">
      <div className="pg-container pb-16 pt-12">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="mb-10 flex items-end gap-5">
          <div className="flex-1">
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{
                background: 'color-mix(in oklab, var(--pg-accent-2) 22%, transparent)',
                color: 'var(--pg-accent-2)',
              }}
            >
              <Sparkles className="h-3 w-3" /> EXPERIMENTAL
            </div>
            <h1 className="m-0 text-[clamp(38px,6vw,52px)] font-bold leading-[1] tracking-[-0.04em] text-pg-text">
              The Lab
            </h1>
            <p className="mt-3 max-w-[520px] text-[16px] leading-relaxed text-pg-muted">
              Where we cook up weird, ambitious tools. Some will graduate —
              others will blow up. All of them run locally.
            </p>
          </div>
          <div className="hidden sm:block">
            <TLMascot size={140} mood="curious" />
          </div>
        </div>

        {/* ── FEATURED CARD ─────────────────────────────────────── */}
        <div
          className="relative mb-6 overflow-hidden rounded-pg-hero border p-8"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklab, var(--pg-accent) 33%, transparent) 0%, color-mix(in oklab, var(--pg-accent-2) 33%, transparent) 50%, color-mix(in oklab, var(--pg-accent-3) 22%, transparent) 100%)',
            borderColor: 'var(--pg-border-hi)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--pg-accent-2) 60%, transparent) 0%, transparent 70%)',
            }}
          />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div
                className="mb-2 text-[11px] font-bold tracking-[1px]"
                style={{ color: 'var(--pg-accent-3)' }}
              >
                ⚡ FEATURED THIS MONTH
              </div>
              <h2 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.02em] text-pg-text sm:text-[30px]">
                {FEATURED.name}
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-pg-muted">
                {FEATURED.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-pg-pill bg-pg-text px-4 py-2.5 text-[13px] font-semibold text-pg-bg"
                >
                  Try it
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-pg-pill border border-pg-border-hi bg-transparent px-4 py-2.5 text-[13px] text-pg-text"
                >
                  How it works
                </button>
              </div>
            </div>
            <div
              className="rounded-pg-card border border-pg-border bg-pg-bg p-4 font-mono text-[12px]"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              <div className="text-pg-dim">{FEATURED.promptLabel}</div>
              <div className="mt-1 text-pg-text">{FEATURED.promptText}</div>
              <div className="mt-3 text-pg-dim">{FEATURED.outputLabel}</div>
              <div className="mt-1" style={{ color: 'var(--pg-accent-4)' }}>
                {FEATURED.outputText}
              </div>
            </div>
          </div>
        </div>

        {/* ── ALL EXPERIMENTS ───────────────────────────────────── */}
        <div className="mb-3 text-[13px] uppercase tracking-[0.8px] text-pg-muted">
          All experiments
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIMENTS.map((e) => (
            <div
              key={e.name}
              className="relative overflow-hidden rounded-pg-bar border border-pg-border bg-pg-surface p-[18px]"
            >
              <span
                aria-hidden
                className="cat-glow pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-25 blur-xl"
                style={catHeroVars(e.hue)}
              />
              <div className="relative">
                <div className="mb-2.5 flex items-center justify-between">
                  <span
                    className="cat-chip flex h-8 w-8 items-center justify-center rounded-[8px]"
                    style={catChipVars(e.hue)}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span
                    className="rounded px-2 py-[3px] text-[10px] font-bold tracking-[0.5px]"
                    style={{
                      background: TAG_STYLE[e.tag].bg,
                      color: TAG_STYLE[e.tag].color,
                    }}
                  >
                    {e.tag.toUpperCase()}
                  </span>
                </div>
                <div className="text-[16px] font-bold text-pg-text">{e.name}</div>
                <div className="mt-1 text-[13px] leading-snug text-pg-muted">
                  {e.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SUGGESTION BOX ────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center gap-5 rounded-pg-panel border border-dashed border-pg-border-hi bg-pg-surface p-6 sm:flex-row">
          <TLMascot size={64} mood="happy" />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[16px] font-semibold text-pg-text">
              Got an idea for a tool?
            </div>
            <div className="mt-1 text-[13px] text-pg-muted">
              Drop it on GitHub — the weirder, the better. Top voted ideas ship next.
            </div>
          </div>
          <a
            href="https://github.com/zero-state-studio/toolslab/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pg-pill bg-pg-text px-4 py-2.5 text-[13px] font-semibold text-pg-bg"
          >
            <Github className="h-3.5 w-3.5" />
            Suggest a tool
          </a>
        </div>
      </div>
    </div>
  );
}
