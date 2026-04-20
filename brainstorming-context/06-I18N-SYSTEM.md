# 06 — i18n System

## Locale matrix

| Locale | Code | Flag | URL form | Dictionary dir |
|--------|------|------|----------|----------------|
| English (default) | `en` | 🇬🇧 | `/tools/<id>` (no prefix) | `lib/i18n/dictionaries/en/` |
| Italian | `it` | 🇮🇹 | `/it/tools/<id>` | `lib/i18n/dictionaries/it/` |
| Spanish | `es` | 🇪🇸 | `/es/tools/<id>` | `lib/i18n/dictionaries/es/` |
| French | `fr` | 🇫🇷 | `/fr/tools/<id>` | `lib/i18n/dictionaries/fr/` |
| German | `de` | 🇩🇪 | `/de/tools/<id>` | `lib/i18n/dictionaries/de/` |
| Portuguese | `pt` | 🇵🇹 | `/pt/tools/<id>` | `lib/i18n/dictionaries/pt/` |

Planned (`futureLocales` in config): `nl`, `pl`, `tr`.

## Hard rules

1. **Tool slug is never translated.** `/tools/json-formatter` in every locale — only the content inside the page changes.
2. **Default locale has no prefix.** `toolslab.dev/tools/X` is the EN canonical.
3. **Fallback is always English.** If `<locale>/<tool>.json` is missing a field, loader falls back to `en/<tool>.json` field-by-field (`lib/i18n/load-tools.ts`).
4. **Tool must be registered in `lib/i18n/load-tools.ts` `toolIds[]`** — otherwise translations never load even if the JSON exists. This is the #1 gotcha.

## Dictionary file schema

Per-tool JSON in `lib/i18n/dictionaries/<locale>/tools/<tool-id>.json`:

```jsonc
{
  "title": "Tool Name",
  "description": "Short 1-liner under the title",
  "placeholder": "Input hint",
  "meta": {
    "title": "SEO <title> (≤60 char)",
    "description": "SEO meta description (≤160 char)"
  },
  "tagline": "Action verb + function + benefit (8-12 words)",
  "pageDescription": "Hero paragraph (30-70 words), also feeds schema.org",
  "longTailKeywords": [
    "12 locale-specific long-tail phrases"
  ],
  "instructions": {
    "title": "How to use …",
    "steps": [{ "title": "", "description": "" }],         // 3-5
    "features": ["…"],                                      // 4-8
    "useCases": ["…"],                                      // 5-8
    "proTips": ["…"],                                       // 4-6
    "troubleshooting": ["…"],                               // 3-5
    "keyboardShortcuts": [                                  // optional
      { "keys": "Ctrl+C", "description": "…" }
    ]
  },
  "labels": { "<button|field>": "<translated-label>" },     // tool-specific
  "messages": { "<key>": "<translated-message>" },          // tool-specific
  "options": { "<option>": "<translated-option>" }          // tool-specific
}
```

Some older tool dictionaries lack `placeholder` or `longTailKeywords`. Recent fixes (RIC-5, RIC-26) plugged those gaps for IT and EN respectively. An audit skill `/i18n-check` flags all remaining gaps.

## Top-level dictionary (non-tool UI)

Also in `lib/i18n/dictionaries/<locale>.json` — covers navigation, footer, homepage, category pages, Lab, etc. Loaded via `lib/i18n/get-dictionary.ts`.

## How translations reach the page

Flow on a request to `/it/tools/json-formatter`:

1. Middleware / layout determines `locale = 'it'`.
2. `loadToolTranslation('it', 'json-formatter')` dynamic-imports the JSON.
3. If missing → warn, fall back to `en`.
4. Passed as `dictionary` prop into `ToolPageClient`.
5. `generateMetadata` reads `meta.title` / `meta.description` from the dictionary.
6. `generateToolSchema('json-formatter', 'it')` uses localized `pageDescription` + `tagline` + tool keywords.

## Adding a new tool translation

Checklist (see also `08-DEVELOPMENT-WORKFLOW.md`):

1. Create 6 JSON files — one per locale — in `lib/i18n/dictionaries/<locale>/tools/<id>.json`.
2. Add `<id>` to `lib/i18n/load-tools.ts` `toolIds[]`.
3. Add the tool to `lib/tools.ts`.
4. Run `/i18n-check` skill to confirm.
5. Run `npm run validate:hreflang`.
6. Update sitemaps.

## Adding a new locale

1. Add to `Locale` type union in `lib/i18n/config.ts`.
2. Add to `locales`, `localeNames`, `localeFlags`, `localeToOGLocale`.
3. Create `lib/i18n/dictionaries/<new-locale>.json` (top-level UI).
4. Create `lib/i18n/dictionaries/<new-locale>/tools/*.json` — one per tool.
5. Create `public/sitemap-<new-locale>.xml`.
6. Update `public/robots.txt` if needed.

## Known patterns and gotchas

- **Component-level i18n:** don't hardcode strings in implementations. Pass `dictionary` or use helper hooks.
- **Keyboard shortcut localization:** German uses `Strg` instead of `Ctrl`; keep per-locale.
- **Number / date formatting:** use `Intl.NumberFormat` / `Intl.DateTimeFormat` with the locale code.
- **RTL:** not currently supported. Arabic / Hebrew in `futureLocales` would require CSS + layout audit.
- **Locale switcher:** `components/LanguageSwitcher.tsx` (or similar in `components/layout/`). Preserves the current tool slug when switching.

## Skill: `/i18n-check`

Runs across all 6 locales × all registered tools, reports:
- Missing dictionary files
- Missing fields within existing dictionaries
- Tools not in `load-tools.ts`
- Over-length `meta.title` / `meta.description`

Run before every deploy or after batch tool edits.
