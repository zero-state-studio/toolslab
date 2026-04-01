import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { ToolLabel } from '@/lib/edge-config/types';
import { useLocale } from '@/hooks/useLocale';
import { useDictionary } from '@/hooks/useDictionary';

// Category gradient — one thin top-border per card gives a light color note
const categoryGradients: Record<string, string> = {
  data: 'from-blue-500 to-cyan-500',
  encoding: 'from-emerald-500 to-green-500',
  base64: 'from-teal-500 to-cyan-500',
  text: 'from-purple-500 to-pink-500',
  web: 'from-pink-500 to-rose-500',
  dev: 'from-amber-500 to-orange-500',
  generators: 'from-orange-500 to-red-500',
  formatters: 'from-indigo-500 to-purple-500',
  social: 'from-rose-500 to-pink-500',
  pdf: 'from-red-600 to-orange-600',
};

interface ToolCardProps {
  tool: Tool;
  className?: string;
  showStats?: boolean;
  toolLabel?: ToolLabel;
}

export function ToolCard({
  tool,
  className,
  showStats = false,
  toolLabel,
}: ToolCardProps) {
  const { getToolLabelInfo, getLabelComponent } = useToolLabels();
  const labelInfo = getToolLabelInfo(toolLabel);
  const { createHref } = useLocale();
  const { dictionary } = useDictionary();

  // Translations
  const translatedTool = dictionary?.tools?.[tool.id] || {
    title: tool.name,
    description: tool.description,
  };
  const categoryId = tool.categories[0];
  const translatedCategory =
    dictionary?.categories?.[categoryId]?.name || categoryId;
  const gradient = categoryGradients[categoryId] || 'from-violet-500 to-violet-400';
  const comingSoonMessage =
    (dictionary?.common?.messages as any)?.comingSoon ||
    'This tool is coming soon. Stay tuned for updates!';

  // Coming-soon variant
  if (!labelInfo.isClickable) {
    return (
      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-60 dark:border-white/[0.05] dark:bg-white/[0.01]',
          className
        )}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.05]">
            <ToolIcon id={tool.id} className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 text-sm font-semibold text-slate-500 dark:text-slate-500 leading-tight">
              {translatedTool.title}
            </h3>
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-500">
              {translatedCategory}
            </span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-600 line-clamp-2">
          {comingSoonMessage}
        </p>
      </div>
    );
  }

  return (
    <Link href={createHref(tool.route)} className={cn('group block h-full', className)}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]">
        {/* Category color top accent — always visible */}
        <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradient}`} />

        {/* Header: icon + label badge + favorite */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {/* Icon — neutral style like FeaturedTools */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 transition-transform duration-200 group-hover:scale-105 dark:border-white/[0.08] dark:bg-white/[0.05]">
              <ToolIcon id={tool.id} className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>

            {/* Label badge (popular / new) */}
            {labelInfo.hasLabel && (
              <div className="mt-0.5 flex-shrink-0">
                {getLabelComponent(toolLabel, 'xs')}
              </div>
            )}
          </div>

          {/* Favorite button */}
          <div className="z-20 flex-shrink-0">
            <FavoriteButton
              type="tool"
              id={tool.id}
              name={tool.name}
              size="sm"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1.5 text-sm font-semibold leading-tight text-slate-900 dark:text-white">
          {translatedTool.title}
        </h3>

        {/* Category badge — neutral style */}
        <div className="mb-3">
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
            {translatedCategory}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {translatedTool.description}
        </p>

        {/* Keywords */}
        {tool.keywords && tool.keywords.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1">
            {tool.keywords.slice(0, 3).map((keyword) => (
              <span
                key={keyword}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-slate-500"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* "Try now" CTA — visible on hover */}
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-violet-400">
          Try now
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
