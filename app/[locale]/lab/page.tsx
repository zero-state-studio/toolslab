import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import {
  getLocalizedPath,
  generateHreflangAlternates,
} from '@/lib/i18n/helpers';
import { LocaleLabPageClient } from './LocaleLabPageClient';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface LocaleLabPageProps {
  params: {
    locale: string;
  };
}

// Locale-specific metadata
const localeMeta: Record<
  string,
  { title: string; description: string; ogDescription: string; twitterTitle: string; twitterDescription: string; keywords: string[] }
> = {
  it: {
    title: 'Lab Sviluppatore - 70+ Strumenti Gratuiti Online',
    description:
      'Accedi a oltre 70 strumenti gratuiti per sviluppatori in un unico spazio privato. JSON formatter, encoder Base64, generatori hash, convertitori di codice e altro. Nessuna registrazione — segna i tuoi preferiti per accesso immediato.',
    ogDescription:
      'Oltre 70 strumenti gratuiti per sviluppatori all\'istante. JSON formatter, encoder, generatori e altro. Nessuna registrazione — 100% privato, nel tuo browser.',
    twitterTitle: 'Lab Sviluppatore - 70+ Strumenti Gratis | ToolsLab',
    twitterDescription:
      '70+ strumenti gratuiti per sviluppatori in uno spazio privato. Nessuna registrazione, nessun tracciamento.',
    keywords: [
      'strumenti sviluppatore gratuiti', 'toolkit sviluppatore online', 'JSON formatter online',
      'encoder Base64 gratis', 'spazio lavoro sviluppatore', 'strumenti codice online',
      'generatore hash online', 'strumenti produttività sviluppatore',
      'strumenti online gratuiti', 'strumenti sviluppatore browser',
    ],
  },
  es: {
    title: 'Lab Desarrollador - 70+ Herramientas Gratis Online',
    description:
      'Accede a más de 70 herramientas gratuitas para desarrolladores en un espacio privado. JSON formatter, codificador Base64, generadores hash y más. Sin registro — marca tus favoritas para acceso instantáneo.',
    ogDescription:
      '70+ herramientas gratuitas para desarrolladores al instante. JSON formatter, codificadores, generadores y más. Sin registro — 100% privado.',
    twitterTitle: 'Lab Desarrollador - 70+ Herramientas Gratis | ToolsLab',
    twitterDescription:
      '70+ herramientas gratuitas para desarrolladores. Sin registro, sin rastreo — solo herramientas.',
    keywords: [
      'herramientas desarrollador gratis', 'toolkit desarrollador online', 'JSON formatter online',
      'codificador Base64 gratis', 'espacio trabajo desarrollador', 'herramientas código online',
      'generador hash online', 'herramientas productividad desarrollador',
      'herramientas online gratis', 'herramientas desarrollador navegador',
    ],
  },
  fr: {
    title: 'Lab Développeur - 70+ Outils Gratuits en Ligne',
    description:
      'Accédez à plus de 70 outils gratuits pour développeurs dans un espace privé. JSON formatter, encodeur Base64, générateurs hash et plus. Sans inscription — marquez vos favoris pour un accès instantané.',
    ogDescription:
      '70+ outils gratuits pour développeurs instantanément. JSON formatter, encodeurs, générateurs et plus. Sans inscription — 100% privé.',
    twitterTitle: 'Lab Développeur - 70+ Outils Gratuits | ToolsLab',
    twitterDescription:
      '70+ outils gratuits pour développeurs. Sans inscription, sans suivi — que des outils.',
    keywords: [
      'outils développeur gratuits', 'toolkit développeur en ligne', 'JSON formatter en ligne',
      'encodeur Base64 gratuit', 'espace travail développeur', 'outils code en ligne',
      'générateur hash en ligne', 'outils productivité développeur',
      'outils en ligne gratuits', 'outils développeur navigateur',
    ],
  },
  de: {
    title: 'Entwickler-Lab - 70+ Kostenlose Online-Tools',
    description:
      'Zugriff auf über 70 kostenlose Entwickler-Tools in einem privaten Workspace. JSON-Formatierer, Base64-Encoder, Hash-Generatoren und mehr. Keine Registrierung — markiere deine Favoriten für sofortigen Zugriff.',
    ogDescription:
      '70+ kostenlose Entwickler-Tools sofort verfügbar. JSON-Formatierer, Encoder, Generatoren und mehr. Keine Registrierung — 100% privat.',
    twitterTitle: 'Entwickler-Lab - 70+ Kostenlose Tools | ToolsLab',
    twitterDescription:
      '70+ kostenlose Entwickler-Tools in einem privaten Workspace. Keine Registrierung, kein Tracking.',
    keywords: [
      'Entwickler-Tools kostenlos', 'Entwickler-Toolkit online', 'JSON Formatter online',
      'Base64 Encoder kostenlos', 'Entwickler Workspace', 'Code-Tools online',
      'Hash-Generator online', 'Entwickler Produktivitäts-Tools',
      'kostenlose Online-Tools', 'Browser-basierte Entwickler-Tools',
    ],
  },
  pt: {
    title: 'Lab Desenvolvedor - 70+ Ferramentas Grátis Online',
    description:
      'Acesse mais de 70 ferramentas gratuitas para desenvolvedores em um espaço privado. JSON formatter, codificador Base64, geradores hash e mais. Sem cadastro — marque seus favoritos para acesso instantâneo.',
    ogDescription:
      '70+ ferramentas gratuitas para desenvolvedores instantaneamente. JSON formatter, codificadores, geradores e mais. Sem cadastro — 100% privado.',
    twitterTitle: 'Lab Desenvolvedor - 70+ Ferramentas Grátis | ToolsLab',
    twitterDescription:
      '70+ ferramentas gratuitas para desenvolvedores. Sem cadastro, sem rastreamento — apenas ferramentas.',
    keywords: [
      'ferramentas desenvolvedor grátis', 'toolkit desenvolvedor online', 'JSON formatter online',
      'codificador Base64 grátis', 'espaço trabalho desenvolvedor', 'ferramentas código online',
      'gerador hash online', 'ferramentas produtividade desenvolvedor',
      'ferramentas online grátis', 'ferramentas desenvolvedor navegador',
    ],
  },
};

