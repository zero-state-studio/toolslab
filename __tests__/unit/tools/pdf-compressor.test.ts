import {
  compressionPresets,
  clampQuality,
  clampDpi,
  scaleForDpi,
  resolveRasterSettings,
  computeSavings,
  buildCompressedFileName,
  compressPdfLossless,
  compressPdf,
  buildCompressResult,
  isPdfFile,
} from '@/lib/tools/pdf-compressor';
import { PDFDocument } from 'pdf-lib';

/** Build a PDF buffer with N blank pages and verbose metadata. */
async function makePdf(pages: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]);
  doc.setTitle('A rather long document title used to pad the metadata');
  doc.setAuthor('ToolsLab test suite author with a long name');
  doc.setSubject('Subject string that exists only to add bytes');
  doc.setKeywords(['alpha', 'beta', 'gamma', 'delta']);
  const bytes = await doc.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

describe('clampQuality', () => {
  it('keeps values inside the valid range', () => {
    expect(clampQuality(0.5)).toBe(0.5);
  });

  it('clamps above 1 and below 0.1', () => {
    expect(clampQuality(5)).toBe(1);
    expect(clampQuality(0)).toBe(0.1);
    expect(clampQuality(-3)).toBe(0.1);
  });

  it('falls back to a default for non-finite input', () => {
    expect(clampQuality(NaN)).toBe(0.7);
    expect(clampQuality(Infinity)).toBe(0.7);
  });
});

describe('clampDpi', () => {
  it('keeps usable DPI values', () => {
    expect(clampDpi(150)).toBe(150);
  });

  it('rounds fractional DPI', () => {
    expect(clampDpi(119.6)).toBe(120);
  });

  it('clamps to the 36–300 window', () => {
    expect(clampDpi(1)).toBe(36);
    expect(clampDpi(4000)).toBe(300);
  });

  it('falls back to a default for non-finite input', () => {
    expect(clampDpi(NaN)).toBe(120);
  });
});

describe('scaleForDpi', () => {
  it('maps 72 DPI to scale 1', () => {
    expect(scaleForDpi(72)).toBe(1);
  });

  it('maps 144 DPI to scale 2', () => {
    expect(scaleForDpi(144)).toBe(2);
  });

  it('clamps before converting', () => {
    expect(scaleForDpi(10_000)).toBe(300 / 72);
  });
});

describe('compressionPresets', () => {
  it('gets more aggressive from light to strong', () => {
    expect(compressionPresets.light.dpi).toBeGreaterThan(
      compressionPresets.balanced.dpi
    );
    expect(compressionPresets.balanced.dpi).toBeGreaterThan(
      compressionPresets.strong.dpi
    );
    expect(compressionPresets.light.quality).toBeGreaterThan(
      compressionPresets.strong.quality
    );
  });

  it('keeps every preset within the clamped ranges', () => {
    for (const preset of Object.values(compressionPresets)) {
      expect(clampDpi(preset.dpi)).toBe(preset.dpi);
      expect(clampQuality(preset.quality)).toBe(preset.quality);
    }
  });
});

describe('resolveRasterSettings', () => {
  it('returns the named preset unchanged', () => {
    expect(resolveRasterSettings('light')).toEqual(compressionPresets.light);
  });

  it('merges custom values over the balanced baseline', () => {
    expect(
      resolveRasterSettings('custom', { dpi: 200, grayscale: true })
    ).toEqual({
      dpi: 200,
      quality: compressionPresets.balanced.quality,
      grayscale: true,
    });
  });

  it('clamps out-of-range custom values', () => {
    expect(resolveRasterSettings('custom', { dpi: 9999, quality: 12 })).toEqual(
      {
        dpi: 300,
        quality: 1,
        grayscale: false,
      }
    );
  });

  it('ignores custom values for named levels', () => {
    expect(resolveRasterSettings('strong', { dpi: 300 })).toEqual(
      compressionPresets.strong
    );
  });

  it('coerces a missing grayscale flag to false', () => {
    expect(resolveRasterSettings('custom', {}).grayscale).toBe(false);
  });
});

describe('computeSavings', () => {
  it('computes bytes and percentage saved', () => {
    expect(computeSavings(1000, 250)).toEqual({
      originalSize: 1000,
      compressedSize: 250,
      savedBytes: 750,
      savedPercent: 75,
    });
  });

  it('rounds the percentage to one decimal', () => {
    expect(computeSavings(3000, 2000).savedPercent).toBe(33.3);
  });

  it('reports negative savings when the file grew', () => {
    const stats = computeSavings(100, 150);
    expect(stats.savedBytes).toBe(-50);
    expect(stats.savedPercent).toBe(-50);
  });

  it('reports zero for an identical size', () => {
    expect(computeSavings(500, 500).savedPercent).toBe(0);
  });

  it('avoids dividing by zero on an empty original', () => {
    expect(computeSavings(0, 0).savedPercent).toBe(0);
  });
});

describe('buildCompressedFileName', () => {
  it('appends the suffix before the extension', () => {
    expect(buildCompressedFileName('report.pdf')).toBe('report-compressed.pdf');
  });

  it('is case-insensitive on the extension', () => {
    expect(buildCompressedFileName('Report.PDF')).toBe('Report-compressed.pdf');
  });

  it('handles names without an extension', () => {
    expect(buildCompressedFileName('scan')).toBe('scan-compressed.pdf');
  });

  it('falls back to "document" for an empty name', () => {
    expect(buildCompressedFileName('')).toBe('document-compressed.pdf');
    expect(buildCompressedFileName('.pdf')).toBe('document-compressed.pdf');
  });

  it('accepts a custom suffix', () => {
    expect(buildCompressedFileName('a.pdf', '-small')).toBe('a-small.pdf');
  });

  it('keeps unicode file names intact', () => {
    expect(buildCompressedFileName('relazione-annuàle-2026.pdf')).toBe(
      'relazione-annuàle-2026-compressed.pdf'
    );
  });
});

