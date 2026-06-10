/**
 * Non-localized /tools route — English default
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import ToolsHubContent from '@/components/tools/ToolsHubContent';
import { generateHreflangAlternates } from '@/lib/i18n/helpers';
import { tools } from '@/lib/tools';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'All Developer Tools - 69+ Free Online Utilities | ToolsLab',
  description:
    '69+ free online tools for developers: JSON formatter, Base64 encoder, JWT decoder, hash generator, URL encoder, SQL formatter and more. 100% browser-based, no signup required, completely private.',
  keywords: [
    'online developer tools',
    'free developer utilities',
    'web development tools',
    'json formatter online',
    'base64 encoder decoder',
    'url encoder decoder',
    'hash generator online',
    'jwt decoder online',
    'sql formatter online',
    'browser based tools',
    'privacy first tools',
    'developer utilities',
    'coding tools online',
    'programming utilities free',
    'no signup developer tools',
  ],
  openGraph: {
    title: 'All Developer Tools - 69+ Free Online Utilities | ToolsLab',
    description:
      '69+ free browser-based tools for JSON formatting, Base64 encoding, hash generation, and more. No signup, 100% private, instant results.',
    type: 'website',
    url: 'https://toolslab.dev/tools',
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
    title: 'All Developer Tools - ToolsLab',
    description:
      '69+ free online developer tools for JSON, encoding, generators, and more. All browser-based with zero data transmission.',
    images: ['https://toolslab.dev/twitter-card.jpg'],
  },
  alternates: {
    canonical: 'https://toolslab.dev/tools',
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

const BASE_URL = 'https://toolslab.dev';

function buildStructuredData() {
  const availableTools = tools.filter((t) => t.label !== 'coming-soon');

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Developer Tools – Free Online Utilities',
    description:
      `${availableTools.length}+ free online developer tools: JSON formatter, Base64 encoder, JWT decoder, hash generator and more. 100% browser-based, no signup required.`,
    url: `${BASE_URL}/tools`,
    provider: {
      '@type': 'Organization',
      name: 'ToolsLab',
      url: BASE_URL,
    },
    hasPart: availableTools.slice(0, 30).map((tool) => ({
      '@type': 'SoftwareApplication',
      name: tool.name,
      description: tool.description,
      url: `${BASE_URL}${tool.route}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    })),
  };

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free Developer Tools by ToolsLab',
    description: 'Complete list of free online developer tools.',
    url: `${BASE_URL}/tools`,
    numberOfItems: availableTools.length,
    itemListElement: availableTools.slice(0, 50).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      description: tool.description,
      url: `${BASE_URL}${tool.route}`,
    })),
  };

  return [collectionPage, itemList];
}

export default async function ToolsPage() {
  const structuredData = buildStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ToolsHubContent />
      </Suspense>
    </>
  );
}
