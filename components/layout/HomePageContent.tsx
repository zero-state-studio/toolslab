'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { DictionaryProvider } from '@/components/providers/DictionaryProvider';
import { trackEngagement } from '@/lib/analytics';

// Above-the-fold Playground sections
import { PGHero } from '@/components/home/PGHero';
import { PGValueProps } from '@/components/home/PGValueProps';
import { PGCategoryGrid } from '@/components/home/PGCategoryGrid';
import { PGPopularTools } from '@/components/home/PGPopularTools';

// Below-the-fold (SEO content, kept lazy)
const SEOContent = dynamic(
  () =>
    import('@/components/home/SEOContent').then((mod) => ({
      default: mod.SEOContent,
    })),
  { ssr: false }
);

function LoadingPlaceholder({ minHeight = 'min-h-[200px]' }: { minHeight?: string }) {
  return (
    <div className={`flex ${minHeight} items-center justify-center`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-pg-border border-t-pg-accent" />
    </div>
  );
}

interface HomePageContentProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export default function HomePageContent({
  locale = 'en',
  dictionary,
}: HomePageContentProps) {
  const homeSections = ['common', 'home', 'footer'];

  useEffect(() => {
    trackEngagement('homepage-viewed', { locale });
  }, []);

  const home = dictionary?.home as any;

  return (
    <DictionaryProvider
      locale={locale}
      sections={homeSections}
      initialDictionary={dictionary}
    >
      <main className="min-h-screen">
        <PGHero
          title={home?.hero?.title || 'Every dev tool,'}
          subtitle={
            home?.hero?.subtitle ||
            'Fast, free, no sign-up. Every file stays on your machine.'
          }
        />
        <PGValueProps />
        <PGCategoryGrid
          title={home?.categories?.title || 'Browse by category'}
          seeAllLabel={home?.categories?.viewAll || 'View all'}
        />
        <PGPopularTools
          title={home?.popular?.title || 'Popular this week'}
          updatedLabel={home?.popular?.updatedLabel || 'updated recently'}
        />

        {/* SEO tail content — kept below fold for crawlers */}
        <Suspense fallback={<LoadingPlaceholder />}>
          <SEOContent />
        </Suspense>
      </main>
    </DictionaryProvider>
  );
}
