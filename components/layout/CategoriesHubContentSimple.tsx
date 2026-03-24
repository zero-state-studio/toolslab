'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronRight,
  Database,
  Lock,
  FileText,
  Palette,
  Settings,
  Rocket,
  Share2,
  Image,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { categories } from '@/lib/tools';
import { useLocale } from '@/hooks/useLocale';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { type Locale } from '@/lib/i18n/config';

// ── Design tokens (match CategoryGrid on home) ─────────────────────
const categoryIcons: Record<string, React.ElementType> = {
  data: Database,
  encoding: Lock,
  base64: Image,
  text: FileText,
  generators: Rocket,
  web: Palette,
  dev: Settings,
  formatters: Code2,
  social: Share2,
  pdf: FileText,
};

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

const categoryGlowColors: Record<string, string> = {
  data: 'rgba(59,130,246,0.07)',
  encoding: 'rgba(16,185,129,0.07)',
  base64: 'rgba(20,184,166,0.07)',
  text: 'rgba(168,85,247,0.07)',
  web: 'rgba(236,72,153,0.07)',
  dev: 'rgba(245,158,11,0.07)',
  generators: 'rgba(249,115,22,0.07)',
  formatters: 'rgba(99,102,241,0.07)',
  social: 'rgba(244,63,94,0.07)',
  pdf: 'rgba(239,68,68,0.07)',
};

// ──────────────────────────────────────────────────────────────────

interface CategoriesHubContentSimpleProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export default function CategoriesHubContentSimple({
  locale: serverLocale,
  dictionary,
}: CategoriesHubContentSimpleProps) {
  const { locale: clientLocale, createHref } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const locale = serverLocale || clientLocale;

  useEffect(() => { setMounted(true); }, []);

  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

  const filteredCategories = searchQuery
    ? categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.tools.some(
            (t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.keywords.some((k) =>
                k.toLowerCase().includes(searchQuery.toLowerCase())
              )
          )
      )
    : categories;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="py-12">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="mx-auto mb-4 h-6 w-48 rounded-full bg-slate-200 dark:bg-white/[0.06]" />
              <div className="mx-auto mb-4 h-10 w-80 rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
              <div className="mx-auto h-10 max-w-md rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-16">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-white/[0.04]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          pointerEvents: 'none',
        }}
      />

      {/* ── COMPACT HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-5">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-32 -top-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-0 h-56 w-56 rounded-full bg-amber-500/[0.07] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          {/* Breadcrumb */}
          <nav className="mb-3 flex justify-center" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href={createHref('/')} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Home
                </Link>
              </li>
              <li><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></li>
              <li className="font-medium text-slate-900 dark:text-white">Categories</li>
            </ol>
          </nav>

          {/* Badge */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5">
              <div className="relative">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                <div className="absolute inset-0 h-1.5 w-1.5 animate-ping rounded-full bg-violet-400 opacity-75" />
              </div>
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-300">
                {categories.length} categories · {totalTools}+ tools
              </span>
            </div>
          </div>

          {/* H1 */}
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Browse Tool{' '}
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-amber-400 bg-clip-text text-transparent">
              Categories
            </span>
          </h1>

          <p className="mx-auto mb-5 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {totalTools}+ professional tools organized into {categories.length} specialized categories. Find exactly what you need, instantly.
          </p>

          {/* Search */}
          <div className="mx-auto max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories or tools..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 caret-violet-400 transition-all focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} matching &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES GRID ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16">
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-20 text-center dark:border-white/[0.06]">
            <p className="text-base font-medium text-slate-900 dark:text-white">No categories found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search term.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category.id] || FileText;
              const gradient = categoryGradients[category.id] || 'from-slate-500 to-slate-600';
              const glowColor = categoryGlowColors[category.id] || 'rgba(139,92,246,0.06)';
              const catName = dictionary?.categories?.[category.id]?.name || category.name;
              const catDescription = dictionary?.categories?.[category.id]?.description || category.description;

              return (
                <Link
                  key={category.id}
                  href={createHref(`/category/${category.id}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-100/50 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
                >
                  {/* Persistent category glow background */}
                  <div
                    className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: glowColor }}
                  />

                  {/* Colored top border — always visible */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradient}`} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Name */}
                    <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {catName}
                    </h2>

                    {/* Description */}
                    <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {catDescription}
                    </p>

                    {/* Footer: count + arrow */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300">
                        {category.tools.length} {category.tools.length === 1 ? 'tool' : 'tools'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-400" />
                    </div>

                    {/* Tool preview chips */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {category.tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool.id}
                          className="rounded-md border border-slate-200 bg-slate-50/60 px-2 py-0.5 text-xs text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400"
                        >
                          {tool.name}
                        </span>
                      ))}
                      {category.tools.length > 3 && (
                        <span className="rounded-md border border-slate-200 bg-slate-50/60 px-2 py-0.5 text-xs font-medium text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.02]">
                          +{category.tools.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-200 bg-slate-50 py-14 dark:border-white/[0.06] dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Looking for a specific tool?
          </h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Browse all {totalTools}+ tools with search, filters, and sorting.
          </p>
          <Link
            href={createHref('/tools')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(139,92,246,0.45)]"
          >
            Browse all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
