# Implementation Prompt for Claude Code

Copy this into Claude Code as your initial instruction.

---

I'm redesigning **toolslab.dev** — a catalog of browser-based dev tools. I've prepared a design handoff package in this folder. Your job is to implement the design in our codebase.

## Read these first, in order

1. `README.md` — full spec: overview, tokens, all 5 page types, interactions.
2. `TOKENS.md` — copy-pasteable CSS variables and category hue system.
3. `references/ToolsLab Redesign.html` — open in a browser to see every page live. **This is the source of truth for visuals.** Zoom into each artboard labeled `A · ...` (ignore the `B ·` Terminal direction — we picked A).
4. `references/shared.jsx` — tokens + categories + tools data + icons + mascot SVG.
5. `references/playground-core.jsx` + `playground-pages.jsx` — reference React implementations of each page.

## What to build

5 page types, all in Direction A "Playground":
- **Home / Landing** → `PGHome`
- **Categories** (index) → `PGCategories`
- **Category Detail** → `PGCategoryDetail`
- **Tool Page** (JPG-to-PDF is the exemplar; there are 120+ tools) → `PGToolPage`
- **The Lab** (experimental tools) → `PGLab`

Plus shared chrome: top nav, ⌘K command palette, theme toggle, footer.

## Technical approach

- **Do NOT copy the reference JSX verbatim** — it uses inline styles for prototyping speed. Port each component to our codebase's component + styling patterns (Tailwind / CSS Modules / whatever we use).
- **Use CSS variables for tokens** so the theme toggle is a single attribute swap on `<html data-theme="...">`.
- **Category colors are computed from a `hue` number** via OKLCH — don't hardcode 8×4 combinations. See TOKENS.md.
- Icons: install **lucide-react** (matches the `stroke-width: 1.6` line style used in the prototypes). Swap the inline `TLIcon` placeholders for real Lucide icons of the same semantic.
- Fonts: self-host or Google Fonts (**Geist** + **JetBrains Mono**).
- The **mascot** (beaker bot) is in `shared.jsx` → `TLMascot`. Extract it to its own SVG component — it needs to be re-usable at 32/64/110/140 px and re-colorable.

## Priority order

1. Tokens + theme toggle infrastructure + nav + footer (scaffolding)
2. Home page — it's the most visible, and its search/⌘K is used everywhere
3. Tool page — our highest-traffic page type; critical that the workspace dominates
4. Categories + Category detail (same design language, parallel build)
5. The Lab (simpler, mostly static)
6. ⌘K command palette (can start as a stub and grow)

## Guardrails

- **Dark is the default**, light is a toggle. Start every component in dark.
- **Match measurements closely** — this is a hi-fi handoff. Pixel counts in README.md are intentional.
- **Max content width 1200px**, 40px horizontal padding, centered.
- **Responsive**: desktop-first at 1280px. Below 900px → 4-col becomes 2, 3-col becomes 1, tool page sidebar stacks.
- **Accessibility**: all colored icon chips must pass 4.5:1. The OKLCH L values in TOKENS.md are tuned for this — don't stray.

## First deliverable

Scaffold the project + token system + top nav + theme toggle + empty Home with working hero layout. Post a screenshot and I'll green-light the rest.

## Questions to ask me before starting

- Which framework / stack are we using? (If greenfield, recommend Next.js App Router + Tailwind + shadcn/ui.)
- Do we already have icons / fonts set up?
- How should tool data be stored — static file or API? (Default: static `data/tools.ts`.)
