# 09 — Roadmap and Backlog

**Source of truth:** Linear project `Toolslab` (team `Ricca`).
**Mirror:** `documentation/todo/IMPLEMENTATION_ROADMAP.md` (human-readable snapshot).

## Status snapshot (2026-04-17)

| Bucket | Count |
|--------|-------|
| Shipped (in `lib/tools.ts`) | 59 tools* |
| Phase 1 — Maximum priority | 12 |
| Phase 2 — High priority | 20 |
| Phase 3 — Medium priority | 18 |
| Phase 4 — Low priority | 13 |
| **Total pipeline** | **122** (59 shipped + 63 backlog) |

*The roadmap says 59; current `lib/tools.ts` has **69**. Some recent shipments haven't been reflected in the snapshot.

## Phase 1 — Maximum priority (12 tools)

High search volume (>30K/mo), strong SEO fit, complements existing popular tools. Ship all before next SEO audit.

| ID | Name | Category | SV | Pts | Linear | Rationale |
|----|------|----------|----|-----|--------|-----------|
| json-diff | JSON Diff | data | 40K | 5 | RIC-12 | Semantic JSON comparison; complements text-diff |
| timestamp-diff | Timestamp Diff | data | 10K | 3 | RIC-14 | Duration between timestamps; complements unix-ts |
| word-counter | Word Counter & Reading Time | text | 90K | 2 | RIC-29 | Massive volume, zero-friction |
| css-box-shadow-generator | CSS Box Shadow Generator | web | 60K | 3 | RIC-30 | Most-searched CSS visual generator |
| number-base-converter | Number Base Converter | dev | 55K | 2 | RIC-31 | Hex/binary/decimal/octal |
| json-to-yaml | JSON to YAML Converter | data | 50K | 2 | RIC-32 | Dominant search form; separate landing |
| color-palette-generator | Color Palette Generator | web | 50K | 5 | RIC-33 | Color harmony; design/dev crossover |
| image-resizer | Image Resizer | web | 450K | 5 | RIC-34 | Huge volume; client-side canvas |
| json-schema-generator | JSON Schema Generator | data | 40K | 5 | RIC-35 | Infer schema from sample |
| fake-data-generator | Fake Data Generator | generators | 35K | 5 | RIC-36 | Realistic mock data |
| contrast-checker | Contrast Checker | web | 33K | 2 | RIC-37 | WCAG AA/AAA; integrates color-picker |
| markdown-table-generator | Markdown Table Generator | formatters | 30K | 3 | RIC-38 | Visual builder |

## Phase 2 — High priority (sample, 20 total)

Solid search volume (10K–30K/mo), clear developer demand.

| ID | Name | Category | SV | Pts | Linear |
|----|------|----------|----|-----|--------|
| slug-generator | Slug Generator | web | 20K | 2 | RIC-15 |
| meta-tags-generator | Meta Tags Generator | web | 25K | 5 | RIC-16 |
| base64-to-svg | Base64 to SVG | base64 | 5K | 2 | RIC-17 |
| user-agent-parser | User Agent Parser | dev | 15K | 3 | RIC-18 |
| css-flexbox-generator | CSS Flexbox Generator | web | 28K | 5 | RIC-39 |
| css-grid-generator | CSS Grid Generator | web | 25K | 5 | RIC-40 |
| url-parser | URL Parser & Components | dev | 25K | 3 | RIC-41 |

Full Phase 2 list in `documentation/todo/IMPLEMENTATION_ROADMAP.md`.

## Phase 3 — Medium priority (18 tools)

Lower volume (5K–15K/mo) but complete gaps or serve niche flows. Mostly 2–3 points each.

Themes:
- Additional base64 → formats (SVG, audio)
- Dev utilities (environment parsers, format converters)
- Social media (Twitter card generator, TikTok hashtag tools)
- Extra PDF operations (merge, split, compress)

## Phase 4 — Low priority (13 tools)

Experimental / long-shot / educational. Build only when capacity and strategic alignment exist.

## Ongoing streams (not tool-scoped)

### SEO & Content (milestone)
- Per-tool audit + long-tail coverage (e.g. RIC-26 = JSON Formatter audit)
- Blog post production
- Programmatic SEO expansion
- Internal linking improvements

### i18n (milestone)
- Translation gap fills (e.g. RIC-5 = Italian `placeholder` field for 11 tools)
- New locale rollouts (next candidates: `nl`, `pl`, `tr`)
- Locale-specific keyword tuning

### Platform
- Core Web Vitals optimizations
- Bundle size reductions
- Accessibility audit
- Tauri desktop app feature parity

## Prioritization logic

Weight factors (informal):

| Factor | Weight | Notes |
|--------|--------|-------|
| Search volume | High | monthly SV from Keyword Planner / SERP tools |
| Build cost (points) | Medium | 1 = trivial, 5 = complex, 8 = multi-tool system |
| Complements existing tools | Medium | chaining / category gaps |
| Competitive gap | Medium | do incumbents suck at this? |
| Uniqueness / moat | Low-Medium | can we do it better than freeformatter.com? |
| Strategic fit | Medium | does it match brand voice / audience? |

Avoid: tools that require server-side processing, tools that duplicate a competitor with no edge, tools purely to rank for a keyword without solving a real problem.

## Linear issue structure

**Every issue has:**
- Title with prefix: `tool-name:`, `seo:`, `i18n:`, `chore:`, `bug:`, etc.
- Project: `Toolslab`
- Milestone: relevant ongoing or phase
- Priority: 1=Urgent … 4=Low
- Estimate: points (Fibonacci-ish: 1, 2, 3, 5, 8)
- Labels: `quick-win`, `locale:<x>`, `data`, `seo`, `i18n`, `cross-cutting`, etc.
- Description with **Scope / Checklist / Verify / Notes** sections

**Good issue template:**
```md
## Scope
- Tool / area
- Locales or systems affected
- Source of info

## Checklist
- [ ] Concrete task 1
- [ ] Concrete task 2

## Verify
- [ ] Manual / automated check

## Notes
Context, dependencies, links.
```

## Where roadmap ends and brainstorming begins

The 63 backlog tools are prioritized by estimated ROI. Brainstorming should focus on:
- **Tools not yet on the list** — white-space identification
- **Non-tool growth vectors** — blog, programmatic SEO pages, comparison pages
- **Product pivots** — bundles, workflows, API exposure, Tauri desktop angle
- **Monetization experiments** — honest sponsorships, affiliate for dev tools, open-source donations
