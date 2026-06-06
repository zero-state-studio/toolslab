'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import {
  tools,
  toolsMap,
  getToolById,
  categories,
  getCategoryColorClass,
} from '@/lib/tools';
import ToolWorkspace from './ToolWorkspace';
import {
  trackEngagement,
  trackToolUse,
  trackConversion,
} from '@/lib/analytics';
import {
  ChevronRight,
  Share2,
  X,
  Info,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Home,
  LayoutGrid,
} from 'lucide-react';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { FAQModal } from '@/components/ui/faq-modal';
import ToolHowToUse from './ToolHowToUse';
import ToolHeroSection from './ToolHeroSection';
import AdBanner from '@/components/ads/AdBanner';
import { getSmartRelatedTools } from '@/lib/seo/related-tools-engine';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { getCategoryTheme, catColor } from '@/lib/categoryTheme';

function getCategoryColor(category: string, mode: 'dark' | 'light' = 'dark'): string {
  const theme = getCategoryTheme(category);
  return catColor(theme.hue, 'text', mode);
}

// Tools whose implementation renders an inline Usage Tips block: they render the
// mobile ad banner internally (above the tips), so the outer mobile banner is skipped.
const TOOLS_WITH_INLINE_MOBILE_AD = [
  'base64-to-pdf',
  'base64-to-gif',
  'sql-formatter',
  'excel-filter',
  'pdf-to-word',
  'linkedin-post-formatter',
];

interface ToolPageClientProps {
  toolId: string;
  locale?: string;
  dictionary?: any;
  toolTranslations?: {
    title?: string;
    description?: string;
    tagline?: string;
    pageDescription?: string;
    placeholder?: string;
    instructions?: string;
  };
}

