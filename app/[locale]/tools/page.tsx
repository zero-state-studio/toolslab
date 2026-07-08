import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import { getPageMetadata, getKeywordsString } from '@/lib/i18n/seo-metadata';
import {
  getLocalizedPath,
  generateHreflangAlternates,
} from '@/lib/i18n/helpers';
import ToolsHubContent from '@/components/tools/ToolsHubContent';
import { tools } from '@/lib/tools';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface LocaleToolsPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: LocaleToolsPageProps): Promise<Metadata> {
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const metadata = getPageMetadata('tools', locale as Locale);
  const localizedUrl = `https://toolslab.dev${getLocalizedPath('/tools', locale as Locale)}`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: getKeywordsString('tools', locale as Locale),
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: localizedUrl,
      siteName: 'ToolsLab',
      images: [
        {
          url: 'https://toolslab.dev/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'ToolsLab - Developer Tools Laboratory',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: ['https://toolslab.dev/twitter-card.jpg'],
    },
    alternates: {
      canonical: localizedUrl,
      languages: generateHreflangAlternates('/tools'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const BASE_URL = 'https://toolslab.dev';

function buildStructuredData(locale: string) {
  const localizedPath = getLocalizedPath('/tools', locale as Locale);
  const availableTools = tools.filter((t) => t.label !== 'coming-soon');

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'All Developer Tools – Free Online Utilities',
      description: `${availableTools.length}+ free browser-based developer tools. No signup, 100% private.`,
      url: `${BASE_URL}${localizedPath}`,
      provider: {
        '@type': 'Organization',
        name: 'ToolsLab',
        url: BASE_URL,
      },
      hasPart: availableTools.slice(0, 30).map((tool) => ({
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        url: `${BASE_URL}${getLocalizedPath(tool.route, locale as Locale)}`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Free Developer Tools by ToolsLab',
      url: `${BASE_URL}${localizedPath}`,
      numberOfItems: availableTools.length,
      itemListElement: availableTools.slice(0, 50).map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tool.name,
        url: `${BASE_URL}${getLocalizedPath(tool.route, locale as Locale)}`,
      })),
    },
  ];
}

export default async function LocaleToolsPage({
  params: { locale },
}: LocaleToolsPageProps) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Only the sections ToolsHubContent reads (toolsPage strings + category
  // names) — the full dictionary would be serialized into the flight payload
  const dict = await getDictionary(locale as Locale, [
    'toolsPage',
    'categories',
  ]);
  const structuredData = buildStructuredData(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ToolsHubContent locale={locale as Locale} dictionary={dict} />
      </Suspense>
    </>
  );
}
