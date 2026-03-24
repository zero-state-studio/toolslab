'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  Search,
  Filter,
  Grid3X3,
  Heart,
  Shield,
  Zap,
  Bookmark,
  Lock,
  Sparkles,
  Database,
  FileText,
  Palette,
  Settings,
  Rocket,
  Share2,
  Image,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { useToolStore } from '@/lib/store/toolStore';
import { WelcomePopup, HelpButton } from '@/components/lab/WelcomePopup';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { cn } from '@/lib/utils';
import {
  categories as CATEGORIES,
  tools as TOOLS_CONFIG,
  getPopularTools,
} from '@/lib/tools';
import { labToasts } from '@/lib/utils/toasts';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { useHydration } from '@/lib/hooks/useHydration';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function CategorySection({ categoryId }: { categoryId: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { favoriteTools, toggleToolFavorite } = useToolStore();

  const category = CATEGORIES.find((cat) => cat.id === categoryId);
  if (!category) return null;

  const categoryTools = category.tools.map((tool) => tool.id);

  if (categoryTools.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-6 py-5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-500" />
        )}
        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-violet-600" />
        <h3 className="flex-1 text-left text-lg font-semibold text-slate-900 dark:text-white">
          {category.name}
        </h3>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
          {categoryTools.length} {categoryTools.length === 1 ? 'tool' : 'tools'}
        </span>
        <FavoriteButton type="category" id={categoryId} name={category.name} />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="border-t border-slate-200 dark:border-white/[0.06]"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTools.map((toolSlug) => {
              const tool = TOOLS_CONFIG.find((t) => t.id === toolSlug);
              if (!tool) return null;

              return (
                <LabToolCard key={toolSlug} tool={tool} showRemove={false} />
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function LabToolCard({
  tool,
  showRemove = false,
  lastUsed,
}: {
  tool: any;
  showRemove?: boolean;
  lastUsed?: number;
}) {
  const { toggleToolFavorite } = useToolStore();
  const toolLabel = useToolLabel(tool.id);
  const { getToolLabelInfo, getLabelComponent } = useToolLabels();
  const labelInfo = getToolLabelInfo(toolLabel);

  const isComingSoon = toolLabel === 'coming-soon';

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleToolFavorite(tool.id || tool.slug);
  };

  const CardContent = ({ children }: { children: React.ReactNode }) => {
    if (isComingSoon) {
      return (
        <div
          className={cn(
            'group relative cursor-not-allowed rounded-xl p-5 opacity-75 transition-all',
            'border border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.04]'
          )}
        >
          {children}
        </div>
      );
    }

    return (
      <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02]">
        <Link href={tool.route || `/tools/${tool.id}`} className="block">
          {children}
        </Link>
      </div>
    );
  };

  return (
    <CardContent>
      <div className="mb-3 flex items-start gap-3">
        <div className="text-xl">{tool.icon}</div>
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              'truncate text-base font-semibold transition-colors',
              isComingSoon
                ? 'text-slate-500 dark:text-slate-400'
                : 'text-slate-900 group-hover:text-violet-600 dark:text-slate-100 dark:group-hover:text-violet-400'
            )}
          >
            {tool.name}
          </h4>
          <p
            className={cn(
              'mt-1 line-clamp-2 text-xs leading-relaxed',
              isComingSoon
                ? 'text-slate-500 dark:text-slate-400'
                : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {isComingSoon
              ? 'This tool is coming soon. Stay tuned for updates!'
              : tool.description}
          </p>
        </div>
      </div>

      {lastUsed && !isComingSoon && (
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          <span suppressHydrationWarning>
            Last used: {formatTimeAgo(lastUsed)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!isComingSoon ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md">
            <ExternalLink className="h-3 w-3" />
            <span>Open Tool</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
            <Clock className="h-3 w-3" />
            <span>Coming Soon</span>
          </div>
        )}

        {showRemove && (
          <button
            onClick={handleRemove}
            className="rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
            title="Remove from Lab"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Label - Show Coming Soon label or In Lab badge */}
      {isComingSoon ? (
        <div className="absolute right-3 top-3">
          {getLabelComponent(toolLabel, 'xs')}
        </div>
      ) : (
        <div className="absolute right-3 top-3 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
          In Lab
        </div>
      )}
    </CardContent>
  );
}

function PopularToolCard({ tool, index }: { tool: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={tool.route}
        className="group relative flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-violet-500/40 dark:hover:shadow-violet-500/10"
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-violet-500/40 to-amber-500/30 transition-opacity group-hover:from-violet-500/80 group-hover:to-amber-500/60" />

        <span className="flex-shrink-0 text-2xl">{tool.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {tool.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <FavoriteButton type="tool" id={tool.id} />
        </div>
      </Link>
    </motion.div>
  );
}

function HowItWorksStep({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * step }}
      className="flex flex-col items-center text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200 bg-violet-500/10 dark:border-violet-500/30 dark:bg-violet-500/20">
        <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
        Step {step}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </motion.div>
  );
}

function EnhancedEmptyState() {
  const { data: t } = useDictionarySectionContext('lab');
  const popularTools = getPopularTools()
    .filter((tool) => tool.label !== 'coming-soon')
    .slice(0, 6);

  return (
    <>
      {/* Section 1: Popular Tools - Show what's available */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Most searched
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t?.empty?.popularToolsTitle || 'Popular Developer Tools'}
              </h2>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {t?.empty?.popularToolsSubtitle ||
                  'Try any tool instantly — star it to add to your Lab'}
              </p>
            </div>
            <Link
              href="/tools"
              className="hidden items-center gap-1 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 sm:flex"
            >
              View all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool, index) => (
              <PopularToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400"
            >
              View all {TOOLS_CONFIG.filter((t) => t.label !== 'coming-soon').length} tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works - Micro-onboarding */}
      <section className="border-y border-slate-200 bg-white/50 py-16 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t?.empty?.howItWorksTitle || 'Build Your Toolkit in 3 Steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <HowItWorksStep
              step={1}
              icon={Search}
              title={t?.empty?.step1Title || 'Explore Tools'}
              description={
                t?.empty?.step1Description ||
                'Browse 70+ free developer tools — JSON formatters, encoders, generators and more.'
              }
            />
            <HowItWorksStep
              step={2}
              icon={Star}
              title={t?.empty?.step2Title || 'Star Favorites'}
              description={
                t?.empty?.step2Description ||
                'Click the star on any tool to save it to your personal Lab for instant access.'
              }
            />
            <HowItWorksStep
              step={3}
              icon={Zap}
              title={t?.empty?.step3Title || 'Work Faster'}
              description={
                t?.empty?.step3Description ||
                'Open your Lab to find all your tools in one place — no searching, no scrolling.'
              }
            />
          </div>

          {/* Connecting line between steps (desktop) */}
          <div className="relative mx-auto mt-[-140px] hidden max-w-2xl md:block" aria-hidden="true">
            <div className="h-0.5 bg-gradient-to-r from-violet-200 via-violet-400 to-violet-200 dark:from-violet-700/50 dark:via-violet-500 dark:to-violet-700/50" />
          </div>
        </div>
      </section>

      {/* Section 3: Categories Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t?.empty?.categoriesTitle || 'Explore by Category'}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t?.empty?.categoriesSubtitle ||
                'Find the right tool for every task in your development workflow'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category, index) => {
              const categoryIcons: Record<string, React.ElementType> = {
                data: Database, encoding: Lock, base64: Image, text: FileText,
                generators: Rocket, web: Palette, dev: Settings,
                formatters: Code2, social: Share2, pdf: FileText,
              };
              const categoryGradients: Record<string, string> = {
                data: 'from-blue-500 to-cyan-500', encoding: 'from-emerald-500 to-green-500',
                base64: 'from-teal-500 to-cyan-500', text: 'from-purple-500 to-pink-500',
                web: 'from-pink-500 to-rose-500', dev: 'from-amber-500 to-orange-500',
                generators: 'from-orange-500 to-red-500', formatters: 'from-indigo-500 to-purple-500',
                social: 'from-rose-500 to-pink-500', pdf: 'from-red-600 to-orange-600',
              };
              const categoryGlowColors: Record<string, string> = {
                data: 'rgba(59,130,246,0.07)', encoding: 'rgba(16,185,129,0.07)',
                base64: 'rgba(20,184,166,0.07)', text: 'rgba(168,85,247,0.07)',
                web: 'rgba(236,72,153,0.07)', dev: 'rgba(245,158,11,0.07)',
                generators: 'rgba(249,115,22,0.07)', formatters: 'rgba(99,102,241,0.07)',
                social: 'rgba(244,63,94,0.07)', pdf: 'rgba(239,68,68,0.07)',
              };
              const Icon = categoryIcons[category.id] || FileText;
              const gradient = categoryGradients[category.id] || 'from-slate-500 to-slate-600';
              const glowColor = categoryGlowColors[category.id] || 'rgba(139,92,246,0.06)';

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={`/category/${category.id}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-100/50 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
                  >
                    {/* Category glow background */}
                    <div
                      className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: glowColor }}
                    />

                    {/* Colored top border */}
                    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradient}`} />

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Name */}
                      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                        {category.name}
                      </h3>

                      {/* Description */}
                      <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {category.description}
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Trust Pillars */}
      <section className="border-t border-slate-200 py-16 dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-green-200 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/15">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                {t?.empty?.trustPrivacyTitle || '100% Private'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t?.empty?.trustPrivacyDescription ||
                  'All data stays in your browser. No accounts, no server storage, no tracking.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200 bg-violet-500/10 dark:border-violet-500/30 dark:bg-violet-500/15">
                <Heart className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                {t?.empty?.trustFreeTitle || 'Free Forever'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t?.empty?.trustFreeDescription ||
                  'Every tool is free with no usage limits. No premium tiers, no paywalls.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/15">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                {t?.empty?.trustNoSignupTitle || 'No Sign-Up Required'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t?.empty?.trustNoSignupDescription ||
                  'Start using any tool instantly. Your Lab preferences save automatically in your browser.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Bottom CTA */}
      <section className="border-t border-slate-200 py-16 dark:border-white/[0.08]">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {t?.empty?.bottomCtaTitle || 'Ready to build your toolkit?'}
          </h2>
          <p className="mb-8 text-slate-600 dark:text-slate-400">
            {t?.empty?.bottomCtaDescription ||
              'Explore our collection of free developer tools and start starring your favorites.'}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-3.5 font-semibold text-white shadow-sm transition-all hover:shadow-md dark:shadow-violet-500/20 dark:hover:shadow-violet-500/30"
            >
              <Search className="h-5 w-5" />
              {t?.empty?.exploreAllTools || 'Explore All Tools'}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-600 px-8 py-3.5 font-semibold text-violet-600 transition-all hover:bg-violet-50 dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-950/20"
            >
              <Grid3X3 className="h-5 w-5" />
              {t?.empty?.browseCategories || 'Browse Categories'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function LabHubContent() {
  const isHydrated = useHydration();
  const { data: t } = useDictionarySectionContext('lab');
  const {
    favoriteTools,
    favoriteCategories,
    labVisited,
    getFavoriteCount,
    getRecentTools,
    setLabVisited,
  } = useToolStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration before accessing store

    setMounted(true);
    setLabVisited();

    const { favoriteTools, favoriteCategories } = useToolStore.getState();
    const favoriteCount = favoriteTools.length + favoriteCategories.length;
  }, [isHydrated]); // Re-run when hydration completes

  // Show welcome toast if first visit with favorites
  useEffect(() => {
    const { labVisited } = useToolStore.getState();
    if (
      !labVisited &&
      (favoriteTools.length > 0 || favoriteCategories.length > 0)
    ) {
      setTimeout(() => {
        labToasts.welcomeToLab();
      }, 1000);
    }
  }, [favoriteTools.length, favoriteCategories.length]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-slate-200 py-12 dark:border-white/[0.06]">
          <div className="animate-pulse">
            <div className="mx-auto max-w-4xl px-4">
              <div className="mb-4 h-10 w-64 rounded bg-slate-200 dark:bg-white/[0.06]" />
              <div className="h-5 w-96 rounded bg-slate-200 dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-slate-200 dark:bg-white/[0.06]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const favoriteCount = getFavoriteCount();
  const recentTools = getRecentTools();
  const isEmpty = favoriteCount === 0;

  // Get valid favorite categories
  const validFavoriteCategories = favoriteCategories.filter((categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category && category.tools.length > 0;
  });

  // Get standalone favorite tools
  const standaloneFavoriteTools = favoriteTools.filter((toolSlug) => {
    const tool = TOOLS_CONFIG.find((t) => t.id === toolSlug);
    return tool && !favoriteCategories.includes(tool.categories[0]);
  });

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-background">
        {/* Grid Background */}
        <div
          className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <WelcomePopup />

        {/* Hero - Compact, value-focused */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/[0.06]">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-40 -top-20 h-60 w-60 rounded-full bg-amber-500/[0.07] blur-3xl" />

          <div className="relative py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
              {/* Breadcrumb */}
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-slate-500">
                  <li>
                    <Link
                      href="/"
                      className="transition-colors hover:text-slate-900 dark:hover:text-white"
                    >
                      Home
                    </Link>
                  </li>
                  <li><span className="text-slate-400">/</span></li>
                  <li className="font-medium text-slate-900 dark:text-white">Lab</li>
                </ol>
              </nav>

              <div className="max-w-3xl">
                {/* Status badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                  </span>
                  {TOOLS_CONFIG.filter((t) => t.label !== 'coming-soon').length} free tools · no signup · private
                </div>

                <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
                  {t?.empty?.headerTitle || 'Your Developer Tools, One Workspace'}
                </h1>

                <p className="mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                  {t?.empty?.headerSubtitle ||
                    'Star your go-to tools and access them all from your personal Lab. Free, private, instant — no account needed.'}
                </p>

                {/* CTA inline */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:shadow-md"
                  >
                    <Search className="h-4 w-4" />
                    {t?.empty?.exploreAllTools || 'Explore All Tools'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="hidden text-sm text-slate-500 sm:inline">
                    or scroll down to see popular tools
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <EnhancedEmptyState />
      </div>
    );
  }

  const lastUsedTool =
    recentTools.length > 0
      ? TOOLS_CONFIG.find((t) => t.id === recentTools[0].tool)
      : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Grid Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <WelcomePopup />
      <HelpButton />

      {/* Enhanced Header - With Tools */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/[0.06]">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-60 w-60 rounded-full bg-amber-500/[0.07] blur-3xl" />

        <div className="relative py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              {/* Breadcrumbs */}
              <nav className="mb-4 flex justify-center" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-slate-500">
                  <li>
                    <Link
                      href="/"
                      className="transition-colors hover:text-slate-900 dark:hover:text-white"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <span className="text-slate-400">/</span>
                  </li>
                  <li className="font-medium text-slate-900 dark:text-white">Lab</li>
                </ol>
              </nav>

              {/* Hero Icons */}
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="text-5xl lg:text-6xl">🧪</span>
                <div className="h-10 w-px bg-slate-300 dark:bg-white/[0.10]" />
                <span className="text-5xl lg:text-6xl">⚗️</span>
              </div>

              {/* Main Heading with integrated stats */}
              <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white lg:text-3xl">
                  Your Personal Developer Lab
                </h1>

                {/* Integrated Stats Pill Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2">
                  <Bookmark className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    {favoriteCount} Tools Saved
                  </span>
                </div>
              </div>

              {/* Dynamic Tagline */}
              <p className="mx-auto mb-4 max-w-2xl text-base text-slate-600 dark:text-slate-400 lg:text-lg">
                Streamline your workflow with curated tools and instant access
              </p>

              {/* Last Used Info */}
              {lastUsedTool && (
                <p className="mb-4 text-sm text-slate-500">
                  Last used:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lastUsedTool.name}
                  </span>
                </p>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"
                >
                  <Search className="h-4 w-4" />
                  Browse Tools
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"
                >
                  <Filter className="h-4 w-4" />
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Content */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="space-y-10">
          {/* Favorite Categories */}
          {validFavoriteCategories.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <span>📁</span>
                Favorite Categories
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
                  {validFavoriteCategories.length}
                </span>
              </h2>
              <div className="space-y-6">
                {validFavoriteCategories.map((categoryId) => (
                  <CategorySection key={categoryId} categoryId={categoryId} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Standalone Favorite Tools */}
          {standaloneFavoriteTools.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <span>⭐</span>
                Favorite Tools
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
                  {standaloneFavoriteTools.length}
                </span>
              </h2>
              <div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                }}
              >
                {standaloneFavoriteTools.map((toolSlug) => {
                  const tool = TOOLS_CONFIG.find((t) => t.id === toolSlug);
                  if (!tool) return null;

                  return (
                    <motion.div
                      key={toolSlug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mx-auto w-full max-w-sm"
                    >
                      <LabToolCard tool={tool} showRemove={true} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Recent Activity */}
          {recentTools.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <span>🕒</span>
                Recent Activity
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
                  {recentTools.length}
                </span>
              </h2>
              <div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                }}
              >
                {recentTools.map((operation) => {
                  const tool = TOOLS_CONFIG.find(
                    (t) => t.id === operation.tool
                  );
                  if (!tool) return null;

                  return (
                    <motion.div
                      key={operation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mx-auto w-full max-w-sm"
                    >
                      <LabToolCard tool={tool} lastUsed={operation.timestamp} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
          {/* Discover More Tools Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-violet-50/50 p-8 dark:border-white/[0.06] dark:from-violet-950/20 dark:to-violet-950/10">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-gradient-to-r from-violet-100 to-violet-50 p-3 dark:from-violet-900/30 dark:to-violet-900/20">
                  <Search className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>

              <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
                {t?.empty?.needMoreTools || 'Need More Tools?'}
              </h2>

              <p className="mx-auto mb-8 max-w-2xl text-slate-600 dark:text-slate-400">
                {t?.empty?.needMoreToolsDescription ||
                  'Explore our complete collection of developer tools across all categories. Find the perfect tool for your workflow and add it to your Lab.'}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md"
                >
                  <Search className="h-4 w-4" />
                  {t?.empty?.browseAllTools || 'Browse All Tools'}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-violet-600 px-6 py-3 font-semibold text-violet-600 transition-all hover:bg-violet-50 dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-950/20"
                >
                  <Grid3X3 className="h-4 w-4" />
                  {t?.empty?.browseCategories || 'Browse Categories'}
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
