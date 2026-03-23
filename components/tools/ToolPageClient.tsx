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
} from 'lucide-react';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { useToolLabel } from '@/lib/services/toolLabelService';
import { useToolLabels } from '@/lib/hooks/useToolLabels';
import { FAQModal } from '@/components/ui/faq-modal';
import ToolHowToUse from './ToolHowToUse';
import ToolHeroSection from './ToolHeroSection';
import { getSmartRelatedTools } from '@/lib/seo/related-tools-engine';

const CATEGORY_COLORS: Record<string, string> = {
  data: '#0EA5E9',
  encoding: '#10B981',
  text: '#8B5CF6',
  generators: '#F97316',
  web: '#EC4899',
  dev: '#F59E0B',
  formatters: '#6366F1',
  social: '#F43F5E',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#3B82F6';
}

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
      trackEngagement('tool-page-viewed', {
        tool: toolId,
        has_initial_input: !!initialInput,
        // Note: referrer and url are automatically added by trackEngagement()
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
  const categoryId = tool?.categories[0] ?? 'dev';
  const toolWithSlug = useMemo(
    () => (tool ? ({ ...tool, slug: tool.id, category: categoryId } as any) : null),
    [tool, categoryId]
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

  const categoryColor = getCategoryColor(categoryId);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header Ad Banner - Hidden */}

      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:py-8">
        {/* Breadcrumb - Reduced spacing */}
        <nav className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <Link
            href="/"
            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link
            href="/tools"
            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Tools
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link
            href={`/category/${categoryId}`}
            className="capitalize text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            style={{ color: categoryColor }}
          >
            {primaryCategory?.name || categoryId}
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {tool.name}
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
            categoryName={categoryName}
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

          {/* Share Button - Aligned with header */}
          <div className="flex items-start pt-1">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
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
          <div className="hidden space-y-4 lg:col-span-3 lg:block">
              {/* Support / Donation Box */}
              <a
                href="https://buymeacoffee.com/toolslab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion('donation', 'tool-sidebar')}
                className="group block rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:border-amber-500/40 hover:bg-amber-500/10 dark:border-amber-500/20 dark:bg-amber-500/5"
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

              {/* Related Tools */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {t.relatedTools}
                </h3>
                <div className="space-y-3">
                  {relatedTools.map((relatedTool: (typeof tools)[0]) => (
                    <Link
                      key={relatedTool.id}
                      href={createHref(`/tools/${relatedTool.id}`)}
                      className="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center text-lg"
                          style={{ color: categoryColor }}
                        >
                          {relatedTool.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {relatedTool.name}
                        </p>
                        <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                          {relatedTool.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Same Category Tools */}
              {sameCategoryTools.length > 0 && (
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {t.sameCategoryTools}
                  </h3>
                  <div className="space-y-3">
                    {sameCategoryTools.map(
                      (categoryTool: (typeof tools)[0]) => (
                        <Link
                          key={categoryTool.id}
                          href={createHref(`/tools/${categoryTool.id}`)}
                          className="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div
                            className="rounded-lg p-2"
                            style={{ backgroundColor: `${categoryColor}20` }}
                          >
                            <span
                              className="flex h-5 w-5 items-center justify-center text-lg"
                              style={{ color: categoryColor }}
                            >
                              {categoryTool.icon}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {categoryTool.name}
                            </p>
                            <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                              {categoryTool.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Sidebar Ad - Hidden */}
            </div>
        </div>

        {/* Mobile Related Tools (visible only on mobile via CSS) */}
        <div className="mt-8 sm:mt-12 lg:hidden">
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

            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {t.relatedTools}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedTools.map((relatedTool: (typeof tools)[0]) => (
                <Link
                  key={relatedTool.id}
                  href={createHref(`/tools/${relatedTool.id}`)}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="mb-2 inline-block rounded-lg p-2"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center text-lg"
                      style={{ color: categoryColor }}
                    >
                      {relatedTool.icon}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {relatedTool.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {relatedTool.description}
                  </p>
                </Link>
              ))}
            </div>
        </div>

        {/* Mobile Same Category Tools (visible only on mobile via CSS) */}
        {sameCategoryTools.length > 0 && (
          <div className="mt-12 sm:mt-16 lg:hidden">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {t.sameCategoryTools}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {sameCategoryTools.map((categoryTool: (typeof tools)[0]) => (
                <Link
                  key={categoryTool.id}
                  href={createHref(`/tools/${categoryTool.id}`)}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="mb-2 inline-block rounded-lg p-2"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center text-lg"
                      style={{ color: categoryColor }}
                    >
                      {categoryTool.icon}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {categoryTool.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {categoryTool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

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
