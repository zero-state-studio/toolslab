import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/i18n/helpers';

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const dict = await getDictionary(locale as Locale);

  return {
    title: {
      default: 'ToolsLab - ' + dict.home.hero.title,
      template: `%s${dict.seo.suffix}`,
    },
    description: dict.seo.defaultDescription,
    metadataBase: new URL('https://toolslab.dev'),
    alternates: {
      canonical: locale === 'en' ? '/' : `/${locale}`,
      languages: generateHreflangAlternates('/'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <>{children}</>;
}
