// Category theming — Playground direction.
// Each category maps to a hue (OKLCH) + a lucide icon name.
// Colors are computed at runtime via `catColor(hue, role, theme)`.

import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Lock,
  Binary,
  Type,
  Sparkles,
  Palette,
  Wrench,
  Wand2,
  Smartphone,
  File,
  Braces,
  Globe,
  Clock,
  Terminal,
  Image as ImageIcon,
} from 'lucide-react';

export type CategoryRole = 'bgChip' | 'text' | 'bgHero' | 'borderHero';

/** Hue + icon for each existing category id in lib/tools.ts */
export const CATEGORY_THEME: Record<
  string,
  { hue: number; icon: LucideIcon; label: string }
> = {
  data:       { hue: 150, icon: Braces,     label: 'Data & Conversion' },
  encoding:   { hue: 45,  icon: Lock,       label: 'Encoding & Security' },
  base64:     { hue: 280, icon: Binary,     label: 'Base64' },
  text:       { hue: 200, icon: Type,       label: 'Text & Format' },
  generators: { hue: 20,  icon: Sparkles,   label: 'Generators' },
  web:        { hue: 330, icon: Palette,    label: 'Web & Design' },
  dev:        { hue: 95,  icon: Terminal,   label: 'Dev Utilities' },
  formatters: { hue: 240, icon: Wand2,      label: 'Formatters' },
  social:     { hue: 0,   icon: Smartphone, label: 'Social Media' },
  pdf:        { hue: 8,   icon: FileText,   label: 'PDF Tools' },
  // fallback aliases matching playground design, so code from refs keeps working
  image:      { hue: 280, icon: ImageIcon,  label: 'Image Tools' },
  encode:     { hue: 45,  icon: Lock,       label: 'Encoders' },
  time:       { hue: 95,  icon: Clock,      label: 'Time & Date' },
};

export const DEFAULT_CATEGORY = {
  hue: 260,
  icon: Wrench,
  label: 'Tool',
} as const;

export function getCategoryTheme(id: string | undefined | null) {
  if (!id) return DEFAULT_CATEGORY;
  return CATEGORY_THEME[id] ?? DEFAULT_CATEGORY;
}

/**
 * Resolve an OKLCH color for a category hue.
 *
 * Roles:
 *   bgChip      — small icon-chip bg
 *   text        — icon / text color on a chip
 *   bgHero      — gradient start for hero card (or icon big chip bg)
 *   borderHero  — border for hero card
 *
 * Both `dark` and `light` variants are tuned for WCAG 4.5:1 contrast
 * against the surface tokens.
 */
export function catColor(
  hue: number,
  role: CategoryRole,
  theme: 'dark' | 'light' = 'dark'
): string {
  if (theme === 'dark') {
    switch (role) {
      case 'bgChip':     return `oklch(0.30 0.10 ${hue})`;
      case 'text':       return `oklch(0.85 0.20 ${hue})`;
      case 'bgHero':     return `oklch(0.25 0.10 ${hue})`;
      case 'borderHero': return `oklch(0.35 0.10 ${hue})`;
    }
  }
  switch (role) {
    case 'bgChip':     return `oklch(0.92 0.10 ${hue})`;
    case 'text':       return `oklch(0.50 0.20 ${hue})`;
    case 'bgHero':     return `oklch(0.95 0.10 ${hue})`;
    case 'borderHero': return `oklch(0.85 0.10 ${hue})`;
  }
}

/**
 * Theme-aware variant that works with a `currentTheme` string.
 * Produces inline CSS variables for tailwind / inline styles.
 */
export function catStyleChip(hue: number) {
  return {
    // light-first; dark overrides come from the parent `.dark` scope via CSS
    // variables — we emit OKLCH directly so no runtime theme read is needed.
    background: `oklch(0.92 0.10 ${hue})`,
    color:      `oklch(0.50 0.20 ${hue})`,
  } as const;
}

export function catStyleChipDark(hue: number) {
  return {
    background: `oklch(0.30 0.10 ${hue})`,
    color:      `oklch(0.85 0.20 ${hue})`,
  } as const;
}
