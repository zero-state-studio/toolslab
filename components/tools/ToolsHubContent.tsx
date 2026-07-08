'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { useDictionary } from '@/hooks/useDictionary';
import Link from 'next/link';
import {
  tools,
  categories,
  type Tool,
} from '@/lib/tools';
import { ToolCardWrapper } from '@/components/tools/ToolCardWrapper';
import { ToolListItem } from '@/components/tools/ToolListItem';
import {
  Search,
  X,
  TrendingUp,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  Shield,
  Zap,
  Lock,
  CheckCircle2,
  Database,
  FileText,
  Palette,
  Settings,
  Rocket,
  Share2,
  ArrowUpAZ,
  Code2,
  Image,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/ui/ToolIcon';

// Category icons — same as CategoryGrid
const categoryIcons: Record<string, React.ElementType> = {
  data: Database,
  encoding: Lock,
  base64: Image,
  text: FileText,
  generators: Rocket,
  web: Palette,
  dev: Terminal,
  formatters: Code2,
  social: Share2,
  pdf: FileText,
};

// Category accent colors
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

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'alphabetical' | 'recent';

interface ToolsHubContentProps {
  locale?: string;
  dictionary?: any;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'alphabetical', label: 'A → Z', icon: ArrowUpAZ },
  { value: 'recent', label: 'Recently Added', icon: Clock },
];

