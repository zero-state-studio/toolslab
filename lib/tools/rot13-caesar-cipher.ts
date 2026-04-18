export type CipherMode = 'rot13' | 'encode' | 'decode' | 'brute-force';

export interface CipherOptions {
  mode?: CipherMode;
  shift?: number;
}

export interface CipherRotation {
  shift: number;
  text: string;
}

export interface CipherResult {
  success: boolean;
  result?: string;
  rotations?: CipherRotation[];
  error?: string;
  metadata?: {
    mode: CipherMode;
    shift: number;
    inputLength: number;
    outputLength: number;
  };
}

const A_LOWER = 97;
const A_UPPER = 65;

function normalizeShift(shift: number): number {
  const mod = ((shift % 26) + 26) % 26;
  return mod;
}

function rotate(text: string, shift: number): string {
  const s = normalizeShift(shift);
  if (s === 0) return text;

  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 97 && code <= 122) {
      out += String.fromCharCode(((code - A_LOWER + s) % 26) + A_LOWER);
    } else if (code >= 65 && code <= 90) {
      out += String.fromCharCode(((code - A_UPPER + s) % 26) + A_UPPER);
    } else {
      out += text[i];
    }
  }
  return out;
}

export function processRot13CaesarCipher(
  input: string,
  options: CipherOptions = {}
): CipherResult {
  if (input === null || input === undefined) {
    return { success: false, error: 'Input required' };
  }

  const mode: CipherMode = options.mode ?? 'rot13';

  try {
    if (mode === 'brute-force') {
      const rotations: CipherRotation[] = [];
      for (let i = 1; i <= 25; i++) {
        rotations.push({ shift: i, text: rotate(input, i) });
      }
      return {
        success: true,
        rotations,
        metadata: {
          mode,
          shift: 0,
          inputLength: input.length,
          outputLength: rotations.reduce((sum, r) => sum + r.text.length, 0),
        },
      };
    }

    let effectiveShift: number;
    if (mode === 'rot13') {
      effectiveShift = 13;
    } else {
      const rawShift = options.shift;
      if (rawShift === undefined || rawShift === null || Number.isNaN(rawShift)) {
        return { success: false, error: 'Shift value required for Caesar mode' };
      }
      if (!Number.isInteger(rawShift)) {
        return { success: false, error: 'Shift must be an integer' };
      }
      if (rawShift < 1 || rawShift > 25) {
        return { success: false, error: 'Shift must be between 1 and 25' };
      }
      effectiveShift = mode === 'decode' ? -rawShift : rawShift;
    }

    const result = rotate(input, effectiveShift);
    return {
      success: true,
      result,
      metadata: {
        mode,
        shift: normalizeShift(effectiveShift),
        inputLength: input.length,
        outputLength: result.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function rot13(input: string): string {
  return rotate(input, 13);
}

export function caesarEncode(input: string, shift: number): string {
  return rotate(input, shift);
}

export function caesarDecode(input: string, shift: number): string {
  return rotate(input, -shift);
}
