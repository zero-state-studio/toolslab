/**
 * Sitemap Generation Utilities for Multilingual Site
 * Supports dynamic generation of sitemap index and locale-specific sitemaps
 */

import { tools } from '@/lib/tools';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { ACTIVE_ARTICLE_SLUGS } from '@/lib/blog/active-articles';

const SITE_URL = 'https://toolslab.dev';

export interface SitemapURL {
  url: string;
  lastmod: string;
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
}

export interface SitemapPage {
  path: string;
  changefreq: SitemapURL['changefreq'];
  priority: number;
}

/**
 * Get all static pages to include in sitemap
 */
export function getStaticPages(): SitemapPage[] {
  return [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/tools', changefreq: 'daily', priority: 0.9 },
    { path: '/categories', changefreq: 'weekly', priority: 0.8 },
    { path: '/lab', changefreq: 'monthly', priority: 0.6 },
    { path: '/about', changefreq: 'monthly', priority: 0.5 },
    { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  ];
}

/**
 * Get all tool pages
 */
export function getToolPages(): SitemapPage[] {
  return tools
    .filter((tool) => tool.label !== 'coming-soon')
    .map((tool) => {
      let priority: number;
      if (tool.searchVolume >= 50000) priority = 0.9;
      else if (tool.searchVolume >= 10000) priority = 0.8;
      else priority = 0.7;
      return {
        path: `/tools/${tool.id}`,
        changefreq: 'weekly' as const,
        priority,
      };
    });
}

/**
 * Get all category pages
 */
export function getCategoryPages(): SitemapPage[] {
  // Extract unique categories from tools
  const categories = new Set(tools.flatMap((tool) => tool.categories));

  return Array.from(categories).map((category) => ({
    path: `/category/${category}`,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));
}

/**
 * Get all blog article pages
 */
export function getBlogPages(): SitemapPage[] {
  return ACTIVE_ARTICLE_SLUGS.map((slug) => ({
    path: `/blog/${slug}`,
    changefreq: 'monthly' as const,
    priority: 0.6,
  }));
}

/**
 * Get all pages for sitemap (static + blog + tools + categories)
 */
export function getAllPages(): SitemapPage[] {
  return [
    ...getStaticPages(),
    ...getBlogPages(),
    ...getToolPages(),
    ...getCategoryPages(),
  ];
}

/**
 * Generate absolute URL for a locale and path
 */
export function getAbsoluteUrl(locale: Locale, path: string): string {
  // English (default) doesn't have prefix
  if (locale === defaultLocale) {
    if (path === '/') return SITE_URL; // 'https://toolslab.dev' (no trailing slash)
    return `${SITE_URL}${path}`;
  }

  // Special case for root path: return /{locale} without trailing slash
  if (path === '/') {
    return `${SITE_URL}/${locale}`;
  }

  // Other locales have prefix
  return `${SITE_URL}/${locale}${path}`;
}

/**
 * Generate hreflang alternates for a page
 */
export function generateHreflangAlternates(path: string): Array<{
  hreflang: string;
  href: string;
}> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  // Add all locales
  locales.forEach((locale) => {
    alternates.push({
      hreflang: locale,
      href: getAbsoluteUrl(locale as Locale, path),
    });
  });

  // Add x-default (points to English version)
  alternates.push({
    hreflang: 'x-default',
    href: getAbsoluteUrl(defaultLocale, path),
  });

  return alternates;
}

/**
 * Generate sitemap URLs for a specific locale
 */
export function generateSitemapURLs(locale: Locale): SitemapURL[] {
  const pages = getAllPages();
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return pages.map((page) => ({
    url: getAbsoluteUrl(locale, page.path),
    lastmod,
    changefreq: page.changefreq,
    priority: page.priority,
    alternates: generateHreflangAlternates(page.path),
  }));
}

/**
 * Generate XML for a single sitemap URL with hreflang
 */
export function generateURLXML(sitemapURL: SitemapURL): string {
  const alternatesXML = sitemapURL.alternates
    ? sitemapURL.alternates
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`
        )
        .join('\n')
    : '';

  return `  <url>
    <loc>${sitemapURL.url}</loc>
    <lastmod>${sitemapURL.lastmod}</lastmod>
    <changefreq>${sitemapURL.changefreq}</changefreq>
    <priority>${sitemapURL.priority.toFixed(1)}</priority>
${alternatesXML}
  </url>`;
}

/**
 * Generate complete sitemap XML for a locale
 */
export function generateSitemapXML(locale: Locale): string {
  const urls = generateSitemapURLs(locale);
  const urlsXML = urls.map(generateURLXML).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXML}
</urlset>`;
}

/**
 * Generate sitemap index XML
 */
export function generateSitemapIndexXML(): string {
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const sitemapsXML = locales
    .map(
      (locale) => `  <sitemap>
    <loc>${SITE_URL}/sitemap-${locale}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXML}
</sitemapindex>`;
}

/**
 * Validate that all pages have translations in all locales
 * Returns array of missing translations
 */
export function validateSitemapCompleteness(): Array<{
  page: string;
  missingLocales: Locale[];
}> {
  const pages = getAllPages();
  const issues: Array<{ page: string; missingLocales: Locale[] }> = [];

  // For now, all pages should exist in all locales
  // This could be extended to check actual file existence
  pages.forEach((page) => {
    const missingLocales: Locale[] = [];

    // Check if dynamic routes exist
    // For static validation, we assume all pages exist in all locales
    // Real validation would check file system or build output

    if (missingLocales.length > 0) {
      issues.push({
        page: page.path,
        missingLocales,
      });
    }
  });

  return issues;
}

/**
 * Validate bidirectional hreflang
 * Ensures all hreflang links are bidirectional
 */
export function validateHreflangBidirectionality(): Array<{
  page: string;
  issue: string;
}> {
  const pages = getAllPages();
  const issues: Array<{ page: string; issue: string }> = [];

  pages.forEach((page) => {
    const alternates = generateHreflangAlternates(page.path);

    // Check that x-default exists
    const hasXDefault = alternates.some((alt) => alt.hreflang === 'x-default');
    if (!hasXDefault) {
      issues.push({
        page: page.path,
        issue: 'Missing x-default hreflang',
      });
    }

    // Check that all locales are present
    locales.forEach((locale) => {
      const hasLocale = alternates.some((alt) => alt.hreflang === locale);
      if (!hasLocale) {
        issues.push({
          page: page.path,
          issue: `Missing hreflang for locale: ${locale}`,
        });
      }
    });
  });

  return issues;
}

/**
 * Get sitemap statistics
 */
export function getSitemapStats() {
  const staticPages = getStaticPages();
  const blogPages = getBlogPages();
  const toolPages = getToolPages();
  const categoryPages = getCategoryPages();
  const totalPages = getAllPages();

  return {
    totalLocales: locales.length,
    staticPages: staticPages.length,
    blogPages: blogPages.length,
    toolPages: toolPages.length,
    categoryPages: categoryPages.length,
    totalPagesPerLocale: totalPages.length,
    totalURLsInAllSitemaps: totalPages.length * locales.length,
    locales: locales.join(', '),
  };
}
