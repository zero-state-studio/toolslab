/**
 * PDF Merger & Splitter — client-side PDF operations using pdf-lib.
 *
 * Heavy library (pdf-lib) is loaded via dynamic import only when an
 * operation runs, keeping it out of the initial route chunk.
 */

import { fileToArrayBuffer, downloadPdf, formatFileSize } from './image-to-pdf';

export { fileToArrayBuffer, downloadPdf, formatFileSize };

export interface MergeResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
  metadata?: { pageCount: number; sourceCount: number };
}

export interface SplitPart {
  /** 1-based label of the range, e.g. "1-3" or "5". */
  label: string;
  bytes: Uint8Array;
  pageCount: number;
}

export interface SplitResult {
  success: boolean;
  parts?: SplitPart[];
  error?: string;
}

export interface ParsedRanges {
  success: boolean;
  /** Each range is an inclusive [start, end] pair, 1-based. */
  ranges?: [number, number][];
  error?: string;
}

/**
 * Validate that a File looks like a PDF (by type or extension).
 */
export function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Parse a page-range expression like "1-3, 5, 8-10" into inclusive
 * [start, end] pairs. Validates bounds against totalPages.
 *
 * Rules:
 *  - Comma-separated tokens; each token is "N" or "A-B".
 *  - Open-ended "A-" means A..totalPages.
 *  - Pages are 1-based; start must be <= end and within [1, totalPages].
 */
export function parsePageRanges(
  input: string,
  totalPages: number
): ParsedRanges {
  if (totalPages < 1) {
    return { success: false, error: 'Document has no pages' };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: 'Enter at least one page range' };
  }

  const ranges: [number, number][] = [];
  const tokens = trimmed.split(',');

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;

    const dashMatch = token.match(/^(\d+)\s*-\s*(\d*)$/);
    const singleMatch = token.match(/^(\d+)$/);

    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (n < 1 || n > totalPages) {
        return {
          success: false,
          error: `Page ${n} is out of range (1-${totalPages})`,
        };
      }
      ranges.push([n, n]);
    } else if (dashMatch) {
      const start = parseInt(dashMatch[1], 10);
      const end = dashMatch[2] === '' ? totalPages : parseInt(dashMatch[2], 10);
      if (start < 1 || start > totalPages) {
        return {
          success: false,
          error: `Page ${start} is out of range (1-${totalPages})`,
        };
      }
      if (end < 1 || end > totalPages) {
        return {
          success: false,
          error: `Page ${end} is out of range (1-${totalPages})`,
        };
      }
      if (start > end) {
        return {
          success: false,
          error: `Invalid range "${token}": start is after end`,
        };
      }
      ranges.push([start, end]);
    } else {
      return { success: false, error: `Invalid range token: "${token}"` };
    }
  }

  if (ranges.length === 0) {
    return { success: false, error: 'Enter at least one page range' };
  }

  return { success: true, ranges };
}

/**
 * Merge multiple PDF documents (as ArrayBuffers) into a single PDF.
 * Core function — accepts buffers so it is environment-agnostic and testable.
 */
export async function mergePdfBuffers(
  buffers: ArrayBuffer[]
): Promise<MergeResult> {
  try {
    if (buffers.length < 2) {
      return { success: false, error: 'Add at least two PDF files to merge' };
    }
    const { PDFDocument } = await import('pdf-lib');
    const merged = await PDFDocument.create();

    for (const buf of buffers) {
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const copied = await merged.copyPages(doc, doc.getPageIndices());
      copied.forEach((page) => merged.addPage(page));
    }

    const bytes = await merged.save();
    return {
      success: true,
      bytes,
      metadata: { pageCount: merged.getPageCount(), sourceCount: buffers.length },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to merge PDFs: ${error.message}`
          : 'Failed to merge PDFs',
    };
  }
}

/**
 * Split a PDF (as ArrayBuffer) into multiple documents, one per range.
 * Core function — accepts a buffer + parsed ranges so it is testable.
 */
export async function splitPdfBuffer(
  buffer: ArrayBuffer,
  ranges: [number, number][]
): Promise<SplitResult> {
  try {
    if (ranges.length === 0) {
      return { success: false, error: 'No page ranges provided' };
    }
    const { PDFDocument } = await import('pdf-lib');
    const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = source.getPageCount();

    const parts: SplitPart[] = [];
    for (const [start, end] of ranges) {
      if (start < 1 || end > totalPages || start > end) {
        return {
          success: false,
          error: `Range ${start}-${end} is out of bounds (1-${totalPages})`,
        };
      }
      const out = await PDFDocument.create();
      // Convert 1-based inclusive range to 0-based indices.
      const indices = [];
      for (let i = start - 1; i <= end - 1; i++) indices.push(i);
      const copied = await out.copyPages(source, indices);
      copied.forEach((page) => out.addPage(page));
      const bytes = await out.save();
      parts.push({
        label: start === end ? `${start}` : `${start}-${end}`,
        bytes,
        pageCount: indices.length,
      });
    }

    return { success: true, parts };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to split PDF: ${error.message}`
          : 'Failed to split PDF',
    };
  }
}

/**
 * Read the page count of a PDF buffer.
 */
export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

/** Convert raw PDF bytes to a downloadable Blob. */
export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Turn a set of "cut after page N" points into inclusive [start, end]
 * page ranges that partition a document of `totalPages`. Cut points are
 * sanitised to the valid 1..totalPages-1 window, de-duplicated and sorted.
 *
 * Example: total 10, cuts [3, 7] → [[1,3],[4,7],[8,10]].
 */
export function cutPointsToRanges(
  totalPages: number,
  cutAfterPages: number[]
): [number, number][] {
  if (totalPages < 1) return [];
  const cuts = Array.from(
    new Set(
      cutAfterPages.filter(
        (c) => Number.isInteger(c) && c >= 1 && c <= totalPages - 1
      )
    )
  ).sort((a, b) => a - b);

  const ranges: [number, number][] = [];
  let start = 1;
  for (const cut of cuts) {
    ranges.push([start, cut]);
    start = cut + 1;
  }
  ranges.push([start, totalPages]);
  return ranges;
}

export interface PdfThumbnail {
  pageNumber: number;
  dataUrl: string;
}

/**
 * Render small PNG thumbnails for every page of a PDF buffer, for use in
 * a visual page picker. Browser-only (uses pdf.js + canvas).
 */
export async function renderPdfThumbnails(
  buffer: ArrayBuffer,
  scale = 0.3
): Promise<PdfThumbnail[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) })
    .promise;
  try {
    const thumbs: PdfThumbnail[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      thumbs.push({ pageNumber: i, dataUrl: canvas.toDataURL('image/png') });
      page.cleanup();
    }
    return thumbs;
  } finally {
    await doc.destroy();
  }
}
