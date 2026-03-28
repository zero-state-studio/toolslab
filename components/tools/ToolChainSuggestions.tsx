'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Zap,
  Eye,
  X,
  Copy,
  Save,
  History,
  Sparkles,
  Command,
} from 'lucide-react';
import { useToolChainStore } from '@/lib/stores/toolChainStore';
import { tools } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/ui/ToolIcon';

interface ToolChainSuggestionsProps {
  className?: string;
}

export default function ToolChainSuggestions({
  className,
}: ToolChainSuggestionsProps) {
  const {
    showSuggestions,
    suggestedTools,
    lastDetection,
    lastProcessedOutput,
    currentChain,
    chainedData,
    setSuggestionsVisible,
    generateChainUrl,
    saveCurrentChain,
    setChainedData,
  } = useToolChainStore();

  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleCopyOutput = async () => {
    if (lastProcessedOutput) {
      await navigator.clipboard.writeText(lastProcessedOutput);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleSaveChain = () => {
    saveCurrentChain();
    // Could show a toast notification here
  };

  const handleContinueWithTool = (toolSlug: string) => {
    if (lastProcessedOutput) {
      setChainedData(lastProcessedOutput);
    }
  };

  const getSuggestedToolData = (toolSlug: string) => {
    return tools.find((tool) => tool.id === toolSlug);
  };

  if (!showSuggestions || !lastDetection || suggestedTools.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative mt-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-blue-800 dark:from-blue-900/20 dark:to-purple-900/20',
          className
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Continue Your Workflow
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lastDetection.description} • {suggestedTools.length} suggested
                tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <button
              onClick={handleCopyOutput}
              className="rounded-lg bg-white/50 p-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              title="Copy output"
            >
              <Copy className="h-4 w-4" />
            </button>

            {currentChain.length > 1 && (
              <button
                onClick={handleSaveChain}
                className="rounded-lg bg-white/50 p-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                title="Save workflow"
              >
                <Save className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setSuggestionsVisible(false)}
              className="rounded-lg bg-white/50 p-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              title="Hide suggestions"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Detection Info */}
        <div className="mb-4 rounded-lg border border-white/50 bg-white/60 p-3 dark:border-gray-700/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-300">
              Detected:{' '}
              <span className="font-medium">{lastDetection.type}</span>
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round(lastDetection.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Tool Suggestions */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestedTools.slice(0, 6).map((toolSlug, index) => {
            const tool = getSuggestedToolData(toolSlug);
            if (!tool) return null;

            return (
              <motion.div
                key={toolSlug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={generateChainUrl(toolSlug)}
                  onClick={() => handleContinueWithTool(toolSlug)}
                  className="group flex items-center gap-3 rounded-xl border border-white/50 bg-white/70 p-3 transition-all duration-200 hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-gray-700/50 dark:bg-gray-800/50 dark:hover:border-blue-700 dark:hover:bg-gray-700"
                >
                  <ToolIcon id={tool.id} className="h-5 w-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {tool.name}
                    </div>
                    <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Chain Progress */}
        {currentChain.length > 0 && (
          <div className="border-t border-white/50 pt-4 dark:border-gray-700/50">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Chain ({currentChain.length} steps)
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {currentChain.map((step, index) => (
                <div
                  key={step.id}
                  className="flex flex-shrink-0 items-center gap-2"
                >
                  <div className="flex items-center gap-2 rounded-lg border border-white/50 bg-white/50 px-3 py-1 dark:border-gray-700/50 dark:bg-gray-800/30">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {step.toolName}
                    </span>
                  </div>
                  {index < currentChain.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Hint */}
        <div className="mt-4 border-t border-white/50 pt-3 dark:border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-white/50 bg-white/50 px-1.5 py-0.5 font-mono dark:border-gray-700/50 dark:bg-gray-800/50">
                  <Command className="mr-1 inline h-3 w-3" />K
                </kbd>
                <span>Toggle</span>
              </div>

              <div className="flex items-center gap-1">
                <kbd className="rounded border border-white/50 bg-white/50 px-1.5 py-0.5 font-mono dark:border-gray-700/50 dark:bg-gray-800/50">
                  <Command className="mr-1 inline h-3 w-3" />
                  ⇧C
                </kbd>
                <span>Copy</span>
              </div>
            </div>

            {copiedToClipboard && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-medium text-green-600 dark:text-green-400"
              >
                Copied!
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
