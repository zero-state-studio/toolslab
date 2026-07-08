'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { categories, getToolsByCategory, getToolById } from '@/lib/tools';
import {
  type CategorySEO,
  generateCategoryStructuredData,
} from '@/lib/category-seo';
import { trackEngagement } from '@/lib/analytics';
import { ChevronRight, ArrowRight, Star, Search } from 'lucide-react';
import Script from 'next/script';
import {
  getCategoryTheme,
  catChipVars,
  catHeroVars,
} from '@/lib/categoryTheme';
import { CategoryToolCard } from '@/components/tools/CategoryToolCard';

type SortKey = 'popular' | 'az' | 'new';

interface CategoryPageContentProps {
  categoryId: string;
  seoContent: CategorySEO;
}

export default function CategoryPageContent({
  categoryId,
  seoContent,
}: CategoryPageContentProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');

  const category = categories.find((cat) => cat.id === categoryId);
  const tools = useMemo(
    () => (category ? getToolsByCategory(category.id) : []),
    [category]
  );
  const structuredData = category ? generateCategoryStructuredData(seoContent) : null;
  const cTheme = getCategoryTheme(categoryId);

  useEffect(() => {
    if (!category) return;
    trackEngagement('category-page-viewed', {
      category: categoryId,
      toolsCount: tools.length,
    });
  }, [categoryId, category, tools.length]);

  const visibleTools = useMemo(() => {
    const labelOf = (id: string) => getToolById(id)?.label || '';
    let list = tools.filter(
      (t) => labelOf(t.id) !== 'coming-soon' && labelOf(t.id) !== 'test'
    );

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }

    if (sort === 'az') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'new') {
      list = [...list].sort((a, b) => {
        const an = a.label === 'new' ? 1 : 0;
        const bn = b.label === 'new' ? 1 : 0;
        return bn - an;
      });
    } else {
      list = [...list].sort(
        (a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0)
      );
    }

    return list;
  }, [tools, query, sort]);

  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      {structuredData && (
        <Script
          id="category-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <div className="min-h-screen bg-[color:var(--pg-bg)]">
        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="pg-container pb-6 pt-8">
          <nav className="mb-4 flex text-[13px] text-pg-muted" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-pg-text">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link href="/categories" className="hover:text-pg-text">
                  Categories
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="font-medium text-pg-text">{category.name}</li>
            </ol>
          </nav>

          <div
            className="cat-hero relative overflow-hidden rounded-pg-hero border p-7"
            style={catHeroVars(cTheme.hue)}
          >
            <span
              aria-hidden
              className="cat-glow pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full opacity-25 blur-2xl"
              style={catHeroVars(cTheme.hue)}
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <span
                className="cat-chip flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-[18px]"
                style={catChipVars(cTheme.hue)}
              >
                <cTheme.icon className="h-9 w-9" strokeWidth={1.6} />
              </span>
              <div className="flex-1">
                <h1 className="text-[clamp(28px,4vw,36px)] font-bold leading-tight tracking-[-0.02em] text-pg-text">
                  {category.name}
                </h1>
                <p className="mt-1 text-[15px] text-pg-muted">
                  {seoContent.tagline || category.description}
                </p>
                <p className="mt-1 text-[13px] text-pg-dim">
                  {tools.length} tools · all free and client-side.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-pg-card border border-pg-border bg-pg-surface px-3.5 py-2.5 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text"
              >
                <Star className="h-3.5 w-3.5" /> Star category
              </button>
            </div>

            {seoContent.benefits && seoContent.benefits.length > 0 && (
              <div className="relative mt-5 flex flex-wrap gap-2">
                {seoContent.benefits.slice(0, 4).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full border border-pg-border bg-pg-surface px-3 py-1 text-[12px] text-pg-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-pg-accent" />
                    {benefit}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── FILTER + SORT ─────────────────────────────────────── */}
        <section className="pg-container">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pg-dim" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${tools.length} ${category.name.toLowerCase()}...`}
                className="w-full rounded-pg-bar border border-pg-border bg-pg-surface py-2.5 pl-10 pr-3 text-[14px] text-pg-text placeholder:text-pg-dim focus:border-pg-border-hi focus:outline-none"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-pg-card border border-pg-border bg-pg-surface p-1">
              {(['popular', 'az', 'new'] as const).map((key) => {
                const label =
                  key === 'popular' ? 'Popular' : key === 'az' ? 'A–Z' : 'New';
                const active = sort === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={
                      'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ' +
                      (active
                        ? 'bg-pg-surface-hi text-pg-text'
                        : 'text-pg-muted hover:text-pg-text')
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TOOLS GRID ────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((tool) => (
              <CategoryToolCard
                key={tool.id}
                tool={tool}
                hue={cTheme.hue}
                Icon={cTheme.icon}
              />
            ))}
            {visibleTools.length === 0 && (
              <p className="col-span-full py-10 text-center text-[13px] text-pg-muted">
                No tools match your filter.
              </p>
            )}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        {seoContent.faqs && seoContent.faqs.length > 0 && (
          <section className="pg-container pt-8">
            <div className="rounded-pg-panel border border-pg-border bg-pg-surface p-6">
              <h2 className="mb-5 text-[18px] font-semibold text-pg-text">
                Frequently Asked Questions about {category.name} Tools
              </h2>
              <div className="space-y-0">
                {seoContent.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-pg-border last:border-0"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="flex w-full items-start justify-between gap-4 py-4 text-left"
                    >
                      <h3 className="text-[14px] font-medium text-pg-text">
                        {faq.question}
                      </h3>
                      <ChevronRight
                        className={
                          'mt-0.5 h-4 w-4 flex-shrink-0 text-pg-muted transition-transform duration-200 ' +
                          (expandedFaq === index ? 'rotate-90 text-pg-accent' : '')
                        }
                      />
                    </button>
                    {expandedFaq === index && (
                      <p className="pb-4 text-[14px] leading-relaxed text-pg-muted">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── RELATED CATEGORIES ────────────────────────────── */}
        {seoContent.relatedCategories && seoContent.relatedCategories.length > 0 && (
          <section className="pg-container mt-8">
            <h2 className="mb-3 text-[16px] font-semibold text-pg-text">
              Related Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {seoContent.relatedCategories.map((relatedId) => {
                const relatedCategory = categories.find((c) => c.id === relatedId);
                if (!relatedCategory) return null;
                const relTheme = getCategoryTheme(relatedId);
                return (
                  <Link
                    key={relatedId}
                    href={`/category/${relatedId}`}
                    className="inline-flex items-center gap-2 rounded-pg-card border border-pg-border bg-pg-surface px-3 py-2 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text"
                  >
                    <span
                      className="cat-chip inline-flex h-6 w-6 items-center justify-center rounded-md"
                      style={catChipVars(relTheme.hue)}
                    >
                      <relTheme.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <span>{relatedCategory.name}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="pg-container mb-10 mt-8">
          <div className="rounded-pg-panel border border-pg-border bg-pg-surface p-6 text-center">
            <h2 className="mb-2 text-[24px] font-bold text-pg-text">
              Looking for more tools?
            </h2>
            <p className="mb-6 text-pg-muted">
              Browse all {totalTools}+ tools across every category.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-pg-card px-6 py-3 text-[14px] font-semibold text-white shadow-[var(--pg-shadow-search-glow)] transition-transform hover:-translate-y-0.5"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, var(--pg-accent) 0%, var(--pg-accent-2) 100%)',
              }}
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

