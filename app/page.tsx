import { Metadata } from 'next';
import HomePageContent from '@/components/layout/HomePageContent';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'ToolsLab - 50+ Free Developer Tools | JSON, Base64, JWT, UUID & More',
  description:
    'Free online developer tools for JSON formatting, Base64 encoding, JWT decoding, UUID generation, and more. Fast, private, no signup required. Process everything in your browser.',
  keywords:
    'developer tools, json formatter, base64 encoder, jwt decoder, uuid generator, hash generator, url encoder, timestamp converter, regex tester, online tools, web tools, free tools, browser tools',
  openGraph: {
    title: 'ToolsLab - Your Developer Tools Laboratory 🧪',
    description:
      '50+ precision-engineered tools for developers. Process data instantly in your browser. No signup, no limits, just pure productivity.',
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
    title: 'ToolsLab - 50+ Free Developer Tools',
    description:
      'JSON formatter, Base64 encoder, JWT decoder, and more. All tools run locally in your browser. Fast, private, no signup.',
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
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ToolsLab',
  description:
    '50+ developer tools for data conversion, encoding, formatting, and more',
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
  dateModified: '2025-01-15T00:00:00.000Z',
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  featureList: [
    'JSON Formatter and Validator',
    'Base64 Encoder/Decoder',
    'JWT Token Decoder',
    'UUID Generator',
    'Hash Generator (MD5, SHA)',
    'URL Encoder/Decoder',
    'Timestamp Converter',
    'Regular Expression Tester',
    'Password Generator',
    'Color Picker and Converter',
  ],
};

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
