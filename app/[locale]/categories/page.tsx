import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoriesHubContentSimple from '@/components/layout/CategoriesHubContentSimple';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import {
  getLocalizedPath,
  generateHreflangAlternates,
} from '@/lib/i18n/helpers';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface LocaleCategoriesPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: LocaleCategoriesPageProps): Promise<Metadata> {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  // Per-locale metadata for the categories hub page. Previously only IT and EN
  // were provided, so FR/ES/DE/PT silently fell back to English copy — weakening
  // E-A-T signals for those locales (RIC-119). Mirrors the pattern used by
  // app/[locale]/lab/page.tsx which is already fully localized.
  type HubMeta = { title: string; description: string; keywords: string };
  const hubMeta: Record<Locale, HubMeta> = {
    en: {
      title: 'Developer Tool Categories - Browse by Functionality',
      description:
        'Explore 24+ professional developer tools organized into 6 specialized categories. From data conversion to security utilities, find tools for JSON formatting, Base64 encoding, hash generation, and more.',
      keywords:
        'developer tools categories, JSON formatter, Base64 encoder, hash generator, data conversion tools, security utilities, web development tools, programming utilities',
    },
    it: {
      title: 'Categorie Strumenti Sviluppatori - Naviga per Funzionalità',
      description:
        'Esplora 24+ strumenti professionali per sviluppatori organizzati in 6 categorie specializzate. Dalla conversione dati alle utilità di sicurezza, trova strumenti per formattazione JSON, codifica Base64, generazione hash e altro.',
      keywords:
        'categorie strumenti sviluppatori, formattatore JSON, codificatore Base64, generatore hash, strumenti conversione dati, utilità sicurezza, strumenti sviluppo web, utilità programmazione',
    },
    es: {
      title:
        'Categorías de Herramientas para Desarrolladores - Explora por Funcionalidad',
      description:
        'Explora 24+ herramientas profesionales para desarrolladores organizadas en 6 categorías especializadas. Desde la conversión de datos hasta las utilidades de seguridad, encuentra herramientas para formatear JSON, codificar Base64, generar hashes y mucho más.',
      keywords:
        'categorías de herramientas para desarrolladores, formateador JSON, codificador Base64, generador de hash, herramientas de conversión de datos, utilidades de seguridad, herramientas de desarrollo web, utilidades de programación',
    },
    fr: {
      title:
        "Catégories d'Outils pour Développeurs - Parcourir par Fonctionnalité",
      description:
        "Explorez 24+ outils professionnels pour développeurs organisés en 6 catégories spécialisées. De la conversion de données aux utilitaires de sécurité, trouvez des outils pour le formatage JSON, l'encodage Base64, la génération de hash et bien plus.",
      keywords:
        "catégories d'outils développeurs, formateur JSON, encodeur Base64, générateur de hash, outils de conversion de données, utilitaires de sécurité, outils de développement web, utilitaires de programmation",
    },
    de: {
      title: 'Entwickler-Tool-Kategorien - Nach Funktion durchsuchen',
      description:
        'Entdecken Sie 24+ professionelle Entwickler-Tools in 6 spezialisierten Kategorien. Von Datenkonvertierung bis Sicherheits-Utilities — finden Sie Tools für JSON-Formatierung, Base64-Kodierung, Hash-Generierung und vieles mehr.',
      keywords:
        'Entwickler-Tool-Kategorien, JSON-Formatierer, Base64-Encoder, Hash-Generator, Datenkonvertierungs-Tools, Sicherheits-Utilities, Webentwicklungs-Tools, Programmier-Utilities',
    },
    pt: {
      title:
        'Categorias de Ferramentas para Desenvolvedores - Navegar por Funcionalidade',
      description:
        'Explore 24+ ferramentas profissionais para desenvolvedores organizadas em 6 categorias especializadas. Da conversão de dados aos utilitários de segurança, encontre ferramentas para formatação JSON, codificação Base64, geração de hash e muito mais.',
      keywords:
        'categorias de ferramentas para desenvolvedores, formatador JSON, codificador Base64, gerador de hash, ferramentas de conversão de dados, utilitários de segurança, ferramentas de desenvolvimento web, utilitários de programação',
    },
  };

  const { title, description, keywords } = hubMeta[locale as Locale];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath('/categories', locale as Locale)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ToolsLab`,
      description,
    },
    alternates: {
      canonical: `https://toolslab.dev${getLocalizedPath('/categories', locale as Locale)}`,
      languages: generateHreflangAlternates('/categories'),
    },
  };
}

export default async function LocaleCategoriesPage({
  params: { locale },
}: LocaleCategoriesPageProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Only the 'categories' section — CategoriesHubContentSimple reads
  // dictionary.categories exclusively
  const dict = await getDictionary(locale as Locale, ['categories']);

  return (
    <CategoriesHubContentSimple locale={locale as Locale} dictionary={dict} />
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
