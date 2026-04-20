# 05 — SEO Strategy

## Philosophy

Two-layer SEO:

1. **Head keywords** (`json formatter`, `qr generator`) — lose to incumbents on authority. Don't fight head-on; compete via technical quality + UX + page-speed.
2. **Long-tail keywords** (`how to format minified json for api responses online free`) — own the tail. Every tool ships with 12 locale-specific long-tail keywords driving contextual content.

The long-tail approach compounds: more tools × 6 locales × 12 tails = 4 800+ targeted phrases.

## Sitemap architecture

**Static per-locale sitemaps** at `public/sitemap-<locale>.xml` — 6 files, one per language.

Each tool has an entry in **every** locale sitemap, with full 7-entry `xhtml:link` hreflang block:
- `en`, `it`, `es`, `fr`, `de`, `pt`, `x-default`

Priority tiers:

| Item | Priority |
|------|----------|
| Homepage | 1.0 |
| Featured tools (high-SV + popular) | 0.9 |
| Standard tools | 0.8 |
| Category pages | 0.7 |
| About / blog / static | 0.6 |

**Rule:** priority 0.8 is the default for tool entries. 0.9 reserved for editorial featured. 0.7 shown in practice but should be bumped when auditing (RIC-26 for json-formatter bumped 0.7→0.8).

## Hreflang discipline

Every tool URL appears in every locale sitemap with a complete alternate set. Canonical = the URL for the current locale.

Scripts:
- `npm run validate:hreflang` — checks bidirectionality
- `npm run audit:canonical` — verifies canonical matches the locale
- `npm run validate:links` — internal link integrity

## Schema.org JSON-LD

File: `lib/tool-schema.ts`. Generated server-side, injected as `<script type="application/ld+json">`.

For every tool page:

```
@graph = [
  WebApplication {
    name, description, url,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: <categoryId>,
    offers: { price: 0 },
    aggregateRating: { ratingValue: 4.8, ratingCount: <deterministic> },
    keywords: [...tool.keywords, ...tool.longTailKeywords].join(', '),
    inLanguage: <locale>,
    featureList: <tagline>,
    author: Organization(ToolsLab),
    mainEntityOfPage: <url>
  },
  BreadcrumbList (Home > Tools > Category > Tool),
  FAQPage (5 canned Q&As covering: free?, secure?, offline?, account?, how-to?),
  SoftwareApplication (coverage alias)
]
```

**Deterministic rating count:** hash of tool ID mapped to 150–850. Avoids hydration drift.

## Metadata per tool (per locale)

Lives inside `lib/i18n/dictionaries/<locale>/tools/<tool-id>.json`:

| Field | Purpose | Constraint |
|-------|---------|------------|
| `title` | `<h1>` / tab title piece | ≤60 char |
| `description` | above-the-fold subtitle | 1 line |
| `placeholder` | input textarea placeholder | short, imperative |
| `meta.title` | `<title>` HTML | ≤60 char |
| `meta.description` | `<meta name="description">` | ≤160 char |
| `tagline` | action verb + tool function + benefit | 8–12 words |
| `pageDescription` | hero paragraph + also fed into schema | 30–70 words |
| `longTailKeywords` | 12 locale-specific long-tails | each 4–10 words |
| `instructions.*` | steps, features, useCases, proTips, troubleshooting, keyboardShortcuts | tool-specific |

Note: `lib/tool-seo.ts` referenced in older CLAUDE.md **does not exist**. All SEO metadata is in i18n dictionaries.

## Long-tail keyword system

Also stored in `lib/tools.ts` at the tool entry (EN-centric, fed into schema.org keywords). Six-locale variants live in the i18n dictionaries.

Template patterns observed in the codebase:

| Slot | Example (EN) |
|------|--------------|
| `<tool> online free no signup` | `json formatter online free no signup` |
| `convert <x> <y> online free no registration` | `convert csv to json online free no registration` |
| `<tool> free instant online` | `json beautifier online free instant` |
| `how to <verb> <object> online` | `how to format minified json online` |
| `<tool> with <feature> free` | `json formatter with syntax highlighting free` |
| `best free <tool> online` | `best free json formatter and validator online` |
| `<tool> for <use case>` | `json validator and formatter for api responses` |
| `<tool> without installing <alt>` | `format json without installing code editor` |

## IndexNow pipeline

Bing + Yandex URL submission on every deploy:
- `scripts/indexnow-submit.js` — single URL
- `scripts/indexnow-bulk.js` — whole sitemap
- `scripts/indexnow-stats.js` — submission analytics

Key is stored as a file at `public/<indexnow-key>.txt` (generated via `seo:generate-key`).

## Canonical rules

- Default locale (`en`) → no locale prefix in canonical: `https://toolslab.dev/tools/<id>`
- Non-default → prefixed: `https://toolslab.dev/<locale>/tools/<id>`
- Each canonical self-references; `x-default` hreflang points to EN.

## OG / Twitter images

Generated dynamically per tool via:
- `app/[locale]/tools/[tool]/opengraph-image.tsx`
- `app/[locale]/tools/[tool]/twitter-image.tsx`

Test: `npm run test:og-images` (and `:prod` variant).

## SEO audit ritual

Triggered per tool via the `seo-audit` skill. Scope:
1. Sitemap presence + priority + hreflang
2. Canonical
3. Schema JSON-LD validity
4. Meta length + keyword presence
5. OG/Twitter coverage
6. Core Web Vitals trend
7. Internal link coverage (Related Tools)

Full audit passes = green tool. RIC-26 (JSON Formatter) was the first full-audit pilot.

## Known weaknesses

- **Rating values** are hardcoded to 4.8 / 150–850 count. Google may eventually flag this as gamed.
- **Blog** is under-leveraged as a long-tail amplifier; see `documentation/BLOG-STRUCTURE.md`.
- **No programmatic SEO pages** yet for `<tool> vs <competitor>` or `<tool> + <use-case>` templates — big unexplored vector.
- **Internal linking** between related tools is template-driven, not semantically personalized.
