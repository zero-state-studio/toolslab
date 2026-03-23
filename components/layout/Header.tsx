'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import {
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  Beaker,
  Grid3X3,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { categories } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { LabLogo } from '@/components/icons/LabLogo';
import { useToolStore, selectNewFavoritesCount } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { GitHubStars } from '@/components/ui/github-stars';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { useDictionarySection } from '@/hooks/useDictionary';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const newFavoritesCount = useToolStore(selectNewFavoritesCount);
  const isHydrated = useHydration();
  const { locale, createHref } = useLocalizedRouter();
  const { data: common } = useDictionarySection('common');

  useEffect(() => { setMounted(true); }, []);

  // Throttled scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const isActive = (href: string) =>
    pathname === href || pathname === createHref(href.replace(/^\//, '') || '/');

  const navLinkClass = (href: string) =>
    cn(
      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
      isActive(createHref(href))
        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
    );

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-all duration-300',
          'border-slate-200/60 bg-white/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-background/85',
          isScrolled && 'shadow-sm shadow-slate-200/50 dark:shadow-black/20'
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">

          {/* ── LOGO ── */}
          <Link href={createHref('/')} className="flex items-center gap-2.5 mr-6">
            <LabLogo className="h-7 w-7 text-violet-600" animated />
            <span className="hidden bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent sm:inline-block">
              ToolsLab
            </span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <Link href={createHref('/tools')} className={navLinkClass('/tools')}>
              <Zap className="h-3.5 w-3.5" />
              {common?.nav?.tools || 'Tools'}
            </Link>

            {/* Categories dropdown */}
            <div className="group relative">
              <button
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
                )}
                aria-haspopup="true"
                aria-label="Categories menu"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                {common?.nav?.categories || 'Categories'}
                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* Dropdown panel */}
              <div className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1.5 w-72 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0a0a0f]/95 dark:shadow-black/40">
                  {/* Browse all */}
                  <Link
                    href={createHref('/categories')}
                    className="mb-1 flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-violet-500/10"
                    role="menuitem"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <Grid3X3 className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                        Browse All Categories
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Overview & comparison
                      </div>
                    </div>
                  </Link>

                  <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />

                  <div className="grid grid-cols-1 gap-0.5">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={createHref(`/category/${category.id}`)}
                        className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        role="menuitem"
                      >
                        <span className="w-5 text-center text-base">{category.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {category.name}
                          </div>
                        </div>
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-600">
                          {category.tools.length}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link href={createHref('/lab')} className={navLinkClass('/lab')}>
              <Beaker className="h-3.5 w-3.5" />
              The Lab
              {mounted && isHydrated && newFavoritesCount > 0 && (
                <span className="rounded-full bg-violet-500 px-1.5 py-px font-mono text-[10px] font-medium text-white">
                  {newFavoritesCount}
                </span>
              )}
            </Link>
          </nav>

          {/* ── RIGHT CONTROLS ── */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* About (desktop) */}
            <Link
              href={createHref('/about')}
              className={cn(navLinkClass('/about'), 'hidden md:flex')}
            >
              <Info className="h-3.5 w-3.5" />
              {common?.nav?.about || 'About'}
            </Link>

            {/* Divider */}
            <div className="mx-1.5 hidden h-4 w-px bg-slate-200 dark:bg-white/[0.08] md:block" />

            {/* GitHub Stars */}
            {mounted && <GitHubStars className="hidden sm:flex" />}

            {/* Language Switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto transition-transform duration-300 ease-in-out md:hidden',
          'border-l border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#0a0a0f]',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <LabLogo className="h-6 w-6 text-violet-600" animated />
            <span className="font-bold text-slate-900 dark:text-white">ToolsLab</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-4" aria-label="Mobile navigation">
          {/* Primary links */}
          <div className="space-y-0.5">
            <Link
              href={createHref('/tools')}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(createHref('/tools'))
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.05]'
              )}
            >
              <Zap className="h-4 w-4" />
              {common?.nav?.tools || 'Tools'}
            </Link>

            <Link
              href={createHref('/lab')}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(createHref('/lab'))
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.05]'
              )}
            >
              <Beaker className="h-4 w-4" />
              The Lab
              {mounted && isHydrated && newFavoritesCount > 0 && (
                <span className="ml-auto rounded-full bg-violet-500 px-1.5 py-px font-mono text-[10px] text-white">
                  {newFavoritesCount}
                </span>
              )}
            </Link>

            <Link
              href={createHref('/about')}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(createHref('/about'))
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.05]'
              )}
            >
              <Info className="h-4 w-4" />
              {common?.nav?.about || 'About'}
            </Link>
          </div>

          {/* Categories section */}
          <div className="mt-6">
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {common?.nav?.categories || 'Categories'}
            </p>
            <div className="space-y-0.5">
              <Link
                href={createHref('/categories')}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-500/10 dark:text-violet-400"
              >
                <Grid3X3 className="h-4 w-4" />
                Browse all categories
              </Link>

              <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={createHref(`/category/${category.id}`)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.05]"
                >
                  <span className="w-5 text-center">{category.icon}</span>
                  <span className="flex-1">{category.name}</span>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-600">
                    {category.tools.length}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 dark:border-white/[0.06]">
            <LanguageSwitcher currentLocale={locale} />
            {mounted && (
              <button
                onClick={toggleTheme}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            )}
            {mounted && <GitHubStars />}
          </div>
        </nav>
      </div>
    </>
  );
}
