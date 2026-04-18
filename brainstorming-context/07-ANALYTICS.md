# 07 — Analytics

## Stack

- **Umami Cloud** (cookieless, GDPR-friendly, lightweight)
- **Vercel Speed Insights** (Core Web Vitals)
- **Vercel Analytics** (page-level, via `@vercel/analytics`)

Sentry is referenced in CLAUDE.md but check codebase to confirm current status.

## Architecture: centralized + auto-tracking

Folder: `lib/analytics/`
- `config.ts` — env-driven toggles
- `core/` — event queue, batching
- `umami/` — Umami adapter
- `hooks/` — `usePageView`, etc.
- `helpers/` — bot detection, URL normalization, PII sanitization
- `middleware/` — request-side bot filtering

## Zero-boilerplate tool tracking

When a tool processes data, call `addToHistory()`. That's it. Everything else is automatic.

```ts
import { useToolStore } from '@/lib/store/toolStore';

const { addToHistory } = useToolStore();

const handleProcess = (input: string) => {
  const startTime = Date.now();       // ← must be BEFORE processing
  const output = processMyTool(input);

  addToHistory({
    id: crypto.randomUUID(),
    tool: 'my-tool',                  // must match lib/tools.ts id (kebab-case)
    input,
    output,
    timestamp: startTime,             // used to compute processingTime
  });

  return output;
};
```

Under the hood, `addToHistory` emits a `tool.use` event:

```
{
  event: 'tool.use',
  tool: 'json-formatter',
  inputSize:   <bytes>,
  outputSize:  <bytes>,
  processingTime: <ms>,      // Date.now() - timestamp
  success: true,
  userLevel: 'first_time' | 'returning' | 'power',
  locale: 'it',
  sessionId: 'abc-123',
  viewport: '1920x1080',
  isMobile: false,
  timestamp: 1234567890
}
```

**Gotcha:** `timestamp` must be when processing *starts*, not when it finishes — otherwise `processingTime ≈ 0`.

## Pageview normalization

All locale variants collapse into a single event identifier:

```
/tools/json-formatter        → event page: 'tool:json-formatter', locale: 'en'
/it/tools/json-formatter     → event page: 'tool:json-formatter', locale: 'it'
/es/tools/json-formatter     → event page: 'tool:json-formatter', locale: 'es'
```

Umami sees the same "tool slug" regardless of locale, with `locale` as a property. This enables accurate tool-level aggregation without per-locale duplicates.

## Batching + delivery

- Events batch by count (**default 5**) or time (**default 1 000 ms**), whichever first.
- Standard delivery: `fetch` to Umami Cloud endpoint.
- Critical delivery (e.g. `session.end`): `sendBeacon` — survives tab close / navigation. 97%+ browser coverage.
- **No retry logic.** `sendBeacon` is best-effort; retries would cause duplicates.

Result: ~80–90% reduction in network requests vs. per-event POST.

## PII sanitization

Every event passes through a sanitizer that strips:
- Email addresses
- IPv4 / IPv6 addresses
- Credit card numbers (Luhn-validated)
- API keys / tokens (common patterns)

Zero user-supplied content is ever sent to Umami. Input/output sizes are bytes only, never content.

## Bot detection

Client-side heuristics distinguish:
- **Benign bots** (search engines, Lighthouse, archive crawlers) — events pass through, marked
- **Malicious bots** (scrapers, credential stuffing) — events dropped client-side

## Debug panel

Add `?debug=analytics` to any URL → floating debug panel shows:
- Queue status (pending events, next flush in X ms)
- Session data (duration, pageviews, events, tools used)
- UmamiAdapter status (enabled, SDK ready)
- Manual flush button
- Config dump to console

Examples:
```
http://localhost:3000?debug=analytics
http://localhost:3000/tools/json-formatter?debug=analytics
```

## User segmentation

`userLevel` is computed client-side from persisted history:

| Level | Definition |
|-------|------------|
| `first_time` | No history entries |
| `returning` | 1–10 history entries |
| `power` | 10+ history entries |

Feeds Umami segment filters.

## Documentation index

Full docs in `documentation/analytics/`:
- `README.md` — overview
- `DEVELOPER_GUIDE.md` — how to add tracking to a new tool
- `ARCHITECTURE.md` — design decisions, tradeoffs
- `PAGEVIEW_TRACKING.md` — PageViewTracker internals, UTM

## Configuration

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true          # master switch
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id>
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_DEBUG=true                # debug logs
NEXT_PUBLIC_ANALYTICS_BATCH_SIZE=5
NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL=1000
```

Toggle master switch to `false` for complete disable (no script, no events, no fingerprint).

## What to track, what NOT to track

**Track:**
- Tool usage (auto via `addToHistory`)
- Page views (auto via layout-level tracker)
- Core Web Vitals (Vercel Speed Insights)
- Error rate per tool (aggregated, no message content)

**Don't track:**
- User inputs or outputs (PII / compliance / trust)
- Session recordings (no Hotjar / FullStory — too intrusive)
- Cross-tool identity linking (no fingerprinting)
- Anything requiring cookies for individual identification
