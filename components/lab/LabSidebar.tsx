'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { tools, getToolById } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { useHydration } from '@/lib/hooks/useHydration';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

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
    <motion.div
      className={cn(
        'flex min-h-[calc(100vh-9rem)] flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-white/[0.06] dark:bg-white/[0.02]',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-white/[0.06]">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4 fill-violet-500 text-violet-500" />
              <h2 className="text-sm font-medium text-slate-900 dark:text-white">
                {t?.sidebar?.myTools || 'My Tools'}
              </h2>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-white/[0.06]">
                {favoriteToolsData.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm font-medium"
              >
                {t?.sidebar?.overview || 'Overview'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-3">
          <AnimatePresence>
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
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="border-t border-slate-200 p-4 dark:border-white/[0.06]"
        >
          <p className="text-center text-xs text-slate-500">
            {t?.sidebar?.starToolsToAdd || 'Star tools to add them here'}
          </p>
        </motion.div>
      )}
    </motion.div>
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
    <motion.button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2 rounded-lg p-2 transition-all duration-200',
        isSelected
          ? 'border border-violet-500/20 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex-shrink-0 text-lg" title={tool.name}>
          {tool.icon}
        </span>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-w-0 flex-1"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSelected && (
        <motion.div
          className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      )}
    </motion.button>
  );
}
