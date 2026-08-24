import {
  clampQuality,
  scaleForDpi,
  imageExtension,
  mimeForFormat,
  buildImageFileName,
  resolvePages,
} from '@/lib/tools/pdf-to-jpg';

describe('clampQuality', () => {
  it('keeps values within 0.1–1', () => {
    expect(clampQuality(0.8)).toBe(0.8);
  });
  it('clamps above 1', () => {
    expect(clampQuality(1.5)).toBe(1);
  });
  it('clamps below 0.1', () => {
    expect(clampQuality(0)).toBe(0.1);
  });
  it('falls back to 0.92 for NaN', () => {
    expect(clampQuality(NaN)).toBe(0.92);
  });
});

describe('scaleForDpi', () => {
  it('returns 1 at 72 DPI', () => {
    expect(scaleForDpi(72)).toBe(1);
  });
  it('returns 2 at 144 DPI', () => {
    expect(scaleForDpi(144)).toBe(2);
  });
  it('returns ~2.78 at 200 DPI', () => {
    expect(scaleForDpi(200)).toBeCloseTo(2.777, 2);
  });
  it('defaults to 1 for invalid input', () => {
    expect(scaleForDpi(0)).toBe(1);
    expect(scaleForDpi(-5)).toBe(1);
    expect(scaleForDpi(NaN)).toBe(1);
  });
});

describe('imageExtension & mimeForFormat', () => {
  it('maps jpeg to jpg', () => {
    expect(imageExtension('jpeg')).toBe('jpg');
  });
  it('keeps png and webp', () => {
    expect(imageExtension('png')).toBe('png');
    expect(imageExtension('webp')).toBe('webp');
  });
  it('builds mime types', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg');
    expect(mimeForFormat('png')).toBe('image/png');
  });
});

describe('buildImageFileName', () => {
  it('zero-pads page numbers based on total', () => {
    expect(buildImageFileName('report', 3, 10, 'jpeg')).toBe(
      'report_page-03.jpg'
    );
  });
  it('uses width from total pages', () => {
    expect(buildImageFileName('doc', 7, 100, 'png')).toBe('doc_page-007.png');
  });
  it('strips .pdf extension from base', () => {
    expect(buildImageFileName('scan.pdf', 1, 1, 'jpeg')).toBe(
      'scan_page-1.jpg'
    );
  });
  it('falls back to document for empty base', () => {
    expect(buildImageFileName('', 1, 1, 'webp')).toBe('document_page-1.webp');
  });
});

describe('resolvePages', () => {
  it('returns all pages when selection empty', () => {
    expect(resolvePages(3)).toEqual([1, 2, 3]);
    expect(resolvePages(3, [])).toEqual([1, 2, 3]);
  });
  it('keeps only valid in-range pages', () => {
    expect(resolvePages(5, [2, 4])).toEqual([2, 4]);
  });
  it('drops out-of-range and non-integer entries', () => {
    expect(resolvePages(5, [0, 6, 2, 3.5, 3])).toEqual([2, 3]);
  });
  it('sorts and de-duplicates', () => {
    expect(resolvePages(5, [4, 1, 4, 2])).toEqual([1, 2, 4]);
  });
});
