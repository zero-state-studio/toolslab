# 01 — Overview

## Product

**ToolsLab** — a curated suite of browser-based developer utilities. Every tool runs client-side; no data ever leaves the user's browser.

**URL:** https://toolslab.dev
**Tagline:** the lab where developers shape raw data into solutions.

## Core principle — "Dual Mode"

The product serves two audiences simultaneously:

1. **Single-task users (~90%)** arrive via SEO, solve one problem, leave. Must win them in <5s: obvious input, instant output, zero friction.
2. **Workflow power users (~10%)** chain tools, save favorites, use history. Rewarded with the "Lab" — a personal hub with favorites, recent tools, keyboard shortcuts, pinned workflows.

Everything UX-wise is designed to serve (1) without hurting (2). Never the other way around.

## Business model

- **Fully free.** No signup, no paywall, no account. Private by default.
- **Revenue sources:**
  - Ethical display ads (toggleable via env flag `NEXT_PUBLIC_ENABLE_ADS`)
  - Donations (BuyMeACoffee / similar)
- **Explicitly rejected:**
  - Premium tiers / gated features
  - Server-side processing of user data
  - Email capture / newsletters as lead-gen
  - Dark-pattern cookie banners

## Target users

| Segment | % traffic (est.) | Primary need |
|---------|------------------|--------------|
| Backend / fullstack devs | 40% | JSON/YAML/SQL/XML formatters, JWT, Base64 |
| Frontend / web devs | 20% | CSS generators, color tools, minifiers |
| Data / DevOps | 15% | CSV/JSON, crontab, hash, timestamps |
| Designers | 10% | Color picker, gradient, favicon, image optimizer |
| Students / learners | 10% | General utilities, converters |
| Non-devs (PDF tools) | 5% | Image-to-PDF, PDF-to-Word |

Geo: English dominates (~65%), followed by IT / ES / FR / DE / PT based on localization coverage.

## Competitive positioning

**Compared to** jsonformatter.org, codebeautify.org, base64decode.org, freeformatter.com:

- **Faster:** static Next.js, CDN-cached, no heavy frameworks on the landing.
- **Private:** client-side only, no uploads. Explicit claim on every tool page.
- **Broader:** single destination for 69+ utilities vs. single-purpose competitors.
- **Cleaner UX:** no autoplay video ads, no modal popups, no newsletter nag.

**Weakness we watch:** individual tool pages have to rank against domain-specific incumbents with 10+ year backlink histories. Strategy = long-tail dominance + technical SEO excellence, not head-keyword battles.

## Mission statement

> Build a trusted lab where developers get their job done fast, privately, and without being monetized against.

## Key metrics (north stars)

| Metric | Target | Why |
|--------|--------|-----|
| Organic monthly visits | growing ≥10% MoM | SEO health |
| Tool usage / visitor | ≥1.4 | Workflow stickiness |
| Time to first interactive click | ≤1.5s on 3G | UX moat |
| % of sessions with zero errors | ≥99.5% | Reliability trust |
| Bounce rate on tool pages | ≤40% | Content-fit proxy |

## Brand voice

Plain, precise, no-bullshit. Technical where useful, never condescending. No emoji confetti, no growth-hack microcopy. Think "UNIX man page that actually likes you".