describe('isPdfFile', () => {
  it('accepts a PDF mime type', () => {
    expect(
      isPdfFile(new File(['x'], 'a.bin', { type: 'application/pdf' }))
    ).toBe(true);
  });

  it('accepts a .pdf extension without a mime type', () => {
    expect(isPdfFile(new File(['x'], 'a.PDF', { type: '' }))).toBe(true);
  });

  it('rejects other files', () => {
    expect(isPdfFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBe(
      false
    );
  });
});

describe('buildCompressResult', () => {
  const original = new Uint8Array(1000);

  it('keeps the compressed bytes when they are smaller', () => {
    const compressed = new Uint8Array(400);
    const result = buildCompressResult(original, compressed, 'raster', 3);

    expect(result.bytes).toBe(compressed);
    expect(result.stats).toEqual({
      originalSize: 1000,
      compressedSize: 400,
      savedBytes: 600,
      savedPercent: 60,
    });
    expect(result.metadata).toEqual({
      mode: 'raster',
      pageCount: 3,
      improved: true,
    });
  });

  it('discards a bigger result and returns the original instead', () => {
    // Rasterising a PDF that shares one image across pages can grow it.
    const compressed = new Uint8Array(2500);
    const result = buildCompressResult(original, compressed, 'raster', 4);

    expect(result.bytes).toBe(original);
    expect(result.stats!.compressedSize).toBe(1000);
    expect(result.stats!.savedBytes).toBe(0);
    expect(result.metadata!.improved).toBe(false);
  });

  it('treats an equal size as no improvement', () => {
    const result = buildCompressResult(
      original,
      new Uint8Array(1000),
      'lossless',
      1
    );

    expect(result.bytes).toBe(original);
    expect(result.metadata!.improved).toBe(false);
  });

  it('never reports negative savings', () => {
    const sizes = [1, 999, 1000, 1001, 50_000];
    for (const size of sizes) {
      const result = buildCompressResult(
        original,
        new Uint8Array(size),
        'raster',
        1
      );
      expect(result.stats!.savedBytes).toBeGreaterThanOrEqual(0);
      expect(result.stats!.savedPercent).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('compressPdfLossless', () => {
  it('returns a valid, loadable PDF', async () => {
    const buffer = await makePdf(3);
    const result = await compressPdfLossless(buffer);

    expect(result.success).toBe(true);
    expect(result.bytes).toBeDefined();
    const reloaded = await PDFDocument.load(result.bytes!);
    expect(reloaded.getPageCount()).toBe(3);
  });

  it('strips document metadata', async () => {
    const buffer = await makePdf(1);
    const result = await compressPdfLossless(buffer);
    const reloaded = await PDFDocument.load(result.bytes!, {
      updateMetadata: false,
    });

    expect(reloaded.getTitle() || '').toBe('');
    expect(reloaded.getAuthor() || '').toBe('');
    expect(reloaded.getSubject() || '').toBe('');
  });

  it('never returns a file larger than the original', async () => {
    const buffer = await makePdf(2);
    const result = await compressPdfLossless(buffer);

    expect(result.stats!.compressedSize).toBeLessThanOrEqual(
      result.stats!.originalSize
    );
    expect(result.stats!.savedBytes).toBeGreaterThanOrEqual(0);
  });

  it('reports the mode, page count and improved flag', async () => {
    const buffer = await makePdf(4);
    const result = await compressPdfLossless(buffer);

    expect(result.metadata).toEqual({
      mode: 'lossless',
      pageCount: 4,
      improved: result.stats!.savedBytes > 0,
    });
  });

  it('falls back to the original bytes when the rewrite is not smaller', async () => {
    const buffer = await makePdf(1);
    const first = await compressPdfLossless(buffer);
    // Already stripped and object-streamed — a second pass cannot win.
    const second = await compressPdfLossless(
      first.bytes!.buffer.slice(
        first.bytes!.byteOffset,
        first.bytes!.byteOffset + first.bytes!.byteLength
      ) as ArrayBuffer
    );

    expect(second.success).toBe(true);
    expect(second.metadata!.improved).toBe(false);
    expect(second.stats!.savedBytes).toBe(0);
  });

  it('fails gracefully on a non-PDF buffer', async () => {
    const junk = new TextEncoder().encode('definitely not a pdf');
    const result = await compressPdfLossless(
      junk.buffer.slice(0, junk.byteLength) as ArrayBuffer
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Failed to compress PDF/);
    expect(result.bytes).toBeUndefined();
  });

  it('fails gracefully on an empty buffer', async () => {
    const result = await compressPdfLossless(new ArrayBuffer(0));
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('compressPdf', () => {
  it('dispatches lossless mode to the structural compressor', async () => {
    const buffer = await makePdf(2);
    const result = await compressPdf(buffer, { mode: 'lossless' });

    expect(result.success).toBe(true);
    expect(result.metadata!.mode).toBe('lossless');
    expect(result.metadata!.pageCount).toBe(2);
  });

  it('propagates errors from the underlying compressor', async () => {
    const result = await compressPdf(new ArrayBuffer(0), { mode: 'lossless' });
    expect(result.success).toBe(false);
  });
});
