# ToolsLab — Brainstorming Context Pack

**Purpose:** self-contained documentation pack for off-repo brainstorming sessions (Claude Desktop, ChatGPT, human collaborators) who don't have direct codebase access.

**Snapshot date:** 2026-04-18
**Repo:** `github.com/.../toolslab` — branch `development`
**Live:** https://toolslab.dev

## How to use this pack

1. Upload the whole folder (or concat the files) into a Claude Desktop Project.
2. Start a conversation: "Using the ToolsLab brainstorming context, help me brainstorm X".
3. Files are ordered so reading top-to-bottom gives progressively deeper context.

## Files in reading order

| # | File | Purpose |
|---|------|---------|
| 01 | `01-OVERVIEW.md` | Mission, business model, users, positioning |
| 02 | `02-TECH-STACK.md` | Framework, libraries, infra, constraints |
| 03 | `03-ARCHITECTURE.md` | Folder structure, dynamic routing, state, hydration |
| 04 | `04-TOOLS-CATALOG.md` | 69 shipped tools grouped by category + search volume |
| 05 | `05-SEO-STRATEGY.md` | Sitemap, schema JSON-LD, hreflang, long-tail system |
| 06 | `06-I18N-SYSTEM.md` | 6 locales, dictionary file layout, URL convention |
| 07 | `07-ANALYTICS.md` | Umami, auto-tracking flow via `addToHistory` |
| 08 | `08-DEVELOPMENT-WORKFLOW.md` | Skills, `/new-tool` scaffold, Linear workflow, hooks |
| 09 | `09-ROADMAP-AND-BACKLOG.md` | Phase 1–4 pipeline (63 tools in backlog), prioritization logic |
| 10 | `10-CONSTRAINTS-AND-DECISIONS.md` | Architectural rules, anti-patterns, non-negotiables |
| 11 | `11-OPEN-QUESTIONS.md` | Hot topics ripe for brainstorming |

## Distinguishability

This folder lives at repo root (not inside `/documentation/`) precisely to signal:
it is **context-for-external-AI**, not project docs consumed by the codebase.

## Refresh policy

- Regenerate when a major architectural shift lands (new locale, new stack piece, removed system).
- For tool catalog drift (±5 tools), refresh `04-TOOLS-CATALOG.md` only.
- For backlog changes, prefer linking to Linear over editing `09-ROADMAP-AND-BACKLOG.md`.