// Fallback (EN)
const enMeta = {
  title: 'Developer Lab - 70+ Free Online Tools in One Workspace',
  description:
    'Access 70+ free developer tools in one private workspace. JSON formatters, Base64 encoders, hash generators, code converters and more. No signup required — star your favorites for instant access.',
  ogDescription:
    'Access 70+ free developer tools instantly. JSON formatters, encoders, generators and more. No signup — 100% private, runs in your browser.',
  twitterTitle: 'Developer Lab - 70+ Free Tools | ToolsLab',
  twitterDescription:
    '70+ free developer tools in one private workspace. No signup, no tracking — just tools.',
  keywords: [
    'free developer tools', 'online developer toolkit', 'JSON formatter online',
    'Base64 encoder free', 'developer workspace', 'code tools collection',
    'hash generator online', 'developer productivity tools',
    'free online tools', 'browser-based developer tools',
  ],
};

export async function generateMetadata({
  params: { locale },
}: LocaleLabPageProps): Promise<Metadata> {
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const meta = localeMeta[locale] || enMeta;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.ogDescription,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath('/lab', locale as Locale)}`,
      siteName: 'ToolsLab',
      images: [
        {
          url: 'https://toolslab.dev/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'ToolsLab Developer Lab - 70+ Free Online Tools',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.twitterTitle,
      description: meta.twitterDescription,
      images: ['https://toolslab.dev/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://toolslab.dev${getLocalizedPath('/lab', locale as Locale)}`,
      languages: generateHreflangAlternates('/lab'),
    },
  };
}

export default async function LocaleLabPage({
  params: { locale },
}: LocaleLabPageProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load only sections needed for lab page
  const labSections = ['common', 'lab'];
  const dict = await getDictionary(locale as Locale, labSections);

  return <LocaleLabPageClient locale={locale as Locale} dictionary={dict} />;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
