/**
 * Analyze all tools and populate the admin DB with accurate data.
 *
 * Checks:
 * - SEO level: 0 (no SEO), 1 (has description), 2 (has longTailKeywords)
 * - Language quality: flags translations that contain wrong-language text
 * - Generates notes for issues found
 *
 * Run: npx tsx scripts/analyze-tools-admin.ts
 */
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { tools } from '../lib/tools';

const DB_PATH = path.join(__dirname, '..', 'data', 'admin.db');
const I18N_PATH = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries');

const LOCALES = ['en', 'it', 'es', 'fr', 'de', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

// Common words that strongly indicate English text
// These are function words that rarely appear in other languages
const ENGLISH_INDICATORS = [
  // Articles & determiners
  /\bthe\b/i, /\byour\b/i, /\bthis\b/i, /\bthat\b/i,
  // Prepositions
  /\bwith\b/i, /\bfrom\b/i, /\binto\b/i, /\babout\b/i,
  // Conjunctions
  /\band\b/i, /\bbut\b/i, /\bbecause\b/i,
  // Verbs
  /\bis\b/i, /\bare\b/i, /\bwas\b/i, /\bwere\b/i,
  /\bhave\b/i, /\bhas\b/i, /\bcan\b/i, /\bwill\b/i,
  /\bshould\b/i, /\bwould\b/i, /\bcould\b/i,
  // Common words
  /\bfor\b/i, /\bnot\b/i, /\byou\b/i, /\ball\b/i,
  /\bbetween\b/i, /\bwhether\b/i, /\bwithout\b/i,
  /\beach\b/i, /\bevery\b/i, /\btheir\b/i,
  /\bbefore\b/i, /\bafter\b/i, /\bduring\b/i,
];

// Words that are commonly used in tech context across languages (false positives to avoid)
const TECH_WORDS = new Set([
  'json', 'csv', 'xml', 'sql', 'html', 'css', 'url', 'base64', 'jwt',
  'yaml', 'pdf', 'gif', 'png', 'jpg', 'webp', 'uuid', 'qr', 'utm',
  'regex', 'curl', 'api', 'http', 'https', 'md5', 'sha', 'sha256',
  'sha512', 'bcrypt', 'unix', 'timestamp', 'markdown', 'typescript',
  'javascript', 'lorem', 'ipsum', 'rgb', 'hex', 'hsl', 'unicode',
  'ascii', 'utf', 'ssl', 'tls', 'dns', 'ip', 'tcp', 'cron', 'crontab',
  'chmod', 'htaccess', 'eml', 'barcode', 'favicon', 'minifier', 'formatter',
  'whatsapp', 'youtube', 'instagram', 'linkedin', 'online', 'free', 'tool',
  'input', 'output', 'format', 'convert', 'encode', 'decode', 'hash',
  'generate', 'validate', 'preview', 'editor', 'code', 'data', 'file',
  'text', 'string', 'number', 'boolean', 'array', 'object', 'null',
  'token', 'prompt', 'ai', 'gpt', 'openai', 'ctrl', 'shift', 'enter',
  'tab', 'escape', 'delete', 'copy', 'paste', 'select', 'click',
  'drag', 'drop', 'download', 'upload', 'save', 'load', 'import', 'export',
  'ean', 'upc', 'code128', 'pdf417', 'datamatrix', 'itf',
]);

/**
 * Check if a text string appears to be in English rather than the target locale.
 * Returns a score: 0 = looks translated, higher = more likely English
 */
function englishScore(text: string): number {
  if (!text || text.length < 10) return 0;

  // Remove tech words to avoid false positives
  let cleanText = text.toLowerCase();
  for (const tw of TECH_WORDS) {
    cleanText = cleanText.replace(new RegExp(`\\b${tw}\\b`, 'gi'), '');
  }

  let matches = 0;
  let total = ENGLISH_INDICATORS.length;

  for (const pattern of ENGLISH_INDICATORS) {
    if (pattern.test(cleanText)) {
      matches++;
    }
  }

  return matches / total;
}

/**
 * Check if a translation looks like it's actually in the target language.
 * Compares against the English version to detect untranslated content.
 */
function checkTranslation(
  enData: Record<string, any>,
  localeData: Record<string, any>,
  locale: Locale,
  toolId: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Fields to check (most important user-visible text)
  const fieldsToCheck = ['title', 'description', 'tagline', 'pageDescription'];

  for (const field of fieldsToCheck) {
    const enValue = enData[field];
    const localeValue = localeData[field];

    if (!localeValue) {
      issues.push(`Missing '${field}'`);
      continue;
    }

    if (typeof enValue !== 'string' || typeof localeValue !== 'string') continue;

    // Check 1: Exact match with English = definitely not translated
    if (localeValue === enValue && enValue.length > 5) {
      issues.push(`'${field}' is identical to English`);
      continue;
    }

    // Check 2: Very high similarity to English (>90% same words)
    const enWords = new Set(enValue.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const localeWords = localeValue.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (enWords.size > 3 && localeWords.length > 3) {
      const overlap = localeWords.filter(w => enWords.has(w)).length;
      const similarity = overlap / localeWords.length;
      if (similarity > 0.7) {
        issues.push(`'${field}' ~${Math.round(similarity * 100)}% similar to English`);
        continue;
      }
    }

    // Check 3: English score on the translated text
    const score = englishScore(localeValue);
    if (score > 0.15) {
      issues.push(`'${field}' contains English text (score: ${(score * 100).toFixed(0)}%)`);
    }
  }

  // Check instructions if present
  if (localeData.instructions) {
    const instrFields = ['steps', 'features', 'useCases', 'proTips', 'troubleshooting'];
    for (const field of instrFields) {
      const enArr = enData.instructions?.[field];
      const localeArr = localeData.instructions?.[field];

      if (!localeArr || !Array.isArray(localeArr)) continue;
      if (!enArr || !Array.isArray(enArr)) continue;

      // Check a sample of items for untranslated content
      for (let i = 0; i < Math.min(localeArr.length, 3); i++) {
        const enItem = typeof enArr[i] === 'string' ? enArr[i] :
                       enArr[i]?.description || enArr[i]?.title || '';
        const localeItem = typeof localeArr[i] === 'string' ? localeArr[i] :
                          localeArr[i]?.description || localeArr[i]?.title || '';

        if (typeof enItem === 'string' && typeof localeItem === 'string') {
          if (enItem === localeItem && enItem.length > 10) {
            issues.push(`instructions.${field}[${i}] identical to English`);
            break; // One example is enough
          }

          const score = englishScore(localeItem);
          if (score > 0.2) {
            issues.push(`instructions.${field} contains English text`);
            break;
          }
        }
      }
    }
  }

  // Check meta
  if (localeData.meta && enData.meta) {
    for (const metaField of ['title', 'description']) {
      const enMeta = enData.meta[metaField];
      const localeMeta = localeData.meta[metaField];
      if (enMeta && localeMeta && enMeta === localeMeta && enMeta.length > 10) {
        issues.push(`meta.${metaField} identical to English`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// --- Main ---
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const updateStmt = db.prepare(`
  UPDATE tools SET
    seo_level = @seo_level,
    seo_notes = @seo_notes,
    optimizations = @optimizations,
    lang_en = @lang_en,
    lang_it = @lang_it,
    lang_es = @lang_es,
    lang_fr = @lang_fr,
    lang_de = @lang_de,
    lang_pt = @lang_pt,
    notes = @notes,
    status = @status,
    last_updated = datetime('now')
  WHERE id = @id
`);

let totalIssues = 0;

const updateAll = db.transaction(() => {
  for (const tool of tools) {
    const result: Record<string, any> = {
      id: tool.id,
      lang_en: 0,
      lang_it: 0,
      lang_es: 0,
      lang_fr: 0,
      lang_de: 0,
      lang_pt: 0,
      seo_level: 0,
      seo_notes: '',
      optimizations: '',
      notes: '',
      status: 'active',
    };

    // --- SEO Check ---
    // Read EN i18n file for tagline/pageDescription
    const enFilePath = path.join(I18N_PATH, 'en', 'tools', `${tool.id}.json`);
    let enData: Record<string, any> = {};

    try {
      enData = JSON.parse(fs.readFileSync(enFilePath, 'utf-8'));
    } catch {
      result.notes = 'EN i18n file missing or invalid';
      result.status = 'needs-work';
    }

    const hasDescription = !!(enData.tagline || enData.pageDescription || enData.meta?.description);
    const hasLongTail = !!(tool.longTailKeywords && tool.longTailKeywords.length > 0);

    if (hasLongTail) {
      result.seo_level = 2; // Full SEO
      result.seo_notes = `Full SEO: tagline + pageDescription + ${tool.longTailKeywords?.length || 0} long-tail keywords`;
    } else if (hasDescription) {
      result.seo_level = 1; // SEO
      result.seo_notes = 'Has description but no long-tail keywords';
    } else {
      result.seo_level = 0; // No SEO
      result.seo_notes = 'No tagline or description found';
    }

    // --- Language Quality Check ---
    const allNotes: string[] = [];

    for (const locale of LOCALES) {
      const filePath = path.join(I18N_PATH, locale, 'tools', `${tool.id}.json`);
      const langKey = `lang_${locale}` as keyof typeof result;

      try {
        const localeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (locale === 'en') {
          // English is the source — just check it exists and has content
          const hasContent = !!(localeData.title && localeData.description);
          result[langKey] = hasContent ? 1 : 0;
          if (!hasContent) {
            allNotes.push(`[EN] Missing title or description`);
          }
        } else {
          // Non-EN: check translation quality
          const check = checkTranslation(enData, localeData, locale, tool.id);
          result[langKey] = check.valid ? 1 : 0;
          if (!check.valid) {
            allNotes.push(`[${locale.toUpperCase()}] ${check.issues.join('; ')}`);
            totalIssues++;
          }
        }
      } catch {
        result[langKey] = 0;
        allNotes.push(`[${locale.toUpperCase()}] File missing or invalid JSON`);
        totalIssues++;
      }
    }

    if (allNotes.length > 0) {
      result.notes = allNotes.join('\n');
      if (result.status === 'active') {
        result.status = 'needs-work';
      }
    }

    updateStmt.run(result);

    const langCount = LOCALES.filter(l => result[`lang_${l}`] === 1).length;
    const seoLabel = ['No SEO', 'SEO', 'Full SEO'][result.seo_level as number];
    const statusIcon = allNotes.length > 0 ? '⚠️' : '✅';

    console.log(
      `${statusIcon} ${tool.icon} ${tool.name.padEnd(30)} | SEO: ${seoLabel.padEnd(8)} | Lang: ${langCount}/6 ${allNotes.length > 0 ? `| Issues: ${allNotes.length}` : ''}`
    );

    if (allNotes.length > 0) {
      for (const note of allNotes) {
        console.log(`   └─ ${note}`);
      }
    }
  }
});

console.log('\n🔍 Analyzing all tools...\n');
updateAll();

// Print summary
const stats = {
  total: tools.length,
  seo0: db.prepare('SELECT COUNT(*) as c FROM tools WHERE seo_level = 0').get() as { c: number },
  seo1: db.prepare('SELECT COUNT(*) as c FROM tools WHERE seo_level = 1').get() as { c: number },
  seo2: db.prepare('SELECT COUNT(*) as c FROM tools WHERE seo_level = 2').get() as { c: number },
  needsWork: db.prepare("SELECT COUNT(*) as c FROM tools WHERE status = 'needs-work'").get() as { c: number },
  fullyTranslated: db.prepare(
    'SELECT COUNT(*) as c FROM tools WHERE lang_en=1 AND lang_it=1 AND lang_es=1 AND lang_fr=1 AND lang_de=1 AND lang_pt=1'
  ).get() as { c: number },
};

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Total tools: ${stats.total}`);
console.log(`SEO Level 0 (No SEO):   ${stats.seo0.c}`);
console.log(`SEO Level 1 (SEO):      ${stats.seo1.c}`);
console.log(`SEO Level 2 (Full SEO): ${stats.seo2.c}`);
console.log(`Fully translated (6/6): ${stats.fullyTranslated.c}`);
console.log(`Needs work:             ${stats.needsWork.c}`);
console.log(`Total i18n issues:      ${totalIssues}`);
console.log('='.repeat(60));

db.close();
