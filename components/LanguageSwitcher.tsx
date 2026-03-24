'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { defaultLocale, type Locale } from '@/lib/i18n/config';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import {
  getActiveLocales,
  getAllLocaleConfigs,
  getLocaleConfig,
} from '@/lib/i18n/locale-config';

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale?: Locale;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, switchLanguage } = useLocalizedRouter();

  // Use provided locale or detected locale
  const activeLocale = currentLocale || locale;
  const activeConfig = getLocaleConfig(activeLocale);
  const availableLocales = getActiveLocales();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    // Use centralized language switching with query preservation
    switchLanguage(newLocale, true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-white/[0.06]"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span role="img" aria-label={activeConfig.name}>
          {activeConfig.flag}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0a0a0f]/95">
          <div role="menu" aria-orientation="vertical">
            {availableLocales.map((locale) => {
              const config = getLocaleConfig(locale);
              return (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    locale === activeLocale
                      ? 'bg-violet-500/10 font-medium text-violet-600 dark:text-violet-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]'
                  }`}
                  role="menuitem"
                  aria-current={locale === activeLocale ? 'true' : 'false'}
                >
                  <span className="text-base" role="img" aria-label={config.name}>
                    {config.flag}
                  </span>
                  <span>{config.name}</span>
                  {locale === activeLocale && (
                    <svg
                      className="ml-auto h-3.5 w-3.5 text-violet-500"
                      fill="none"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
