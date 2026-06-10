import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { UmamiProvider } from '@/components/analytics/UmamiProvider';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { ToastProvider } from '@/components/providers/ToastProvider';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Analytics Debug Panel (only in development)
const AnalyticsDebugPanel = dynamic(
  () => import('@/components/analytics/AnalyticsDebugPanel'),
  {
    ssr: false,
  }
);

import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { UpdateNotification } from '@/components/UpdateNotification';
// import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { cn } from '@/lib/utils';
import { HtmlLangUpdater } from '@/components/HtmlLangUpdater';

// Geist isn't in `next/font/google` types yet; Inter is our close fallback.
const geist = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-geist',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read locale from the X-Locale header set by middleware.
  // This ensures the SSR HTML has the correct lang attribute for all locales,
  // which is required for hreflang/html-lang consistency (Ahrefs, Google, etc.).
  const locale = headers().get('x-locale') ?? 'en';
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* DNS prefetch for faster subsequent requests */}
        <link rel="dns-prefetch" href="https://toolslab.dev" />
        <link rel="preconnect" href="https://toolslab.dev" />
        {/* Umami analytics endpoints */}
        <link rel="dns-prefetch" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://cloud.umami.is" crossOrigin="" />
      </head>
      <body
        className={cn(
          geist.variable,
          jetbrainsMono.variable,
          'min-h-screen font-sans antialiased'
        )}
      >
        <HtmlLangUpdater />
        <UmamiProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            <ScrollToTop />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <UpdateNotification />
            <ToastProvider />
            <AnalyticsDebugPanel />
          </ThemeProvider>
        </UmamiProvider>
        {/* <SpeedInsights /> */}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* Ahrefs Analytics - loaded after page is interactive */}
        {process.env.NODE_ENV === 'production' &&
          process.env.NEXT_PUBLIC_AHREFS_KEY && (
            <Script
              src="https://analytics.ahrefs.com/analytics.js"
              data-key={process.env.NEXT_PUBLIC_AHREFS_KEY}
              strategy="lazyOnload"
            />
          )}
        {/* Google AdSense - consent handled by Google CMP (Privacy & messaging) */}
        {/* lazyOnload: ads must not compete with hydration for mobile CPU/bandwidth (INP) */}
        {process.env.NEXT_PUBLIC_ENABLE_ADS === 'true' &&
          process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
            <Script
              id="adsbygoogle-init"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
              strategy="lazyOnload"
              crossOrigin="anonymous"
            />
          )}
      </body>
    </html>
  );
}
