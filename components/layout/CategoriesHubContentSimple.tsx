'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, Rows3, TrendingUp, Flame } from 'lucide-react';
import { categories } from '@/lib/tools';
import { getCategoryTheme, catChipVars, catHeroVars } from '@/lib/categoryTheme';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

interface CategoriesHubContentSimpleProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

interface CategoryWithStats {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: typeof categories[number]['tools'];
  toolCount: number;
  topTool: typeof categories[number]['tools'][number] | null;
  totalSearchVolume: number;
}

export default function CategoriesHubContentSimple(
  _props?: CategoriesHubContentSimpleProps
) {
  const { createHref } = useLocalizedRouter();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const enriched: CategoryWithStats[] = useMemo(
    () =>
      categories.map((cat) => {
        const tools = cat.tools.filter((t) => t.label !== 'coming-soon');
        const sorted = [...tools].sort(
          (a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0)
        );
        const totalSearchVolume = tools.reduce(
          (sum, t) => sum + (t.searchVolume ?? 0),
          0
        );
        return {
          ...cat,
          toolCount: tools.length,
          topTool: sorted[0] ?? null,
          totalSearchVolume,
        };
      }),
    []
  );

  const totals = useMemo(
    () => ({
      tools: enriched.reduce((sum, c) => sum + c.toolCount, 0),
      searches: enriched.reduce((sum, c) => sum + c.totalSearchVolume, 0),
    }),
    [enriched]
  );

  const trending = useMemo(
    () => [...enriched].sort((a, b) => b.totalSearchVolume - a.totalSearchVolume).slice(0, 3),
    [enriched]
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return enriched;
    const query = q.toLowerCase();
    return enriched.filter((c) => {
      if (c.name.toLowerCase().includes(query)) return true;
      if (c.description.toLowerCase().includes(query)) return true;
      return c.tools.some((t) => t.name.toLowerCase().includes(query));
    });
  }, [q, enriched]);

  const formatSearches = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return String(n);
  };

  return (
    <div className="pg-container py-12">
      <div className="mb-8">
        <div className="mb-2 text-[13px] text-pg-muted">
          <Link href={createHref('/')} className="hover:text-pg-text">Home</Link>{' '}
          › <span className="text-pg-text">Categories</span>
        </div>
        <h1 className="text-[44px] font-bold leading-tight tracking-[-0.025em] text-pg-text">
          Categories<span className="font-medium text-pg-muted"> · {categories.length}</span>
        </h1>
        <p className="mt-1 text-[16px] text-pg-muted">
          Every tool grouped by what it does. Pick a lane.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-pg-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono tabular-nums text-pg-text">{totals.tools}</span>
            tools
          </span>
          <span aria-hidden className="text-pg-dim">·</span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-pg-accent-4" />
            <span className="font-mono tabular-nums text-pg-text">
              {formatSearches(totals.searches)}
            </span>
            monthly searches
          </span>
          <span aria-hidden className="text-pg-dim">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-pg-accent-3" />
            trending
            {trending.map((c, i) => (
              <span key={c.id} className="text-pg-text">
                {c.name}
                {i < trending.length - 1 ? ',' : ''}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter categories…"
            className="w-full rounded-[10px] border border-pg-border bg-pg-surface py-2.5 pl-9 pr-3 text-[14px] text-pg-text outline-none placeholder:text-pg-muted focus:border-pg-border-hi"
          />
        </div>
        <div className="flex items-center gap-1 rounded-[10px] border border-pg-border bg-pg-surface p-1">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
              view === 'grid'
                ? 'bg-pg-surface-hi text-pg-text'
                : 'text-pg-muted hover:text-pg-text'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
              view === 'list'
                ? 'bg-pg-surface-hi text-pg-text'
                : 'text-pg-muted hover:text-pg-text'
            )}
            aria-label="List view"
          >
            <Rows3 className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        className={cn(
          'grid gap-4',
          view === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        )}
      >
        {filtered.map((cat) => {
          const theme = getCategoryTheme(cat.id);
          const first = cat.tools.slice(0, 4);
          const rest = Math.max(cat.tools.length - first.length, 0);
          return (
            <Link
              key={cat.id}
              href={createHref(`/category/${cat.id}`)}
              className="group relative overflow-hidden rounded-pg-panel border border-pg-border bg-pg-surface p-6 transition-colors hover:border-pg-border-hi"
            >
              <span
                aria-hidden
                className="cat-glow pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-25 blur-2xl"
                style={catHeroVars(theme.hue)}
              />

              <div className="relative flex items-start gap-4">
                <span
                  className="cat-chip flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[12px]"
                  style={catChipVars(theme.hue)}
                >
                  <theme.icon className="h-6 w-6" strokeWidth={1.8} />
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold text-pg-text">{cat.name}</h3>
                    <span className="text-[12px] tabular-nums text-pg-dim">
                      {cat.toolCount} {cat.toolCount === 1 ? 'tool' : 'tools'}
                    </span>
                    {cat.totalSearchVolume > 0 && (
                      <span className="text-[12px] tabular-nums text-pg-dim">
                        · {formatSearches(cat.totalSearchVolume)}/mo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-pg-muted">{cat.description}</p>

                  {cat.topTool && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-pg-muted">
                      <Flame className="h-3 w-3 text-pg-accent-3" />
                      <span>Top:</span>
                      <span className="font-medium text-pg-text">
                        {cat.topTool.name}
                      </span>
                    </div>
                  )}

                  {first.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {first.map((t) => (
                        <span
                          key={t.id}
                          className="rounded-[6px] border border-pg-border bg-[color:var(--pg-bg)] px-2.5 py-1 text-[12px] text-pg-muted"
                        >
                          {t.name}
                        </span>
                      ))}
                      {rest > 0 && (
                        <span className="px-2 py-1 text-[12px] text-pg-accent">
                          +{rest} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
