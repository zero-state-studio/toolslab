# Design tokens — ToolsLab "Playground"

Copy into your CSS / Tailwind config.

## CSS variables

```css
:root[data-theme="dark"] {
  --bg:        #0f0b1a;
  --bg-2:      #1a1530;
  --surface:   #1e1835;
  --surface-hi:#2a2248;
  --border:    rgba(167,139,250,.12);
  --border-hi: rgba(167,139,250,.22);
  --text:      #f5f1ff;
  --text-muted:#a19bb8;
  --text-dim:  #706a85;
  --accent:    #a78bfa;
  --accent-2:  #f472b6;
  --accent-3:  #fde68a;
  --accent-4:  #6ee7b7;
}

:root[data-theme="light"] {
  --bg:        #faf7ff;
  --bg-2:      #f1ecff;
  --surface:   #ffffff;
  --surface-hi:#f7f3ff;
  --border:    rgba(31,27,46,.08);
  --border-hi: rgba(31,27,46,.14);
  --text:      #1f1b2e;
  --text-muted:#5b5373;
  --text-dim:  #8a8299;
  --accent:    #7c3aed;
  --accent-2:  #db2777;
  --accent-3:  #d97706;
  --accent-4:  #059669;
}
```

## Category hues

```ts
export const CATEGORIES = [
  { id: 'pdf',    name: 'PDF Tools',     hue: 8   },
  { id: 'image',  name: 'Image Tools',   hue: 280 },
  { id: 'text',   name: 'Text & String', hue: 200 },
  { id: 'data',   name: 'Data & Format', hue: 150 },
  { id: 'encode', name: 'Encoders',      hue: 45  },
  { id: 'web',    name: 'Web & Network', hue: 330 },
  { id: 'time',   name: 'Time & Date',   hue: 95  },
  { id: 'dev',    name: 'Dev Utilities', hue: 20  },
];

// bg fill for icon chip
//   dark:  oklch(0.30 0.10 <hue>)
//   light: oklch(0.92 0.10 <hue>)
// icon/text color
//   dark:  oklch(0.85 0.20 <hue>)
//   light: oklch(0.50 0.20 <hue>)
```

## Fonts

- Geist (sans) — `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700')`
- JetBrains Mono — `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700')`

## Shadows

```css
--shadow-card: 0 1px 0 rgba(255,255,255,.03) inset, 0 8px 32px -12px rgba(0,0,0,.4);
--shadow-search-glow: 0 20px 60px -20px var(--accent); /* use accent + alpha */
```

## Radii

```css
--r-chip:  6px;
--r-btn:   8px;
--r-pill:  10px;
--r-card:  12px;
--r-bar:   14px;
--r-panel: 16px;
--r-hero:  20px;
--r-badge: 999px;
```
