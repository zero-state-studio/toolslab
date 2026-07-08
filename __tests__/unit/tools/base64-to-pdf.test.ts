/**
 * Tests for Base64 to PDF converter
 * Focus: input-mistake recovery (double encoding, plain-text paste)
 * and actionable error reporting.
 */

import {
  base64ToPdf,
  isValidBase64,
  isPdfData,
  detectFileType,
  looksLikeNaturalText,
  normalizeBase64,
} from '@/lib/tools/base64-to-pdf';

// Minimal payload with a valid PDF header
const PDF_CONTENT = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF';
const PDF_BASE64 = Buffer.from(PDF_CONTENT).toString('base64');

const toBase64 = (s: string) => Buffer.from(s).toString('base64');

describe('base64ToPdf', () => {
  describe('valid input', () => {
    it('converts valid PDF Base64', async () => {
      const result = await base64ToPdf(PDF_BASE64);
      expect(result.success).toBe(true);
      expect(result.metadata?.isPdf).toBe(true);
      expect(result.wasDoubleEncoded).toBe(false);
    });

    it('handles data URL prefix', async () => {
      const result = await base64ToPdf(
        `data:application/pdf;base64,${PDF_BASE64}`
      );
      expect(result.success).toBe(true);
    });

    it('handles whitespace/newline-wrapped Base64 (MIME style)', async () => {
      const wrapped = PDF_BASE64.replace(/(.{64})/g, '$1\n');
      const result = await base64ToPdf(wrapped);
      expect(result.success).toBe(true);
    });
  });

  describe('double-encoded input recovery', () => {
    it('recovers double-encoded PDF and flags it', async () => {
      const doubleEncoded = toBase64(PDF_BASE64);
      const result = await base64ToPdf(doubleEncoded);
      expect(result.success).toBe(true);
      expect(result.wasDoubleEncoded).toBe(true);
      expect(result.metadata?.isPdf).toBe(true);
    });

    it('recovers triple-encoded PDF', async () => {
      const tripleEncoded = toBase64(toBase64(PDF_BASE64));
      const result = await base64ToPdf(tripleEncoded);
      expect(result.success).toBe(true);
      expect(result.wasDoubleEncoded).toBe(true);
    });

    it('does not flag single-encoded non-PDF as double-encoded', async () => {
      const result = await base64ToPdf(toBase64('just some text content'));
      expect(result.success).toBe(false);
      expect(result.wasDoubleEncoded).toBeUndefined();
    });
  });

  describe('plain-text paste detection', () => {
    it('rejects prose without punctuation (passes charset check)', async () => {
      const result = await base64ToPdf(
        'questo e il mio documento importante di prova'
      );
      expect(result.success).toBe(false);
      expect(result.inputLooksLikeText).toBe(true);
      expect(result.error).toContain('plain text, not Base64');
    });

    it('rejects prose with punctuation', async () => {
      const result = await base64ToPdf('Ciao, ecco il mio documento.');
      expect(result.success).toBe(false);
      expect(result.inputLooksLikeText).toBe(true);
    });

    it('does not misflag valid PDF Base64', async () => {
      const result = await base64ToPdf(PDF_BASE64);
      expect(result.inputLooksLikeText).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe('non-PDF Base64 errors', () => {
    it('includes decoded preview for readable text payloads', async () => {
      const result = await base64ToPdf(
        toBase64('Hello world, this is a plain text file content for testing')
      );
      expect(result.success).toBe(false);
      expect(result.decodedPreview).toContain('Hello world');
      expect(result.detectedFileType).toBe('plain text file');
    });

    it('detects PNG payloads', async () => {
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const result = await base64ToPdf(pngBytes.toString('base64'));
      expect(result.success).toBe(false);
      expect(result.detectedFileType).toBe('PNG image');
      expect(result.decodedPreview).toBeUndefined();
    });

    it('rejects invalid Base64 characters', async () => {
      const result = await base64ToPdf('!!!not-base64###');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid Base64 format');
    });

    it('skips header validation when disabled', async () => {
      const result = await base64ToPdf(toBase64('not a pdf'), {
        validatePdfHeader: false,
      });
      expect(result.success).toBe(true);
      expect(result.metadata?.isPdf).toBe(false);
    });
  });
});

describe('looksLikeNaturalText', () => {
  it.each([
    ['prose without punctuation', 'questo e un documento di testo', true],
    ['prose with punctuation', 'Hello, here is my document.', true],
    ['continuous base64', PDF_BASE64, false],
    ['base64 with padding', 'aGVsbG8=', false],
    ['MIME-wrapped base64 (76-char lines)', PDF_BASE64.replace(/(.{76})/g, '$1\n'), false],
    ['two words only', 'hello world', false],
    ['empty', '', false],
  ])('%s → %s', (_name, input, expected) => {
    expect(looksLikeNaturalText(input)).toBe(expected);
  });
});

describe('isPdfData', () => {
  it('finds %PDF- at offset within first 1024 bytes', () => {
    const padded = Buffer.concat([
      Buffer.from(' '.repeat(100)),
      Buffer.from(PDF_CONTENT),
    ]);
    expect(isPdfData(new Uint8Array(padded))).toBe(true);
  });

  it('rejects data without header', () => {
    expect(isPdfData(new Uint8Array(Buffer.from('no header here')))).toBe(
      false
    );
  });
});

describe('detectFileType', () => {
  it('detects JPEG', () => {
    expect(
      detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))
    ).toBe('JPEG image');
  });

  it('labels printable ASCII as plain text', () => {
    expect(detectFileType(new Uint8Array(Buffer.from('some text')))).toBe(
      'plain text file'
    );
  });
});

describe('normalizeBase64 / isValidBase64', () => {
  it('converts base64url and pads', () => {
    expect(normalizeBase64('a-b_c')).toBe('a+b/c===');
  });

  it('accepts standard base64', () => {
    expect(isValidBase64(PDF_BASE64)).toBe(true);
  });
});
