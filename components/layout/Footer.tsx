'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github } from 'lucide-react';
import { trackConversion, trackSocial, trackEngagement } from '@/lib/analytics';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { useDictionary } from '@/hooks/useDictionary';

export function Footer() {
  const { createHref } = useLocalizedRouter();
  const { dictionary, loading } = useDictionary();

  // Safe accessors with fallbacks
  const footer = dictionary?.footer || {
    aboutToolsLab: 'About ToolsLab',
    aboutDescription:
      'No BS developer tools built by developers, for developers. Fast, private, and completely free.',
    learnMission: 'Learn about our mission',
    quickLinks: 'Quick Links',
    home: 'Home',
    allTools: 'All Tools',
    categories: 'Categories',
    yourLab: 'Your Lab',
    about: 'About',
    popularTools: 'Popular Tools',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    support: 'Support us',
    buyMeCoffee: 'Buy us a coffee',
    copyright: '© 2025 ToolsLab. All rights reserved.',
    craftedIn: 'in our digital laboratory',
    developedBy: 'Developed by',
  };

  const categories = dictionary?.categories || {
    data: { name: 'Data & Conversion' },
    encoding: { name: 'Encoding & Security' },
    text: { name: 'Text & Format' },
    generators: { name: 'Generators' },
    dev: { name: 'Dev Utilities' },
  };

  const tools = dictionary?.tools || {
    'json-formatter': { title: 'JSON Formatter' },
    'regex-tester': { title: 'Regex Tester' },
    'uuid-generator': { title: 'UUID Generator' },
    'base64-encode': { title: 'Base64 Encoder' },
    'hash-generator': { title: 'Hash Generator' },
  };

  return (
    <footer
      className="border-t border-slate-200/50 bg-background dark:border-white/[0.06]"
      style={{
        minHeight: '400px',
        position: 'relative',
        backgroundImage: 'none',
      }}
    >
      <div
        className="footer-container mx-auto max-w-[1200px] px-6 py-16 sm:px-8 lg:px-6"
        style={{ minHeight: '350px' }}
      >
        {/* Main Footer Content - 4 Column Grid */}
        <div className="footer-content mb-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Column 1: About */}
          <div className="footer-column">
            <h3 className="relative mb-5 text-xs font-bold uppercase tracking-[0.08em] text-slate-700 after:absolute after:bottom-[-8px] after:left-0 after:h-0.5 after:w-6 after:rounded-full after:bg-gradient-to-r after:from-purple-500 after:to-transparent dark:text-slate-200">
              {footer.aboutToolsLab}
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {footer.aboutDescription}
            </p>
            <Link
              href={createHref('/about')}
              onClick={() =>
                trackEngagement('about-mission-clicked', { from: 'footer' })
              }
              className="mission-link inline-flex items-center gap-1 text-sm font-medium text-purple-600 transition-all duration-200 hover:gap-2 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
            >
              {footer.learnMission}
              <span className="arrow transition-transform duration-200 hover:translate-x-1">
                →
              </span>
            </Link>

            {/* Social Links - Altezza fissa per prevenire CLS */}
            <div
              className="social-links mt-4 flex gap-3"
              style={{ minHeight: '36px' }}
            >
              <a
                href="https://x.com/tools_lab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial('x', 'footer-about')}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="X (Twitter)"
              >
                <svg
                  className="w-4.5 h-4.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/hellotoolslab/toolslab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial('github', 'footer-about')}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="GitHub"
              >
                <Github className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-column">
            <h3 className="relative mb-5 text-xs font-bold uppercase tracking-[0.08em] text-slate-700 after:absolute after:bottom-[-8px] after:left-0 after:h-0.5 after:w-6 after:rounded-full after:bg-gradient-to-r after:from-purple-500 after:to-transparent dark:text-slate-200">
              {footer.quickLinks}
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={createHref('/')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {footer.home}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/tools')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {footer.allTools}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/categories')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {footer.categories}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/lab')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {footer.yourLab}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/about')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {footer.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="footer-column">
            <h3 className="relative mb-5 text-xs font-bold uppercase tracking-[0.08em] text-slate-700 after:absolute after:bottom-[-8px] after:left-0 after:h-0.5 after:w-6 after:rounded-full after:bg-gradient-to-r after:from-purple-500 after:to-transparent dark:text-slate-200">
              {footer.categories}
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={createHref('/category/data')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {categories.data.name}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/category/encoding')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {categories.encoding.name}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/category/text')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {categories.text.name}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/category/generators')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {categories.generators.name}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/category/dev')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {categories.dev.name}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Popular Tools */}
          <div className="footer-column">
            <h3 className="relative mb-5 text-xs font-bold uppercase tracking-[0.08em] text-slate-700 after:absolute after:bottom-[-8px] after:left-0 after:h-0.5 after:w-6 after:rounded-full after:bg-gradient-to-r after:from-purple-500 after:to-transparent dark:text-slate-200">
              {footer.popularTools}
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href={createHref('/tools/json-formatter')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {tools['json-formatter'].title}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/tools/regex-tester')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {tools['regex-tester'].title}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/tools/uuid-generator')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {tools['uuid-generator'].title}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/tools/base64-encode')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {tools['base64-encode'].title}
                </Link>
              </li>
              <li>
                <Link
                  href={createHref('/tools/hash-generator')}
                  className="block py-1.5 text-sm leading-relaxed text-slate-600 transition-all duration-200 hover:pl-1 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {tools['hash-generator'].title}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-t border-slate-200 dark:border-slate-800/50" />

        {/* Bottom Section - Redesigned */}
        <div className="footer-bottom space-y-8">
          {/* Row 1: Links */}
          <div className="footer-links flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href={createHref('/privacy')}
              className="text-slate-600 transition-colors duration-200 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300"
              rel="noopener noreferrer"
            >
              {footer.privacy}
            </Link>
            <span className="text-slate-400 dark:text-slate-700">•</span>
            <Link
              href={createHref('/terms')}
              className="text-slate-600 transition-colors duration-200 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300"
              rel="noopener noreferrer"
            >
              {footer.terms}
            </Link>
            <span className="text-slate-400 dark:text-slate-700">•</span>
            <a
              href="https://buymeacoffee.com/toolslab"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('donation', 'footer-support-link')}
              className="support-link group relative inline-flex items-center gap-2 rounded-full border border-purple-300/60 bg-purple-50 px-5 py-2 text-sm font-medium text-purple-700 transition-all duration-200 hover:border-purple-400 hover:bg-purple-100 hover:text-purple-800 hover:shadow-lg hover:shadow-purple-200/50 dark:border-purple-500/20 dark:bg-purple-500/5 dark:text-purple-300 dark:hover:border-purple-500/40 dark:hover:bg-purple-500/10 dark:hover:text-purple-200 dark:hover:shadow-purple-500/20"
            >
              <span className="text-base transition-transform duration-200 group-hover:scale-110">
                ☕
              </span>
              <span>{footer.support}</span>
            </a>
          </div>

          {/* Row 2: Zero State Studio branding */}
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-500">
              {footer.developedBy}
            </span>
            <a
              href="https://zerostate.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 transition-all duration-300 hover:border-violet-400 hover:bg-white hover:shadow-md hover:shadow-violet-100 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-violet-500/30 dark:hover:bg-white/[0.05] dark:hover:shadow-violet-500/10"
            >
              <Image
                src="/images/ZSS_logo.png"
                alt="Zero State Studio"
                width={36}
                height={36}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-base font-semibold text-slate-700 transition-colors duration-300 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
                Zero State Studio
              </span>
            </a>
          </div>

          {/* Row 3: Copyright */}
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <p className="m-0 text-xs text-slate-500 dark:text-slate-600">
              {footer.copyright}
            </p>
          </div>
        </div>
      </div>

      {/* Rimuovi styled-jsx per evitare CLS - usa solo Tailwind */}
    </footer>
  );
}
