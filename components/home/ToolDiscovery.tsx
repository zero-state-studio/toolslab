'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Code, Database, Lock, Globe, Zap } from 'lucide-react';
import { tools } from '@/lib/tools';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';
import { useLocale } from '@/hooks/useLocale';
import { ToolIcon } from '@/components/ui/ToolIcon';

const useCaseTabsConfig = [
  {
    id: 'apiDev',
    icon: Code,
    tools: [
      'json-formatter',
      'jwt-decoder',
      'base64-encode',
      'url-encoder',
      'uuid-generator',
    ],
  },
  {
    id: 'dataProcessing',
    icon: Database,
    tools: [
      'json-formatter',
      'csv-to-json',
      'xml-to-json',
      'yaml-to-json',
      'sql-formatter',
    ],
  },
  {
    id: 'webDev',
    icon: Globe,
    tools: [
      'html-minifier',
      'css-minifier',
      'javascript-minifier',
      'color-converter',
      'markdown-to-html',
    ],
  },
  {
    id: 'security',
    icon: Lock,
    tools: [
      'hash-generator',
      'password-generator',
      'jwt-decoder',
      'base64-encode',
      'uuid-generator',
    ],
  },
  {
    id: 'productivity',
    icon: Zap,
    tools: [
      'unix-timestamp',
      'regex-tester',
      'diff-checker',
      'lorem-ipsum',
      'uuid-generator',
    ],
  },
];

export function ToolDiscovery() {
  const { data: t } = useDictionarySectionContext('home');
  const discovery = t?.toolDiscovery;
  const { createHref } = useLocale();
  const [activeTab, setActiveTab] = useState('apiDev');

  const activeUseCase = useCaseTabsConfig.find((tab) => tab.id === activeTab)!;
  const ActiveIcon = activeUseCase.icon;
  const activeTabData =
    discovery?.tabs?.[activeTab as keyof typeof discovery.tabs];

  const relevantTools = activeUseCase.tools
    .map((toolId) => tools.find((t) => t.id === toolId))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <section className="bg-slate-50/70 py-16 dark:bg-background sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {discovery?.title || 'Find Your Perfect Tool'}
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            {discovery?.subtitle ||
              'Discover tools tailored to your specific use case'}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mt-12">
          <div
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
            role="tablist"
          >
            {useCaseTabsConfig.map((tab) => {
              const Icon = tab.icon;
              const tabData =
                discovery?.tabs?.[tab.id as keyof typeof discovery.tabs];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`group relative inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-violet-500/40 bg-violet-600/20 text-violet-300'
                      : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-violet-500/20 hover:text-slate-300 dark:border-white/[0.06] dark:bg-white/[0.02]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {tabData?.label || tab.id}
                  </span>
                  <span className="sm:hidden">
                    {tabData?.label?.split(' ')[0] || tab.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-12"
            role="tabpanel"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none">
              {/* Tab header */}
              <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.05]">
                    <ActiveIcon className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {activeTabData?.label || activeUseCase.id}
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-400">
                      {activeTabData?.description || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tools grid */}
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relevantTools.map((tool, index) => (
                    <motion.div
                      key={tool!.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={createHref(tool!.route)}
                        className="group flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-violet-500/40 hover:bg-violet-50 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.05] dark:hover:shadow-none"
                      >
                        <ToolIcon id={tool!.id} className="h-6 w-6 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-violet-300 dark:text-white">
                            {tool!.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-400">
                            {tool!.description}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                            Try now
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Pro tip box */}
                <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-amber-400">
                      💡 Pro tip:
                    </span>{' '}
                    You can chain these tools together for complex workflows.
                    Try formatting JSON, then encoding it to Base64 for API
                    transmission.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
