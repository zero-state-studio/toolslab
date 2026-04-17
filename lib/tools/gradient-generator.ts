export type GradientType = 'linear' | 'radial' | 'conic';
export type RadialShape = 'circle' | 'ellipse';
export type RadialSize =
  | 'closest-side'
  | 'closest-corner'
  | 'farthest-side'
  | 'farthest-corner';

export interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
  alpha?: number; // 0-1
}

export interface GradientConfig {
  type: GradientType;
  angle?: number; // for linear gradients (0-360)
  shape?: RadialShape; // for radial gradients
  size?: RadialSize; // for radial gradients
  position?: { x: number; y: number }; // for radial/conic gradients (0-100)
  colorStops: ColorStop[];
}

export interface GradientPreset {
  id: string;
  name: string;
  category: string;
  gradient: GradientConfig;
}

export interface GradientResult {
  success: boolean;
  css?: string;
  tailwindClass?: string;
  svg?: string;
  error?: string;
}

export interface ColorConversion {
  hex: string;
  rgb: { r: number; g: number; b: number; a?: number };
  hsl: { h: number; s: number; l: number; a?: number };
  hsv: { h: number; s: number; v: number; a?: number };
}

/**
 * Generate CSS gradient from configuration
 */
export function generateGradientCSS(config: GradientConfig): GradientResult {
  try {
    if (!config.colorStops || config.colorStops.length === 0) {
      return { success: false, error: 'At least one color stop is required' };
    }

    // Sort color stops by position
    const sortedStops = [...config.colorStops].sort(
      (a, b) => a.position - b.position
    );

    let css = '';

    switch (config.type) {
      case 'linear':
        css = generateLinearGradient(config, sortedStops);
        break;
      case 'radial':
        css = generateRadialGradient(config, sortedStops);
        break;
      case 'conic':
        css = generateConicGradient(config, sortedStops);
        break;
      default:
        return { success: false, error: 'Invalid gradient type' };
    }

    // Generate Tailwind class equivalent
    const tailwindClass = generateTailwindClass(config);

    // Generate SVG version
    const svg = generateSVGGradient(config, sortedStops);

    return {
      success: true,
      css,
      tailwindClass,
      svg,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to generate gradient',
    };
  }
}

/**
 * Generate linear gradient CSS
 */
function generateLinearGradient(
  config: GradientConfig,
  stops: ColorStop[]
): string {
  const angle = config.angle ?? 90;
  const colorStops = stops
    .map((stop) => {
      const color =
        stop.alpha !== undefined && stop.alpha < 1
          ? addAlphaToColor(stop.color, stop.alpha)
          : stop.color;
      return `${color} ${stop.position}%`;
    })
    .join(', ');

  return `linear-gradient(${angle}deg, ${colorStops})`;
}

/**
 * Generate radial gradient CSS
 */
function generateRadialGradient(
  config: GradientConfig,
  stops: ColorStop[]
): string {
  const shape = config.shape ?? 'ellipse';
  const size = config.size ?? 'farthest-corner';
  const position = config.position ?? { x: 50, y: 50 };

  const colorStops = stops
    .map((stop) => {
      const color =
        stop.alpha !== undefined && stop.alpha < 1
          ? addAlphaToColor(stop.color, stop.alpha)
          : stop.color;
      return `${color} ${stop.position}%`;
    })
    .join(', ');

  return `radial-gradient(${shape} ${size} at ${position.x}% ${position.y}%, ${colorStops})`;
}

/**
 * Generate conic gradient CSS
 */
function generateConicGradient(
  config: GradientConfig,
  stops: ColorStop[]
): string {
  const angle = config.angle ?? 0;
  const position = config.position ?? { x: 50, y: 50 };

  const colorStops = stops
    .map((stop) => {
      const color =
        stop.alpha !== undefined && stop.alpha < 1
          ? addAlphaToColor(stop.color, stop.alpha)
          : stop.color;
      return `${color} ${stop.position}%`;
    })
    .join(', ');

  return `conic-gradient(from ${angle}deg at ${position.x}% ${position.y}%, ${colorStops})`;
}

/**
 * Generate Tailwind CSS class (approximation)
 */
function generateTailwindClass(config: GradientConfig): string {
  if (config.colorStops.length < 2) return '';

  const firstColor = config.colorStops[0];
  const lastColor = config.colorStops[config.colorStops.length - 1];

  // This is a simplified mapping - full Tailwind support would require custom classes
  const direction =
    config.type === 'linear' && config.angle !== undefined
      ? getTailwindDirection(config.angle)
      : 'to-r';

  return `bg-gradient-${direction} from-${getTailwindColor(firstColor.color)} to-${getTailwindColor(lastColor.color)}`;
}

/**
 * Generate SVG gradient definition
 */
