'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { DictionaryProvider } from '@/components/providers/DictionaryProvider';
import { trackEngagement } from '@/lib/analytics';

// Eager load critical above-the-fold components
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { PoweredBy } from '@/components/home/PoweredBy';

// Lazy load below-the-fold components using next/dynamic
// (React.lazy doesn't handle SSR chunk resolution reliably in Next.js)
const FeaturedTools = dynamic(
  () =>
    import('@/components/home/FeaturedTools').then((mod) => ({
      default: mod.FeaturedTools,
    })),
  { ssr: false }
);
const TrustMetrics = dynamic(
  () =>
    import('@/components/home/TrustMetrics').then((mod) => ({
      default: mod.TrustMetrics,
    })),
  { ssr: false }
);
const WhyToolsLab = dynamic(
  () =>
    import('@/components/home/WhyToolsLab').then((mod) => ({
      default: mod.WhyToolsLab,
    })),
  { ssr: false }
);
const InteractiveDemo = dynamic(
  () =>
    import('@/components/home/InteractiveDemo').then((mod) => ({
      default: mod.InteractiveDemo,
    })),
  { ssr: false }
);
const ToolDiscovery = dynamic(
  () =>
    import('@/components/home/ToolDiscovery').then((mod) => ({
      default: mod.ToolDiscovery,
    })),
  { ssr: false }
);
const SEOContent = dynamic(
  () =>
    import('@/components/home/SEOContent').then((mod) => ({
      default: mod.SEOContent,
    })),
  { ssr: false }
);
const FooterCTA = dynamic(
  () =>
    import('@/components/home/FooterCTA').then((mod) => ({
      default: mod.FooterCTA,
    })),
  { ssr: false }
);

// Loading placeholder for lazy components
function LoadingPlaceholder({
  minHeight = 'min-h-[200px]',
}: {
  minHeight?: string;
}) {
  return (
    <div className={`flex ${minHeight} items-center justify-center`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-violet-500" />
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
  // Specify sections needed for homepage
  const homeSections = ['common', 'home', 'footer'];

  // Track homepage engagement
  useEffect(() => {
    trackEngagement('homepage-viewed', {
      locale,
    });
  }, []); // Run only once on mount

  return (
    <DictionaryProvider
      locale={locale}
      sections={homeSections}
      initialDictionary={dictionary}
    >
      <main className="min-h-screen bg-background">
        {/* Above the fold - loaded immediately */}
        <HeroSection locale={locale} dictionary={dictionary} />

        {/* Most Used This Week - moved before CategoryGrid */}
        <Suspense fallback={<LoadingPlaceholder minHeight="min-h-[300px]" />}>
          <FeaturedTools locale={locale} dictionary={dictionary} />
        </Suspense>

        <CategoryGrid locale={locale} dictionary={dictionary} />

        {/* Powered By section - lightweight, loaded immediately */}
        <PoweredBy />

        <Suspense fallback={<LoadingPlaceholder minHeight="min-h-[200px]" />}>
          <TrustMetrics />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder minHeight="min-h-[400px]" />}>
          <WhyToolsLab locale={locale} dictionary={dictionary} />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder minHeight="min-h-[500px]" />}>
          <InteractiveDemo />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder />}>
          <ToolDiscovery />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder />}>
          <SEOContent />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder />}>
          <FooterCTA />
        </Suspense>
      </main>
    </DictionaryProvider>
  );
}
