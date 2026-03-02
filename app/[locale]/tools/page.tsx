import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale } from '@/lib/i18n/config';
import { getPageMetadata, getKeywordsString } from '@/lib/i18n/seo-metadata';
import {
  getLocalizedPath,
  generateHreflangAlternates,
} from '@/lib/i18n/helpers';
import ToolsHubContent from '@/components/tools/ToolsHubContent';

export const revalidate = false;

interface LocaleToolsPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: LocaleToolsPageProps): Promise<Metadata> {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const dict = await getDictionary(locale as Locale);
  const metadata = getPageMetadata('tools', locale as Locale);

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: getKeywordsString('tools', locale as Locale),
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      url: `https://toolslab.dev${getLocalizedPath('/tools', locale as Locale)}`,
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
      canonical: `https://toolslab.dev${getLocalizedPath('/tools', locale as Locale)}`,
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
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function LocaleToolsPage({
  params: { locale },
}: LocaleToolsPageProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<div>Loading...</div>}>
        <ToolsHubContent locale={locale as Locale} dictionary={dict} />
      </Suspense>
    </div>
  );
}
