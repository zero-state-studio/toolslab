'use client';

import { Tool, getCategoryColorClass, getCategoryByTool } from '@/lib/tools';
import { ToolIcon } from '@/components/ui/ToolIcon';
import {
  ArrowLeft,
  Clock,
  Star,
  Copy,
  Download,
  Upload,
  RotateCw,
  Maximize2,
  Share2,
  History,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useToolStore } from '@/lib/store/toolStore';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useHydration } from '@/lib/hooks/useHydration';

interface ToolLayoutProps {
  tool: Tool;
  children?: React.ReactNode;
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  const isHydrated = useHydration();
  const { history, addToHistory, getUserLevel } = useToolStore();
  const [recentUses, setRecentUses] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<
    'first_time' | 'returning' | 'power'
  >('first_time');
  const categoryClass = getCategoryColorClass(tool.categories[0]);
  const category = getCategoryByTool(tool);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    const toolHistory = history.filter((h) => h.tool === tool.id);
    setRecentUses(toolHistory.length);
    setUserLevel(getUserLevel());
  }, [isHydrated, history, tool.id, getUserLevel]);

  const handleToolUse = (input: string, output: string) => {
    addToHistory({
      id: `${Date.now()}-${Math.random()}`,
      tool: tool.id,
      input,
      output,
      timestamp: Date.now(),
    });
  };

  return (
    <div className={cn('min-h-screen', categoryClass)}>
      <div className="container-main py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center space-x-2 text-sm">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tools</span>
          </Link>
          <span className="text-gray-400">/</span>
          {category && (
            <>
              <Link
                href={`/?category=${category.id}`}
                className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                style={{ color: `var(--category-primary)` }}
              >
                {category.name}
              </Link>
              <span className="text-gray-400">/</span>
            </>
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {tool.name}
          </span>
        </nav>

        {/* Tool Header */}
        <div className="tool-header">
          <div className="tool-icon-container">
            <ToolIcon id={tool.id} className="h-9 w-9 text-slate-700 dark:text-slate-300" />
          </div>

          <div className="tool-content">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="tool-title">{tool.name}</h1>
                <div className="mb-4 flex items-center gap-3">
                  <div className="badge badge-category">
                    {category?.name || tool.categories[0]}
                  </div>
                  {tool.label === 'popular' && (
                    <div className="badge badge-popular flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Popular
                    </div>
                  )}
                </div>
              </div>

              {/* Tool Actions */}
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button className="btn btn-secondary flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </button>
              </div>
            </div>

            <p className="tool-description">{tool.description}</p>

            <div className="tool-meta">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{recentUses} uses</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span className="capitalize">
                  {userLevel.replace('_', ' ')} user
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{(tool.searchVolume / 100).toFixed(1)}k uses today</span>
              </div>
            </div>

            <div className="tool-keywords">
              {tool.keywords.map((keyword) => (
                <span key={keyword} className="badge badge-category">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Content */}
        {children ? (
          <div className="tool-workspace">{children}</div>
        ) : (
          <div className="tool-workspace">
            {/* Input Panel */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-label">
                  <Upload className="h-4 w-4" />
                  <span>Input</span>
                </div>
                <div className="tool-panel-actions">
                  <button className="btn btn-secondary btn-sm">
                    <Upload className="h-4 w-4" />
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <textarea
                className="textarea textarea-input input-category"
                placeholder="Paste or type your input here..."
                rows={12}
              />

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  0 characters
                </div>
                <button className="btn btn-category">
                  <RotateCw className="mr-2 h-4 w-4" />
                  Process
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <div className="tool-panel-label">
                  <Download className="h-4 w-4" />
                  <span>Output</span>
                </div>
                <div className="tool-panel-actions">
                  <button className="btn btn-secondary btn-sm">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <textarea
                className="textarea textarea-output input-category"
                placeholder="Processed output will appear here..."
                rows={12}
                readOnly
              />

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ready to copy
                </div>
                <button className="btn btn-copy">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Result
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tool Tips */}
        <div className="mt-12 rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/50">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="text-2xl">💡</span>
            Tips & Shortcuts
          </h3>
          <div className="grid gap-4 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-800">
                  Ctrl+V
                </kbd>
                <span>Paste input</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-800">
                  Ctrl+A
                </kbd>
                <span>Select all output</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-800">
                  Ctrl+C
                </kbd>
                <span>Copy output</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-800">
                  Ctrl+Enter
                </kbd>
                <span>Process input</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
