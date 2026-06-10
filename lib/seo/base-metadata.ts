import type { Metadata } from 'next';

/**
 * Base metadata shared by both root layouts (app/(en)/layout.tsx and
 * app/[locale]/layout.tsx). With multiple root layouts nothing is inherited
 * across them, so locale layouts must spread this and override title,
 * description and alternates.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL('https://toolslab.dev'),
  title: {
    default: 'ToolsLab - Laboratory for Developer Tools',
    template: '%s | ToolsLab',
  },
  description:
    'Your Laboratory for Developer Tools - Experiment, Chain, Optimize. Free online tools for developers including JSON formatter, Base64 encoder, JWT decoder, UUID generator and more.',
  keywords: [
    'developer tools',
    'online tools',
    'json formatter',
    'base64 encoder',
    'url encoder',
    'jwt decoder',
    'uuid generator',
    'hash generator',
    'password generator',
    'regex tester',
    'crontab builder',
    'free tools',
    'web tools',
    'laboratory',
    'toolslab',
  ],
  authors: [{ name: 'ToolsLab' }],
  creator: 'ToolsLab',
  publisher: 'ToolsLab',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://toolslab.dev',
    title: 'ToolsLab - Laboratory for Developer Tools',
    description:
      'Your Laboratory for Developer Tools - Experiment, Chain, Optimize. Free online tools for developers.',
    siteName: 'ToolsLab',
    images: [
      {
        url: '/opengraph-image.png', // Next.js generates this automatically
        width: 1200,
        height: 630,
        alt: 'ToolsLab - Laboratory for Developer Tools',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'ToolsLab - Laboratory for Developer Tools',
    description:
      'Your Laboratory for Developer Tools - Free online tools for developers',
    creator: '@toolslab', // Replace with actual handle if you have one
    images: ['/opengraph-image.png'],
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

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  verification: {
    // google: 'your-google-verification-code', // Replace with actual verification code
    other: {
      'msvalidate.01': 'A915DC41215EC56805DD7990E7B00EE4',
    },
  },

  alternates: {
    canonical: 'https://toolslab.dev',
  },

  manifest: '/manifest.webmanifest',

  category: 'technology',
};
