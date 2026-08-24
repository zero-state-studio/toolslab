import {
  parsePageRanges,
  mergePdfBuffers,
  splitPdfBuffer,
  getPdfPageCount,
  isPdfFile,
  cutPointsToRanges,
} from '@/lib/tools/pdf-merger-splitter';
import { PDFDocument } from 'pdf-lib';

/** Build a PDF buffer with N blank pages for testing. */
async function makePdf(pages: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  const bytes = await doc.save();
  // Return a standalone ArrayBuffer slice.
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

describe('parsePageRanges', () => {
  it('parses a single page', () => {
    expect(parsePageRanges('3', 10)).toEqual({
      success: true,
      ranges: [[3, 3]],
    });
  });

  it('parses a simple range', () => {
    expect(parsePageRanges('2-5', 10)).toEqual({
      success: true,
      ranges: [[2, 5]],
    });
  });

  it('parses multiple comma-separated ranges', () => {
    expect(parsePageRanges('1-3, 5, 8-10', 10)).toEqual({
      success: true,
      ranges: [
        [1, 3],
        [5, 5],
        [8, 10],
      ],
    });
  });

  it('handles open-ended range as through last page', () => {
    expect(parsePageRanges('7-', 10)).toEqual({
      success: true,
      ranges: [[7, 10]],
    });
  });

  it('tolerates extra whitespace', () => {
    expect(parsePageRanges('  1 - 2 ,  4 ', 10).ranges).toEqual([
      [1, 2],
      [4, 4],
    ]);
  });

  it('rejects empty input', () => {
    expect(parsePageRanges('', 10).success).toBe(false);
  });

  it('rejects page above total', () => {
    const r = parsePageRanges('11', 10);
    expect(r.success).toBe(false);
    expect(r.error).toContain('out of range');
  });

  it('rejects page zero', () => {
    expect(parsePageRanges('0', 10).success).toBe(false);
  });

  it('rejects reversed range', () => {
    const r = parsePageRanges('5-2', 10);
    expect(r.success).toBe(false);
    expect(r.error).toContain('after end');
  });

  it('rejects garbage token', () => {
    expect(parsePageRanges('1-3, abc', 10).success).toBe(false);
  });

  it('rejects when document has no pages', () => {
    expect(parsePageRanges('1', 0).success).toBe(false);
  });
});

describe('isPdfFile', () => {
  it('accepts application/pdf type', () => {
    expect(isPdfFile(new File([''], 'a.pdf', { type: 'application/pdf' }))).toBe(
      true
    );
  });

  it('accepts .pdf extension without type', () => {
    expect(isPdfFile(new File([''], 'doc.PDF', { type: '' }))).toBe(true);
  });

  it('rejects non-pdf', () => {
    expect(isPdfFile(new File([''], 'a.txt', { type: 'text/plain' }))).toBe(
      false
    );
  });
});

describe('mergePdfBuffers', () => {
  it('merges two PDFs and sums page counts', async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    const r = await mergePdfBuffers([a, b]);
    expect(r.success).toBe(true);
    expect(r.metadata?.pageCount).toBe(5);
    expect(r.metadata?.sourceCount).toBe(2);
    expect(await getPdfPageCount(r.bytes!.buffer.slice(0) as ArrayBuffer)).toBe(
      5
    );
  });

  it('merges three PDFs in order', async () => {
    const r = await mergePdfBuffers([
      await makePdf(1),
      await makePdf(1),
      await makePdf(1),
    ]);
    expect(r.metadata?.pageCount).toBe(3);
  });

  it('rejects merging fewer than two files', async () => {
    const r = await mergePdfBuffers([await makePdf(2)]);
    expect(r.success).toBe(false);
    expect(r.error).toContain('at least two');
  });

  it('returns error on invalid buffer', async () => {
    const bad = new TextEncoder().encode('not a pdf').buffer;
    const r = await mergePdfBuffers([bad, bad]);
    expect(r.success).toBe(false);
  });
});

describe('cutPointsToRanges', () => {
  it('returns one range covering all pages when no cuts', () => {
    expect(cutPointsToRanges(10, [])).toEqual([[1, 10]]);
  });
  it('partitions at cut points', () => {
    expect(cutPointsToRanges(10, [3, 7])).toEqual([
      [1, 3],
      [4, 7],
      [8, 10],
    ]);
  });
  it('splits every page when cut after each', () => {
    expect(cutPointsToRanges(3, [1, 2])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });
  it('sorts and de-duplicates cuts', () => {
    expect(cutPointsToRanges(10, [7, 3, 7])).toEqual([
      [1, 3],
      [4, 7],
      [8, 10],
    ]);
  });
  it('ignores out-of-range cuts (>= total or < 1)', () => {
    expect(cutPointsToRanges(5, [0, 5, 10, 2])).toEqual([
      [1, 2],
      [3, 5],
    ]);
  });
  it('returns empty for zero pages', () => {
    expect(cutPointsToRanges(0, [1])).toEqual([]);
  });
});

describe('splitPdfBuffer', () => {
  it('splits into the requested ranges', async () => {
    const doc = await makePdf(10);
    const r = await splitPdfBuffer(doc, [
      [1, 3],
      [5, 5],
      [8, 10],
    ]);
    expect(r.success).toBe(true);
    expect(r.parts).toHaveLength(3);
    expect(r.parts![0]).toMatchObject({ label: '1-3', pageCount: 3 });
    expect(r.parts![1]).toMatchObject({ label: '5', pageCount: 1 });
    expect(r.parts![2]).toMatchObject({ label: '8-10', pageCount: 3 });
  });

  it('each part is a valid PDF with the right page count', async () => {
    const doc = await makePdf(6);
    const r = await splitPdfBuffer(doc, [[2, 4]]);
    const part = r.parts![0];
    const count = await getPdfPageCount(
      part.bytes.buffer.slice(0) as ArrayBuffer
    );
    expect(count).toBe(3);
  });

  it('rejects out-of-bounds range', async () => {
    const doc = await makePdf(3);
    const r = await splitPdfBuffer(doc, [[2, 9]]);
    expect(r.success).toBe(false);
    expect(r.error).toContain('out of bounds');
  });

  it('rejects empty ranges', async () => {
    const doc = await makePdf(3);
    const r = await splitPdfBuffer(doc, []);
    expect(r.success).toBe(false);
  });
});
