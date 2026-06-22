/**
 * SVG optimization powered by SVGO.
 *
 * The optimizer itself is dynamically imported from SVGO's browser build
 * (`svgo/browser`) so it never pulls Node-only modules into the bundle and
 * stays out of the initial chunk. Pure helpers (detection, sizing, savings,
 * config building) are unit-tested directly. All processing is client-side.
 */

import type { Config } from 'svgo';

export interface SvgOptimizeOptions {
  /** Run SVGO repeatedly until the output stops shrinking. Default true. */
  multipass?: boolean;
  /** Pretty-print the output instead of minifying onto one line. Default false. */
  prettify?: boolean;
}

export interface SvgOptimizeResult {
  success: boolean;
  data?: string;
  error?: string;
  originalSize?: number;
  optimizedSize?: number;
  savedPercent?: number;
}

/** UTF-8 byte length of a string. */
export function svgByteSize(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return Buffer.byteLength(text, 'utf8');
}

/** Whether the input looks like an SVG document. */
export function isSvg(text: string): boolean {
  return /<svg[\s>]/i.test(text);
}

/** Percentage saved going from original to optimized (0–100, never negative). */
export function computeSavedPercent(original: number, optimized: number): number {
  if (original <= 0) return 0;
  return Math.max(0, Math.round((1 - optimized / original) * 100));
}

/**
 * Build an SVGO config. SVGO v4's default preset already keeps `viewBox`
 * (removing it breaks responsive scaling), so the bare preset is what we want.
 */
export function buildSvgoConfig(options: SvgOptimizeOptions = {}): Config {
  const plugins: Config['plugins'] = ['preset-default'];
  return {
    multipass: options.multipass ?? true,
    js2svg: { pretty: options.prettify ?? false, indent: 2 },
    plugins,
  };
}

/** Optimize an SVG string (browser only — dynamically imports SVGO). */
export async function optimizeSvg(
  svg: string,
  options: SvgOptimizeOptions = {}
): Promise<SvgOptimizeResult> {
  if (!svg || !svg.trim()) {
    return { success: false, error: 'Input required' };
  }
  if (!isSvg(svg)) {
    return { success: false, error: 'That does not look like an SVG file' };
  }
  try {
    const { optimize } = await import('svgo/browser');
    const result = optimize(svg, buildSvgoConfig(options));
    const originalSize = svgByteSize(svg);
    const optimizedSize = svgByteSize(result.data);
    return {
      success: true,
      data: result.data,
      originalSize,
      optimizedSize,
      savedPercent: computeSavedPercent(originalSize, optimizedSize),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `Could not optimize SVG: ${error.message}` : 'Could not optimize SVG',
    };
  }
}
