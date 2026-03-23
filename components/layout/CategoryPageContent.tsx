'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { categories, getToolsByCategory } from '@/lib/tools';
import { ToolCardWrapper } from '@/components/tools/ToolCardWrapper';
import {
  type CategorySEO,
  generateCategoryStructuredData,
} from '@/lib/category-seo';
import { getToolById } from '@/lib/tools';
import { trackEngagement } from '@/lib/analytics';
import {
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Star,
} from 'lucide-react';
import Script from 'next/script';

// ── Design tokens (match CategoriesHubContentSimple) ─────────────
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
// ──────────────────────────────────────────────────────────────────

interface CategoryPageContentProps {
  categoryId: string;
  seoContent: CategorySEO;
}

export default function CategoryPageContent({
  categoryId,
  seoContent,
}: CategoryPageContentProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const category = categories.find((cat) => cat.id === categoryId);
  const tools = category ? getToolsByCategory(category.id) : [];
  const structuredData = generateCategoryStructuredData(seoContent);
  const gradient = categoryGradients[categoryId] || 'from-violet-500 to-purple-500';

  useEffect(() => {
    if (!category) return;
    trackEngagement('category-page-viewed', {
      category: categoryId,
      toolsCount: tools.length,
    });
  }, [categoryId, category, tools.length]);

  if (!category) {
    return <div>Category not found</div>;
  }

  const getToolLabelForTool = (toolId: string) => {
    const tool = getToolById(toolId);
    return tool?.label || '';
  };

  const popularTools = tools.filter(
    (tool) => getToolLabelForTool(tool.id) === 'popular'
  );
  const otherTools = tools.filter((tool) => {
    const label = getToolLabelForTool(tool.id);
    return !label || (label !== 'popular' && label !== 'coming-soon' && label !== 'test');
  });
  const allDisplayTools = tools.filter(
    (tool) => getToolLabelForTool(tool.id) !== 'coming-soon'
  );

  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <>
      <Script
        id="category-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-5">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -left-32 -top-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 top-0 h-56 w-56 rounded-full bg-amber-500/[0.07] blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-4">
            {/* Breadcrumb */}
            <nav className="mb-3 flex" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link href="/" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    Home
                  </Link>
                </li>
                <li><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></li>
                <li>
                  <Link href="/categories" className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    Categories
                  </Link>
                </li>
                <li><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></li>
                <li className="font-medium text-slate-900 dark:text-white">{category.name}</li>
              </ol>
            </nav>

            {/* Category badge + icon */}
            <div className="mb-3 flex items-center gap-3">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}>
                <span className="text-xl leading-none">{category.icon}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1">
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-300">
                  {tools.length} tools
                </span>
              </div>
            </div>

            {/* H1 */}
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {seoContent.h1Title.split(category.name)[0]}
              <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {category.name}
              </span>
              {seoContent.h1Title.split(category.name)[1] || ''}
            </h1>

            {/* Tagline */}
            <p className="mb-2 text-base font-medium text-slate-700 dark:text-slate-300 sm:text-lg">
              {seoContent.tagline}
            </p>

            {/* Description */}
            <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:line-clamp-none line-clamp-3">
              {seoContent.description}
            </p>

            {/* Benefits chips */}
            {seoContent.benefits && seoContent.benefits.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {seoContent.benefits.slice(0, 4).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    {benefit}
                  </span>
                ))}
              </div>
            )}

            {/* Use cases */}
            {seoContent.useCases && seoContent.useCases.length > 0 && (
              <div className="hidden flex-wrap items-center gap-x-2 gap-y-1 md:flex">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-500">
                  Perfect for:
                </span>
                {seoContent.useCases.map((useCase, index) => (
                  <span key={index} className="text-xs text-slate-500 dark:text-slate-500">
                    {useCase}{index < seoContent.useCases.length - 1 && <span className="ml-2 text-slate-300 dark:text-slate-700">·</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── TOOLS ──────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16">

          {/* Popular Tools */}
          {popularTools.length > 0 && (
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  Most Popular
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  Top Picks
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popularTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Other Tools */}
          {otherTools.length > 0 && (
            <div className="mb-10">
              {(popularTools.length > 0) && (
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  All {category.name} Tools
                </h2>
              )}
              {popularTools.length === 0 && (
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  {category.name} Tools
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {otherTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* ── FAQ ──────────────────────────────────────────────────── */}
          {seoContent.faqs && seoContent.faqs.length > 0 && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                Frequently Asked Questions about {category.name} Tools
              </h2>
              <div className="space-y-0">
                {seoContent.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-slate-100 last:border-0 dark:border-white/[0.04]"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="flex w-full items-start justify-between gap-4 py-4 text-left"
                    >
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        {faq.question}
                      </h3>
                      <ChevronRight
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                          expandedFaq === index ? 'rotate-90 text-violet-500' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── RELATED CATEGORIES ───────────────────────────────────── */}
          {seoContent.relatedCategories && seoContent.relatedCategories.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                Related Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {seoContent.relatedCategories.map((relatedId) => {
                  const relatedCategory = categories.find((c) => c.id === relatedId);
                  if (!relatedCategory) return null;
                  const relGradient = categoryGradients[relatedId] || 'from-violet-500 to-purple-500';
                  return (
                    <Link
                      key={relatedId}
                      href={`/category/${relatedId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-300 dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
                    >
                      <span className={`inline-flex rounded-lg bg-gradient-to-br ${relGradient} p-1 text-white`}>
                        <span className="text-xs leading-none">{relatedCategory.icon}</span>
                      </span>
                      <span>{relatedCategory.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.01]">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Looking for more tools?
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Browse all {totalTools}+ tools across every category.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(139,92,246,0.45)]"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </section>
      </div>
    </>
  );
}
