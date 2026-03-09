import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import { getPageMetadata, getKeywordsString } from '@/lib/i18n/seo-metadata';
import { getLocalizedPath } from '@/lib/i18n/helpers';
import { NewAboutPage } from '@/components/about/NewAboutPage';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

interface LocaleAboutPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: LocaleAboutPageProps): Promise<Metadata> {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const dict = await getDictionary(locale as Locale);
  const metadata = getPageMetadata('about', locale as Locale);

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: getKeywordsString('about', locale as Locale),
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath('/about', locale as Locale)}`,
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
      canonical: `https://toolslab.dev${getLocalizedPath('/about', locale as Locale)}`,
      languages: generateHreflangAlternates({
        pageType: 'static',
        path: 'about',
      }),
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

export default async function LocaleAboutPage({
  params: { locale },
}: LocaleAboutPageProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="animate-pulse space-y-8 px-4 py-16">
            <div className="mx-auto h-12 w-96 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mx-auto h-96 max-w-4xl rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      }
    >
      <NewAboutPage locale={locale} dictionary={dict} />
    </Suspense>
  );
}
