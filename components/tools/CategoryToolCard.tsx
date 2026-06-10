'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { type Tool } from '@/lib/tools';
import { catChipVars } from '@/lib/categoryTheme';
import type { LucideIcon } from 'lucide-react';

interface CategoryToolCardProps {
  tool: Tool;
  hue: number;
  Icon: LucideIcon;
  href?: string;
  runsWord?: string;
}

export function CategoryToolCard({
  tool,
  hue,
  Icon,
  href,
  runsWord = 'runs',
}: CategoryToolCardProps) {
  const isHot = tool.label === 'popular';
  const isComingSoon = tool.label === 'coming-soon';
  const runs = Math.max(1, Math.round((tool.searchVolume ?? 1500) / 30));
  const runsLabel =
    runs >= 1000
      ? `~${Math.round(runs / 1000)}k ${runsWord}`
      : `~${runs} ${runsWord}`;

  const Wrapper: any = isComingSoon ? 'div' : Link;
  const wrapperProps = isComingSoon
    ? { className: 'pointer-events-none opacity-60' }
    : { href: href ?? tool.route };

  return (
    <Wrapper
      {...wrapperProps}
      className={
        'group relative flex flex-col rounded-pg-card border border-pg-border bg-pg-surface p-4 transition-colors hover:border-pg-border-hi ' +
        (wrapperProps.className || '')
      }
    >
      {isHot && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px]"
          style={{
            background: 'color-mix(in oklab, var(--pg-accent-3) 22%, transparent)',
            color: 'var(--pg-accent-3)',
          }}
        >
          HOT
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <span
          className="cat-chip flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]"
          style={catChipVars(hue)}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <div className="truncate text-[14px] font-semibold text-pg-text">
            {tool.name}
          </div>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] text-pg-muted">
        {tool.description}
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] tabular-nums text-pg-dim">
        <span>{runsLabel}</span>
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </div>
    </Wrapper>
  );
}

export default CategoryToolCard;
