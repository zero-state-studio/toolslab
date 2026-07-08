'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import {
  Moon,
  Sun,
  Menu,
  X,
  Search,
  Grid3X3,
  Zap,
  Beaker,
  Info,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { categories } from '@/lib/tools';
import { getCategoryTheme, catChipVars } from '@/lib/categoryTheme';
import { cn } from '@/lib/utils';
import { LabLogo } from '@/components/icons/LabLogo';
import { useToolStore, selectNewFavoritesCount } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { GitHubStars } from '@/components/ui/github-stars';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { useDictionarySection } from '@/hooks/useDictionary';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getCurrentHoliday } from '@/lib/utils/holidays';
import { HolidayOverlay } from '@/components/ui/HolidayOverlay';
import dynamic from 'next/dynamic';

import type { Dictionary } from '@/lib/i18n/types';

// Loaded on first open (⌘K / '/' / click) — keeps the palette + radix dialog
// out of the first-load bundle of every page that renders the header.
const CommandPalette = dynamic(
  () =>
    import('@/components/CommandPalette').then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false }
);

interface HeaderProps {
  /** Server-loaded common dictionary: makes SSR nav localized instead of EN fallbacks */
  initialCommon?: Dictionary['common'];
}

export function Header({ initialCommon }: HeaderProps = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Latch: mount the (lazy) palette on first open, keep it mounted afterwards
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [holidayHover, setHolidayHover] = useState(false);
  const [holidayClick, setHolidayClick] = useState(false);
  const holiday = getCurrentHoliday();
  const pathname = usePathname();
  const newFavoritesCount = useToolStore(selectNewFavoritesCount);
  const isHydrated = useHydration();
  const { locale, createHref } = useLocalizedRouter();
  const { data: fetchedCommon, isReady } = useDictionarySection('common');
  // Until the client fetch resolves, fall back to the server-provided dict
  // (same locale) so SSR and first client render are localized and identical.
  const common = isReady ? fetchedCommon : (initialCommon ?? fetchedCommon);

  useEffect(() => { setMounted(true); }, []);

  // ⌘K / Ctrl+K opens palette; '/' opens when not typing into a field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (paletteOpen) setPaletteLoaded(true);
  }, [paletteOpen]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const isActive = (href: string) =>
    pathname === href || pathname === createHref(href.replace(/^\//, '') || '/');

  const navItem = (href: string, label: string, Icon?: typeof Zap) => {
    const active = isActive(createHref(href));
    return (
      <Link
        key={href}
        href={createHref(href)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          active
            ? 'bg-pg-surface-hi text-pg-text'
            : 'text-pg-muted hover:bg-pg-surface-hi/60 hover:text-pg-text'
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Link>
    );
  };

  return (
    <>
      {holiday && (
        <HolidayOverlay
          holiday={holiday}
          open={holidayHover || holidayClick}
          onClose={holidayClick ? () => setHolidayClick(false) : undefined}
        />
      )}

      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-pg-border',
          'bg-[color:var(--pg-bg)]/85 backdrop-blur-xl'
        )}
      >
        <div className="mx-auto flex h-[60px] max-w-pg items-center gap-5 px-5 sm:px-10">
          {/* Logo */}
          <Link
            href={createHref('/')}
            className="flex items-center gap-2.5"
            aria-label="ToolsLab home"
          >
            <LabLogo size={28} />
            <span className="text-[16px] tracking-[-0.3px]">
              <span className="font-medium text-pg-muted">Tools</span>
              <span className="font-bold text-pg-text">Lab</span>
            </span>
            <span
              className="hidden rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider sm:inline-flex"
              style={{
                background: 'color-mix(in oklab, var(--pg-accent-4) 22%, transparent)',
                color: 'var(--pg-accent-4)',
              }}
            >
              v3
            </span>
          </Link>

          {/* Nav */}
          <nav
            className="ml-3 hidden items-center gap-1 md:flex"
            aria-label="Main navigation"
          >
            {navItem('/tools', common?.nav?.tools || 'Tools', Zap)}
            {navItem('/categories', common?.nav?.categories || 'Categories', Grid3X3)}
            <Link
              href={createHref('/lab')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                isActive(createHref('/lab'))
                  ? 'bg-pg-surface-hi text-pg-text'
                  : 'text-pg-muted hover:bg-pg-surface-hi/60 hover:text-pg-text'
              )}
            >
              <Beaker className="h-3.5 w-3.5" />
              {common?.nav?.lab || 'The Lab'}
              {mounted && isHydrated && newFavoritesCount > 0 && (
                <span className="rounded-full bg-pg-accent px-1.5 py-px font-mono text-[10px] font-medium text-white">
                  {newFavoritesCount}
                </span>
              )}
            </Link>
            {navItem('/about', common?.nav?.about || 'About', Info)}
          </nav>

          <div className="flex-1" />

          {/* ⌘K trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            onMouseEnter={() => setPaletteLoaded(true)}
            onFocus={() => setPaletteLoaded(true)}
            className="group hidden min-w-[220px] items-center gap-2 rounded-lg border border-pg-border bg-pg-surface px-3 py-1.5 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi md:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">{common?.nav?.searchPlaceholder || 'Search tools…'}</span>
            <span className="pg-kbd">⌘K</span>
          </button>

          {/* Holiday badge */}
          {holiday && (
            <button
              onMouseEnter={() => setHolidayHover(true)}
              onMouseLeave={() => setHolidayHover(false)}
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-pg-muted hover:bg-pg-surface-hi/60 hover:text-pg-text lg:flex"
              aria-label={holiday.greeting}
            >
              <span className="text-base leading-none">{holiday.emoji}</span>
            </button>
          )}

          {/* GitHub Stars */}
          {mounted && <GitHubStars className="hidden sm:inline-flex" />}

          {/* Language Switcher */}
          <LanguageSwitcher currentLocale={locale} />

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pg-border bg-pg-surface text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pg-accent"
              aria-label="Toggle theme"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pg-border bg-pg-surface text-pg-muted hover:text-pg-text md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto border-l border-pg-border bg-pg-bg transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-pg-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LabLogo size={26} />
            <span className="font-bold text-pg-text">ToolsLab</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-pg-muted hover:bg-pg-surface-hi"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => { setIsMobileMenuOpen(false); setPaletteOpen(true); }}
            className="mb-4 flex w-full items-center gap-2 rounded-lg border border-pg-border bg-pg-surface px-3 py-2 text-[13px] text-pg-muted"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">{common?.nav?.searchPlaceholder || 'Search tools…'}</span>
            <span className="pg-kbd">⌘K</span>
          </button>

          <nav className="space-y-0.5" aria-label="Mobile navigation">
            {[
              { href: '/tools', label: common?.nav?.tools || 'Tools', Icon: Zap },
              { href: '/categories', label: common?.nav?.categories || 'Categories', Icon: Grid3X3 },
              { href: '/lab', label: common?.nav?.lab || 'The Lab', Icon: Beaker },
              { href: '/about', label: common?.nav?.about || 'About', Icon: Info },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={createHref(href)}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(createHref(href))
                    ? 'bg-pg-surface-hi text-pg-text'
                    : 'text-pg-muted hover:bg-pg-surface-hi/60'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <p className="mt-6 mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-pg-dim">
            {common?.nav?.categories || 'Categories'}
          </p>
          <div className="space-y-0.5">
            {categories.map((category) => {
              const t = getCategoryTheme(category.id);
              return (
                <Link
                  key={category.id}
                  href={createHref(`/category/${category.id}`)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-pg-muted transition-colors hover:bg-pg-surface-hi/60"
                >
                  <span
                    className="cat-chip flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                    style={catChipVars(t.hue)}
                  >
                    <t.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                  <span className="flex-1">{category.name}</span>
                  <span className="font-mono text-xs text-pg-dim">
                    {category.tools.length}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-pg-border pt-5">
            {holiday && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setHolidayClick(true); }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-pg-muted hover:bg-pg-surface-hi/60"
                aria-label={holiday.greeting}
              >
                <span className="text-base leading-none">{holiday.emoji}</span>
                <span>{holiday.greeting}</span>
              </button>
            )}
            <LanguageSwitcher currentLocale={locale} />
            {mounted && (
              <button
                onClick={toggleTheme}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-pg-border bg-pg-surface text-pg-muted hover:text-pg-text"
                aria-label="Toggle theme"
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            )}
            {mounted && <GitHubStars />}
          </div>
        </div>
      </aside>

      {paletteLoaded && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}
