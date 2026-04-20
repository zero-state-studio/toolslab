import {
  processRot13CaesarCipher,
  rot13,
  caesarEncode,
  caesarDecode,
} from '@/lib/tools/rot13-caesar-cipher';

describe('rot13-caesar-cipher', () => {
  describe('rot13 helper', () => {
    it('applies ROT13 to simple lowercase', () => {
      expect(rot13('hello')).toBe('uryyb');
    });

    it('applies ROT13 to mixed case', () => {
      expect(rot13('Hello World')).toBe('Uryyb Jbeyq');
    });

    it('is its own inverse (applying twice returns original)', () => {
      const input = 'The quick brown fox jumps over the lazy dog';
      expect(rot13(rot13(input))).toBe(input);
    });

    it('preserves non-alphabetic characters', () => {
      expect(rot13('Hello, World! 123')).toBe('Uryyb, Jbeyq! 123');
    });

    it('returns empty string for empty input', () => {
      expect(rot13('')).toBe('');
    });
  });

  describe('caesarEncode / caesarDecode', () => {
    it('encodes with shift 3 (classical Caesar)', () => {
      expect(caesarEncode('abc', 3)).toBe('def');
      expect(caesarEncode('ABC', 3)).toBe('DEF');
    });

    it('decodes with shift 3', () => {
      expect(caesarDecode('def', 3)).toBe('abc');
      expect(caesarDecode('DEF', 3)).toBe('ABC');
    });

    it('wraps around the alphabet', () => {
      expect(caesarEncode('xyz', 3)).toBe('abc');
      expect(caesarDecode('abc', 3)).toBe('xyz');
    });

    it('handles shift larger than 26', () => {
      expect(caesarEncode('abc', 29)).toBe('def');
    });

    it('handles negative shift (alias for decode)', () => {
      expect(caesarEncode('def', -3)).toBe('abc');
    });
  });

  describe('processRot13CaesarCipher (ROT13 mode)', () => {
    it('processes valid input in ROT13 mode by default', () => {
      const r = processRot13CaesarCipher('hello');
      expect(r.success).toBe(true);
      expect(r.result).toBe('uryyb');
      expect(r.metadata?.mode).toBe('rot13');
      expect(r.metadata?.shift).toBe(13);
    });

    it('handles empty input', () => {
      const r = processRot13CaesarCipher('');
      expect(r.success).toBe(true);
      expect(r.result).toBe('');
    });

    it('rejects null input', () => {
      const r = processRot13CaesarCipher(null as unknown as string);
      expect(r.success).toBe(false);
      expect(r.error).toBe('Input required');
    });

    it('rejects undefined input', () => {
      const r = processRot13CaesarCipher(undefined as unknown as string);
      expect(r.success).toBe(false);
    });
  });

  describe('processRot13CaesarCipher (encode mode)', () => {
    it('encodes with explicit shift', () => {
      const r = processRot13CaesarCipher('attack at dawn', {
        mode: 'encode',
        shift: 7,
      });
      expect(r.success).toBe(true);
      expect(r.result).toBe('haahjr ha khdu');
      expect(r.metadata?.mode).toBe('encode');
      expect(r.metadata?.shift).toBe(7);
    });

    it('rejects encode without shift', () => {
      const r = processRot13CaesarCipher('hello', { mode: 'encode' });
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/shift/i);
    });

    it('rejects shift out of range (> 25)', () => {
      const r = processRot13CaesarCipher('hello', {
        mode: 'encode',
        shift: 26,
      });
      expect(r.success).toBe(false);
    });

    it('rejects shift out of range (< 1)', () => {
      const r = processRot13CaesarCipher('hello', {
        mode: 'encode',
        shift: 0,
      });
      expect(r.success).toBe(false);
    });

    it('rejects non-integer shift', () => {
      const r = processRot13CaesarCipher('hello', {
        mode: 'encode',
        shift: 3.5,
      });
      expect(r.success).toBe(false);
    });

    it('rejects NaN shift', () => {
      const r = processRot13CaesarCipher('hello', {
        mode: 'encode',
        shift: NaN,
      });
      expect(r.success).toBe(false);
    });
  });

  describe('processRot13CaesarCipher (decode mode)', () => {
    it('decodes with explicit shift', () => {
      const r = processRot13CaesarCipher('haahjr ha khdu', {
        mode: 'decode',
        shift: 7,
      });
      expect(r.success).toBe(true);
      expect(r.result).toBe('attack at dawn');
    });

    it('encode+decode roundtrip with shift 5', () => {
      const plain = 'The quick brown fox jumps over the lazy dog';
      const enc = processRot13CaesarCipher(plain, { mode: 'encode', shift: 5 });
      const dec = processRot13CaesarCipher(enc.result ?? '', {
        mode: 'decode',
        shift: 5,
      });
      expect(dec.result).toBe(plain);
    });
  });

  describe('processRot13CaesarCipher (brute-force mode)', () => {
    it('returns 25 rotations', () => {
      const r = processRot13CaesarCipher('hello', { mode: 'brute-force' });
      expect(r.success).toBe(true);
      expect(r.rotations).toHaveLength(25);
      expect(r.rotations?.[12]?.text).toBe('uryyb'); // shift 13 = ROT13
    });

    it('includes shift values 1 through 25', () => {
      const r = processRot13CaesarCipher('hello', { mode: 'brute-force' });
      const shifts = r.rotations?.map((rot) => rot.shift) ?? [];
      expect(shifts).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    });
  });

  describe('edge cases', () => {
    it('handles unicode / non-ASCII characters by preserving them', () => {
      expect(rot13('café')).toBe('pnsé');
      expect(rot13('日本語')).toBe('日本語');
    });

    it('handles very large input', () => {
      const large = 'a'.repeat(100_000);
      const r = processRot13CaesarCipher(large);
      expect(r.success).toBe(true);
      expect(r.result?.length).toBe(100_000);
      expect(r.result?.charAt(0)).toBe('n');
    });

    it('handles input with only special characters', () => {
      expect(rot13('!!! 123 ???')).toBe('!!! 123 ???');
    });
  });
});
