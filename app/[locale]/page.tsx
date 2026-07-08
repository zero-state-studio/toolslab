import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomePageContent from '@/components/layout/HomePageContent';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import { getPageMetadata, getKeywordsString } from '@/lib/i18n/seo-metadata';
import { getLocalizedPath } from '@/lib/i18n/helpers';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface LocalePageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: LocalePageProps): Promise<Metadata> {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const dict = await getDictionary(locale as Locale);
  const metadata = getPageMetadata('home', locale as Locale);

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: getKeywordsString('home', locale as Locale),
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath('/', locale as Locale)}`,
      siteName: 'ToolsLab',
      type: 'website',
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
      canonical: `https://toolslab.dev${getLocalizedPath('/', locale as Locale)}`,
      languages: generateHreflangAlternates({
        pageType: 'static',
        path: '',
      }),
    },
  };
}

// Generate structured data based on locale
function generateStructuredData(locale: string, dict: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ToolsLab',
    description: dict.home.hero.description,
    url: `https://toolslab.dev${locale === 'en' ? '' : `/${locale}`}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'ToolsLab',
      url: 'https://toolslab.dev',
    },
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString(),
    inLanguage: locale === 'it' ? 'it-IT' : 'en-US',
    isAccessibleForFree: true,
    featureList: [
      dict.tools?.['json-formatter']?.title,
      dict.tools?.['base64-encode']?.title,
      dict.tools?.['jwt-decoder']?.title,
      dict.tools?.['uuid-generator']?.title,
      dict.tools?.['hash-generator']?.title,
      dict.tools?.['url-encode']?.title,
      dict.tools?.['unix-timestamp-converter']?.title,
      dict.tools?.['regex-tester']?.title,
      dict.tools?.['password-generator']?.title,
      dict.tools?.['color-picker']?.title,
    ].filter(Boolean),
  };
}

export default async function LocaleHomePage({
  params: { locale },
}: LocalePageProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Only sections HomePageContent renders — the full 'tools' section (~325KB
  // raw per locale) would be serialized into the RSC flight payload of the HTML
  const homeSections = ['common', 'home', 'footer'];
  const dict = await getDictionary(locale as Locale, homeSections);

  // Titles-only tools load for the JSON-LD featureList: stays server-side,
  // never serialized to the client
  const { tools: toolSummaries } = await getDictionary(locale as Locale, [
    'tools-summaries',
  ]);
  const structuredData = generateStructuredData(locale, {
    ...dict,
    tools: toolSummaries,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageContent locale={locale as Locale} dictionary={dict} />
    </>
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
