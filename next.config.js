/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf.js ships modern ESM that Next/webpack does not transpile by default,
  // causing "Object.defineProperty called on non-object" at module init.
  // Transpiling the package through the Next compiler fixes the interop.
  transpilePackages: ['pdfjs-dist'],

  // IMPORTANTE: Disabilita features sperimentali che causano problemi di cache
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['better-sqlite3'],
  },

  // Disable static export for now - use dev mode for Tauri
  // TODO: Configure proper static export for Tauri production builds

  // Forza pulizia della directory di build
  cleanDistDir: true,
  distDir: '.next',

  // Abilita ETags per caching efficiente
  generateEtags: true,
  poweredByHeader: false,
  compress: true,

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Ottimizzazioni
  swcMinify: true,
  productionBrowserSourceMaps: false,

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // Webpack config per escludere file problematici
  webpack: (config, { isServer, dev }) => {
    // Ignora file di cache
    config.module.rules.push({
      test: /\.tsbuildinfo$/,
      loader: 'ignore-loader',
    });

    // Non generare source maps in produzione
    if (!dev) {
      config.devtool = false;
    }

    // Ensure proper module resolution for Vercel
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = require('path').resolve(__dirname);

    // pdf.js (pdfjs-dist) optionally requires the Node "canvas" package;
    // in the browser build it must be disabled or bundling breaks
    // ("Object.defineProperty called on non-object").
    config.resolve.alias.canvas = false;

    return config;
  },

  // Redirects
  async redirects() {
    return [
      // www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.toolslab.dev',
          },
        ],
        destination: 'https://toolslab.dev/:path*',
        permanent: true, // 301 redirect
      },
      // Sitemap index legacy redirect
      {
        source: '/sitemap-index.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
    ];
  },

  // Headers personalizzati
  async headers() {
    return [
      // Tool pages - fully static (SSG), long CDN cache
      // Vercel invalidates CDN on each deploy, so 1-year cache is safe
      {
        source: '/tools/:tool',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=31536000, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
      // Localized tool pages - same caching
      {
        source: '/:locale/tools/:tool',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=31536000, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
      // Static assets - immutable caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // PWA manifest - cache for 7 days (rarely changes)
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      // Favicons and icons - cache for 6 months
      {
        source:
          '/(favicon.ico|favicon.svg|apple-touch-icon.png|favicon-:size.png|icon-:size.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=15552000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Compression headers for dictionary API
      {
        source: '/api/dictionary/:locale',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Static dictionary files (if served directly)
      {
        source: '/dictionaries/:locale/:section.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
