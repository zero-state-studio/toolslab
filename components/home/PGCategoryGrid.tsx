'use client';

import Link from 'next/link';
import { categories } from '@/lib/tools';
import { getCategoryTheme, catColor } from '@/lib/categoryTheme';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';

interface PGCategoryGridProps {
  title?: string;
  seeAllLabel?: string;
}

export function PGCategoryGrid({
  title = 'Browse by category',
  seeAllLabel = 'View all',
}: PGCategoryGridProps) {
  const { createHref } = useLocalizedRouter();

  return (
    <section className="pg-container pb-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold tracking-[-0.3px] text-pg-text">{title}</h2>
        <Link
          href={createHref('/categories')}
          className="text-[13px] text-pg-accent hover:underline"
        >
          {seeAllLabel} ›
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat) => {
          const theme = getCategoryTheme(cat.id);
          const count = cat.tools.length;
          return (
            <Link
              key={cat.id}
              href={createHref(`/category/${cat.id}`)}
              className="group relative overflow-hidden rounded-[14px] border border-pg-border bg-pg-surface p-[18px] transition-colors hover:border-pg-border-hi"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.18] blur-lg transition-opacity group-hover:opacity-[0.28]"
                style={{ background: catColor(theme.hue, 'text', 'dark') }}
              />
              <span
                className="relative mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{
                  background: catColor(theme.hue, 'bgChip', 'dark'),
                  color: catColor(theme.hue, 'text', 'dark'),
                }}
              >
                <theme.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <div className="text-[15px] font-semibold text-pg-text">{cat.name}</div>
              <div className="mt-1 line-clamp-2 text-[12px] text-pg-muted">
                {cat.description}
              </div>
              <div className="mt-3 text-[12px] tabular-nums text-pg-dim">
                {count} tool{count === 1 ? '' : 's'}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PGCategoryGrid;
