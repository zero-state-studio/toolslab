# 11 — Open Questions (Brainstorming Fuel)

Areas that are actively uncertain, contested, or ripe for creative input. Use this file as seed material for Claude Desktop brainstorming sessions.

## Growth / SEO

### Q1. Programmatic SEO beyond single-tool pages
We have 69 tools × 6 locales = 414 primary pages. Could we systematically generate:
- `<tool-A> vs <tool-B>` comparison pages (internal comparisons + vs. competitors)
- `<tool> + <use-case>` landing pages (e.g. "JSON Formatter for API responses")
- `<tool> + <language/framework>` pages (e.g. "Base64 decode in Python")
- Per-keyword FAQ pages extracted from PAA (People Also Ask)

What's the right scale (100? 1000? 10000 pages) before Google treats it as doorway/thin content?

### Q2. Blog / content strategy
`documentation/BLOG-STRUCTURE.md` exists but the blog is under-leveraged. What's a low-effort, high-quality cadence:
- 1 deep technical post per week tied to a tool?
- Developer interviews?
- Annual "State of X" reports (e.g. "State of JSON in 2026") with original data?

### Q3. Backlinks
Zero intentional backlink strategy today. Possible vectors:
- "Add our badge" approach for satisfied users
- Dev.to / Hashnode / Medium republishing of blog content
- OSS integrations (GitHub Actions that call tool APIs)
- Hacker News submissions of specific tools

## Product

### Q4. Workflows / tool chaining
The "10%" power users could chain: JWT decode → JSON format → JSON diff. Should we formalize workflows as saveable recipes? Or keep everything single-tool and let users copy-paste manually?

Risks: complexity creeps, we become Zapier-lite, loses "simple tool" positioning. Upside: real workflow stickiness, shareable URLs (`/workflows/<hash>`).

### Q5. API / CLI
Every tool has a pure processor function in `lib/tools/<id>.ts`. Exposing them as:
- A public HTTP API (hurts privacy promise unless stateless + no-log)
- A CLI (`npx toolslab json-format < file.json`)
- A VS Code / JetBrains extension

Which of these unlocks new users without cannibalizing web traffic?

### Q6. Tauri desktop
Standalone desktop app is buildable. What's the specific user need that justifies shipping it publicly? Offline work? Drag-drop file handling? Speed? Positioning vs. the web version?

### Q7. Collaboration features
Share a JSON diff link with a colleague without sending data to us. Possible:
- URL-encoded payload (but URL length limits)
- WebRTC peer-to-peer
- E2E-encrypted pastebin

Is this worth building vs. users doing it themselves via existing tools?

## Monetization

### Q8. Sponsor a tool
Instead of ad slots, let a single ethical sponsor (e.g. a dev tool company) sponsor a relevant tool. "JWT Decoder — sponsored by <Auth provider>". Low-volume but high-intent.

### Q9. Affiliate links for dev tools
We send traffic to products devs already want (API platforms, DB tools). Tasteful, non-intrusive affiliate could work. Which products align without violating trust?

### Q10. Paid tier for teams?
Contradicts constraint #2 (no paywalls). But: could a self-hosted "ToolsLab Enterprise" (Docker image, behind corporate VPN) be sold without breaking the free promise? Zero code changes — just packaging + support.

## i18n / localization

### Q11. Next locales
After EN/IT/ES/FR/DE/PT, the `futureLocales` list includes `nl`, `pl`, `tr`. What's the right prioritization: search volume, ease of translation, competitive gaps?

### Q12. Machine translation as seed
Our current 6 locales are (likely) LLM-translated from EN. Good enough for SEO, possibly awkward for native UX. Worth paying a human reviewer per locale?

### Q13. Locale-specific tools
Are there tools that only make sense in specific locales (e.g. German VAT calculator, Italian codice fiscale validator)? They'd have zero EN volume but dominate the locale.

## Platform / UX

### Q14. Mobile experience
Tools are built desktop-first. On mobile, large textareas + on-screen keyboards + small buttons is awkward. Worth a dedicated mobile variant or PWA optimization sprint?

### Q15. Accessibility
Radix primitives give us keyboard + screen reader basics. Systematic WCAG AA audit has not been run. Which tools have the worst gaps?

### Q16. Offline-first
Service worker + full offline PWA could make ToolsLab usable without internet. Aligns with "private by default" brand. Engineering cost: medium.

### Q17. Error surfaces
Each tool has its own error handling. Inconsistency → user confusion. Standard error UI pattern across tools?

## Engineering

### Q18. Bundle bloat
69 tools, each potentially importing heavy libs. Current lazy-load strategy works but per-tool bundles vary wildly. Worth a systematic audit to shrink the top 5 heaviest tools?

### Q19. Testing debt
Coverage target 80% overall, 100% for critical. Current actual coverage unknown (`npm run test:ci` output). Likely below target for newer tools. Gap analysis needed.

### Q20. Analytics — missing signals
We track usage + page views. We don't track:
- User frustration (rage clicks, repeated copy attempts)
- Feature discovery (do users find advanced options?)
- Output quality (did the result actually help?)

How to instrument these without breaking the privacy promise?

### Q21. `lib/tool-seo.ts` ghost
CLAUDE.md references it extensively. File does not exist. Either update CLAUDE.md to reflect reality (metadata in i18n dicts) or build the file as intended. Either way, resolve the drift.

## Meta / process

### Q22. CLAUDE.md drift
Multiple CLAUDE.md instructions reference systems that don't match current code (`lib/tool-seo.ts`, possibly others). Scheduled CLAUDE.md audits needed. Who owns this?

### Q23. Roadmap vs. reality
Roadmap says "59 shipped tools", reality has 69. Snapshot-based mirror in `documentation/todo/IMPLEMENTATION_ROADMAP.md` drifts from Linear. Automate the snapshot refresh or stop maintaining it?

### Q24. Testing brainstorm output
When we brainstorm on Claude Desktop and produce a "build X" recommendation, what's the validation loop? 1 spike-day prototype? Linear ticket + estimate? Decision log?

---

**Use this file as the starting prompt for brainstorm sessions:** pick a question, share it into Claude Desktop alongside this folder, ask "help me think through Q<N>".
