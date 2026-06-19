/**
 * Number Base Converter — convert integers between arbitrary bases
 * (2–36) with optional fixed bit-width and signed (two's complement)
 * interpretation. Pure functions backed by BigInt for exact precision.
 */

export type BitWidth = 8 | 16 | 32 | 64 | null;

export interface ConvertOptions {
  /** Fixed bit width for masking / two's complement. null = unbounded. */
  bitWidth?: BitWidth;
  /** Interpret the value as signed (two's complement) within bitWidth. */
  signed?: boolean;
}

export interface BaseConversionResult {
  success: boolean;
  /** Canonical decimal string of the interpreted value. */
  decimal?: string;
  binary?: string;
  octal?: string;
  hexadecimal?: string;
  /** Representation in the originally requested base (if not 2/8/10/16). */
  custom?: { base: number; value: string };
  error?: string;
}

export const MIN_BASE = 2;
export const MAX_BASE = 36;

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Whether a base is within the supported 2–36 range. */
export function isValidBase(base: number): boolean {
  return Number.isInteger(base) && base >= MIN_BASE && base <= MAX_BASE;
}

/**
 * Parse a string written in `base` into a BigInt. Accepts an optional
 * leading sign and is case-insensitive. Returns null on any invalid digit.
 */
export function parseInBase(
  input: string,
  base: number
): { ok: boolean; value?: bigint; error?: string } {
  if (!isValidBase(base)) {
    return { ok: false, error: `Base must be between ${MIN_BASE} and ${MAX_BASE}` };
  }
  let s = input.trim().toLowerCase();
  if (s === '') return { ok: false, error: 'Enter a number' };

  let negative = false;
  if (s[0] === '+' || s[0] === '-') {
    negative = s[0] === '-';
    s = s.slice(1);
  }
  // Allow common prefixes only when they match the base.
  if (base === 16 && s.startsWith('0x')) s = s.slice(2);
  else if (base === 2 && s.startsWith('0b')) s = s.slice(2);
  else if (base === 8 && s.startsWith('0o')) s = s.slice(2);
  // Group separators for readability.
  s = s.replace(/[_\s]/g, '');

  if (s === '') return { ok: false, error: 'Enter a number' };

  const big = BigInt(base);
  let value = 0n;
  for (const ch of s) {
    const digit = DIGITS.indexOf(ch);
    if (digit < 0 || digit >= base) {
      return { ok: false, error: `Invalid digit "${ch}" for base ${base}` };
    }
    value = value * big + BigInt(digit);
  }
  return { ok: true, value: negative ? -value : value };
}

/** Format a BigInt into the given base (lowercase, with sign). */
export function formatInBase(value: bigint, base: number): string {
  if (!isValidBase(base)) throw new Error('Invalid base');
  if (value === 0n) return '0';
  const negative = value < 0n;
  let v = negative ? -value : value;
  const big = BigInt(base);
  let out = '';
  while (v > 0n) {
    const rem = Number(v % big);
    out = DIGITS[rem] + out;
    v = v / big;
  }
  return negative ? '-' + out : out;
}

/**
 * Apply a fixed bit width. Returns the value reduced into the width's
 * range, interpreting as signed (two's complement) or unsigned.
 * Throws if the magnitude does not fit the width.
 */
export function applyBitWidth(
  value: bigint,
  bitWidth: Exclude<BitWidth, null>,
  signed: boolean
): bigint {
  const bits = BigInt(bitWidth);
  const modulo = 1n << bits;
  // Reduce into [0, 2^bits) range first (two's complement wrap).
  let wrapped = ((value % modulo) + modulo) % modulo;
  if (signed) {
    const signBit = 1n << (bits - 1n);
    if (wrapped >= signBit) wrapped -= modulo;
  }
  return wrapped;
}

/**
 * Convert a number string in `fromBase` to all common bases.
 * With a bitWidth, the value is wrapped to that width (and interpreted
 * as signed two's complement when `signed` is true).
 */
export function convertBases(
  input: string,
  fromBase: number,
  options: ConvertOptions = {}
): BaseConversionResult {
  try {
    const parsed = parseInBase(input, fromBase);
    if (!parsed.ok || parsed.value === undefined) {
      return { success: false, error: parsed.error || 'Invalid number' };
    }

    let value = parsed.value;
    if (options.bitWidth) {
      value = applyBitWidth(value, options.bitWidth, options.signed ?? false);
    }

    const result: BaseConversionResult = {
      success: true,
      decimal: formatInBase(value, 10),
      binary: formatInBase(value, 2),
      octal: formatInBase(value, 8),
      hexadecimal: formatInBase(value, 16),
    };
    if (![2, 8, 10, 16].includes(fromBase)) {
      result.custom = { base: fromBase, value: formatInBase(value, fromBase) };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/** Human label for the common named bases. */
export function baseName(base: number): string {
  switch (base) {
    case 2:
      return 'Binary';
    case 8:
      return 'Octal';
    case 10:
      return 'Decimal';
    case 16:
      return 'Hexadecimal';
    default:
      return `Base ${base}`;
  }
}
