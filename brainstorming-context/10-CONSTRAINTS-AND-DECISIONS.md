# 10 — Constraints and Decisions

Non-negotiables, anti-patterns, and the reasoning behind them. Violating these is expensive in time or reputation.

## Hard non-negotiables

### 1. Client-side only for user data
No user-supplied content (input, output, parsed result) ever leaves the browser. This is both a product promise ("private by default") and a compliance choice (no GDPR data-flow complications, no breach risk surface).

**Implication:** any feature requiring server-side data processing must either (a) be redesigned as client-side or (b) involve a clear UX-level consent step and a separate business justification.

### 2. No signups, no accounts, no paywalls
Everything stays free. "Power user" features (favorites, history, lab) are stored in `localStorage` — no server-side account model.

**Implication:** no SSO, no user table, no auth middleware. Personalization is per-browser-per-device only.

### 3. Unified dynamic routing for tools
All tools served by `app/tools/[tool]/page.tsx` (EN) and `app/[locale]/tools/[tool]/page.tsx` (other locales). No dedicated per-tool pages.

**Reason:** consistent metadata generation, unified lazy-loading, single source of schema/hreflang. Every time somebody created a dedicated page in the past, metadata drift + build breakage followed.

### 4. Single source of truth: `lib/tools.ts`
Tool metadata (id, name, description, categories, keywords, searchVolume, etc.) lives in exactly one place. Do NOT duplicate into `data/`, `db/`, or sibling files.

**Reason:** sitemap, schema, search, category pages, and Lab all read from it.

### 5. Hydration discipline with Zustand
Every component reading from `useToolStore` or `useCrontabStore` must gate with `useHydration()`. Skipping this = React #425 in production + data disappearing on refresh.

### 6. No `label: 'new'`
Default label is `''`. `'popular'` only when editorially promoted; `'coming-soon'` only for placeholders; `'test'` never in production lists.

### 7. SEO defaults
- Sitemap priority 0.8 for standard tools, 0.9 featured, 1.0 homepage
- Every tool URL present in every locale sitemap with full hreflang block (7 alternates)
- Canonical always locale-specific, x-default points to EN
- Schema JSON-LD emitted for every tool page (4-item @graph)

### 8. Commit + PR discipline
- Commit subject: `<type>(<scope>): <subject> [RIC-<id>]`
- Never skip hooks or GPG signing without explicit user permission
- Never force-push to `main` or `development`
- Create new commits instead of `--amend` on published work

### 9. No interpreter / code-exec allowlists
In Claude Code settings, never allowlist `python3`, `node -e`, `npx`, `bash -c`, etc. These are arbitrary code execution risks. Narrow exact-command allowlists are acceptable.

## Architectural decisions (ADR-ish)

### ADR-1 — Static per-locale sitemaps over dynamic `app/sitemap.ts`
**Why:** deterministic output, diffable in git, easy to audit via scripts. Trade-off: manual entry when adding a new tool, but the `/new-tool` skill + checklist makes this an accepted cost.

### ADR-2 — Umami Cloud over self-hosted Plausible/Matomo
**Why:** zero infra operation burden, cookieless by default, cheap. Trade-off: less control over data retention; mitigated by aggressive PII sanitization + not sending user content ever.

### ADR-3 — Long-tail keywords in both `lib/tools.ts` (EN) and i18n dicts (all locales)
**Why:** EN version feeds schema.org `keywords` (one canonical source); per-locale versions drive localized content visibility. Duplicated data, but read by different consumers.

### ADR-4 — Zustand + `persist` over Redux or context-only state
**Why:** minimal boilerplate, good DX, persistence out-of-the-box. Trade-off: hydration discipline required (see constraint 5).

### ADR-5 — Tailwind + Radix over Material / Chakra / full component kits
**Why:** style control, smaller bundle, accessibility baked into Radix primitives. Consistent with shadcn/ui patterns.

### ADR-6 — Dedicated `brainstorming-context/` folder over `documentation/brainstorming/`
**Why:** distinguishability. `/documentation/` is for the project itself; this folder is a snapshot for external AI collaborators. Making it a sibling signals different purpose.

### ADR-7 — Tauri for optional desktop app over Electron
**Why:** smaller bundle, native perf, Rust-backed IPC, same Next.js codebase. Trade-off: smaller ecosystem than Electron, but acceptable.

### ADR-8 — 6 active locales, not 10+
**Why:** translation quality over quantity; each locale needs full meta/tagline/pageDescription/longTails per tool. Scaling to 10 locales would 10x the content debt without proportional traffic gain.

## Anti-patterns (things we consciously DON'T do)

| Anti-pattern | Why avoided |
|--------------|-------------|
| Tracking user input content | Privacy promise + trust |
| Newsletter popups / email gates | UX quality > lead volume |
| Dark-pattern cookie banners | Ethical choice + cookieless stack makes them unnecessary |
| Feature flags that silently change UX | Users on ToolsLab expect stable behavior across sessions |
| Server-side tool processing for "convenience" | Would destroy the core "private" positioning |
| Multi-paragraph code comments | Naming is the primary contract; comments rot |
| Creating docs files unprompted | Documentation should earn its place, not accumulate |
| Premature abstractions (ThemeProvider4000) | 3 similar lines > 1 custom abstraction |
| Global error boundaries swallowing all errors | Hides real bugs; prefer scoped boundaries |
| Running interpreters in Claude auto-allow | Arbitrary code execution risk |

## Code style commitments

- **TypeScript strict mode**, all components typed, Zod for runtime validation.
- **Pure functions** in `lib/tools/<id>.ts` — testable without React.
- **JSDoc for complex functions only**, never for obvious ones.
- **No backwards-compat shims** for removed code — delete cleanly, don't leave `_unused` vars or re-exports.
- **No trailing "fixed in X" / "handles case from #Y" comments** — that's the commit message's job.

## Performance commitments

| Metric | Ceiling |
|--------|---------|
| Processing time (≤100KB input) | 500 ms |
| Per-tool bundle contribution | 50 KB gzipped |
| Memory per tab | 50 MB |
| Initial load on 3G | 1.5 s |
| Time to Interactive | 2 s |
| Lighthouse perf score | ≥95 |
| Core Web Vitals | all green |

Regressions beyond these thresholds block merge.

## Testing commitments

- **Minimum coverage:** 80% branches/functions/lines/statements.
- **Critical path coverage (100% required):** formatter/validator core logic, security-sensitive ops (JWT, hash, bcrypt), data transformations.
- **Priority order:** critical > high > medium. UI snapshot tests are lowest priority.
- **Edge cases every tool must cover:** empty, null, undefined, very large inputs, unicode, special chars, malformed input.

## Security commitments

- Never commit `.env.local` or any secret
- Sanitize all user input (DOMPurify where HTML is rendered)
- CSP headers stringent (configured in `next.config.js` or middleware)
- `npm audit` reviewed weekly, high/critical CVEs fixed within 7 days
- No `eval()` / `Function()` constructor on user input — ever
