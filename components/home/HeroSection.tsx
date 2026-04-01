'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, Shield, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchTools } from '@/lib/tools';
import { type Locale, defaultLocale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { useLocale } from '@/hooks/useLocale';
import { ToolIcon } from '@/components/ui/ToolIcon';

const placeholders = [
  'json formatter',
  'base64 encoder',
  'jwt decoder',
  'uuid generator',
  'hash generator',
  'url encoder',
];

const popularSearches = [
  { label: 'JSON', query: 'json' },
  { label: 'Base64', query: 'base64' },
  { label: 'JWT', query: 'jwt' },
  { label: 'UUID', query: 'uuid' },
  { label: 'Hash', query: 'hash' },
  { label: 'URL Encode', query: 'url' },
];

interface HeroSectionProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export function HeroSection({
  locale = defaultLocale,
  dictionary,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { createHref } = useLocale();

  const localizedPlaceholders = useMemo(() => {
    if (!dictionary) return placeholders;
    return [
      dictionary.tools['json-formatter']?.title?.toLowerCase() ||
        'json formatter',
      dictionary.tools['base64-encode']?.title?.toLowerCase() ||
        'base64 encoder',
      dictionary.tools['jwt-decoder']?.title?.toLowerCase() || 'jwt decoder',
      dictionary.tools['uuid-generator']?.title?.toLowerCase() ||
        'uuid generator',
      dictionary.tools['hash-generator']?.title?.toLowerCase() ||
        'hash generator',
      dictionary.tools['url-encoder']?.title?.toLowerCase() || 'url encoder',
    ];
  }, [dictionary]);

  const getPopularSearches = () => {
    if (!dictionary) return popularSearches;
    return [
      { label: 'JSON', query: 'json' },
      { label: 'Base64', query: 'base64' },
      { label: 'JWT', query: 'jwt' },
      { label: 'UUID', query: 'uuid' },
      { label: 'Hash', query: 'hash' },
      {
        label: dictionary.common?.actions?.encode || 'URL Encode',
        query: 'url',
      },
    ];
  };

  // Typewriter effect via direct DOM manipulation - no re-renders
  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;

    const tryText = 'Try';
    let currentPlaceholderIndex = 0;
    let currentIndex = 0;
    let timer: NodeJS.Timeout;
    let phase: 'typing' | 'pausing' | 'erasing' = 'typing';

    const getTargetText = () =>
      `${tryText} '${localizedPlaceholders[currentPlaceholderIndex]}'...`;

    const tick = () => {
      const targetText = getTargetText();
      if (phase === 'typing') {
        if (currentIndex <= targetText.length) {
          input.placeholder = targetText.slice(0, currentIndex);
          currentIndex++;
          timer = setTimeout(tick, 50);
        } else {
          phase = 'pausing';
          timer = setTimeout(tick, 2000);
        }
      } else if (phase === 'pausing') {
        phase = 'erasing';
        currentIndex = targetText.length;
        tick();
      } else if (phase === 'erasing') {
        if (currentIndex > 0) {
          currentIndex--;
          input.placeholder = targetText.slice(0, currentIndex);
          timer = setTimeout(tick, 30);
        } else {
          currentPlaceholderIndex =
            (currentPlaceholderIndex + 1) % localizedPlaceholders.length;
          phase = 'typing';
          timer = setTimeout(tick, 50);
        }
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, [localizedPlaceholders, dictionary]);

  const searchResults =
    searchQuery.length > 0 ? searchTools(searchQuery).slice(0, 5) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      router.push(createHref(searchResults[0].route));
    }
  };

  const handleResultClick = (route: string) => {
    setIsSearchFocused(false);
    router.push(createHref(route));
  };

  const handlePopularSearch = (query: string) => {
    setSearchQuery(query);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    const results = searchTools(query);
    if (results.length > 0) {
      router.push(results[0].route);
    }
  };

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-background">
      {/* Technical grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
      <div className="bg-amber-500/8 pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative z-10 w-full px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Status badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-2">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-violet-400 opacity-75" />
              </div>
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-violet-300">
                {dictionary?.home?.hero?.subtitle ||
                  '72 tools · free forever · no signup'}
              </span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            {dictionary?.home?.hero?.title || 'Your Developer Tools'}{' '}
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-amber-400 bg-clip-text text-transparent">
              Laboratory
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-slate-700 dark:text-slate-400 sm:text-xl">
            {dictionary?.home?.hero?.description ||
              'Experiment, Transform, Deploy. 72 precision-engineered tools — instant results, 100% private, runs entirely in your browser.'}
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <label htmlFor="hero-search" className="sr-only">
                  Search tools
                </label>
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="hero-search"
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                  placeholder=""
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 caret-violet-400 backdrop-blur-sm transition-all duration-200 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-slate-500"
                  suppressHydrationWarning
                />
              </div>

              {/* Search suggestions dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-[99999] mt-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0a0a0f]/95">
                  {searchResults.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleResultClick(tool.route)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    >
                      <ToolIcon id={tool.id} className="h-5 w-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-400">
                          {tool.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Popular searches */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-600">
                {dictionary?.home?.popular?.subtitle || 'Quick access'}:
              </span>
              {getPopularSearches().map((search) => (
                <button
                  key={search.query}
                  onClick={() => handlePopularSearch(search.query)}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-violet-500/40 hover:text-violet-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400"
                >
                  {search.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTA — above trust signals */}
          <div className="mt-8 flex justify-center">
            <Link
              href={createHref('/tools')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(139,92,246,0.5)]"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Inline trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              No data leaves your device
            </span>
            <span className="text-xs text-slate-700">·</span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Runs in-browser
            </span>
            <span className="text-xs text-slate-700">·</span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Lock className="h-3.5 w-3.5 text-violet-400" />
              No signup needed
            </span>
          </div>

          {/* Quick inline links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
            <span>Popular:</span>
            <Link
              href={createHref('/tools/json-formatter')}
              className="text-slate-500 transition-colors hover:text-violet-400"
            >
              JSON Formatter
            </Link>
            <span>·</span>
            <Link
              href={createHref('/tools/base64-encode')}
              className="text-slate-500 transition-colors hover:text-violet-400"
            >
              Base64 Encoder
            </Link>
            <span>·</span>
            <Link
              href={createHref('/tools/jwt-decoder')}
              className="text-slate-500 transition-colors hover:text-violet-400"
            >
              JWT Decoder
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
