# 08 — Development Workflow

## Operating system

- **Claude Code (CLI)** is the primary dev interface.
- **Linear** (team `Ricca`, project `Toolslab`) is the operational system for all tickets.
- Git convention: feature branches per Linear issue, PR into `development`, then promote to `main` for Vercel production.

## Branch / commit convention

Branch names auto-suggested by Linear: `gianlucaricaldone/ric-<id>-<slug>`.

Commit message pattern:
```
<type>(<scope>): <subject> [RIC-<id>]

<body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

`<type>` ∈ `feat | fix | test | docs | style | refactor | perf | chore`.

## Adding a new tool — `/new-tool` skill

Invocation:
```
/new-tool <tool-id> "<Tool Name>" <category-id>
```

Runs the canonical 13-step scaffold automatically. After scaffold, always chain:

1. `programmatic-seo` skill — optimize `meta.title`, `meta.description`, `tagline`, `pageDescription`, EN keywords.
2. `seo-audit` skill — verify sitemap, schema JSON-LD, canonical, hreflang, OG/Twitter.
3. **Manually** add the new tool to all 6 sitemaps (`public/sitemap-*.xml`) with `priority=0.8` + full hreflang block.

### The 13 scaffold steps

1. Register in `lib/tools.ts` (full metadata: id, name, description, icon, route, categories, keywords, longTailKeywords, searchVolume, label).
2. Add SEO content fields to the 6 i18n dictionaries (`meta`, `tagline`, `pageDescription`, `longTailKeywords`).
3. Add tool-specific `instructions` content (`steps`, `features`, `useCases`, `proTips`, `troubleshooting`, `keyboardShortcuts`).
4. Write Jest test first in `__tests__/unit/tools/<id>.test.ts`.
5. Implement pure processor in `lib/tools/<id>.ts` (returns `{ success, result?, error?, metadata? }`).
6. Implement React UI in `components/tools/implementations/<ToolName>.tsx`.
7. If the component reads Zustand stores, import and use `useHydration` (gating reads + effects).
8. Register in `components/tools/LazyToolLoader.tsx`.
9. Register ID in `lib/i18n/load-tools.ts` `toolIds[]` array.
10. Create the 6 i18n JSON files with the full schema (see `06-I18N-SYSTEM.md`).
11. Wire `addToHistory()` so Umami auto-tracking fires.
12. Wire `useScrollToResult({ onlyIfNotVisible: false })` with `useEffect` on output change.
13. Confirm no dedicated `app/tools/<id>/page.tsx` is created — the dynamic route handles everything.

### Completeness check

`tool-completeness-reviewer` subagent runs automatically at end of `/new-tool`. Also invokable manually.

## Key skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `/new-tool` | starting a new tool | 13-step scaffold |
| `/i18n-check` | pre-deploy, after batch dict edits | verify 6-locale coverage |
| `programmatic-seo` | after `/new-tool`, or optimizing existing | SEO content optimization |
| `seo-audit` | before deploy, high-SV tool work | sitemap/schema/hreflang/canonical audit |
| `long-tail-seo` | per-locale keyword coverage | research + assign 12 long-tails per tool per locale |
| `page-cro` | tool with high SV underperforming | conversion / engagement review |
| `free-tool-strategy` | roadmap decisions | evaluate which tool to build next |
| `systematic-debugging` | persistent bugs, prod-only errors, 3rd-fix territory | disciplined debugging loop |
| `superpowers:brainstorming` | before any creative work | explore intent + requirements |
| `superpowers:test-driven-development` | before implementation | TDD discipline |
| `superpowers:writing-plans` | multi-step tasks with a spec | produce a written plan |
| `superpowers:executing-plans` | executing a written plan | plan-driven execution with review checkpoints |

## MCP servers

- **context7** — docs-on-demand for libraries. Prefix queries with `use context7`.
- **Linear** — create/update issues, manage labels, statuses, milestones, projects.
- **GitHub** — PRs, reviews, repo operations.
- **Playwright** — browser automation for e2e / visual QA.

## Hooks (Claude Code)

- **PostToolUse** on `.ts` / `.tsx` edits — auto-runs `tsc --noEmit`. Any TS error blocks further edits until fixed.
- **PreToolUse** blocks edits to `.env.local` — credentials must be updated via terminal.
- **SessionStart** — optional caveman mode / skill loading.

## Common scripts

```bash
# dev
npm run dev
npm run dev:ads              # with ads (legacy, prefer env flag)

# testing
npm run test                 # watch
npm run test:ci              # CI + coverage
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:all

# build
npm run build                # production
npm run build:prod           # with ads
npm run analyze:size         # bundle analyzer

# quality
npm run lint
npm run lint:fix
npm run type-check
npm run format

# SEO
npm run seo:discover
npm run seo:submit
npm run seo:monitor
npm run seo:full             # discover → submit → monitor

# sitemap
npm run sitemap:generate
npm run sitemap:validate
npm run validate:hreflang
npm run audit:canonical
npm run validate:links

# IndexNow
npm run indexnow:submit
npm run indexnow:bulk
npm run indexnow:stats

# Edge Config (runtime flags)
npm run edge-config:dev
npm run edge-config:show
npm run edge-config:manage
npm run local:config         # local overrides

# Tauri desktop build
npm run tauri:dev
npm run tauri:build
```

## Linear workflow

**Structure (team `Ricca`):**
- Project: `Toolslab`
- Milestones: `Ongoing — SEO & Content`, `Ongoing — i18n`, and phase-based rollout milestones
- Labels: `quick-win`, `locale:<code>`, `data`, `seo`, `i18n`, `cross-cutting`, etc.

**Status workflow:**
`Backlog` → `Todo` → `In Progress` → `In Review` → (`Deployed` |  `Done`) — with `Canceled` / `Duplicate` as closure terminals.

When claiming an issue in Claude Code:
1. `mcp__claude_ai_Linear__get_issue` to read scope.
2. Move to `In Progress`.
3. Branch naming = `gitBranchName` from the issue.
4. Commit with `[RIC-<id>]` suffix in subject.
5. Move to `In Review` on PR open; `Done` on merge + deploy.

## Pre-deploy checklist

1. `npm run test:all` clean
2. `npm run lint` clean
3. `npm run build` clean
4. `npm run analyze:size` — no surprise bundle jumps
5. `/i18n-check` — zero missing locales / fields
6. `npm run validate:hreflang` clean
7. `npm run audit:canonical` clean
8. Manual smoke: homepage + 3 random tools in 2 random locales

## Weekly maintenance (Friday)

- Sentry triage
- Bundle size trend
- `npm outdated` → update low-risk deps
- Umami delta review (top/bottom tools this week)
- Prod data snapshot / backup if relevant
