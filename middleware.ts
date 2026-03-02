/**
 * Next.js Middleware - OPTIMIZED FOR CPU EFFICIENCY
 *
 * OPTIMIZATIONS (Jan 2025):
 * - VPN detection cached via cookie (12 regex only on first visit, 1h TTL)
 * - Locale detection via direct if/else (no loop/callbacks)
 * - Static security headers moved to next.config.js
 * - Locale cookie skipped if already correct
 * - Removed unused headers (X-Pathname, X-User-Country)
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
  const hostname = request.nextUrl.hostname;

  // -------------------------------------------------------------------------
  // 1. Domain canonicalization (immediate redirect)
  // -------------------------------------------------------------------------
  if (hostname === 'www.toolslab.dev') {
    const redirectUrl = new URL(request.nextUrl);
    redirectUrl.hostname = 'toolslab.dev';
    return NextResponse.redirect(redirectUrl, 301);
  }

  // -------------------------------------------------------------------------
  // 2. Detect locale from pathname (direct checks, no loop/callbacks)
  // -------------------------------------------------------------------------
  let currentLocale: Locale = defaultLocale;
  let pathnameHasLocale = false;

  if (pathname.startsWith('/it/') || pathname === '/it') {
    currentLocale = 'it';
    pathnameHasLocale = true;
  } else if (pathname.startsWith('/es/') || pathname === '/es') {
    currentLocale = 'es';
    pathnameHasLocale = true;
  } else if (pathname.startsWith('/fr/') || pathname === '/fr') {
    currentLocale = 'fr';
    pathnameHasLocale = true;
  } else if (pathname.startsWith('/de/') || pathname === '/de') {
    currentLocale = 'de';
    pathnameHasLocale = true;
  } else if (pathname.startsWith('/pt/') || pathname === '/pt') {
    currentLocale = 'pt';
    pathnameHasLocale = true;
  }

  // -------------------------------------------------------------------------
  // 3. Bot detection (lightweight)
  // -------------------------------------------------------------------------
  const userAgent = request.headers.get('user-agent') || '';
  const botDetection = detectBot(userAgent);

  if (botDetection.isBot) {
    // Minimal response for bots - just set essential headers
    const response = NextResponse.next();
    response.headers.set('X-Locale', currentLocale);
    response.headers.set('X-Bot-Detected', 'true');
    response.headers.set('Cache-Control', 'public, max-age=86400');
    // CRITICAL: Set X-Request-URL for bots too - needed for correct HTML lang attribute
    // Without this, SSR renders <html lang="en"> even on localized pages, causing hreflang mismatch
    response.headers.set('X-Request-URL', request.url);

    if (botDetection.isSearchEngine) {
      response.headers.set('X-Search-Engine', 'true');
    }

    return response;
  }

  // -------------------------------------------------------------------------
  // 4. VPN detection (cookie-cached to avoid regex on every request)
  // -------------------------------------------------------------------------
  const vpnCookie = request.cookies.get('vpn-mode');
  let isVPN: boolean;

  if (vpnCookie !== undefined) {
    // Cached result: skip all regex checks
    isVPN = vpnCookie.value === 'true';
  } else {
    // First visit: run full detection
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    isVPN = detectCorporateVPN(forwardedFor, realIP, userAgent);
  }

  const response = NextResponse.next();

  // Cache VPN detection result for 8 hours (typical work day)
  if (vpnCookie === undefined) {
    response.cookies.set('vpn-mode', String(isVPN), {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 28800,
    });
  }

  // Set essential headers (X-Request-URL used by app/layout.tsx for SSR locale)
  response.headers.set('X-Locale', currentLocale);
  response.headers.set('X-Request-URL', request.url);

  // Set locale cookie (skip if already correct to reduce response size)
  const existingLocale = request.cookies.get('NEXT_LOCALE');
  if (existingLocale?.value !== currentLocale) {
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  // Persistent language preference (only for non-default locales)
  if (pathnameHasLocale && currentLocale !== defaultLocale) {
    const preferredLocaleCookie = request.cookies.get('preferred-locale');
    if (preferredLocaleCookie?.value !== currentLocale) {
      response.cookies.set('preferred-locale', currentLocale, {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
      });
    }
  }

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
