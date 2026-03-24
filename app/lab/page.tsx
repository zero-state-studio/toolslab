import { Metadata } from 'next';
import { Suspense } from 'react';
import { LabPageClient } from './LabPageClient';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Developer Lab - 70+ Free Online Tools in One Workspace | ToolsLab',
  description:
    'Access 70+ free developer tools in one private workspace. JSON formatters, Base64 encoders, hash generators, code converters and more. No signup required — star your favorites for instant access.',
  keywords: [
    'free developer tools',
    'online developer toolkit',
    'JSON formatter online',
    'Base64 encoder free',
    'developer workspace',
    'code tools collection',
    'hash generator online',
    'developer productivity tools',
    'free online tools',
    'browser-based developer tools',
  ],
  openGraph: {
    title: 'Developer Lab - 70+ Free Tools in One Workspace | ToolsLab',
    description:
      'Access 70+ free developer tools instantly. JSON formatters, encoders, generators and more. No signup — 100% private, runs in your browser.',
    type: 'website',
    url: 'https://toolslab.dev/lab',
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
    title: 'Developer Lab - 70+ Free Tools | ToolsLab',
    description:
      '70+ free developer tools in one private workspace. No signup, no tracking — just tools.',
    images: ['https://toolslab.dev/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://toolslab.dev/lab',
    languages: generateHreflangAlternates({
      pageType: 'static',
      path: 'lab',
    }),
  },
};

// JSON-LD structured data — landing page for ToolsLab's developer workspace
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://toolslab.dev/lab#webpage',
  name: 'Developer Lab - 70+ Free Online Developer Tools',
  description:
    'Access 70+ free developer tools in one private workspace. JSON formatters, Base64 encoders, hash generators, code converters and more. No signup required.',
  url: 'https://toolslab.dev/lab',
  isPartOf: {
    '@type': 'WebSite',
    '@id': 'https://toolslab.dev#website',
    name: 'ToolsLab',
    url: 'https://toolslab.dev',
  },
  publisher: {
    '@type': 'Organization',
    name: 'ToolsLab',
    url: 'https://toolslab.dev',
    logo: {
      '@type': 'ImageObject',
      url: 'https://toolslab.dev/icon-512.png',
    },
  },
  about: {
    '@type': 'SoftwareApplication',
    name: 'ToolsLab',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    description:
      '70+ free browser-based developer tools. JSON formatters, encoders, generators, converters and more. 100% client-side, no signup required.',
    url: 'https://toolslab.dev',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '70+ free developer tools',
      '100% client-side processing',
      'No signup or account required',
      'Private — data never leaves your browser',
      'Personal Lab workspace with starred favorites',
      '10 tool categories',
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://toolslab.dev',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Lab',
        item: 'https://toolslab.dev/lab',
      },
    ],
  },
};

export default async function LabPage() {
  // Load dictionary for English (default locale)
  const labSections = ['common', 'lab'];
  const dict = await getDictionary('en', labSections);

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-48 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-48 rounded-2xl bg-slate-200 dark:bg-white/[0.06]"></div>
                <div className="h-48 rounded-2xl bg-slate-200 dark:bg-white/[0.06]"></div>
                <div className="h-48 rounded-2xl bg-slate-200 dark:bg-white/[0.06]"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LabPageClient locale="en" dictionary={dict} />
    </Suspense>
    </>
  );
}
