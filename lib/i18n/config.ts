// Basic locale types - these should match locale-config.ts
export type Locale = 'en' | 'it' | 'es' | 'fr' | 'de' | 'pt'; // Future: add new locales here when activating them

export const locales: Locale[] = ['en', 'it', 'es', 'fr', 'de', 'pt'];
export const defaultLocale: Locale = 'en';

// Locales that should have URL prefix (exclude default)
export const localesWithPrefix = locales.filter((l) => l !== defaultLocale);

// Legacy exports for backward compatibility
// These will be dynamically populated from locale-config.ts
export const localeNames: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  it: '🇮🇹',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
};

// OpenGraph locale codes for social media metadata
export const localeToOGLocale: Record<Locale, string> = {
  en: 'en_US',
  it: 'it_IT',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  pt: 'pt_PT',
};

// Future locales (ready to add)
// When adding a new locale:
// 1. Add to Locale type
// 2. Add to locales array
// 3. Add to localeNames
// 4. Add to localeFlags
// 5. Create dictionary file in dictionaries/
export const futureLocales = {
  fr: { name: 'Français', flag: '🇫🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Português', flag: '🇵🇹' },
  nl: { name: 'Nederlands', flag: '🇳🇱' },
  pl: { name: 'Polski', flag: '🇵🇱' },
  tr: { name: 'Türkçe', flag: '🇹🇷' },
};
