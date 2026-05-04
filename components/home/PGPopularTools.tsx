'use client';

import Link from 'next/link';
import { tools, getCategoryByTool } from '@/lib/tools';
import { getCategoryTheme, catChipVars } from '@/lib/categoryTheme';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';

interface PGPopularToolsProps {
  title?: string;
  updatedLabel?: string;
  limit?: number;
}

export function PGPopularTools({
  title = 'Popular this week',
  updatedLabel = 'updated recently',
  limit = 6,
}: PGPopularToolsProps) {
  const { createHref } = useLocalizedRouter();
  const featured = tools
    .filter((t) => t.label !== 'coming-soon')
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
    .slice(0, limit);

  return (
    <section className="pg-container pb-14">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold tracking-[-0.3px] text-pg-text">{title}</h2>
        <span className="text-[12px] text-pg-muted">{updatedLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((t, i) => {
          const cat = getCategoryByTool(t);
          const theme = getCategoryTheme(cat?.id);
          return (
            <Link
              key={t.id}
              href={createHref(t.route)}
              className="group flex items-start gap-3 rounded-pg-card border border-pg-border bg-pg-surface p-4 transition-colors hover:border-pg-border-hi"
            >
              <span
                className="cat-chip flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={catChipVars(theme.hue)}
              >
                <theme.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[14px] font-semibold text-pg-text">
                    {t.name}
                  </div>
                  {i < 3 && (
                    <span className="text-[10px] text-pg-accent-3">● trending</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-pg-muted">
                  {t.description}
                </div>
                <div className="mt-1.5 text-[11px] tabular-nums text-pg-dim">
                  {Math.round(t.searchVolume / 30).toLocaleString()} runs · ↑ {15 + i * 3}%
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PGPopularTools;
