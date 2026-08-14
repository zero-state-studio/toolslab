# 🗺️ ToolsLab Roadmap

Live status of the tool build pipeline. **Rendered on GitHub** — refresh to see the latest after each push. Checkboxes drive the progress badge.

- **Source of truth:** this file + [`lib/tools.ts`](./lib/tools.ts) (registry).
- **Maintained by:** Claude Code ticks items and commits as work lands. PM reads here — no console needed.
- **Priority:** by estimated monthly search volume (SEO-driven growth).

**Legend:** `[x]` shipped & merged · `[ ]` not started · 🔬 built, verifying · 🎯 next up

---

## 📊 Status

- **Shipped (dev):** 9 tools · ~1.3M/mo search volume
- **Verifying:** 2 (pdf.js render)
- **Queued:** prioritized below

---

## ✅ Shipped — this cycle

- [x] **word-counter** — Word Counter & Reading Time · 90K/mo · `RIC-29`
- [x] **merge-pdf** — Merge PDF · 165K/mo · `RIC-46`
- [x] **split-pdf** — Split PDF (visual page picker) · 110K/mo · `RIC-46`
- [x] **pdf-to-jpg** — PDF to JPG/PNG/WebP · 120K/mo · `RIC-54`
- [x] **css-box-shadow-generator** — CSS Box Shadow Generator · 60K/mo · `RIC-30`
- [x] **number-base-converter** — Number Base Converter · 55K/mo · `RIC-31`
- [x] **image-resizer** — Image Resizer (px / %) · 450K/mo · `RIC-34`
- [x] **image-compressor** — Image Compressor (quality slider) · 150K/mo · replaces `image-optimizer` stub
- [x] **pdf-compressor** — Compress PDF (lossless + raster levels) · 90K/mo · `RIC-66`

> Each: pure tested logic, 6 locales (en/it/es/fr/de/pt), web-researched long-tail keywords, sitemap, completeness review.

## 🔬 Verifying

- [ ] **split-pdf** — confirm thumbnails render after `transpilePackages: ['pdfjs-dist']` fix + dev restart
- [ ] **pdf-to-jpg** — same pdf.js path, verify page→image after restart
- [ ] Push `development` to origin, then verify both in prod

---

## 🎯 Queued — Phase 1 (high volume, ≥30K/mo)

- [ ] 🎯 **json-schema-generator** — Generate JSON Schema from JSON · 40K/mo · `RIC-35`
- [ ] **json-diff** — Structured JSON diff · 40K/mo · `RIC-12`
- [ ] **fake-data-generator** — Mock/fake data · 35K/mo · `RIC-36`
- [ ] **contrast-checker** — WCAG contrast checker (quick-win) · 33K/mo · `RIC-37`

## 📦 Queued — Phase 2 (medium, 20–30K/mo)

- [ ] **css-flexbox-generator** · 28K/mo · `RIC-39`
- [ ] **css-grid-generator** · 25K/mo · `RIC-40`
- [ ] **url-parser** — URL Parser & Components · 25K/mo · `RIC-41`
- [ ] **meta-tags-generator** · 25K/mo · `RIC-16`
- [ ] **html-to-jsx** — HTML to JSX Converter · 22K/mo · `RIC-42`
- [ ] **totp-otp-generator** — TOTP / OTP Generator & Verifier · 22K/mo · `RIC-43`
- [ ] **ipv4-subnet-calculator** · 20K/mo · `RIC-44`
- [ ] **sitemap-generator** · 20K/mo · `RIC-45`
- [ ] **slug-generator** · 20K/mo · `RIC-15`

## 🧊 Backlog — Phase 3 (≤20K/mo, selected)

- [ ] **dns-lookup-tool** · 18K/mo · `RIC-72`
- [ ] **css-border-radius-generator** · 18K/mo · `RIC-47`
- [ ] **open-graph-preview** · 15K/mo · `RIC-49`
- [ ] **tsv-to-json-converter** · 15K/mo · `RIC-48`
- [ ] **user-agent-parser** · 15K/mo · `RIC-18`
- [ ] **semver-checker** · 14K/mo · `RIC-51`
- [ ] **json-flatten-unflatten** · 12K/mo · `RIC-52`
- [ ] _… full backlog in Linear (project Toolslab)_

---

## ⚠️ Review before building (overlap with existing tools)

- [ ] **color-palette-generator** · 50K/mo · `RIC-33` — overlaps `color-picker`/`gradient-generator`
- [x] ~~image-resizer / image-compressor~~ — shipped; the old `image-optimizer` was only a coming-soon stub (no logic), now replaced by two focused tools
- [x] ~~json-to-yaml~~ — already covered by `yaml-json-converter`

---

## 🔧 Process notes

- New tools scaffolded via the `/new-tool` skill (13 steps; SEO is a blocking step).
- Long-tail keywords are **web-researched per locale**, never hand-written.
- `lib/tools.ts` stays client-light; long-tail lives in `lib/tools-seo.ts` (server-only).
- Sitemap regenerated with `npm run sitemap:generate` (priority auto by volume).

_Volumes are estimates for prioritization, not guarantees._
