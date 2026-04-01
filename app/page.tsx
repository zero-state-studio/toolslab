import { Metadata } from 'next';
import HomePageContent from '@/components/layout/HomePageContent';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title:
    'ToolsLab - 72 Free Online Developer Tools | JSON, Base64, JWT, PDF & More',
  description:
    'Free online developer tools: JSON formatter, Base64 encoder, JWT decoder, password generator, JPG to PDF, PNG to PDF, and 66 more. 100% client-side — your data never leaves your browser. No signup required.',
  keywords:
    'developer tools, json formatter, base64 encoder, jwt decoder, uuid generator, hash generator, url encoder, timestamp converter, regex tester, online tools, web tools, free tools, browser tools, jpg to pdf, png to pdf, password generator, json to csv, sql formatter',
  openGraph: {
    title: 'ToolsLab - 72 Free Developer Tools | JSON, Base64, JWT & More',
    description:
      '72 free developer tools. 100% client-side — your data never leaves your browser. No signup, no limits, no tracking.',
    url: 'https://toolslab.dev',
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
    title: 'ToolsLab - 72 Free Developer Tools',
    description:
      'JSON formatter, Base64 encoder, JWT decoder, password generator, JPG to PDF, and more. All tools run locally in your browser. Fast, private, no signup.',
    images: ['https://toolslab.dev/twitter-card.jpg'],
  },
  alternates: {
    canonical: 'https://toolslab.dev',
    languages: generateHreflangAlternates({
      pageType: 'static',
      path: '',
    }),
  },
  other: {
    // 'google-site-verification': 'your-google-verification-code',
  },
};

// Structured data for SEO
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ToolsLab',
    description:
      '72 free developer tools for data conversion, encoding, formatting, and more. All processing happens client-side — your data never leaves your browser.',
    url: 'https://toolslab.dev',
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
    dateModified: '2026-01-15T00:00:00.000Z',
    inLanguage: ['en', 'it', 'es', 'fr', 'de', 'pt'],
    isAccessibleForFree: true,
    featureList: [
      'JPG to PDF Converter (150K searches/mo)',
      'PNG to PDF Converter (100K searches/mo)',
      'Password Generator (82K searches/mo)',
      'JSON Formatter and Validator',
      'Base64 Encoder/Decoder',
      'JWT Token Decoder',
      'UUID Generator',
      'Hash Generator (MD5, SHA-1, SHA-256)',
      'URL Encoder/Decoder',
      'Timestamp Converter',
      'Regular Expression Tester',
      'Color Picker and Converter',
      'CSV to JSON Converter',
      'SQL Formatter',
      'Markdown to HTML',
      '100% Client-Side Processing',
      'Zero Data Collection',
      'No Signup Required',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are ToolsLab tools really free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all 72 tools are completely free, forever. No premium tier, no usage limits, no credit card required. ToolsLab is supported by privacy-respecting ads.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my data safe? Does ToolsLab store my input?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Your data never leaves your device. All processing happens 100% client-side in your browser. We do not store, log, or transmit your input data to any server.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to sign up or create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No signup, no account, no email required. Open any tool and start using it immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'What types of developer tools does ToolsLab offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ToolsLab offers 72 tools across 9 categories: Data & Conversion (JSON, CSV, XML, YAML), Encoding & Security (Base64, JWT, Hash, Password), PDF Tools (JPG to PDF, PNG to PDF), Text & Format (Markdown, Diff, Lorem Ipsum), Generators (UUID, QR Code, Color), Web & Design (Color Converter, CSS Minifier), Dev Utilities (Regex Tester, Timestamp), Formatters (JSON, SQL, HTML), and more.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use ToolsLab offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most tools work offline once the page is loaded, since all processing happens in your browser. Some features like tool search require connectivity.',
        },
      },
    ],
  },
];

export default async function HomePage() {
  const locale = 'en';
  const homeSections = ['common', 'home', 'footer', 'tools'];
  const dictionary = await getDictionary(locale, homeSections);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageContent locale={locale} dictionary={dictionary} />
    </>
  );
}

export async function generateStaticParams() {
  return [];
}
