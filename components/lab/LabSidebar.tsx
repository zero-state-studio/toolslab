'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { tools, getToolById } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
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

interface LabSidebarProps {
  selectedToolId: string | null;
  onToolSelect: (toolId: string) => void;
  onShowOverview: () => void;
}

export function LabSidebar({
  selectedToolId,
  onToolSelect,
  onShowOverview,
}: LabSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isHydrated = useHydration();
  const { favoriteTools } = useToolStore();
  const { data: t } = useDictionarySectionContext('lab');

  const favoriteToolsData = isHydrated
    ? favoriteTools
        .map((toolId) => getToolById(toolId))
        .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    : [];

  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-9rem)] flex-col border-r border-slate-200 bg-white transition-[width] duration-300 dark:border-white/[0.06] dark:bg-white/[0.02]',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-white/[0.06]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 duration-200 animate-in fade-in slide-in-from-left-2">
            <Star className="h-4 w-4 fill-violet-500 text-violet-500" />
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              {t?.sidebar?.myTools || 'My Tools'}
            </h2>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-white/[0.06]">
              {favoriteToolsData.length}
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.04]"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Overview Button */}
      <div className="border-b border-slate-200 p-3 dark:border-white/[0.06]">
        <button
          onClick={onShowOverview}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg p-2 transition-all duration-200',
            selectedToolId === null
              ? 'border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
          )}
        >
          <Grid3X3 className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium duration-200 animate-in fade-in slide-in-from-left-2">
              {t?.sidebar?.overview || 'Overview'}
            </span>
          )}
        </button>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-3">
          {favoriteToolsData.map((tool, index) => (
            <ToolSidebarItem
              key={tool.id}
              tool={tool}
              isSelected={selectedToolId === tool.id}
              isCollapsed={isCollapsed}
              index={index}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-slate-200 p-4 duration-200 animate-in fade-in dark:border-white/[0.06]">
          <p className="text-center text-xs text-slate-500">
            {t?.sidebar?.starToolsToAdd || 'Star tools to add them here'}
          </p>
        </div>
      )}
    </div>
  );
}

interface ToolSidebarItemProps {
  tool: any;
  isSelected: boolean;
  isCollapsed: boolean;
  index: number;
  onClick: () => void;
}

function ToolSidebarItem({
  tool,
  isSelected,
  isCollapsed,
  index,
  onClick,
}: ToolSidebarItemProps) {
  const toolLabel = useToolLabel(tool.id);
  const { getToolLabelInfo } = useToolLabels();
  const labelConfig = getToolLabelInfo(toolLabel);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2 rounded-lg p-2 transition-all duration-200 animate-in fade-in slide-in-from-left-2 fill-mode-backwards hover:scale-[1.02] active:scale-[0.98]',
        isSelected
          ? 'border border-violet-500/20 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ToolIcon
          id={tool.id}
          className="h-4 w-4 flex-shrink-0"
          style={{ color: isSelected ? undefined : (categoryColors[tool.categories?.[0]] || '#6366F1') }}
        />

        {!isCollapsed && (
          <div className="min-w-0 flex-1 duration-200 animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {tool.name}
              </span>
              {tool.label && labelConfig.config && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-medium',
                    labelConfig.config.className
                  )}
                >
                  {labelConfig.config.text}
                </span>
              )}
            </div>
            <p className="truncate text-left text-xs text-slate-500 dark:text-slate-400">
              {tool.description}
            </p>
          </div>
        )}
      </div>

      {isSelected && (
        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-500 duration-200 animate-in zoom-in" />
      )}
    </button>
  );
}