export default function ToolsHubContent({
  locale,
  dictionary: propDictionary,
}: ToolsHubContentProps = {}) {
  const searchParams = useSearchParams();
  const { replace, createHref } = useLocalizedRouter();
  const { dictionary: hookDictionary } = useDictionary();

  const dictionary = propDictionary || hookDictionary;

  const t = dictionary?.toolsPage || {
    breadcrumb: { home: 'Home', allTools: 'All Tools' },
    header: {
      title: 'All Developer Tools',
      subtitle: 'Complete collection of free browser-based tools. No signup, no tracking, instant results.',
    },
    search: { placeholder: "Search tools... (e.g. 'json', 'encode', 'hash')" },
    filters: { all: 'All', clearFilters: 'Clear filters' },
    sections: {
      mostPopular: 'Most Popular',
      allTools: 'All Tools',
      trendingTools: 'trending tools',
    },
    empty: {
      title: 'No tools found',
      description: 'Try adjusting your search or filter criteria.',
      clearAll: 'Clear all filters',
    },
    seo: {
      whyChoose: { title: 'Why Choose ToolsLab Tools?' },
      workflows: {
        title: 'Common Developer Workflows',
        api: { title: 'API Development & Testing', tools: ['JSON Formatter', 'JWT Decoder', 'URL Encoder', 'Hash Generator'] },
        data: { title: 'Data Migration & ETL', tools: ['CSV to JSON', 'Base64 Encoder', 'SQL Formatter', 'UUID Generator'] },
        security: { title: 'Security & Authentication', tools: ['JWT Decoder', 'Hash Generator', 'Password Generator', 'Base64'] },
      },
    },
  };

  const totalTools = tools.length;

  const search = searchParams?.get('search') || '';
  const categoryFilter = searchParams?.get('category') || '';
  const sort = (searchParams?.get('sort') as SortOption) || 'popular';

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredTools = useMemo(() => {
    let result = [...tools];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((tool) => tool.categories.includes(categoryFilter));
    }

    switch (sort) {
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
        result.sort((a, b) => {
          if (a.label === 'popular' && b.label !== 'popular') return -1;
          if (a.label !== 'popular' && b.label === 'popular') return 1;
          return (b.searchVolume || 0) - (a.searchVolume || 0);
        });
        break;
      case 'recent':
        result.sort((a, b) => {
          const aIsNew = a.label === 'new';
          const bIsNew = b.label === 'new';
          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;
          return 0;
        });
        break;
    }

    return result;
  }, [search, categoryFilter, sort]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    replace(`/tools?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => replace('/tools', { scroll: false });

  const hasActiveFilters = !!(search || categoryFilter);

  const activeCategory = categories.find((c) => c.id === categoryFilter);

  // Skeleton on SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="py-14">
            <div className="mx-auto max-w-7xl px-4 text-center">
              <div className="mx-auto mb-4 h-6 w-48 rounded-full bg-slate-200 dark:bg-white/[0.06]" />
              <div className="mx-auto mb-6 h-12 w-80 rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
              <div className="mx-auto h-14 max-w-xl rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-16">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-white/[0.04]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle grid pattern */}
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

      {/* ── COMPACT HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-5">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-32 -top-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-0 h-56 w-56 rounded-full bg-amber-500/[0.07] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          {/* Breadcrumb */}
          <nav className="mb-3 flex justify-center" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  href={createHref('/')}
                  className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {t.breadcrumb.home}
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </li>
              <li className="font-medium text-slate-900 dark:text-white">
                {t.breadcrumb.allTools}
              </li>
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
                {totalTools} tools · free forever · no signup
              </span>
            </div>
          </div>

          {/* H1 */}
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            All{' '}
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-amber-400 bg-clip-text text-transparent">
              Developer
            </span>{' '}
            Tools
          </h1>

          <p className="mx-auto mb-5 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {t.header.subtitle}
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => updateFilters('search', e.target.value)}
                placeholder={t.search.placeholder}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 caret-violet-400 backdrop-blur-sm transition-all duration-200 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-slate-500"
              />
              {search && (
                <button
                  onClick={() => updateFilters('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ───────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-2">
        <div className="flex gap-6">

          {/* ── SIDEBAR (desktop only) ── */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-16 space-y-6">

              {/* Categories */}
              <div>
                <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  Categories
                </p>
                <nav className="space-y-0.5">
                  {/* All */}
                  <button
                    onClick={() => updateFilters('category', '')}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                      !categoryFilter
                        ? 'border border-violet-500/20 bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                    <span>All Tools</span>
                    <span className="ml-auto font-mono text-xs opacity-50">{totalTools}</span>
                  </button>

                  {categories.map((category) => {
                    const Icon = categoryIcons[category.id] || LayoutGrid;
                    const isActive = categoryFilter === category.id;
                    const count = tools.filter((t) => t.categories.includes(category.id)).length;
                    const color = categoryColors[category.id] || '#8b5cf6';
                    return (
                      <button
                        key={category.id}
                        onClick={() => updateFilters('category', category.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                          isActive
                            ? 'border border-violet-500/20 bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                        )}
                      >
                        <Icon
                          className="h-4 w-4 flex-shrink-0 transition-colors"
                          style={{ color: isActive ? color : `${color}99` }}
                        />
                        <span className="truncate">
                          {dictionary?.categories?.[category.id]?.name || category.name}
                        </span>
                        <span className="ml-auto font-mono text-xs opacity-50">{count}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sort */}
              <div>
                <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  Sort by
                </p>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateFilters('sort', opt.value)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                          sort === opt.value
                            ? 'border border-violet-500/20 bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 dark:border-white/[0.08] dark:text-slate-500 dark:hover:border-white/[0.15] dark:hover:text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                  {t.filters.clearFilters}
                </button>
              )}
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="min-w-0 flex-1">

            {/* Mobile: horizontal category chips */}
            <div className="mb-4 overflow-x-auto lg:hidden">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => updateFilters('category', '')}
                  className={cn(
                    'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
                    !categoryFilter
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-300'
                  )}
                >
                  All ({totalTools})
                </button>
                {categories.map((cat) => {
                  const count = tools.filter((t) => t.categories.includes(cat.id)).length;
                  const isActive = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => updateFilters('category', cat.id)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-300'
                      )}
                    >
                      <ToolIcon id={cat.id} type="category" className="h-4 w-4 flex-shrink-0" />
                      {dictionary?.categories?.[cat.id]?.name || cat.name}
                      <span className="font-mono text-[10px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toolbar: count + mobile sort + view toggle */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {filteredTools.length}
                </span>{' '}
                {filteredTools.length === 1 ? 'tool' : 'tools'}
                {activeCategory && (
                  <span> in {dictionary?.categories?.[activeCategory.id]?.name || activeCategory.name}</span>
                )}
                {search && (
                  <span> matching &ldquo;{search}&rdquo;</span>
                )}
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile sort select */}
                <select
                  value={sort}
                  onChange={(e) => updateFilters('sort', e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-300 lg:hidden"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={cn(
                      'flex items-center justify-center rounded-md p-1.5 transition-all',
                      viewMode === 'grid'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.08] dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={cn(
                      'flex items-center justify-center rounded-md p-1.5 transition-all',
                      viewMode === 'list'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.08] dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tools list — popular tools surface via in-card label, no separate row */}
            <section>
              {filteredTools.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center dark:border-white/[0.06] dark:bg-white/[0.01]">
                  <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                  <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                    {t.empty.title}
                  </h3>
                  <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
                    {t.empty.description}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    {t.empty.clearAll}
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <ToolCardWrapper key={tool.id} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTools.map((tool) => (
                    <ToolListItem key={tool.id} tool={tool} dictionary={dictionary} />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* ── SEO SECTION ───────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-200 bg-slate-50 py-10 dark:border-white/[0.06] dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4">

          {/* Why ToolsLab */}
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              {t.seo.whyChoose.title}
            </h2>
            <p className="mb-5 text-slate-600 dark:text-slate-400">
              Professional tools built with privacy and speed in mind.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Shield, title: 'Complete Privacy', description: 'All processing happens in your browser — no data ever leaves your device.' },
                { icon: Zap, title: 'Instant Results', description: 'Real-time processing with no server round-trips. Results appear as you type.' },
                { icon: CheckCircle2, title: 'Free Forever', description: 'No registration, no subscription, no hidden costs. Everything is 100% free.' },
                { icon: Lock, title: 'No Signup Required', description: 'Open any tool and start using it immediately. No account needed.' },
                { icon: Settings, title: 'Mobile-Friendly', description: 'Fully responsive design works perfectly on any device or screen size.' },
                { icon: Clock, title: 'Always Up-to-Date', description: 'Regular updates with new tools, features, and bug fixes every week.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common Workflows */}
          <div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              {t.seo.workflows.title}
            </h2>
            <p className="mb-5 text-slate-600 dark:text-slate-400">
              Combine tools to build efficient development workflows.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Code2,
                  title: t.seo.workflows.api.title,
                  tools: t.seo.workflows.api.tools,
                  color: 'violet',
                },
                {
                  icon: Database,
                  title: t.seo.workflows.data.title,
                  tools: t.seo.workflows.data.tools,
                  color: 'blue',
                },
                {
                  icon: Lock,
                  title: t.seo.workflows.security.title,
                  tools: t.seo.workflows.security.tools,
                  color: 'emerald',
                },
              ].map((workflow) => {
                const Icon = workflow.icon;
                return (
                  <div
                    key={workflow.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                        <Icon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {workflow.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(workflow.tools as string[]).map((toolName) => (
                        <span
                          key={toolName}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400"
                        >
                          {toolName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
