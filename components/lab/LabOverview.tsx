'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { getToolById } from '@/lib/tools';
import { useHydration } from '@/lib/hooks/useHydration';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';
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

interface LabOverviewProps {
  onToolSelect: (toolId: string) => void;
}

function formatTimeAgo(timestamp: number, t: any): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t?.lab?.overview?.justNow || 'Just now';
  if (minutes < 60)
    return (
      t?.lab?.overview?.minutesAgo?.replace('{minutes}', String(minutes)) ||
      `${minutes}m ago`
    );
  if (hours < 24)
    return (
      t?.lab?.overview?.hoursAgo?.replace('{hours}', String(hours)) ||
      `${hours}h ago`
    );
  return (
    t?.lab?.overview?.daysAgo?.replace('{days}', String(days)) || `${days}d ago`
  );
}

export function LabOverview({ onToolSelect }: LabOverviewProps) {
  const isHydrated = useHydration();
  const { favoriteTools, getRecentTools } = useToolStore();
  const { data: t } = useDictionarySectionContext('lab');

  const favoriteToolsData = isHydrated
    ? favoriteTools
        .map((toolId) => getToolById(toolId))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    : [];

  const recentTools = isHydrated ? getRecentTools(6) : [];

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Favorite Tools Grid */}
        <div>
          <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
            {t?.overview?.favoriteTools || 'Favorite Tools'}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favoriteToolsData.map((tool, index) => (
              <ToolOverviewCard
                key={tool.id}
                tool={tool}
                index={index}
                onClick={() => onToolSelect(tool.id)}
              />
            ))}
          </div>
        </div>

        {/* Recent Tools */}
        {recentTools.length > 0 && (
          <div>
            <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
              {t?.overview?.recentlyUsed || 'Recently Used'}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentTools.slice(0, 6).map((recentTool, index) => {
                const tool = getToolById(recentTool.id);
                if (!tool) return null;

                return (
                  <div
                    key={tool.id}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
                    onClick={() => onToolSelect(tool.id)}
                  >
                    {/* Gradient accent on hover */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Icon + Info */}
                    <div className="mb-3 flex items-start gap-4">
                      {(() => {
                        const color = categoryColors[tool.categories?.[0]] || '#6366F1';
                        return (
                          <div
                            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30`, color }}
                          >
                            <ToolIcon id={tool.id} className="h-6 w-6" />
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {tool.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {t?.overview?.used || 'Used'}{' '}
                          {formatTimeAgo(recentTool.timestamp, t)}
                        </p>
                      </div>
                    </div>

                    {/* Footer: category badge + Open CTA */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                          {tool.categories?.[0] || 'tool'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-violet-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-violet-400">
                        Open
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ToolOverviewCardProps {
  tool: any;
  index: number;
  onClick: () => void;
}

function ToolOverviewCard({ tool, index, onClick }: ToolOverviewCardProps) {
  return (
    <motion.div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      whileHover={{ y: -5 }}
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Icon + Info */}
      <div className="mb-3 flex items-start gap-4">
        {(() => {
          const color = categoryColors[tool.categories?.[0]] || '#6366F1';
          return (
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30`, color }}
            >
              <ToolIcon id={tool.id} className="h-6 w-6" />
            </div>
          );
        })()}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Footer: category badge + Open CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
            {tool.categories?.[0] || 'tool'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-violet-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-violet-400">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
}
