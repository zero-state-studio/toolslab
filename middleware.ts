/**
 * Next.js Middleware - OPTIMIZED FOR CPU EFFICIENCY
 *
 * OPTIMIZATIONS (May 2026, RIC-10):
 * - Removed Set-Cookie writes (NEXT_LOCALE, preferred-locale, vpn-mode):
 *   they forced `Cache-Control: private` on every response, disabling
 *   the Vercel/CDN cache and making middleware+function fire on every
 *   request. preferred-locale is still written client-side from
 *   lib/i18n/helpers.ts when the user changes locale; NEXT_LOCALE was
 *   never read; vpn-mode cache trades ~10µs regex for cache-private
 *   (terrible tradeoff).
 * - Removed www→apex redirect: next.config.js redirects() handles it at
 *   the Vercel edge routing layer before middleware runs (verified via
 *   curl: response is 308 from CDN, not 301 from middleware).
 * - Removed unused X-Request-URL header (no consumer in repo).
 *
 * PREVIOUS OPTIMIZATIONS (Jan 2025):
 * - Locale detection via direct if/else (no loop/callbacks)
 * - Static security headers moved to next.config.js
 * - Bot path: early return with minimal processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, type Locale } from '@/lib/i18n/config';

// ============================================================================
// PRE-COMPILED PATTERNS (cached at module level for performance)
// ============================================================================

// Pre-compiled private IP patterns for VPN detection
const PRIVATE_IP_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // Link-local
  /^127\./, // Localhost
];

// Pre-compiled VPN indicator patterns
const VPN_INDICATOR_PATTERNS = [
  /forticlient/i,
  /cisco/i,
  /checkpoint/i,
  /palo alto/i,
  /corporate[_\s]proxy/i,
  /zscaler/i,
  /netskope/i,
];

// Pre-compiled bot patterns (simplified for performance)
const SEARCH_ENGINE_BOTS =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp/i;
const KNOWN_BOTS = /bot|crawler|spider|scraper|curl|wget|python|java|php/i;

// ============================================================================
// LIGHTWEIGHT BOT DETECTION (no class instantiation)
// ============================================================================

function detectBot(userAgent: string): {
  isBot: boolean;
  isSearchEngine: boolean;
} {
  if (!userAgent) return { isBot: false, isSearchEngine: false };

  const isSearchEngine = SEARCH_ENGINE_BOTS.test(userAgent);
  const isBot = isSearchEngine || KNOWN_BOTS.test(userAgent);

  return { isBot, isSearchEngine };
}

// ============================================================================
// VPN DETECTION (optimized)
// ============================================================================

function detectCorporateVPN(
  forwardedFor: string | null,
  realIP: string | null,
  userAgent: string
): boolean {
  // Quick check: VPN indicators in user agent
  for (const pattern of VPN_INDICATOR_PATTERNS) {
    if (pattern.test(userAgent)) return true;
  }

  // Check IPs for private ranges
  const allIPs = [forwardedFor, realIP].filter(Boolean).join(',');
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(allIPs)) return true;
  }

  // Check for multiple forwarded IPs (proxy chain)
  if (forwardedFor && forwardedFor.split(',').length > 2) return true;

  return false;
}

// ============================================================================
// VPN-CONDITIONAL HEADERS (static headers moved to next.config.js)
// ============================================================================

function applyVPNHeaders(response: NextResponse, isVPN: boolean) {
  // Static headers (X-Content-Type-Options, X-DNS-Prefetch-Control,
  // Referrer-Policy, X-Frame-Options) are now in next.config.js.
  // Middleware only handles VPN-conditional overrides.
  if (isVPN) {
    response.headers.delete('Strict-Transport-Security');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Override config's DENY
    response.headers.set('X-VPN-Mode', 'true');
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
  } else {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
}

// ============================================================================
// MAIN MIDDLEWARE (streamlined)
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -------------------------------------------------------------------------
  // 1. Detect locale from pathname (direct checks, no loop/callbacks)
  // -------------------------------------------------------------------------
  let currentLocale: Locale = defaultLocale;

  if (pathname.startsWith('/it/') || pathname === '/it') {
    currentLocale = 'it';
  } else if (pathname.startsWith('/es/') || pathname === '/es') {
    currentLocale = 'es';
  } else if (pathname.startsWith('/fr/') || pathname === '/fr') {
    currentLocale = 'fr';
  } else if (pathname.startsWith('/de/') || pathname === '/de') {
    currentLocale = 'de';
  } else if (pathname.startsWith('/pt/') || pathname === '/pt') {
    currentLocale = 'pt';
  }

  // -------------------------------------------------------------------------
  // 2. Bot detection (lightweight)
  // -------------------------------------------------------------------------
  const userAgent = request.headers.get('user-agent') || '';
  const botDetection = detectBot(userAgent);

  if (botDetection.isBot) {
    // Minimal response for bots - just set essential headers
    const response = NextResponse.next();
    response.headers.set('X-Locale', currentLocale);
    response.headers.set('X-Bot-Detected', 'true');
    // Long public cache for bots — survives across crawls
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    );

    if (botDetection.isSearchEngine) {
      response.headers.set('X-Search-Engine', 'true');
    }

    return response;
  }

  // -------------------------------------------------------------------------
  // 3. VPN detection (no cookie cache — keeping `cache-control: public`
  //    is worth far more than the ~10µs of regex avoided per request)
  // -------------------------------------------------------------------------
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const isVPN = detectCorporateVPN(forwardedFor, realIP, userAgent);

  const response = NextResponse.next();

  // Set the locale header consumed by app/layout.tsx
  response.headers.set('X-Locale', currentLocale);

  // Apply VPN-conditional headers (static security headers are in next.config.js)
  applyVPNHeaders(response, isVPN);

  return response;
}

// ============================================================================
// MATCHER CONFIGURATION - CRITICAL FOR CPU OPTIMIZATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * ONLY match paths that NEED middleware processing:
     * - Homepage (locale detection)
     * - Tool pages (locale + analytics)
     * - Localized paths (it/, de/, fr/, es/, pt/)
     * - Core pages (about, lab, categories, blog, etc.)
     *
     * EXPLICITLY EXCLUDED (handled by Next.js directly):
     * - /_next/static/* (static assets)
     * - /_next/image/* (optimized images)
     * - /api/* (API routes - no locale needed)
     * - /sitemap*.xml (static files)
     * - /robots.txt (static file)
     * - /*.ico, /*.png, /*.svg (icons)
     * - /manifest.* (PWA manifests)
     */
    '/',
    '/tools/:path*',
    '/about',
    '/lab',
    '/categories',
    '/category/:path*',
    '/blog',
    '/blog/:path*',
    '/privacy',
    '/terms',
    '/coming-soon',
    '/maintenance',
    // Localized routes (covers all localized pages)
    '/it/:path*',
    '/de/:path*',
    '/fr/:path*',
    '/es/:path*',
    '/pt/:path*',
  ],
};
