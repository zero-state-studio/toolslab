import {
  isValidBase,
  parseInBase,
  formatInBase,
  applyBitWidth,
  convertBases,
  baseName,
} from '@/lib/tools/number-base-converter';

describe('isValidBase', () => {
  it('accepts 2–36', () => {
    expect(isValidBase(2)).toBe(true);
    expect(isValidBase(36)).toBe(true);
  });
  it('rejects out of range', () => {
    expect(isValidBase(1)).toBe(false);
    expect(isValidBase(37)).toBe(false);
    expect(isValidBase(2.5)).toBe(false);
  });
});

describe('parseInBase', () => {
  it('parses decimal', () => {
    expect(parseInBase('255', 10).value).toBe(255n);
  });
  it('parses hex case-insensitively', () => {
    expect(parseInBase('FF', 16).value).toBe(255n);
    expect(parseInBase('ff', 16).value).toBe(255n);
  });
  it('parses binary', () => {
    expect(parseInBase('1010', 2).value).toBe(10n);
  });
  it('strips 0x / 0b / 0o prefixes', () => {
    expect(parseInBase('0xff', 16).value).toBe(255n);
    expect(parseInBase('0b1010', 2).value).toBe(10n);
    expect(parseInBase('0o17', 8).value).toBe(15n);
  });
  it('handles negatives', () => {
    expect(parseInBase('-10', 10).value).toBe(-10n);
  });
  it('ignores underscores and spaces', () => {
    expect(parseInBase('1010_1010', 2).value).toBe(170n);
    expect(parseInBase('1 000', 10).value).toBe(1000n);
  });
  it('parses base 36', () => {
    expect(parseInBase('z', 36).value).toBe(35n);
  });
  it('handles very large numbers (BigInt)', () => {
    const big = '9'.repeat(40);
    expect(parseInBase(big, 10).value).toBe(BigInt(big));
  });
  it('rejects invalid digit for base', () => {
    const r = parseInBase('2', 2);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Invalid digit');
  });
  it('rejects empty', () => {
    expect(parseInBase('   ', 10).ok).toBe(false);
  });
  it('rejects invalid base', () => {
    expect(parseInBase('1', 40).ok).toBe(false);
  });
});

describe('formatInBase', () => {
  it('formats decimal to hex', () => {
    expect(formatInBase(255n, 16)).toBe('ff');
  });
  it('formats decimal to binary', () => {
    expect(formatInBase(10n, 2)).toBe('1010');
  });
  it('formats zero', () => {
    expect(formatInBase(0n, 16)).toBe('0');
  });
  it('keeps the sign', () => {
    expect(formatInBase(-255n, 16)).toBe('-ff');
  });
  it('formats base 36', () => {
    expect(formatInBase(35n, 36)).toBe('z');
  });
});

describe('applyBitWidth', () => {
  it('wraps 255 to -1 as signed 8-bit', () => {
    expect(applyBitWidth(255n, 8, true)).toBe(-1n);
  });
  it('keeps 255 as unsigned 8-bit', () => {
    expect(applyBitWidth(255n, 8, false)).toBe(255n);
  });
  it('wraps -1 to 255 unsigned 8-bit', () => {
    expect(applyBitWidth(-1n, 8, false)).toBe(255n);
  });
  it('wraps 256 to 0 in 8-bit', () => {
    expect(applyBitWidth(256n, 8, false)).toBe(0n);
  });
  it('handles 16-bit signed boundary', () => {
    expect(applyBitWidth(32768n, 16, true)).toBe(-32768n);
  });
});

describe('convertBases', () => {
  it('converts decimal to all bases', () => {
    const r = convertBases('255', 10);
    expect(r.success).toBe(true);
    expect(r.binary).toBe('11111111');
    expect(r.octal).toBe('377');
    expect(r.hexadecimal).toBe('ff');
    expect(r.decimal).toBe('255');
  });

  it('converts hex to decimal', () => {
    expect(convertBases('ff', 16).decimal).toBe('255');
  });

  it('includes custom base output for non-standard bases', () => {
    const r = convertBases('z', 36);
    expect(r.custom).toEqual({ base: 36, value: 'z' });
    expect(r.decimal).toBe('35');
  });

  it('applies signed 8-bit interpretation', () => {
    const r = convertBases('ff', 16, { bitWidth: 8, signed: true });
    expect(r.decimal).toBe('-1');
  });

  it('applies unsigned bit width wrap', () => {
    const r = convertBases('256', 10, { bitWidth: 8, signed: false });
    expect(r.decimal).toBe('0');
  });

  it('returns error on invalid input', () => {
    const r = convertBases('xyz', 10);
    expect(r.success).toBe(false);
  });
});

describe('baseName', () => {
  it('names common bases', () => {
    expect(baseName(2)).toBe('Binary');
    expect(baseName(16)).toBe('Hexadecimal');
    expect(baseName(5)).toBe('Base 5');
  });
});
