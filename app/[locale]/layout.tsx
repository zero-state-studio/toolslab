import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/i18n/helpers';
import { RootDocument } from '@/components/layout/RootDocument';
import { baseMetadata } from '@/lib/seo/base-metadata';

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

  // Root layout: nothing is inherited across root layouts, so spread the
  // shared base (icons, OG, robots, manifest, ...) and override localized bits.
  return {
    ...baseMetadata,
    title: {
      default: 'ToolsLab - ' + dict.home.hero.title,
      template: `%s${dict.seo.suffix}`,
    },
    description: dict.seo.defaultDescription,
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

  return <RootDocument lang={locale}>{children}</RootDocument>;
}
