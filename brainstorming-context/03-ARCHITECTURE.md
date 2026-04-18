# 03 — Architecture

## Top-level folder map

```
toolslab/
├── app/                      # Next.js App Router
│   ├── [locale]/             # Localized routes (it/es/fr/de/pt)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Localized homepage
│   │   ├── tools/[tool]/     # Localized dynamic tool page
│   │   ├── categories/, category/, blog/, about/, lab/, …
│   │   └── admin/            # Edge Config admin panel
│   ├── tools/[tool]/         # EN dynamic tool page (no locale prefix)
│   ├── api/                  # API routes (e.g. IndexNow endpoints)
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # EN homepage
│   └── globals.css
├── components/
│   ├── tools/
│   │   ├── implementations/  # ~58 per-tool React components
│   │   ├── LazyToolLoader.tsx
│   │   └── ToolLayout.tsx
│   ├── layout/               # Header, footer, nav, lab hub
│   ├── lab/                  # Favorites, sidebar, welcome popup
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── tools.ts              # Single-source-of-truth registry (69 tools + 10 categories)
│   ├── tool-schema.ts        # schema.org JSON-LD generator
│   ├── tool-icons.ts
│   ├── tools/                # Pure processing functions (testable units)
│   ├── i18n/
│   │   ├── config.ts         # Locale types, names, flags
│   │   ├── get-dictionary.ts
│   │   ├── load-tools.ts     # Per-tool translation loader
│   │   ├── helpers.ts
│   │   └── dictionaries/{en,it,es,fr,de,pt}/tools/*.json
│   ├── store/                # Zustand stores
│   ├── analytics/            # Umami adapter, event queue, bot detection
│   ├── hooks/                # useHydration, useScrollToResult, …
│   ├── edge-config/
│   └── seo/                  # schema-factory, hreflang utils
├── public/
│   ├── sitemap-{en,it,es,fr,de,pt}.xml  # Static per-locale sitemaps
│   ├── robots.txt
│   └── icon-*.png
├── scripts/                  # SEO/sitemap/indexnow CLI scripts (tsx)
├── __tests__/                # Jest tests (unit/integration/e2e)
├── documentation/            # Project docs (TOOL_DEVELOPMENT.md, roadmap, plans, specs)
├── brainstorming-context/    # ← THIS FOLDER (context for external AIs)
└── .claude/                  # Claude Code config (agents, skills, settings)
```

## Routing: the dynamic tool system (critical)

**Every tool is served by the same dynamic route** — not by a dedicated `app/tools/<tool-id>/page.tsx`.

- EN: `app/tools/[tool]/page.tsx` handles `toolslab.dev/tools/<tool-id>`
- Localized: `app/[locale]/tools/[tool]/page.tsx` handles `toolslab.dev/{it,es,fr,de,pt}/tools/<tool-id>`

Flow per request:
1. Route extracts `<tool-id>` and `<locale>` params.
2. `getToolById(toolId)` reads from `lib/tools.ts`.
3. `loadToolTranslation(locale, toolId)` reads `lib/i18n/dictionaries/<locale>/tools/<tool-id>.json` (falls back to `en` on miss).
4. Metadata (title, description, canonical, hreflang alternates, OG/Twitter) generated in `generateMetadata`.
5. `generateToolSchema(toolId, locale)` emits JSON-LD graph (`WebApplication` + `BreadcrumbList` + `FAQPage` + `SoftwareApplication`).
6. `ToolPageClient` renders the layout; actual tool UI is lazy-loaded via `LazyToolLoader.tsx`.

**⚠️ Hard rule:** never create dedicated tool pages. Any attempt to do so breaks the lazy-loading contract and introduces metadata drift.

## State model

Two Zustand stores:

```ts
// lib/store/toolStore.ts
useToolStore: {
  favoriteTools: string[]
  history: HistoryEntry[]       // tool, input, output, timestamp
  toolState: Record<string, any>
  addToHistory(entry) → triggers Umami auto-tracking
  toggleFavorite(toolId)
  …
}
```

Both stores use `persist` middleware with localStorage. **Every consumer must guard with `useHydration()`** or React error #425 fires in production (and data vanishes on refresh).

Pattern:
```tsx
const isHydrated = useHydration();
const { favoriteTools } = useToolStore();
const safe = isHydrated ? favoriteTools : [];
```

## Tool registry contract (`lib/tools.ts`)

Single source of truth. Used by:
- Sitemap generator
- Schema JSON-LD
- Category pages
- Search / related-tools logic
- Lab (favorites, recent)
- Metadata generation

```ts
interface Tool {
  id: string;                 // kebab-case, matches dictionary filename
  name: string;
  description: string;
  icon: string;               // emoji
  route: string;              // always /tools/<id>
  categories: string[];       // 1..N from 10 known category IDs
  keywords: string[];
  longTailKeywords?: string[];
  searchVolume: number;       // monthly
  label?: '' | 'popular' | 'coming-soon' | 'test';
  isNew?: boolean;
}
```

Helper functions: `getToolById`, `getToolsByCategory`, `searchTools`, `getPopularTools`, `getCategoryByTool`.

## Per-tool file contract

For a tool `foo-bar`:

```
lib/tools/foo-bar.ts                          # Pure processor: processFooBar(input): ToolResult
components/tools/implementations/FooBar.tsx   # React UI
lib/i18n/dictionaries/{en,it,es,fr,de,pt}/tools/foo-bar.json  # Translations
components/tools/LazyToolLoader.tsx           # Lazy registration entry
lib/i18n/load-tools.ts                        # toolIds[] registration (MUST include the id)
lib/tools.ts                                  # Tool entry in the registry
public/sitemap-*.xml                          # Static sitemap entry (priority 0.8 for standard)
```

Skipping any of these = runtime fallback to English, missing sitemap, or broken schema.

## Hydration discipline

Components that touch `useToolStore` or `useCrontabStore` MUST:
1. Import `useHydration`
2. Gate reads with `isHydrated ? storeValue : safeDefault`
3. Inside `useEffect`, early-return if `!isHydrated`

Non-compliance = React #425 hydration mismatch in production.

## Lazy loading strategy

`LazyToolLoader.tsx` maps every tool ID → `React.lazy(() => import(…))`. The dynamic page wraps the lazy component in `<Suspense fallback={<ToolSkeleton />}>`. Heavy deps (pdf-lib, xlsx, pdfjs-dist) are tree-shaken into per-tool chunks.

## Auto-scroll to result

Every tool with visible output MUST use `useScrollToResult({ onlyIfNotVisible: false })` + trigger via `useEffect` on output change. Calling `scrollToResult()` directly after `setState` is unreliable (React hasn't flushed DOM).

## Sitemap generation

Two modes:
- **Runtime** (`app/sitemap.ts` if present) — dynamic at build
- **Static** (`public/sitemap-*.xml`) — per-locale files, manually curated

Current state: **static** per-locale files are the source of truth. Scripts `sitemap:generate` / `sitemap:validate` / `validate:hreflang` / `audit:canonical` keep them honest.

## Schema JSON-LD

`lib/tool-schema.ts → generateToolSchema(toolId, locale)` returns `@graph` with:
- `WebApplication` (main entity, with aggregateRating, offers, keywords)
- `BreadcrumbList` (Home → Tools → Category → Tool)
- `FAQPage` (5 canned Q&As)
- `SoftwareApplication` (coverage alias)

Injected server-side as `<script type="application/ld+json">` in `app/[locale]/tools/[tool]/page.tsx` line ~343.
