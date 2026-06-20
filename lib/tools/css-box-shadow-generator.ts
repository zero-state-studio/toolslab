/**
 * CSS Box Shadow Generator — builds `box-shadow` declarations from one
 * or more shadow layers. Pure functions, safe to run anywhere.
 */

export interface BoxShadowLayer {
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  /** Hex color, e.g. "#000000". */
  color: string;
  /** 0–1 alpha applied to the color. */
  opacity: number;
}

export interface BoxShadowResult {
  success: boolean;
  /** The value only, e.g. "2px 2px 4px 0px rgba(0,0,0,0.25)". */
  value?: string;
  /** Full declaration, e.g. "box-shadow: 2px 2px 4px 0px rgba(0,0,0,0.25);". */
  declaration?: string;
  error?: string;
}

/** A sensible default shadow layer. */
export function defaultLayer(): BoxShadowLayer {
  return {
    inset: false,
    offsetX: 0,
    offsetY: 4,
    blur: 12,
    spread: 0,
    color: '#000000',
    opacity: 0.25,
  };
}

/** Clamp an alpha value into 0–1, trimming to 2 decimals. */
export function clampOpacity(opacity: number): number {
  if (Number.isNaN(opacity)) return 1;
  const v = Math.min(1, Math.max(0, opacity));
  return Math.round(v * 100) / 100;
}

/**
 * Convert a #RGB or #RRGGBB hex color plus alpha to an rgba() string.
 * Falls back to black on invalid input.
 */
export function hexToRgba(hex: string, opacity: number): string {
  const a = clampOpacity(opacity);
  let h = (hex || '').trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return `rgba(0, 0, 0, ${a})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Render a single shadow layer to its CSS fragment. */
export function shadowLayerToCSS(layer: BoxShadowLayer): string {
  const parts = [
    `${layer.offsetX}px`,
    `${layer.offsetY}px`,
    `${layer.blur}px`,
    `${layer.spread}px`,
    hexToRgba(layer.color, layer.opacity),
  ];
  const body = parts.join(' ');
  return layer.inset ? `inset ${body}` : body;
}

/**
 * Build a full box-shadow declaration from one or more layers.
 * Multiple layers are comma-separated, matching CSS syntax.
 */
export function generateBoxShadowCSS(
  layers: BoxShadowLayer[]
): BoxShadowResult {
  try {
    if (!layers || layers.length === 0) {
      return { success: false, error: 'Add at least one shadow layer' };
    }
    const value = layers.map(shadowLayerToCSS).join(', ');
    return {
      success: true,
      value,
      declaration: `box-shadow: ${value};`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface BoxShadowPreset {
  name: string;
  layers: BoxShadowLayer[];
}

/** A few ready-made shadow presets. */
export const BOX_SHADOW_PRESETS: BoxShadowPreset[] = [
  {
    name: 'Subtle',
    layers: [
      { inset: false, offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.12 },
    ],
  },
  {
    name: 'Medium',
    layers: [
      { inset: false, offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.25 },
    ],
  },
  {
    name: 'Large',
    layers: [
      { inset: false, offsetX: 0, offsetY: 10, blur: 30, spread: -5, color: '#000000', opacity: 0.3 },
    ],
  },
  {
    name: 'Inset',
    layers: [
      { inset: true, offsetX: 0, offsetY: 2, blur: 6, spread: 0, color: '#000000', opacity: 0.35 },
    ],
  },
  {
    name: 'Layered',
    layers: [
      { inset: false, offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.1 },
      { inset: false, offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: '#000000', opacity: 0.18 },
    ],
  },
];
