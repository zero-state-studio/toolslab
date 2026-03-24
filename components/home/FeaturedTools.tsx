'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { tools } from '@/lib/tools';
import { type Locale, defaultLocale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { useLocale } from '@/hooks/useLocale';

// Sort by searchVolume to show the most-searched tools first
const featuredTools = tools
  .filter((t) => t.label !== 'coming-soon')
  .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
  .slice(0, 6);

interface FeaturedToolsProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export function FeaturedTools({
  locale = defaultLocale,
  dictionary,
}: FeaturedToolsProps) {
  const { createHref } = useLocale();

  return (
    <section className="bg-slate-50/70 py-16 dark:bg-background sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-violet-400">
              Most searched
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {dictionary?.home?.popular?.title || 'Most-Used Developer Tools'}
          </h2>
          <p className="mt-2 text-lg text-slate-700 dark:text-slate-400">
            {dictionary?.home?.popular?.subtitle ||
              'The tools developers search for most — all free, all instant'}
          </p>
          <Link
            href={createHref('/tools')}
            className="mt-4 inline-flex items-center gap-2 text-violet-400 transition-colors hover:text-violet-300"
          >
            {dictionary?.common?.nav?.allTools || 'View all tools'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {featuredTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link
                  href={createHref(tool.route)}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04] dark:hover:shadow-none"
                >
                  {/* Gradient top accent */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/40 to-amber-500/30 transition-opacity duration-300 group-hover:from-violet-500/80 group-hover:to-amber-500/60" />

                  <div className="flex items-start gap-4">
                    {/* Tool icon */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-2xl transition-transform duration-200 group-hover:scale-110 dark:border-white/[0.08] dark:bg-white/[0.05]">
                      {tool.icon}
                    </div>

                    {/* Tool info */}
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {dictionary?.tools?.[tool.id]?.title || tool.name}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-400">
                        {(
                          dictionary?.tools?.[tool.id]?.description ||
                          tool.description
                        )
                          .split(' ')
                          .slice(0, 10)
                          .join(' ')}
                        ...
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {/* Category badge */}
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                        {tool.categories?.[0] || 'tool'}
                      </span>
                      {/* Search volume for top 3 */}
                      {index < 3 &&
                        tool.searchVolume &&
                        tool.searchVolume > 0 && (
                          <span className="text-xs text-slate-600">
                            {(tool.searchVolume / 1000).toFixed(0)}K/mo
                          </span>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-medium text-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Try Now
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile view all link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={createHref('/tools')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 font-medium text-white hover:from-violet-500 hover:to-violet-400"
          >
            {dictionary?.common?.nav?.allTools || 'View all tools'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
