'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Heart } from 'lucide-react';
import {
  trackConversion,
  trackSocial,
  trackEngagement,
} from '@/lib/analytics';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';
import { useDictionary } from '@/hooks/useDictionary';
import { TLMascot } from '@/components/icons/TLMascot';

export function Footer() {
  const { createHref } = useLocalizedRouter();
  const { dictionary } = useDictionary();

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
    copyright: '© 2026 ToolsLab. All rights reserved.',
    craftedIn: 'in our digital laboratory',
    developedBy: 'Developed by',
  };

  const categoriesDict = dictionary?.categories || {
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

  const columnHeading =
    'relative mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-pg-text/80 ' +
    'after:absolute after:bottom-[-8px] after:left-0 after:h-0.5 after:w-6 after:rounded-full ' +
    'after:bg-gradient-to-r after:from-[color:var(--pg-accent)] after:to-transparent';

  const linkRow =
    'block py-1.5 text-sm leading-relaxed text-pg-muted transition-all duration-200 hover:pl-1 hover:text-pg-text';

  return (
    <footer className="border-t border-pg-border bg-[color:var(--pg-bg)]">
      <div className="mx-auto max-w-pg px-6 py-16 sm:px-8 lg:px-10">
        {/* 4-col info grid */}
        <div className="mb-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <h3 className={columnHeading}>{footer.aboutToolsLab}</h3>
            <p className="mb-3 text-sm leading-relaxed text-pg-muted">
              {footer.aboutDescription}
            </p>
            <Link
              href={createHref('/about')}
              onClick={() =>
                trackEngagement('about-mission-clicked', { from: 'footer' })
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-pg-accent transition-all duration-200 hover:gap-2"
            >
              {footer.learnMission} <span>→</span>
            </Link>

            <div className="mt-4 flex gap-2.5" style={{ minHeight: '36px' }}>
              <a
                href="https://x.com/tools_lab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial('x', 'footer-about')}
                aria-label="X (Twitter)"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-pg-border bg-pg-surface text-pg-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-pg-border-hi hover:text-pg-text"
              >
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/hellotoolslab/toolslab"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial('github', 'footer-about')}
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-pg-border bg-pg-surface text-pg-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-pg-border-hi hover:text-pg-text"
              >
                <Github className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          <div>
            <h3 className={columnHeading}>{footer.quickLinks}</h3>
            <ul className="space-y-1">
              <li><Link href={createHref('/')}           className={linkRow}>{footer.home}</Link></li>
              <li><Link href={createHref('/tools')}      className={linkRow}>{footer.allTools}</Link></li>
              <li><Link href={createHref('/categories')} className={linkRow}>{footer.categories}</Link></li>
              <li><Link href={createHref('/lab')}        className={linkRow}>{footer.yourLab}</Link></li>
              <li><Link href={createHref('/about')}      className={linkRow}>{footer.about}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={columnHeading}>{footer.categories}</h3>
            <ul className="space-y-1">
              <li><Link href={createHref('/category/data')}       className={linkRow}>{categoriesDict.data.name}</Link></li>
              <li><Link href={createHref('/category/encoding')}   className={linkRow}>{categoriesDict.encoding.name}</Link></li>
              <li><Link href={createHref('/category/text')}       className={linkRow}>{categoriesDict.text.name}</Link></li>
              <li><Link href={createHref('/category/generators')} className={linkRow}>{categoriesDict.generators.name}</Link></li>
              <li><Link href={createHref('/category/dev')}        className={linkRow}>{categoriesDict.dev.name}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={columnHeading}>{footer.popularTools}</h3>
            <ul className="space-y-1">
              <li><Link href={createHref('/tools/json-formatter')} className={linkRow}>{tools['json-formatter'].title}</Link></li>
              <li><Link href={createHref('/tools/regex-tester')}   className={linkRow}>{tools['regex-tester'].title}</Link></li>
              <li><Link href={createHref('/tools/uuid-generator')} className={linkRow}>{tools['uuid-generator'].title}</Link></li>
              <li><Link href={createHref('/tools/base64-encode')}  className={linkRow}>{tools['base64-encode'].title}</Link></li>
              <li><Link href={createHref('/tools/hash-generator')} className={linkRow}>{tools['hash-generator'].title}</Link></li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-t border-pg-border" />

        {/* Mascot row */}
        <div className="flex flex-col items-center gap-3 text-center text-sm text-pg-muted sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <TLMascot size={32} />
            <span>
              Made with <Heart className="inline-block h-3.5 w-3.5 translate-y-[-1px] fill-pg-accent-2 text-pg-accent-2" aria-hidden /> for developers · MIT licensed
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
            <Link href={createHref('/privacy')} className="text-pg-muted hover:text-pg-text">
              {footer.privacy}
            </Link>
            <span className="text-pg-dim">•</span>
            <Link href={createHref('/terms')} className="text-pg-muted hover:text-pg-text">
              {footer.terms}
            </Link>
            <span className="text-pg-dim">•</span>
            <a
              href="https://buymeacoffee.com/toolslab"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion('donation', 'footer-support-link')}
              className="inline-flex items-center gap-2 rounded-full border border-pg-border-hi bg-pg-surface px-4 py-1.5 text-sm font-medium text-pg-text transition-all duration-200 hover:border-pg-accent hover:bg-pg-surface-hi"
            >
              <span>☕</span>
              {footer.support}
            </a>
          </div>
        </div>

        {/* Zero State + copyright */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="text-[11px] uppercase tracking-wider text-pg-dim">
            {footer.developedBy}
          </span>
          <a
            href="https://zerostate.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-pg-border bg-pg-surface px-5 py-3 transition-all duration-300 hover:border-pg-accent hover:bg-pg-surface-hi"
          >
            <Image
              src="/images/ZSS_logo.png"
              alt="Zero State Studio"
              width={36}
              height={36}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-base font-semibold text-pg-text">Zero State Studio</span>
          </a>
          <p className="mt-2 text-xs text-pg-dim">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
