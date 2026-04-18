# 02 — Tech Stack

## Core framework

- **Next.js 14.2** (App Router, React Server Components + Client Components hybrid)
- **React 18.3**
- **TypeScript 5.6** — strict mode on
- **Node ≥18.17**, npm ≥9

## Styling / UI

- **Tailwind CSS 3.4** + `tailwindcss-animate` + `prettier-plugin-tailwindcss`
- **Radix UI** primitives (dialog, dropdown, popover, scroll-area, select, separator, slot, switch, tabs, toast, tooltip)
- **shadcn/ui** patterns on top of Radix
- **lucide-react** icon set
- **framer-motion** for key motion moments (not decorative confetti)
- **next-themes** for dark mode
- `class-variance-authority` + `tailwind-merge` + `clsx` for variants

## State

- **Zustand 4.5** with `persist` middleware (localStorage)
- Two stores: `toolStore` (favorites, history, per-tool state) and `crontabStore`
- Hydration guarded by custom `useHydration` hook to avoid React error #425

## Validation / parsing

- **Zod 4** for runtime validation
- `dompurify` for HTML sanitization
- `js-yaml`, `yaml` for YAML
- `papaparse` for CSV
- `marked` / `turndown` / `turndown-plugin-gfm` for Markdown ↔ HTML
- `sql-formatter` for SQL
- `cron-parser` for cron
- `jwt-decode` for JWT (client-side only)

## Heavy utilities (loaded lazily)

- `pdf-lib`, `pdfjs-dist`, `jspdf` — PDF tools
- `jszip` — archives
- `html2canvas`, `qrcode`, `bwip-js` — image / barcode / QR
- `xlsx` — Excel
- `docx` — DOCX export
- `bcryptjs`, `crypto-js` — hashing (client-side)
- `date-fns`, `date-fns-tz` — dates / timezones

All heavy libs are code-split via `React.lazy` in `components/tools/LazyToolLoader.tsx`.

## Infra / ops

- **Hosting:** Vercel (Edge-optimized, Edge Config for runtime flags)
- **CDN:** Vercel edge network
- **Analytics:** Umami Cloud (privacy-respecting, cookieless) + Vercel Speed Insights
- **Error monitoring:** Sentry (mentioned in CLAUDE.md, verify in code)
- **IndexNow:** Bing/Yandex URL submission scripts
- **SEO scripts:** `scripts/seo-*.ts`, `scripts/generate-sitemap.ts`, `scripts/validate-hreflang.ts`, `scripts/audit-canonical.ts`

## Testing

- **Jest 29** + `@testing-library/react` 16 + jsdom
- **Playwright 1.58** for e2e
- Coverage targets: 80% branches/functions/lines/statements; 100% for formatter/validator/security-critical core

## Build / deploy

- `npm run build` — production build (prebuild cleans `.next`, `.vercel/output`, caches)
- `npm run build:prod` — with ads enabled
- Deploy: push to `main` triggers Vercel auto-deploy; `vercel --prod` for manual
- Desktop shell via **Tauri 2** — optional standalone app build (`npm run tauri:build`)

## Key constraints

- **Bundle per-tool contribution:** ≤50 KB gzipped target
- **Memory per tab:** ≤50 MB
- **Processing time:** <500 ms for inputs up to 100 KB
- **Initial load:** <1.5 s on 3G; TTI <2 s
- **No server-side user data processing** — this is a hard rule, not a preference

## Env / flags

- `NEXT_PUBLIC_ENABLE_ADS` — ethical ads on/off
- `NEXT_PUBLIC_ANALYTICS_ENABLED` — master switch for Umami
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- `NEXT_PUBLIC_UMAMI_DEBUG` — enables analytics debug panel
- `NEXT_PUBLIC_ANALYTICS_BATCH_SIZE` (default 5)
- `NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL` (default 1000 ms)
- Edge Config — runtime feature flags without redeploy
