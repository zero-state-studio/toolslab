# Handoff: ToolsLab Redesign — Direction A "Playground"

## Overview

Full visual redesign of **toolslab.dev** — a catalog of 120+ free, browser-based developer tools (JPG→PDF, JSON formatter, Base64, cURL→code, etc.). This handoff covers the **"Playground"** direction: warm, playful, Raycast/Arc-inspired. Dark is the primary theme with a light companion.

The existing site lives at https://toolslab.dev and uses a plain dark theme with a violet accent. This redesign keeps the spirit (dark-first, violet-adjacent) but:

- Adds a **per-category color system** (8 hues in OKLCH) so the site feels like a library of distinct things, not a wall of identical cards.
- Introduces a **mascot** (the "beaker bot" — a small robot inside the logo's Erlenmeyer flask) used sparingly as personality.
- Strips SEO padding from tool pages so the **tool workspace dominates** above the fold.
- Uses a **⌘K-first** navigation model with a persistent search affordance in the nav.

## About the Design Files

The files in `references/` are **design references created in HTML + React (via Babel standalone)**. They are prototypes of the intended look and behavior — not production code to copy directly. Your job is to **recreate these designs in the target codebase's existing environment** using its patterns, routing, state management, and component library. If no environment exists yet, Next.js (App Router) + Tailwind is recommended for this design, but any modern React/Vue/Svelte setup works.

Do NOT ship the HTML files as-is. Do NOT copy the inline-style React components verbatim — port them to proper components in the target framework with proper CSS (Tailwind, CSS Modules, or vanilla CSS variables).

## Fidelity

**High-fidelity.** Colors, typography, spacing, and layout are final. Hex values and pixel measurements should be matched closely. Interaction behavior (hover, command palette, upload states) is specified below and should be implemented.

## Design Tokens

### Colors — Dark theme (primary)

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0f0b1a` | Page background |
| `bg-2` | `#1a1530` | Recessed areas, inner panels, toolbars |
| `surface` | `#1e1835` | Cards, inputs, dropdowns |
| `surface-hi` | `#2a2248` | Hovered cards, active nav items |
| `border` | `rgba(167,139,250,.12)` | Default card / input borders |
| `border-hi` | `rgba(167,139,250,.22)` | Focused / emphasized borders |
| `text` | `#f5f1ff` | Primary text |
| `text-muted` | `#a19bb8` | Secondary text, descriptions |
| `text-dim` | `#706a85` | Metadata, timestamps, dim labels |
| `accent` | `#a78bfa` | Violet — primary brand accent |
| `accent-2` | `#f472b6` | Pink — secondary accent, mascot antenna, CTAs |
| `accent-3` | `#fde68a` | Amber — highlights, "hot" badges, warnings |
| `accent-4` | `#6ee7b7` | Mint — success, "online" dots, check states |

### Colors — Light theme

| Token | Value |
|---|---|
| `bg` | `#faf7ff` |
| `bg-2` | `#f1ecff` |
| `surface` | `#ffffff` |
| `surface-hi` | `#f7f3ff` |
| `border` | `rgba(31,27,46,.08)` |
| `border-hi` | `rgba(31,27,46,.14)` |
| `text` | `#1f1b2e` |
| `text-muted` | `#5b5373` |
| `text-dim` | `#8a8299` |
| `accent` | `#7c3aed` |
| `accent-2` | `#db2777` |
| `accent-3` | `#d97706` |
| `accent-4` | `#059669` |

### Category hues (OKLCH)

Each of the 8 categories gets a hue. Build colored elements with `oklch(L C H)` where L/C vary by theme:

- **Dark theme:** bg fill `oklch(0.3 0.1 <hue>)`, icon/text `oklch(0.85 0.2 <hue>)`
- **Light theme:** bg fill `oklch(0.92 0.1 <hue>)`, icon/text `oklch(0.5 0.2 <hue>)`

| Category | id | hue | Example |
|---|---|---|---|
| PDF Tools | `pdf` | 8 | red-orange |
| Image Tools | `image` | 280 | violet |
| Text & String | `text` | 200 | cyan |
| Data & Format | `data` | 150 | green |
| Encoders | `encode` | 45 | amber |
| Web & Network | `web` | 330 | magenta |
| Time & Date | `time` | 95 | yellow-green |
| Dev Utilities | `dev` | 20 | red-orange warm |

### Typography

- **UI font:** `"Geist", -apple-system, "Inter", system-ui, sans-serif` (Google Fonts / npm `geist`)
- **Monospace:** `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
- **Weights used:** 400, 500, 600, 700

Type scale (px, roughly matches Tailwind's default but tightened):
- `xs` 11, `sm` 12, `base` 13, `md` 14, `lg` 15–16, `xl` 18, `2xl` 22, `3xl` 26, `4xl` 36, `5xl` 52, `6xl` 68

Letter-spacing: large headlines use `-1` to `-2` px (tight); small caps labels use `+0.5` to `+1`.

### Spacing & radii

- **Spacing scale:** 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64 px (loose Tailwind-ish).
- **Radii:** 6 (inputs/chips), 8 (buttons), 10 (pills), 12 (cards), 14 (search bar), 16 (big panels), 20 (hero cards), 999 (badges/tags).
- **Default card:** `border-radius: 12px`, `border: 1px solid border`, `background: surface`, `box-shadow: 0 1px 0 rgba(255,255,255,.03) inset, 0 8px 32px -12px rgba(0,0,0,.4)`.

### Density options (tweak)

- Compact: base padding 12, gap 10, input height 36
- Comfortable (default): 18 / 14 / 44
- Spacious: 28 / 20 / 52

### Card-style options (tweak)

- `flat`: no border, no shadow
- `bordered`: 1px border, no shadow, transparent bg
- `elevated` (default): 1px border + soft shadow + subtle inset highlight

## Pages / Views

All pages share:
- A **sticky top nav** (60px tall) with logo, primary nav (Tools, Categories, The Lab, About), ⌘K search trigger, GitHub star count, theme toggle.
- Max content width **1200px**, centered, with 40px horizontal padding.
- Dark is default. Light theme is a toggle, not a separate URL.

### 1. Home / Landing

**Purpose:** Let visitors find a tool in one search, or browse by category. Communicate free / local / open-source in the first fold.

**Layout (top→bottom):**
1. **Hero** (padding 56/40/48): centered, max-width 960. Contains:
   - Small pill "124 tools · runs entirely in your browser" (online dot + text)
   - Mascot (110px)
   - Headline: "Every dev tool, / one tidy lab." — 68px, weight 700, tracking -2. Second line is a violet→pink→amber gradient text.
   - Subhead: "Fast, free, no sign-up. Every file stays on your machine." (18px, muted)
   - **Big search input** (14/18 padding, radius 14, accent-colored outer glow `0 20px 60px -20px accent40`). Includes an inline ⌘K kbd.
   - Quick-search chip row ("JSON Formatter", "Base64", "JPG to PDF", "cURL to Code", "UUID") — clicking pre-fills the search.
   - Two soft radial-gradient blobs (accent + accent-2) blurred in the background.

2. **Value props strip** (4-col grid, gap 12): Instant / Private / Free forever / Open source. Each: 32×32 colored icon chip + title + one-line description.

3. **Categories grid** (4-col, 8 cards): soft glow in top-right corner of each card using the category hue. 36×36 icon chip, category name, description, tool count.

4. **Popular this week** (3-col, 6 featured tools): 40×40 category-colored icon, name + trending dot, description, run count with up-arrow percentage.

5. **Footer** (32/40, border-top): mascot 32px + "Made with ♥ for developers · MIT licensed" + links (GitHub, Changelog, RSS).

Reference: `references/playground-core.jsx` → `PGHome`.

### 2. Categories (index)

**Purpose:** Browse all 8 categories with a preview of their tools.

**Layout:**
- Breadcrumb "Home › Categories" (13px, muted).
- **H1** "Categories · 8" (44px, tracking -1). Subtitle: "Every tool grouped by what it does. Pick a lane."
- Filter bar: left side is a search input (filter categories), right side is a Grid/List toggle (4px inner padding, 2-state segmented).
- **2-column grid** of big category cards (gap 16). Each card (padding 24, radius 16) contains:
  - A 48×48 rounded-square icon (radius 12) in category hue
  - Category name (18px 700) + tool count inline
  - Description
  - First 4 tool names as chips (radius 6, bg page, border) + "+N more" link in accent

Reference: `PGCategories`.

### 3. Category Detail

**Purpose:** See all tools in one category. Filter and sort.

**Layout:**
- Breadcrumb "Home › Categories › PDF Tools".
- **Hero card** (padding 28, radius 20): gradient background `linear-gradient(135deg, oklch(0.25 0.1 <hue>) 0%, surface 100%)`, border in the category hue. 72×72 category icon, H1 36px, subtitle with description + tool count. "★ Star category" button on the right.
- **Filter + sort row**: search input (flex 1) + segmented "Popular / A–Z / New" (active = Popular by default).
- **Tool grid** — 3 columns, gap 12. Each card (padding 16, radius 12, column flex):
  - Row 1: 32×32 category icon + tool name (14px 600)
  - Row 2: description (13px muted)
  - Row 3 (pushed to bottom): run count + right chevron
  - Optional top-right "HOT" pill (bg `accent-3 / 22`, text `accent-3`, uppercase 10px 700 tracking 0.5)

Reference: `PGCategoryDetail`.

### 4. Tool Page (JPG to PDF is the exemplar)

**Purpose:** Use the tool. Everything else is secondary.

Critically, the current production site has a huge SEO paragraph before the tool. **In this design the SEO text is removed from the first fold** — it can live at the bottom of the page for crawlers.

**Layout:**
- Tight breadcrumb (12px).
- **Compact header row** (no separate hero):
  - 44×44 category-colored tool icon
  - Inline: H1 "JPG to PDF" (26px 700) + category pill + dot + "8.2k runs this month"
  - Tagline below (14px muted): the short description only
  - Right side: Save + Share buttons (chip-size, radius 8, 8/10 padding)
- **2-column grid** `1fr 280px`, gap 16:
  - **Left (the workspace):** a big card with a window chrome (3 traffic lights + filename). Dropzone or thumbnail grid (4 cols, aspect 3/4). Settings bar at the bottom with inline selects for Page size / Orientation / Fit / Margin, then a gradient "Generate PDF" button (disabled when empty, gradient `accent → accent-2` when files loaded).
  - **Right (sidebar):** three stacked cards:
    1. "Related tools" (14 padding) — 4 items from the same category.
    2. **Pro tip card** with mascot 28px + gradient `accent-2/22 → accent-3/22` bg + dashed accent border.
    3. "Keyboard" card listing ⌘O / ⌘Enter / ⌘K with mono kbd labels.

States to implement: `empty` (dropzone with mascot speech bubble "Drop your JPGs! ✨"), `loaded` (thumbnail grid), `processing` (progress bar — not mocked, specify), `done` (download banner — not mocked, specify).

Reference: `PGToolPage`.

### 5. The Lab (experimental tools)

**Purpose:** Showcase experimental / alpha / beta tools separately from the stable catalog.

**Layout:**
- Header row: left has an "EXPERIMENTAL" pill (bg `accent-2/22`, accent-2 text, 12px 600), H1 "The Lab" (52px 700 tracking -1.5), subhead. Right has a larger mascot (140px) with "curious" mood (dot eyes instead of happy arcs).
- **Featured card** (padding 32, radius 20, gradient bg `accent 33 → accent-2 33 → accent-3 22`, big blurred blob behind). 2-column inside:
  - Left: "⚡ FEATURED THIS MONTH" (accent-3, 11px 700 tracking 1), H2 30px, paragraph, two buttons (solid text-on-bg + outline).
  - Right: mock terminal preview with mono code (input "describe", output regex in `accent-4`).
- **"All experiments" label** (13px muted uppercase tracking 0.8).
- **3-column grid** of experiment cards (padding 18, radius 14): each with a colored icon chip + status pill (alpha/beta/new/stable with different accent colors).
- **Suggestion box** at the bottom: dashed border, mascot 64px + CTA button "Suggest a tool" with GitHub icon.

Reference: `PGLab`.

## Interactions & Behavior

### Global

- **⌘K / Ctrl+K** anywhere opens a command palette (modal, 560px wide, centered). Uses fuzzy search on tool names, slugs, and descriptions. Arrow keys navigate, Enter opens, Esc closes.
- **Theme toggle** in nav swaps dark/light. Persist to `localStorage` (`toolslab-theme`). Respect `prefers-color-scheme` on first load.
- **GitHub star count** in nav is fetched once on mount from `GET https://api.github.com/repos/<owner>/<repo>` — cache 1h in localStorage. Show `—` while loading.
- **Hover** on any card: border brightens from `border` to `border-hi`, lift shadow by 20%, 150ms ease-out. No scale.
- **Nav items** show active state as `bg: surface-hi, color: text`. Inactive: `color: text-muted`.

### Home

- Search input is focus-trapped on `/` key (GitHub convention) and ⌘K. Typing filters a dropdown that appears below with up to 8 matches — name (bold), category chip (hue), description (muted one-liner). Arrow keys + Enter to select.
- Quick-search chips: click pre-fills the input and triggers filtering; don't navigate away.
- Category cards: click → `/categories/<id>`. Hover reveals a faint hue gradient overlay.
- Featured tools: click → `/tools/<slug>`.

### Categories index

- Search filters the list of categories live (on name + description + tool names).
- Grid/List toggle switches to a one-per-row layout (not mocked — just stack the same cards vertically at full width).

### Category detail

- Sort tabs update the order (popular = by runs desc; a-z = by name; new = by `addedAt` desc).
- Hover on a tool card: chevron slides 2px right, 150ms.
- Filter input searches name + description + slug within the category.

### Tool page

- **Dropzone** accepts drag/drop AND click-to-browse. Show the "mascot says Drop your JPGs" bubble only in empty state.
- When files are dropped: animate thumbnails in (fade + slight-scale 0.9→1, 200ms, staggered by 30ms).
- Thumbnails are **draggable to reorder**. Show a ghost on drag, reflow siblings.
- **Settings dropdowns** are native-ish selects styled as chips (dropdown shows a small tick next to selected option).
- **Generate button** state:
  - empty → `bg: surface-hi, color: dim, cursor: not-allowed`
  - ready → `bg: linear-gradient(135deg, accent 0%, accent-2 100%), color: #fff`
  - processing → same gradient + inline spinner + "Processing X of N…"
  - done → swap to "Download PDF" with download icon, `bg: accent-4` solid
- **⌘O** opens file picker, **⌘Enter** runs generate, **R** resets queue, **?** shows a keyboard-shortcuts modal.

### The Lab

- Featured card: "Try it →" navigates to the experiment. "How it works" opens a side panel with a longer writeup (not mocked — standard slide-over).
- Experiment cards: identical hover behavior to category cards.
- "Suggest a tool" → opens GitHub issues pre-filled with a template.

## State Management

Minimal global state needed:

- `theme: 'dark' | 'light'` — persisted
- `commandPaletteOpen: boolean`
- `toolQuery: string` — global search term (debounced 150ms)
- Per-tool-page local state: `files: File[]`, `settings: { size, orient, fit, margin, quality }`, `status: 'idle' | 'ready' | 'processing' | 'done' | 'error'`, `output: Blob | null`

Data:
- **Categories** and **tools** are static data — can live in a single `data/tools.ts` exporting typed arrays. See `references/shared.jsx` for the exact shape and sample content.
- **Run counts** and **trending** data can be stubbed for now; later back them with a simple analytics endpoint (e.g., Plausible goal counts).

## Assets

- **Logo mark** — the Erlenmeyer flask icon. SVG provided inline in `references/shared.jsx` (the `TLIcon` with `name="flask"`). Use `currentColor` and the `accent → accent-2` gradient background.
- **Mascot** — the "beaker bot". SVG inline in `references/shared.jsx` (`TLMascot`). Two moods (`happy` = arc eyes, `curious` = dot eyes). Needs to be extracted as its own SVG asset and re-colorable.
- **Icons** — Lucide or Tabler will match the line style used in the prototype (`stroke-width: 1.6`, rounded joins). Current icons are inline SVG placeholders; swap for a real icon library.
- **Fonts** — Geist (sans) + JetBrains Mono. Both free; self-host or Google Fonts.
- **No stock imagery.** The design is entirely typographic + iconographic + mascot.

## Files

```
references/
├── ToolsLab Redesign.html   Full canvas with all pages. Open in a browser to explore.
├── shared.jsx                Tokens, categories, tools data, icons, mascot
├── playground-core.jsx       PGShell, PGNav, PGHome, PGCategories, PGCategoryDetail
├── playground-pages.jsx      PGToolPage, PGLab
└── design-canvas.jsx         Canvas wrapper (not needed for production)
```

Open `ToolsLab Redesign.html` locally (double-click) to see every page live. Zoom into each artboard to inspect. Each Direction A section (prefixed `A ·`) is what to implement.

## Implementation Notes

- Use **CSS variables** for all tokens so the theme toggle is a single class swap on `<html>`.
- Category colors are derived from `hue` — build a tiny helper `catColor(hue, role, theme)` that returns the OKLCH string. Avoid pre-computing all 8 × 4 combinations.
- The **headline gradient text** uses `background-clip: text; -webkit-text-fill-color: transparent`. Include a solid fallback color for browsers without support.
- The **command palette** is the most important interaction. Budget time for fuzzy search (use `fuse.js` or `cmdk`).
- Responsive: the prototypes are desktop-first at 1280px. Below 900px, collapse the 4-col grids to 2, the 3-col to 1. Tool page sidebar stacks under the workspace below 900px.
- Accessibility: all colored icon chips must pass 4.5:1 contrast against their bg. The OKLCH L values above are tuned for this — don't stray.

## Out of scope for this handoff

- About page, 404/error pages, Search/All Tools page — not mocked in Direction A. Design them later using the same system (top nav + max-1200 content + category hue system).
- Authentication / accounts — the site explicitly has none.
- Individual tool implementations — the workspace UI is specified but the actual conversion/encoding logic is not.
