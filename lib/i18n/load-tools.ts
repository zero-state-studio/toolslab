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
 * Load all tools' translations for a locale
 * @param locale - The locale to load
 * @returns Object with all tool translations
 */
export async function loadAllToolsTranslations(locale: Locale) {
  // List of all tool IDs (from registry)
  const toolIds = [
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
    'curl-to-code',
    'curl-to-php',
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
    'rot13-caesar-cipher',
  ];

  const tools: Record<string, any> = {};

  await Promise.all(
    toolIds.map(async (toolId) => {
      const toolData = await loadToolTranslation(locale, toolId);
      if (toolData) {
        tools[toolId] = toolData;
      }
    })
  );

  return { tools };
}
