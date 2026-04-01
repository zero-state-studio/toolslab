'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { categories } from '@/lib/tools';
import { type Locale, defaultLocale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { useLocale } from '@/hooks/useLocale';
import { ToolIcon } from '@/components/ui/ToolIcon';

// Per-category glow colors (shown on hover as an inset shadow tint)
const categoryGlowColors: Record<string, string> = {
  data: 'rgba(59, 130, 246, 0.08)',
  encoding: 'rgba(16, 185, 129, 0.08)',
  text: 'rgba(168, 85, 247, 0.08)',
  web: 'rgba(236, 72, 153, 0.08)',
  dev: 'rgba(245, 158, 11, 0.08)',
  generators: 'rgba(249, 115, 22, 0.08)',
  formatters: 'rgba(99, 102, 241, 0.08)',
  social: 'rgba(244, 63, 94, 0.08)',
  pdf: 'rgba(239, 68, 68, 0.08)',
};

const categoryGradients = {
  data: 'from-blue-500 to-cyan-500',
  encoding: 'from-emerald-500 to-green-500',
  text: 'from-purple-500 to-pink-500',
  web: 'from-pink-500 to-rose-500',
  dev: 'from-amber-500 to-orange-500',
  generators: 'from-orange-500 to-red-500',
  formatters: 'from-indigo-500 to-purple-500',
  social: 'from-rose-500 to-pink-500',
  pdf: 'from-red-600 to-orange-600',
};

interface CategoryGridProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export function CategoryGrid({
  locale = defaultLocale,
  dictionary,
}: CategoryGridProps) {
  const { createHref } = useLocale();
  const totalTools = categories.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {dictionary?.home?.categories?.title ||
              `Browse ${totalTools} Tools by Category`}
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            {dictionary?.home?.categories?.viewAll ||
              'Choose from our comprehensive collection of developer tools'}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const gradient =
              categoryGradients[
                category.id as keyof typeof categoryGradients
              ] || 'from-slate-500 to-slate-600';
            const glowColor =
              categoryGlowColors[category.id] || 'rgba(139,92,246,0.06)';

            return (
              <div key={category.id}>
                <Link
                  href={createHref(`/category/${category.id}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-card-inset backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-100/50 dark:border-white/[0.06] dark:border-white/[0.10] dark:bg-white/[0.02] dark:bg-white/[0.04]"
                  style={
                    {
                      '--category-glow': glowColor,
                    } as React.CSSProperties
                  }
                >
                  {/* Background glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: glowColor }}
                  />

                  {/* Icon and content */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <div
                        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}
                      >
                        <ToolIcon id={category.id} type="category" className="h-6 w-6" />
                      </div>

                      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                        {dictionary?.categories?.[category.id]?.name ||
                          category.name}
                      </h3>

                      <p className="mb-4 text-sm text-slate-700 dark:text-slate-400">
                        {dictionary?.categories?.[category.id]?.description ||
                          category.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300">
                          {category.tools.length}{' '}
                          {category.tools.length === 1 ? 'tool' : 'tools'}
                        </span>

                        <ChevronRight className="h-5 w-5 text-slate-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-300" />
                      </div>
                    </div>
                  </div>

                  {/* Tool preview chips */}
                  <div className="relative z-10 mt-4 flex flex-wrap gap-1">
                    {category.tools.slice(0, 3).map((tool) => (
                      <span
                        key={tool.id}
                        className="rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1 text-xs text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400"
                      >
                        {tool.name}
                      </span>
                    ))}
                    {category.tools.length > 3 && (
                      <span className="rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1 text-xs font-medium text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        +{category.tools.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
