import { Suspense } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { UmamiProvider } from '@/components/analytics/UmamiProvider';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { Header } from '@/components/layout/Header';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { UpdateNotification } from '@/components/UpdateNotification';
import { Analytics } from '@vercel/analytics/next';
import { cn } from '@/lib/utils';
import { HtmlLangUpdater } from '@/components/HtmlLangUpdater';

// Analytics Debug Panel (only in development)
const AnalyticsDebugPanel = dynamic(
  () => import('@/components/analytics/AnalyticsDebugPanel'),
  {
    ssr: false,
  }
);

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

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const adsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ADS === 'true' && Boolean(adsenseClient);

// Google's official snippet: announces to the AdSense tag that Funding Choices
// is already loading, so it doesn't fetch a second copy. Runs from <head>, where
// document.body may not exist yet, hence the retry.
const GOOGLEFC_PRESENT_SIGNAL = `(function(){function s(){if(!window.frames['googlefcPresent']){if(document.body){var i=document.createElement('iframe');i.style='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px';i.style.display='none';i.name='googlefcPresent';document.body.appendChild(i);}else{setTimeout(s,0);}}}s();})();`;

/**
 * Shared <html>/<body> shell used by both root layouts.
 *
 * The lang attribute comes from the owning root layout: hardcoded 'en' for the
 * unprefixed tree, params.locale for app/[locale]. No dynamic API (headers())
 * is involved, so every page can be statically prerendered — reading the
 * X-Locale header here previously forced the whole app to dynamic rendering.
 */
export async function RootDocument({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  // Server-side common dictionary so the Header SSR-renders localized nav
  // (its client hook only resolves after hydration — without this the static
  // HTML always contained the English fallbacks).
  const commonDict = await getDictionary(lang as Locale, ['common'])
    .then((d) => d.common)
    .catch(() => undefined);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* DNS prefetch for faster subsequent requests */}
        <link rel="dns-prefetch" href="https://toolslab.dev" />
        <link rel="preconnect" href="https://toolslab.dev" />
        {/* Umami analytics endpoints */}
        <link rel="dns-prefetch" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://cloud.umami.is" crossOrigin="" />
        {adsEnabled && (
          <>
            <link
              rel="preconnect"
              href="https://fundingchoicesmessages.google.com"
            />
            <link
              rel="preconnect"
              href="https://pagead2.googlesyndication.com"
            />
            <link
              rel="dns-prefetch"
              href="https://googleads.g.doubleclick.net"
            />
            {/* Google Funding Choices (consent CMP), loaded here instead of
                being pulled in by adsbygoogle.js on window.load.

                The consent dialog is the biggest thing on screen, so whenever
                it paints it becomes the LCP element. Behind lazyOnload it
                painted at ~2.5s on every page — which is exactly the field LCP
                Search Console reported for all 104 URLs. Its script was also
                the whole of the 610ms main-thread block that landed right when
                users start clicking (INP). Loading it async from <head> starts
                the chain during HTML parse instead of after load, without ever
                blocking first paint. The ad script itself stays lazyOnload. */}
            <script
              async
              src={`https://fundingchoicesmessages.google.com/i/${adsenseClient}?ers=1`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: GOOGLEFC_PRESENT_SIGNAL,
              }}
            />
          </>
        )}
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
              <Header initialCommon={commonDict} />
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