function generateSVGGradient(
  config: GradientConfig,
  stops: ColorStop[]
): string {
  const gradientId = `gradient-${Date.now()}`;

  let gradientElement = '';

  switch (config.type) {
    case 'linear': {
      const angle = config.angle ?? 90;
      const { x1, y1, x2, y2 } = angleToSVGCoords(angle);

      gradientElement = `<linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
      break;
    }
    case 'radial': {
      const position = config.position ?? { x: 50, y: 50 };
      gradientElement = `<radialGradient id="${gradientId}" cx="${position.x}%" cy="${position.y}%">`;
      break;
    }
    case 'conic':
      // SVG doesn't natively support conic gradients, would need complex implementation
      return 'Conic gradients not supported in SVG format';
  }

  const stopElements = stops
    .map((stop) => {
      const color =
        stop.alpha !== undefined && stop.alpha < 1
          ? addAlphaToColor(stop.color, stop.alpha)
          : stop.color;
      return `  <stop offset="${stop.position}%" stop-color="${color}" />`;
    })
    .join('\n');

  const closingTag =
    config.type === 'linear' ? '</linearGradient>' : '</radialGradient>';

  return `<defs>
  ${gradientElement}
${stopElements}
  ${closingTag}
</defs>
<rect width="100%" height="100%" fill="url(#${gradientId})" />`;
}

/**
 * Convert angle to SVG linear gradient coordinates
 */
function angleToSVGCoords(angle: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const radians = ((angle - 90) * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);

  return {
    x1: 50 - x * 50,
    y1: 50 - y * 50,
    x2: 50 + x * 50,
    y2: 50 + y * 50,
  };
}

/**
 * Add alpha channel to color
 */
function addAlphaToColor(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
  }

  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }

  if (color.startsWith('hsl(')) {
    return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  }

  return color;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Get Tailwind direction class from angle
 */
function getTailwindDirection(angle: number): string {
  const normalizedAngle = ((angle % 360) + 360) % 360;

  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'to-t';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'to-tr';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'to-r';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'to-br';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'to-b';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'to-bl';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'to-l';
  if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'to-tl';

  return 'to-r';
}

/**
 * Convert color to approximate Tailwind color name
 */
function getTailwindColor(color: string): string {
  // This is a simplified mapping - would need a comprehensive color dictionary
  const rgb = hexToRgb(color);
  if (!rgb) return 'gray-500';

  const { r, g, b } = rgb;

  // Basic color detection
  if (r > 200 && g < 100 && b < 100) return 'red-500';
  if (r < 100 && g > 200 && b < 100) return 'green-500';
  if (r < 100 && g < 100 && b > 200) return 'blue-500';
  if (r > 200 && g > 200 && b < 100) return 'yellow-500';
  if (r > 200 && g < 100 && b > 200) return 'purple-500';
  if (r < 100 && g > 200 && b > 200) return 'cyan-500';
  if (r > 200 && g > 150 && b < 100) return 'orange-500';
  if (r > 200 && g > 150 && b > 150) return 'pink-500';

  return 'gray-500';
}

/**
 * Generate random gradient with color harmony
 */
export function generateRandomGradient(
  type: GradientType = 'linear'
): GradientConfig {
  const colorSchemes = [
    // Complementary
    [0, 180],
    // Triadic
    [0, 120, 240],
    // Analogous
    [0, 30, 60],
    // Split complementary
    [0, 150, 210],
  ];

  const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
  const baseHue = Math.floor(Math.random() * 360);

  const colorStops: ColorStop[] = scheme.map((offset, index) => {
    const hue = (baseHue + offset) % 360;
    const saturation = 60 + Math.random() * 40; // 60-100%
    const lightness = 40 + Math.random() * 30; // 40-70%

    const rgb = hslToRgb(hue, saturation, lightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    return {
      id: `stop-${index}`,
      color: hex,
      position: (index / (scheme.length - 1)) * 100,
    };
  });

  const config: GradientConfig = {
    type,
    colorStops,
  };

  if (type === 'linear') {
    config.angle = Math.floor(Math.random() * 360);
  } else if (type === 'radial') {
    config.shape = Math.random() > 0.5 ? 'circle' : 'ellipse';
    config.size = [
      'closest-side',
      'closest-corner',
      'farthest-side',
      'farthest-corner',
    ][Math.floor(Math.random() * 4)] as RadialSize;
    config.position = {
      x: 30 + Math.random() * 40, // 30-70%
      y: 30 + Math.random() * 40, // 30-70%
    };
  } else if (type === 'conic') {
    config.angle = Math.floor(Math.random() * 360);
    config.position = {
      x: 40 + Math.random() * 20, // 40-60%
      y: 40 + Math.random() * 20, // 40-60%
    };
  }

  return config;
}

/**
 * Predefined gradient presets
 */
export const gradientPresets: GradientPreset[] = [
  // Sunset category
  {
    id: 'sunset-1',
    name: 'Warm Sunset',
    category: 'sunset',
    gradient: {
      type: 'linear',
      angle: 45,
      colorStops: [
        { id: '1', color: '#ff9a9e', position: 0 },
        { id: '2', color: '#fecfef', position: 50 },
        { id: '3', color: '#fecfef', position: 100 },
      ],
    },
  },
  {
    id: 'sunset-2',
    name: 'Orange Sunset',
    category: 'sunset',
    gradient: {
      type: 'linear',
      angle: 135,
      colorStops: [
        { id: '1', color: '#ff7e5f', position: 0 },
        { id: '2', color: '#feb47b', position: 100 },
      ],
    },
  },

  // Ocean category
  {
    id: 'ocean-1',
    name: 'Deep Ocean',
    category: 'ocean',
    gradient: {
      type: 'linear',
      angle: 180,
      colorStops: [
        { id: '1', color: '#667eea', position: 0 },
        { id: '2', color: '#764ba2', position: 100 },
      ],
    },
  },
  {
    id: 'ocean-2',
    name: 'Tropical Waters',
    category: 'ocean',
    gradient: {
      type: 'radial',
      shape: 'ellipse',
      size: 'farthest-corner',
      position: { x: 50, y: 50 },
      colorStops: [
        { id: '1', color: '#4facfe', position: 0 },
        { id: '2', color: '#00f2fe', position: 100 },
      ],
    },
  },

  // Neon category
  {
    id: 'neon-1',
    name: 'Electric Purple',
    category: 'neon',
    gradient: {
      type: 'linear',
      angle: 45,
      colorStops: [
        { id: '1', color: '#667eea', position: 0 },
        { id: '2', color: '#764ba2', position: 100 },
      ],
    },
  },
  {
    id: 'neon-2',
    name: 'Cyber Pink',
    category: 'neon',
    gradient: {
      type: 'conic',
      angle: 0,
      position: { x: 50, y: 50 },
      colorStops: [
        { id: '1', color: '#ff006e', position: 0 },
        { id: '2', color: '#fb5607', position: 50 },
        { id: '3', color: '#ffbe0b', position: 100 },
      ],
    },
  },

  // Pastel category
  {
    id: 'pastel-1',
    name: 'Soft Pastel',
    category: 'pastel',
    gradient: {
      type: 'linear',
      angle: 90,
      colorStops: [
        { id: '1', color: '#ffecd2', position: 0 },
        { id: '2', color: '#fcb69f', position: 100 },
      ],
    },
  },
  {
    id: 'pastel-2',
    name: 'Cotton Candy',
    category: 'pastel',
    gradient: {
      type: 'radial',
      shape: 'circle',
      size: 'farthest-side',
      position: { x: 50, y: 50 },
      colorStops: [
        { id: '1', color: '#a8edea', position: 0 },
        { id: '2', color: '#fed6e3', position: 100 },
      ],
    },
  },
];

/**
 * Extract colors from gradient for palette generation
 */
export function extractColorsFromGradient(config: GradientConfig): string[] {
  return config.colorStops.map((stop) => stop.color);
}

/**
 * Split a string at top-level commas (ignoring commas inside parentheses)
 */
function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Normalize a color string to #RRGGBB hex. Returns null for named/unsupported colors.
 */
function normalizeColorToHex(color: string): string | null {
  const c = color.trim();
  // Already valid 6-digit hex
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  // 3-digit hex → expand
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  }
  // 8-digit hex (with alpha) → strip alpha
  if (/^#[0-9a-f]{8}$/i.test(c)) return c.slice(0, 7);
  // rgb / rgba
  const rgbMatch = c.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }
  // hsl / hsla
  const hslMatch = c.match(/^hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (hslMatch) {
    const rgb = hslToRgb(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }
  return null;
}

/**
 * Parse a single color stop string into a ColorStop object
 */
function parseColorStopStr(part: string, index: number, total: number): ColorStop {
  const trimmed = part.trim();
  // Match trailing percentage (handles colors with commas inside parens because we already split at top-level)
  const trailingPct = trimmed.match(/^([\s\S]+?)\s+([\d.]+)%(?:\s+[\d.]+%)?$/);
  let colorStr: string;
  let position: number;

  if (trailingPct) {
    colorStr = trailingPct[1].trim();
    position = parseFloat(trailingPct[2]);
  } else {
    colorStr = trimmed;
    position = total <= 1 ? 0 : Math.round((index / (total - 1)) * 1000) / 10;
  }

  const hex = normalizeColorToHex(colorStr);
  return {
    id: `stop-${index}-${Date.now() + index}`,
    color: hex ?? (colorStr.startsWith('#') ? colorStr : '#808080'),
    position,
  };
}

function parseLinearArgs(parts: string[]): GradientConfig | null {
  let angle = 90;
  let colorStartIndex = 0;
  const first = parts[0];

  if (/^[\d.]+deg$/i.test(first)) {
    angle = parseFloat(first);
    colorStartIndex = 1;
  } else if (/^to\s+/i.test(first)) {
    const dirMap: Record<string, number> = {
      'to right': 90, 'to left': 270, 'to bottom': 180, 'to top': 0,
      'to bottom right': 135, 'to right bottom': 135,
      'to bottom left': 225, 'to left bottom': 225,
      'to top right': 45, 'to right top': 45,
      'to top left': 315, 'to left top': 315,
    };
    angle = dirMap[first.toLowerCase()] ?? 90;
    colorStartIndex = 1;
  }

  const stopParts = parts.slice(colorStartIndex);
  if (stopParts.length < 2) return null;
  const colorStops = stopParts.map((p, i) => parseColorStopStr(p, i, stopParts.length));
  return { type: 'linear', angle, colorStops };
}

function parseRadialArgs(parts: string[]): GradientConfig | null {
  let shape: RadialShape = 'ellipse';
  let size: RadialSize = 'farthest-corner';
  let position = { x: 50, y: 50 };
  let colorStartIndex = 0;
  const first = parts[0];

  if (/^(?:circle|ellipse|closest|farthest|at\s)/i.test(first)) {
    const shapeM = first.match(/\b(circle|ellipse)\b/i);
    if (shapeM) shape = shapeM[1].toLowerCase() as RadialShape;
    const sizeM = first.match(/\b(closest-side|closest-corner|farthest-side|farthest-corner)\b/i);
    if (sizeM) size = sizeM[1].toLowerCase() as RadialSize;
    const posM = first.match(/at\s+([\d.]+)%\s+([\d.]+)%/i);
    if (posM) position = { x: parseFloat(posM[1]), y: parseFloat(posM[2]) };
    colorStartIndex = 1;
  }

  const stopParts = parts.slice(colorStartIndex);
  if (stopParts.length < 2) return null;
  const colorStops = stopParts.map((p, i) => parseColorStopStr(p, i, stopParts.length));
  return { type: 'radial', shape, size, position, colorStops };
}

function parseConicArgs(parts: string[]): GradientConfig | null {
  let angle = 0;
  let position = { x: 50, y: 50 };
  let colorStartIndex = 0;
  const first = parts[0];

  if (/^from\s+|^at\s+/i.test(first)) {
    const angleM = first.match(/from\s+([\d.]+)deg/i);
    if (angleM) angle = parseFloat(angleM[1]);
    const posM = first.match(/at\s+([\d.]+)%\s+([\d.]+)%/i);
    if (posM) position = { x: parseFloat(posM[1]), y: parseFloat(posM[2]) };
    colorStartIndex = 1;
  }

  const stopParts = parts.slice(colorStartIndex);
  if (stopParts.length < 2) return null;
  const colorStops = stopParts.map((p, i) => parseColorStopStr(p, i, stopParts.length));
  return { type: 'conic', angle, position, colorStops };
}

/**
 * Parse a CSS gradient string into a GradientConfig.
 * Accepts: background/background-image prefix, vendor prefixes, bare gradient functions.
 * Returns null if parsing fails.
 */
export function parseGradientFromCSS(cssText: string): GradientConfig | null {
  try {
    const text = cssText
      .trim()
      .replace(/^(background-image|background)\s*:\s*/i, '')
      .replace(/;[\s\S]*$/, '')
      .trim()
      .replace(/^-(?:webkit|moz|ms|o)-/, '');

    const match = text.match(/^(linear|radial|conic)-gradient\(\s*([\s\S]+)\s*\)$/i);
    if (!match) return null;

    const gradType = match[1].toLowerCase() as GradientType;
    const parts = splitTopLevel(match[2]);

    if (gradType === 'linear') return parseLinearArgs(parts);
    if (gradType === 'radial') return parseRadialArgs(parts);
    if (gradType === 'conic') return parseConicArgs(parts);
    return null;
  } catch {
    return null;
  }
}

/**
 * Interpolate between two colors
 */
export function interpolateColors(
  color1: string,
  color2: string,
  factor: number
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Generate CSS with solid-color fallback (no vendor prefixes — all are obsolete since 2013)
 */
export function generateCompatibleCSS(config: GradientConfig): string {
  const result = generateGradientCSS(config);
  if (!result.success || !result.css) return '';

  const fallbackColor = config.colorStops[0]?.color || '#000000';

  return `/* Solid color fallback for very old browsers */
background: ${fallbackColor};

/* Standard — supported in all modern browsers */
background: ${result.css};`;
}
