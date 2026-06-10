import 'server-only';
import type { Locale } from './config';
import type { Dictionary } from './types';
import {
  BaseDictionaryLoader,
  validateSections,
} from './base-dictionary-loader';
import {
  loadAllToolsTranslations,
  loadAllToolsSummaries,
} from './load-tools';

// Re-export type for convenience in server components
export type { Dictionary } from './types';

/**
 * Server-side dictionary loader implementation
 * Loads dictionaries directly from filesystem
 */
class ServerDictionaryLoader extends BaseDictionaryLoader {
  protected async loadFromSource(
    locale: Locale,
    sections?: string[]
  ): Promise<Dictionary> {
    if (!validateSections(sections)) {
      throw new Error(`Invalid sections: ${sections?.join(',')}`);
    }

    // If no sections specified, load full dictionary
    if (!sections) {
      return this.loadFullDictionary(locale);
    }

    // Load specific sections
    const dictionary: Partial<Dictionary> = {};

    await Promise.all(
      sections.map(async (section) => {
        // Lightweight tools section: title+description only (client chrome)
        if (section === 'tools-summaries') {
          try {
            const summaries = await loadAllToolsSummaries(locale);
            Object.assign(dictionary, summaries);
          } catch {
            console.warn(
              `Tools summaries not loadable for locale "${locale}", skipping`
            );
          }
          return;
        }

        // Special handling for 'tools' section - load from granular files
        if (section === 'tools') {
          try {
            const toolsData = await loadAllToolsTranslations(locale);
            Object.assign(dictionary, toolsData);
          } catch (toolsError) {
            console.warn(
              `Failed to load tools for locale "${locale}", trying fallback`
            );
            // Fallback to old tools.json if granular files don't exist
            try {
              const sectionData = await import(
                `./dictionaries/${locale}/${section}.json`
              ).then((module) => module.default);
              Object.assign(dictionary, sectionData);
            } catch (fallbackError) {
              console.warn(
                `Section "tools" not found for locale "${locale}", skipping`
              );
            }
          }
        } else {
          // Normal section loading
          try {
            const sectionData = await import(
              `./dictionaries/${locale}/${section}.json`
            ).then((module) => module.default);

            Object.assign(dictionary, sectionData);
          } catch (sectionError) {
            console.warn(
              `Section "${section}" not found for locale "${locale}", skipping`
            );
          }
        }
      })
    );

    return dictionary as Dictionary;
  }

  /**
   * Load full dictionary (backward compatible)
   */
  private async loadFullDictionary(locale: Locale): Promise<Dictionary> {
    try {
      // Try loading from monolithic file first (backward compatibility)
      try {
        const dictionary = await import(`./dictionaries/${locale}.json`).then(
          (module) => module.default
        );
        return dictionary;
      } catch {
        // Monolithic file doesn't exist, load from sections directory
        const { loadAll } = await import(`./dictionaries/${locale}/index`);
        const dictionary = await loadAll();
        return dictionary as Dictionary;
      }
    } catch (error) {
      console.error(`Failed to load dictionary for locale: ${locale}`, error);

      // Fallback to English if locale not found
      if (locale !== 'en') {
        return this.loadFullDictionary('en');
      }

      throw error;
    }
  }
}

// Singleton instance
const serverLoader = new ServerDictionaryLoader();

/**
 * Server-side dictionary loader for Server Components
 * Uses shared loader instance with caching
 *
 * @param locale - The locale to load
 * @param sections - Optional array of sections to load (e.g., ['common', 'home'])
 */
export const getDictionary = async (
  locale: Locale,
  sections?: string[]
): Promise<Dictionary> => {
  try {
    return await serverLoader.load(locale, sections);
  } catch (error) {
    console.error(
      `Failed to load dictionary for locale: ${locale}, sections: ${sections?.join(',') || 'all'}`,
      error
    );

    // Fallback to English
    if (locale !== 'en') {
      return getDictionary('en', sections);
    }

    throw error;
  }
};
