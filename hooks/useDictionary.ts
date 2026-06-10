'use client';

import { useState, useEffect } from 'react';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/types';
import { getClientDictionary } from '@/lib/i18n/get-dictionary-client';
import { useLocalizedRouter } from './useLocalizedRouter';

/**
 * Client-side hook to load dictionary for current locale
 * Useful for components that need translations in client components
 */
export function useDictionary() {
  const { locale } = useLocalizedRouter();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDictionary = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load all necessary sections for global components (Header, Footer, etc.)
        // 'tools-summaries' = title+description only; the full 'tools' section
        // is ~325KB raw per locale and client chrome never reads the rest.
        const dict = await getClientDictionary(locale, [
          'common',
          'footer',
          'tools-summaries',
          'categories',
        ]);

        if (isMounted) {
          setDictionary(dict);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dictionary:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to load dictionary'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDictionary();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  return {
    dictionary,
    locale,
    loading,
    error,
  };
}

/**
 * Hook for components that need specific dictionary sections
 * Returns empty object if dictionary is not loaded to prevent crashes
 */
export function useDictionarySection<T extends keyof Dictionary>(section: T) {
  const { dictionary, loading, error } = useDictionary();

  return {
    data: dictionary?.[section] || ({} as Dictionary[T]),
    loading,
    error,
    isReady: !loading && dictionary !== null,
  };
}
