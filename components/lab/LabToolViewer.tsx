'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { getToolById } from '@/lib/tools';
import ToolWorkspace from '@/components/tools/ToolWorkspace';
import ToolHeroSection from '@/components/tools/ToolHeroSection';
import ToolHowToUse from '@/components/tools/ToolHowToUse';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/ui/ToolIcon';
import Link from 'next/link';

interface LabToolViewerProps {
  toolId: string;
  onBack: () => void;
}

export function LabToolViewer({ toolId, onBack }: LabToolViewerProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  const tool = getToolById(toolId);
  const toolLabel = useToolLabel(toolId);
  const { getToolLabelInfo } = useToolLabels();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tool) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
          <div className="mb-8 h-4 w-2/3 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
          <div className="h-64 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
        </div>
      </div>
    );
  }

  const labelConfig = getToolLabelInfo(toolLabel);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden duration-300 animate-in fade-in slide-in-from-right-2">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-card">
        <div className="flex items-center justify-between gap-4">
          {/* Tool identity */}
          <div className="flex min-w-0 items-center gap-3">
            <ToolIcon id={tool.id} className="h-6 w-6 flex-shrink-0 text-slate-700 dark:text-slate-300" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {tool.name}
                </h1>
                {tool.label && labelConfig.config && (
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      labelConfig.config.className
                    )}
                  >
                    {labelConfig.config.text}
                  </span>
                )}
              </div>
              <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                {tool.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                showInstructions
                  ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]'
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">How to use</span>
            </button>

            <Link
              href={tool.route}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in new tab</span>
            </Link>

            <FavoriteButton type="tool" id={tool.id} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showInstructions ? (
          <div
            key="instructions"
            className="h-full overflow-y-auto p-6 duration-200 animate-in fade-in slide-in-from-bottom-3"
          >
            <ToolHowToUse toolId={tool.id} categoryColor="purple" />
          </div>
        ) : (
          <div
            key="tool"
            className="h-full p-4 duration-200 animate-in fade-in slide-in-from-bottom-3 sm:p-6"
          >
              <ToolWorkspace
                tool={
                  {
                    ...tool,
                    slug: tool.id,
                    category: tool.categories[0] || 'dev',
                  } as any
                }
                categoryColor="purple"
                isLabMode={true}
              />
          </div>
        )}
      </div>
    </div>
  );
}
