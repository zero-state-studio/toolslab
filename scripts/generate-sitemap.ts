/**
 * Sitemap Generation Script
 * Generates static sitemap XML files with full hreflang annotations
 *
 * Run with: npm run sitemap:generate
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateSitemapXML,
  generateSitemapIndexXML,
  getSitemapStats,
} from '../lib/sitemap/sitemap-utils';
import { locales, type Locale } from '../lib/i18n/config';

const publicDir = path.join(process.cwd(), 'public');

console.log('🗺️  Generating ToolsLab Sitemaps with hreflang...\n');

const stats = getSitemapStats();
console.log(
  `📊 ${stats.totalPagesPerLocale} pages × ${stats.totalLocales} locales = ${stats.totalURLsInAllSitemaps} total URLs\n`
);

// Generate sitemap index
const indexXML = generateSitemapIndexXML();
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXML, 'utf8');
console.log('✅ sitemap.xml (index)');

// Generate locale-specific sitemaps
for (const locale of locales) {
  const xml = generateSitemapXML(locale as Locale);
  const filename = `sitemap-${locale}.xml`;
  fs.writeFileSync(path.join(publicDir, filename), xml, 'utf8');
  const sizeKB = (xml.length / 1024).toFixed(1);
  console.log(`✅ ${filename} (${sizeKB} KB)`);
}

console.log('\n🎉 All sitemaps generated successfully!');
console.log(
  '📤 Submit https://toolslab.dev/sitemap.xml to Google Search Console'
);
