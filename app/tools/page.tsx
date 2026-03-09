/**
 * Non-localized /tools route
 * Redirects to the English localized version
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import ToolsHubContent from '@/components/tools/ToolsHubContent';
import { generateHreflangAlternates } from '@/lib/i18n/helpers';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'All Developer Tools - Free Online Utilities | ToolsLab',
  description:
    'Discover 20+ free online tools for JSON formatting, Base64 encoding, URL decoding, hash generation, and more. All tools work entirely in your browser with no data transmission to servers. Perfect for development, debugging, and data processing workflows.',
  keywords: [
    'online developer tools',
    'free developer utilities',
    'web development tools',
    'json formatter',
    'base64 encoder',
    'url decoder',
    'hash generator',
    'browser based tools',
    'privacy first tools',
    'developer utilities',
    'coding tools',
    'programming utilities',
  ],
  openGraph: {
    title: 'All Developer Tools - Free Online Utilities | ToolsLab',
    description:
      'Complete collection of professional tools for developers, data analysts, and system administrators. 20+ tools, all free and privacy-first.',
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
      'Free online developer tools for JSON, encoding, generators, and more. All browser-based with zero data transmission.',
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

export default async function ToolsPage() {
  // This is the default English route (no locale prefix)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<div>Loading...</div>}>
        <ToolsHubContent />
      </Suspense>
    </div>
  );
}
