import type { Locale } from './config';
import type { Dictionary } from './types';

/**
 * Cache key generator for dictionary sections
 */
export function generateCacheKey(locale: Locale, sections?: string[]): string {
  return sections ? `${locale}:${sections.sort().join(',')}` : locale;
}

/**
 * Abstract base class for dictionary loading
 * Eliminates code duplication between server and client loaders
 */
export abstract class BaseDictionaryLoader {
  protected fullDictionaryCache: Map<Locale, Dictionary>;
  protected sectionCache: Map<string, Dictionary>;
  // In-flight request deduplication: reuse the same promise for concurrent calls
  private inflightRequests: Map<string, Promise<Dictionary>>;

  constructor() {
    this.fullDictionaryCache = new Map<Locale, Dictionary>();
    this.sectionCache = new Map<string, Dictionary>();
    this.inflightRequests = new Map<string, Promise<Dictionary>>();
  }

  /**
   * Main loading method - uses cache or calls abstract loader
   * Deduplicates concurrent requests for the same locale+sections
   */
  async load(locale: Locale, sections?: string[]): Promise<Dictionary> {
    const cacheKey = generateCacheKey(locale, sections);

    // Check section-specific cache
    if (sections && this.sectionCache.has(cacheKey)) {
      return this.sectionCache.get(cacheKey)!;
    }

    // Check full dictionary cache
    if (!sections && this.fullDictionaryCache.has(locale)) {
      return this.fullDictionaryCache.get(locale)!;
    }

    // Deduplicate: if a request for this key is already in-flight, reuse it
    if (this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey)!;
    }

    // Start new request and track it
    const request = this.loadFromSource(locale, sections)
      .then((dictionary) => {
        // Cache the result
        if (sections) {
          this.sectionCache.set(cacheKey, dictionary);
        } else {
          this.fullDictionaryCache.set(locale, dictionary);
        }
        // Remove from in-flight tracking
        this.inflightRequests.delete(cacheKey);
        return dictionary;
      })
      .catch((error) => {
        this.inflightRequests.delete(cacheKey);
        throw error;
      });

    this.inflightRequests.set(cacheKey, request);
    return request;
  }

  /**
   * Abstract method - implemented by server/client loaders
   */
  protected abstract loadFromSource(
    locale: Locale,
    sections?: string[]
  ): Promise<Dictionary>;

  /**
   * Clear cache (useful for testing/hot reload)
   */
  clearCache(): void {
    this.fullDictionaryCache.clear();
    this.sectionCache.clear();
  }

  /**
   * Get cache size (useful for debugging)
   */
  getCacheStats(): {
    fullDictionaries: number;
    sections: number;
    totalEntries: number;
  } {
    return {
      fullDictionaries: this.fullDictionaryCache.size,
      sections: this.sectionCache.size,
      totalEntries: this.fullDictionaryCache.size + this.sectionCache.size,
    };
  }
}

/**
 * Utility: Check if sections parameter is valid
 */
export function validateSections(sections?: string[]): boolean {
  if (!sections) return true;

  const validSections = [
    'common',
    'home',
    'tools',
    'tools-summaries',
    'categories',
    'footer',
    'seo',
    'lab',
  ];
  return sections.every((section) => validSections.includes(section));
}

/**
 * Utility: Merge section data into a single dictionary
 */
export function mergeSections(
  sections: Array<{ [key: string]: any }>
): Dictionary {
  return Object.assign({}, ...sections) as Dictionary;
}
