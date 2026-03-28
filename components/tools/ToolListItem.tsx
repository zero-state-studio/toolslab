'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { type Tool } from '@/lib/tools';
import { useLocale } from '@/hooks/useLocale';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { ToolIcon } from '@/components/ui/ToolIcon';

const categoryColors: Record<string, string> = {
  data: '#0EA5E9',
  encoding: '#10B981',
  base64: '#14B8A6',
  text: '#8B5CF6',
  generators: '#F97316',
  web: '#EC4899',
  dev: '#F59E0B',
  formatters: '#6366F1',
  social: '#F43F5E',
  pdf: '#EF4444',
};

interface ToolListItemProps {
  tool: Tool;
  dictionary?: any;
}

export function ToolListItem({ tool, dictionary }: ToolListItemProps) {
  const { createHref } = useLocale();
  const color = categoryColors[tool.categories[0]] || '#6366F1';

  const translatedTool = dictionary?.tools?.[tool.id] || {
    title: tool.name,
    description: tool.description,
  };

  const categoryId = tool.categories[0];
  const translatedCategory =
    dictionary?.categories?.[categoryId]?.name || categoryId;

  if (tool.label === 'coming-soon') {
    return (
      <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 opacity-60 dark:border-white/[0.04] dark:bg-white/[0.01]">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25`, color }}
        >
          <ToolIcon id={tool.id} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-500">
            {translatedTool.title}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">Coming soon</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03]">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link href={createHref(tool.route)} className="group block">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]">
        {/* Top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Tool icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
            color,
          }}
        >
          <ToolIcon id={tool.id} className="h-5 w-5" />
        </div>

        {/* Tool info */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {translatedTool.title}
            </span>
            {tool.label === 'popular' && (
              <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Popular
              </span>
            )}
            {tool.label === 'new' && (
              <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                New
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
            {translatedTool.description}
          </p>
        </div>

        {/* Category badge (tablet+) */}
        <div className="hidden flex-shrink-0 sm:block">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${color}10`,
              color,
            }}
          >
            {translatedCategory}
          </span>
        </div>

        {/* Favorite button (tablet+) */}
        <div
          className="hidden flex-shrink-0 sm:block"
          onClick={(e) => e.preventDefault()}
        >
          <FavoriteButton type="tool" id={tool.id} name={tool.name} size="sm" />
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-violet-400 dark:text-slate-600" />
      </div>
    </Link>
  );
}