export default function ToolPageClient({
  toolId,
  locale,
  dictionary,
  toolTranslations,
}: ToolPageClientProps) {
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { createHref } = useLocalizedRouter();
  const [usageCount, setUsageCount] = useState(0);

  // Tool label system
  const toolLabel = useToolLabel(toolId);
  const { getToolLabelInfo, getLabelComponent } = useToolLabels();
  const labelInfo = getToolLabelInfo(toolLabel);

  // Extract initial input from search params
  const initialInput = searchParams?.get('input') || undefined;

  useEffect(() => {
    // Simulate usage count
    setUsageCount(Math.floor(Math.random() * 5000) + 1000);

    // Track tool page view
    if (toolId) {
      const toolDef = getToolById(toolId);
      trackEngagement('tool-page-viewed', {
        tool: toolId,
        tool_category: toolDef?.categories?.[0],
        has_initial_input: !!initialInput,
        // Note: referrer, url, userLevel, utm_* are auto-added by EventNormalizer
      });
    }
  }, [toolId, initialInput]);

  const tool = getToolById(toolId);

  // Memoize related tools to avoid recalculating on every render
  const relatedTools = useMemo(() => {
    if (!tool) return [];
    const smartRelatedIds = getSmartRelatedTools(toolId, 4);

    if (smartRelatedIds && smartRelatedIds.length > 0) {
      const relatedToolObjects = smartRelatedIds
        .map((id: string) => toolsMap.get(id))
        .filter(
          (t: (typeof tools)[0] | undefined): t is (typeof tools)[0] =>
            t !== undefined && t.label !== 'coming-soon'
        );

      if (relatedToolObjects.length > 0) {
        return relatedToolObjects;
      }
    }

    // Fallback: Get tools from same category
    return tools
      .filter(
        (t) =>
          t.categories.includes(tool.categories[0]) &&
          t.id !== tool.id &&
          t.label !== 'coming-soon'
      )
      .slice(0, 4);
  }, [toolId, tool]);

  // Memoize same-category tools
  const sameCategoryTools = useMemo(() => {
    if (!tool) return [];
    return tools
      .filter(
        (t) =>
          t.categories.includes(tool.categories[0]) &&
          t.id !== tool.id &&
          t.label !== 'coming-soon'
      )
      .slice(0, 6);
  }, [toolId, tool]);

  // Memoize the tool prop object to prevent breaking ToolWorkspace memoization
  // Must be before early return to satisfy Rules of Hooks
  const toolWithSlug = useMemo(
    () =>
      tool
        ? ({ ...tool, slug: tool.id, category: tool.categories[0] } as any)
        : null,
    [tool]
  );

  if (!tool) {
    return <div>Tool not found</div>;
  }

  // Get translations
  const commonDict = dictionary?.common || {};

  const t = {
    share: commonDict?.actions?.share || 'Share',
    relatedTools: commonDict?.nav?.relatedTools || 'Related Tools',
    sameCategoryTools:
      commonDict?.nav?.sameCategoryTools || 'Tools from the same category',
    home: commonDict?.nav?.home || 'Home',
    allTools: commonDict?.nav?.allTools || 'All Tools',
    toolName: toolTranslations?.title || tool.name,
    toolDescription: toolTranslations?.description || tool.description,
  };

  // Get primary category information
  const primaryCategory = categories.find(
    (cat) => cat.id === tool.categories[0]
  );
  const categoryDict = dictionary?.categories?.[primaryCategory?.id || 'dev'];
  const categoryName = categoryDict?.name || primaryCategory?.name || 'Tools';
  const categoryId = tool.categories[0];

  const categoryColor = getCategoryColor(
    categoryId,
    theme === 'light' ? 'light' : 'dark'
  );

  const handleShare = async () => {
    const hasNativeShare =
      typeof navigator !== 'undefined' && 'share' in navigator;

    trackEngagement('tool-share-clicked', {
      tool: toolId,
      method: hasNativeShare ? 'native' : 'clipboard',
    });

    if (hasNativeShare && navigator.share) {
      try {
        await navigator.share({
          title: `${tool.name} - ToolsLab`,
          text: tool.description,
          url: window.location.href,
        });
        trackEngagement('tool-share-completed', {
          tool: toolId,
          method: 'native',
        });
      } catch (err) {
        // Share cancelled by user
        trackEngagement('tool-share-cancelled', {
          tool: toolId,
          method: 'native',
        });
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      trackEngagement('tool-share-completed', {
        tool: toolId,
        method: 'clipboard',
      });
      // Show toast notification
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
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

      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed -left-32 -top-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${categoryColor}1a` }}
      />
      <div className="pointer-events-none fixed -right-32 top-0 h-56 w-56 rounded-full bg-amber-500/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-4 sm:py-8">
        {/* Breadcrumb - Reduced spacing */}
        <nav className="mb-2 flex items-center gap-x-1.5 text-xs sm:flex-wrap sm:gap-x-2 sm:gap-y-1 sm:text-sm">
          <Link
            href={createHref('/')}
            aria-label={t.home}
            className="flex-shrink-0 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Home className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{t.home}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 sm:h-4 sm:w-4" />
          <Link
            href={createHref('/tools')}
            aria-label={t.allTools}
            className="flex-shrink-0 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <LayoutGrid className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">{t.allTools}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <Link
            href={createHref(`/category/${categoryId}`)}
            className="flex-shrink-0 whitespace-nowrap capitalize transition-colors"
            style={{ color: categoryColor }}
          >
            {categoryName || categoryId}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 sm:h-4 sm:w-4" />
          <span className="min-w-0 truncate font-medium text-slate-900 dark:text-white">
            {t.toolName}
          </span>
        </nav>

        {/* Tool Hero Section - Optimized spacing */}
        <div className="mb-3 flex items-start justify-between gap-4 md:mb-5">
          <ToolHeroSection
            toolId={tool.id}
            toolName={t.toolName}
            toolDescription={t.toolDescription}
            toolTagline={toolTranslations?.tagline}
            toolPageDescription={toolTranslations?.pageDescription}
            categoryColor={categoryColor}
            categoryId={categoryId}
            categoryName={categoryName}
            locale={locale}
            favoriteButton={
              <FavoriteButton
                type="tool"
                id={tool.id}
                name={tool.name}
                size="lg"
                showLabel={false}
              />
            }
            categoryBadge={
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                }}
              >
                {primaryCategory?.name || categoryId}
              </span>
            }
            labelBadge={
              labelInfo.hasLabel
                ? getLabelComponent(toolLabel, 'xs')
                : undefined
            }
            className="relative flex-1"
          />

          {/* Share Button (desktop) / Favorite Star (mobile) - Aligned with header */}
          <div className="flex items-start gap-2 pt-1">
            {/* Mobile: favorite star replaces share button */}
            <div className="sm:hidden">
              <FavoriteButton
                type="tool"
                id={tool.id}
                name={tool.name}
                size="md"
                showLabel={false}
              />
            </div>
            <button
              onClick={handleShare}
              className="hidden items-center gap-1.5 rounded-pg-btn border border-pg-border bg-pg-surface px-3 py-2 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text sm:flex"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.share}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Wider layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Tool Workspace - Much wider on desktop */}
          <div className="lg:col-span-9">
            <ToolWorkspace
              tool={toolWithSlug}
              categoryColor={categoryColor}
              initialInput={initialInput}
              locale={locale}
              dictionary={dictionary}
            />

            {/* Ad: mobile only — below tool input/result, above How to Use.
                Skipped for tools that render the banner inline above their Usage Tips. */}
            {!TOOLS_WITH_INLINE_MOBILE_AD.includes(tool.id) && (
              <AdBanner
                className="my-6 lg:hidden"
                minHeight={100}
                maxHeight={280}
                slot="5833147302"
              />
            )}

            {/* Ad: content area — desktop only, fixed 728x90 leaderboard, above How to Use */}
            <AdBanner
              className="my-6 hidden text-center lg:block"
              fixedWidth={728}
              fixedHeight={90}
              minHeight={90}
              maxHeight={90}
              slot="3320031589"
            />

            {/* Mobile Related Tools (visible only on mobile via CSS) */}
            <div className="my-8 lg:hidden">
              {/* Support / Donation Box */}
              <a
                href="https://buymeacoffee.com/toolslab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('donation', 'tool-sidebar')}
                className="group mb-6 block rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:border-amber-500/40 hover:bg-amber-500/10 dark:border-amber-500/20 dark:bg-amber-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                    ☕
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Enjoying ToolsLab?
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                      Share it or buy me a coffee to keep it free ☕
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-500/60 transition-colors group-hover:text-amber-500" />
                </div>
              </a>

              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                {t.relatedTools}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {relatedTools.map((relatedTool: (typeof tools)[0]) => (
                  <Link
                    key={relatedTool.id}
                    href={createHref(`/tools/${relatedTool.id}`)}
                    className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-white/[0.08] dark:bg-card"
                  >
                    <div
                      className="mb-2 inline-block rounded-lg p-2"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <ToolIcon id={relatedTool.id} className="h-5 w-5" style={{ color: categoryColor }} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {relatedTool.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {relatedTool.description}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Mobile Same Category Tools */}
              {sameCategoryTools.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                    {t.sameCategoryTools}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {sameCategoryTools.map((categoryTool: (typeof tools)[0]) => (
                      <Link
                        key={categoryTool.id}
                        href={createHref(`/tools/${categoryTool.id}`)}
                        className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-white/[0.08] dark:bg-card"
                      >
                        <div
                          className="mb-2 inline-block rounded-lg p-2"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <ToolIcon id={categoryTool.id} className="h-5 w-5" style={{ color: categoryColor }} />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {categoryTool.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {categoryTool.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* How to Use Section */}
            <ToolHowToUse
              toolId={tool.id}
              categoryColor={categoryColor}
              locale={locale}
              instructions={dictionary?.tools?.[tool.id]?.instructions}
              labels={{
                keyFeatures: dictionary?.common?.labels?.keyFeatures,
                commonUseCases: dictionary?.common?.labels?.commonUseCases,
                proTips: dictionary?.common?.labels?.proTips,
                troubleshooting: dictionary?.common?.labels?.troubleshooting,
                keyboardShortcuts:
                  dictionary?.common?.labels?.keyboardShortcuts,
                howToUse: dictionary?.common?.labels?.howToUse,
              }}
            />
          </div>

          {/* Sidebar (Desktop Only via CSS) */}
          <div className="hidden space-y-3 lg:col-span-3 lg:block">
            {/* Ad: above Related Tools */}
            <AdBanner minHeight={250} slot="5204948571" />

            {/* Related Tools */}
            <div className="rounded-pg-card border border-pg-border bg-pg-surface p-3.5">
              <h3 className="mb-2.5 text-[13px] font-semibold text-pg-text">
                {t.relatedTools}
              </h3>
              <div className="space-y-0">
                {relatedTools.map((relatedTool: (typeof tools)[0], idx: number) => (
                  <Link
                    key={relatedTool.id}
                    href={createHref(`/tools/${relatedTool.id}`)}
                    className={`group flex items-center gap-2.5 py-2 ${idx !== relatedTools.length - 1 ? 'border-b border-pg-border' : ''}`}
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: `color-mix(in oklab, ${categoryColor} 20%, transparent)`,
                        color: categoryColor,
                      }}
                    >
                      <ToolIcon id={relatedTool.id} className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-pg-text">
                        {relatedTool.name}
                      </p>
                      <p className="truncate text-[11px] text-pg-dim">
                        {relatedTool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support / Donation Box */}
            <a
              href="https://buymeacoffee.com/toolslab"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('donation', 'tool-sidebar')}
              className="group block rounded-pg-card border border-dashed p-3.5 transition-colors"
              style={{
                borderColor: 'var(--pg-accent-2)',
                background:
                  'linear-gradient(135deg, color-mix(in oklab, var(--pg-accent-2) 22%, transparent), color-mix(in oklab, var(--pg-accent-3) 22%, transparent))',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl transition-transform duration-200 group-hover:scale-110">☕</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-pg-text">Enjoying ToolsLab?</p>
                  <p className="text-[11px] text-pg-muted">
                    Buy me a coffee to keep it free.
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-pg-muted transition-colors group-hover:text-pg-text" />
              </div>
            </a>

            {/* Ad: above More from this category */}
            <AdBanner minHeight={250} slot="4183510940" />

            {/* Same Category Tools */}
            {sameCategoryTools.length > 0 && (
              <div className="rounded-pg-card border border-pg-border bg-pg-surface p-3.5">
                <h3 className="mb-2.5 text-[13px] font-semibold text-pg-text">
                  {t.sameCategoryTools}
                </h3>
                <div className="space-y-0">
                  {sameCategoryTools.map(
                    (categoryTool: (typeof tools)[0], idx: number) => (
                      <Link
                        key={categoryTool.id}
                        href={createHref(`/tools/${categoryTool.id}`)}
                        className={`group flex items-center gap-2.5 py-2 ${idx !== sameCategoryTools.length - 1 ? 'border-b border-pg-border' : ''}`}
                      >
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: `color-mix(in oklab, ${categoryColor} 20%, transparent)`,
                            color: categoryColor,
                          }}
                        >
                          <ToolIcon id={categoryTool.id} className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-pg-text">
                            {categoryTool.name}
                          </p>
                          <p className="truncate text-[11px] text-pg-dim">
                            {categoryTool.description}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Modal */}
        <FAQModal
          categoryColor={categoryColor}
          toolName={tool.name}
          locale={locale}
          faqData={dictionary?.common?.faq}
        />
      </div>
    </div>
  );
}
