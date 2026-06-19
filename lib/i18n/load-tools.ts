import type { Locale } from './config';

/**
 * Load a single tool's translations
 * @param locale - The locale to load
 * @param toolId - The tool ID (e.g., 'json-formatter')
 * @returns Tool translation data
 */
export async function loadToolTranslation(locale: Locale, toolId: string) {
  try {
    const toolData = await import(
      `./dictionaries/${locale}/tools/${toolId}.json`
    );
    return toolData.default;
  } catch (error) {
    console.warn(
      `Tool translation not found: ${locale}/tools/${toolId}.json, falling back to English`
    );

    // Fallback to English
    if (locale !== 'en') {
      try {
        const toolData = await import(`./dictionaries/en/tools/${toolId}.json`);
        return toolData.default;
      } catch (fallbackError) {
        console.error(`Tool translation not found even in English: ${toolId}`);
        return null;
      }
    }

    return null;
  }
}

/**
 * Load only title+description for a list of tools (e.g. related tools).
 * Keeps the RSC payload small: full translations are loaded only for the
 * current tool, related ones just need their card title/description.
 */
export async function loadToolSummaries(
  locale: Locale,
  toolIds: string[]
): Promise<Record<string, { title?: string; description?: string }>> {
  const entries = await Promise.all(
    toolIds.map(async (id) => {
      const data = await loadToolTranslation(locale, id);
      return [
        id,
        { title: data?.title, description: data?.description },
      ] as const;
    })
  );
  return Object.fromEntries(entries);
}

// List of all tool IDs (must match the registry in lib/tools.ts)
export const ALL_TOOL_IDS = [
  'json-formatter',
    'csv-to-json',
    'json-to-csv',
    'sql-formatter',
    'xml-formatter',
    'xml-to-json-converter',
    'base64-encode',
    'url-encode',
    'html-encode-decode',
    'hash-generator',
    'jwt-decoder',
    'base64-to-pdf',
    'base64-to-gif',
    'base64-to-png',
    'base64-to-jpg',
    'base64-to-webp',
    'text-diff',
    'word-counter',
    'markdown-preview',
    'regex-tester',
    'uuid-generator',
    'password-generator',
    'qr-generator',
    'barcode-generator',
    'color-picker',
    'color-format-converter',
    'image-optimizer',
    'favicon-generator',
    'gradient-generator',
    'json-validator',
    'crontab-builder',
    'list-compare',
    'curl-to-axios',
    'curl-to-code',
    'curl-to-csharp',
    'curl-to-go',
    'curl-to-httpie',
    'curl-to-httpx',
    'curl-to-java',
    'curl-to-php',
    'curl-to-ruby',
    'json-to-typescript',
    'css-minifier',
    'js-minifier',
    'yaml-json-converter',
    'yaml-validator',
    'unix-timestamp-converter',
    'eml-to-html',
    'instagram-font-generator',
    'linkedin-post-formatter',
    'excel-filter',
    'ai-prompt-token-counter',
    'pdf-to-word',
    'image-to-pdf',
    'jpg-to-pdf',
    'png-to-pdf',
    'gif-to-pdf',
    'utm-builder',
    'whatsapp-link-generator',
    'youtube-timestamp-generator',
    'chmod-calculator',
    'htaccess-generator',
    'lorem-ipsum-generator',
    'string-case-converter',
    'binary-to-text',
    'js-object-to-json',
    'bcrypt-hash-generator',
    'html-to-markdown',
    'markdown-table-generator',
    'rot13-caesar-cipher',
];

/**
 * Load all tools' translations for a locale
 * @param locale - The locale to load
 * @returns Object with all tool translations
 */
export async function loadAllToolsTranslations(locale: Locale) {
  const tools: Record<string, any> = {};

  await Promise.all(
    ALL_TOOL_IDS.map(async (toolId) => {
      const toolData = await loadToolTranslation(locale, toolId);
      if (toolData) {
        tools[toolId] = toolData;
      }
    })
  );

  return { tools };
}

/**
 * Lightweight variant for the client chrome (Header search, Footer,
 * ToolCard lists): title+description only for every tool. The full
 * 'tools' section is ~325KB raw per locale — 95% of it (instructions,
 * meta, FAQ) is never read by client components.
 */
export async function loadAllToolsSummaries(locale: Locale) {
  return { tools: await loadToolSummaries(locale, ALL_TOOL_IDS) };
}
