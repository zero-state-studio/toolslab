/**
 * Sitemap Generation Script
 * Generates static sitemap XML files with full hreflang annotations
 *
 * Run with: npm run sitemap:generate
 *
 * Anti-churn: lastmod is resolved per-URL. Each URL keeps the date it already
 * had in the live sitemap; only brand-new URLs get today's date. The index
 * lastmod per locale is the newest URL lastmod in that sitemap. This stops the
 * "every URL changed today" signal that suppresses Google crawl on each regen.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateSitemapXML,
  generateSitemapURLs,
  generateSitemapIndexXML,
  getSitemapStats,
} from '../lib/sitemap/sitemap-utils';
import { locales, type Locale } from '../lib/i18n/config';

const publicDir = path.join(process.cwd(), 'public');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

/**
 * Parse an existing sitemap file into a Map<url, lastmod> so previously
 * published URLs keep their date across regenerations.
 */
function parseExistingLastmod(locale: Locale): Map<string, string> {
  const map = new Map<string, string>();
  const file = path.join(publicDir, `sitemap-${locale}.xml`);
  if (!fs.existsSync(file)) return map;

  const xml = fs.readFileSync(file, 'utf8');
  const re = /<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    map.set(m[1].trim(), m[2].trim());
  }
  return map;
}

console.log('🗺️  Generating ToolsLab Sitemaps with hreflang...\n');

const stats = getSitemapStats();
console.log(
  `📊 ${stats.totalPagesPerLocale} pages × ${stats.totalLocales} locales = ${stats.totalURLsInAllSitemaps} total URLs\n`
);

// Build a combined url→lastmod map from all existing locale sitemaps
const existingLastmod = new Map<string, string>();
for (const locale of locales) {
  for (const [url, date] of parseExistingLastmod(locale as Locale)) {
    existingLastmod.set(url, date);
  }
}

// Generate locale-specific sitemaps, tracking the newest lastmod per locale
const perLocaleLastmod: Partial<Record<Locale, string>> = {};
let newUrlCount = 0;

for (const locale of locales) {
  const urls = generateSitemapURLs(locale as Locale, existingLastmod, today);
  newUrlCount += urls.filter((u) => !existingLastmod.has(u.url)).length;

  perLocaleLastmod[locale as Locale] = urls.reduce(
    (max, u) => (u.lastmod > max ? u.lastmod : max),
    '0000-00-00'
  );

  const xml = generateSitemapXML(locale as Locale, existingLastmod, today);
  const filename = `sitemap-${locale}.xml`;
  fs.writeFileSync(path.join(publicDir, filename), xml, 'utf8');
  const sizeKB = (xml.length / 1024).toFixed(1);
  console.log(`✅ ${filename} (${sizeKB} KB)`);
}

// Generate sitemap index with per-locale lastmod (newest URL in each sitemap)
const indexXML = generateSitemapIndexXML(perLocaleLastmod, today);
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXML, 'utf8');
console.log('✅ sitemap.xml (index)');

console.log(
  `\n🎉 All sitemaps generated successfully! ${newUrlCount} new URL(s) stamped ${today}, rest preserved.`
);
console.log(
  '📤 Submit https://toolslab.dev/sitemap.xml to Google Search Console'
);
