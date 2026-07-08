import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { categories } from '@/lib/tools';
import { getCategorySEO } from '@/lib/category-seo';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import {
  getLocalizedPath,
  generateHreflangAlternates,
} from '@/lib/i18n/helpers';
import LocaleCategoryPageContent from '@/components/layout/LocaleCategoryPageContent';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface LocaleCategoryPageProps {
  params: {
    locale: string;
    category: string;
  };
}

export async function generateStaticParams() {
  // Generate paths for all locale/category combinations
  const paths = [];

  for (const locale of locales) {
    for (const category of categories) {
      paths.push({
        locale,
        category: category.id,
      });
    }
  }

  return paths;
}

export async function generateMetadata({
  params,
}: LocaleCategoryPageProps): Promise<Metadata> {
  const { locale, category: categoryId } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const category = categories.find((cat) => cat.id === categoryId);
  const seoContent = await getCategorySEO(categoryId, locale as Locale);

  if (!category || !seoContent) {
    return {
      title: 'Category Not Found - ToolsLab',
      description: 'The requested category was not found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const dict = await getDictionary(locale as Locale, ['categories']);
  const categoryDict = dict.categories[categoryId];
  const categoryName = categoryDict?.name || category.name;
  const categoryNameLower = categoryName.toLowerCase();
  const toolCount = category.tools.length;

  // Localized brand suffix appended to the category H1 for the <title> tag.
  // Prevents mixed-language titles like "Outils d'Encodage - Free Online Tools | ToolsLab"
  // which weakens E-A-T signals for non-EN locales (see RIC-119).
  const brandSuffix: Record<Locale, string> = {
    en: 'Free Online Tools | ToolsLab',
    it: 'Strumenti Gratuiti Online | ToolsLab',
    es: 'Herramientas Gratis Online | ToolsLab',
    fr: 'Outils en Ligne Gratuits | ToolsLab',
    de: 'Kostenlose Online-Tools | ToolsLab',
    pt: 'Ferramentas Grátis Online | ToolsLab',
  };

  // Localized H1 prefix. Falls back to seoContent.h1Title for EN and any
  // locale-specific SEO override loaded from the per-locale dictionary.
  const localizedTitlePrefix =
    locale === 'it' ? categoryName : seoContent.h1Title;

  const title = `${localizedTitlePrefix} - ${brandSuffix[locale as Locale]}`;

  // Localized description. For IT we keep the existing richer copy. For every
  // other locale we use `seoContent.metaDescription` which is already fully
  // translated per-locale in `lib/i18n/dictionaries/<locale>/category-seo.json`.
  const descriptionByLocale: Partial<Record<Locale, string>> = {
    it: `Scopri ${toolCount} strumenti professionali per ${categoryNameLower}. Gratuiti, sicuri e senza registrazione. Perfetti per sviluppatori e professionisti.`,
  };
  const description =
    descriptionByLocale[locale as Locale] ?? seoContent.metaDescription;

  // Localized keywords. For IT we keep the custom keyword set; for other
  // locales we use the translated keyword array from the per-locale JSON.
  const keywordsByLocale: Partial<Record<Locale, string>> = {
    it: `strumenti ${categoryNameLower}, strumenti online gratuiti, ${categoryNameLower} italiano, toolslab, sviluppatori`,
  };
  const keywords = keywordsByLocale[locale as Locale] ?? seoContent.keywords;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${categoryDict?.name || category.name} - ToolsLab`,
      description,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath(`/category/${categoryId}`, locale as Locale)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryDict?.name || category.name} - ToolsLab`,
      description,
    },
    alternates: {
      canonical: `https://toolslab.dev${getLocalizedPath(`/category/${categoryId}`, locale as Locale)}`,
      languages: generateHreflangAlternates(`/category/${categoryId}`),
    },
  };
}

export default async function LocaleCategoryPage({
  params,
}: LocaleCategoryPageProps) {
  const { locale, category: categoryId } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) {
    notFound();
  }

  // Only the sections LocaleCategoryPageContent reads — the full dictionary
  // (tools instructions included) would be serialized into the flight payload
  const dict = await getDictionary(locale as Locale, ['common', 'categories']);
  const seoContent = await getCategorySEO(categoryId, locale as Locale);

  if (!seoContent) {
    notFound();
  }

  return (
    <Suspense
      fallback={<div className="animate-pulse">Loading category...</div>}
    >
      <LocaleCategoryPageContent
        categoryId={categoryId}
        locale={locale as Locale}
        dictionary={dict}
        seoContent={seoContent}
      />
    </Suspense>
  );
}
