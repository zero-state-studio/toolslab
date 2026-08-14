/**
 * PDF Compressor — shrinks PDF file size entirely in the browser.
 *
 * Two strategies:
 *  - `lossless`: re-write the document structure with pdf-lib (object
 *    streams + stripped metadata). Text stays vector and selectable;
 *    savings are modest and depend on how the PDF was produced.
 *  - `raster`: re-render every page with pdf.js at a target DPI, encode it
 *    as JPEG at a given quality, and rebuild the PDF from those images.
 *    Big savings on scans and image-heavy files; text becomes an image.
 *
 * Both heavy libraries (pdf-lib, pdf.js) load via dynamic import so they
 * stay out of the initial route chunk.
 */

import { fileToArrayBuffer, formatFileSize } from './image-to-pdf';
import {
  isPdfFile,
  pdfBytesToBlob,
  loadPdfjs,
  downloadPdf,
} from './pdf-merger-splitter';

export {
  fileToArrayBuffer,
  formatFileSize,
  isPdfFile,
  pdfBytesToBlob,
  downloadPdf,
};

/** How the document is compressed. */
export type CompressionMode = 'lossless' | 'raster';

/** Named quality/size trade-offs for raster compression. */
export type CompressionLevel = 'light' | 'balanced' | 'strong' | 'custom';

export interface RasterSettings {
  /** Target render resolution. PDF user space is 72 DPI. */
  dpi: number;
  /** JPEG quality, 0.1–1.0. */
  quality: number;
  /** Convert pages to grayscale for extra savings on scans. */
  grayscale: boolean;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  /** Bytes saved. Negative when the output grew. */
  savedBytes: number;
  /** Percentage saved, rounded to one decimal. Negative when it grew. */
  savedPercent: number;
}

export interface CompressResult {
  success: boolean;
  bytes?: Uint8Array;
  stats?: CompressionStats;
  error?: string;
  metadata?: {
    mode: CompressionMode;
    pageCount: number;
    /** False when compression could not beat the original file. */
    improved: boolean;
  };
}

/** Raster presets, ordered from most conservative to most aggressive. */
export const compressionPresets: Record<
  Exclude<CompressionLevel, 'custom'>,
  RasterSettings
> = {
  light: { dpi: 150, quality: 0.82, grayscale: false },
  balanced: { dpi: 120, quality: 0.7, grayscale: false },
  strong: { dpi: 96, quality: 0.55, grayscale: false },
};

/** Clamp a JPEG quality value into the usable range. */
export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0.7;
  return Math.min(1, Math.max(0.1, quality));
}

/** Clamp a target DPI into a range that is useful for documents. */
export function clampDpi(dpi: number): number {
  if (!Number.isFinite(dpi)) return 120;
  return Math.min(300, Math.max(36, Math.round(dpi)));
}

/** Convert a target DPI to a pdf.js render scale (PDF base is 72 DPI). */
export function scaleForDpi(dpi: number): number {
  return clampDpi(dpi) / 72;
}

/**
 * Resolve the effective raster settings for a level. `custom` uses the
 * caller-supplied values; every path is clamped to a safe range.
 */
export function resolveRasterSettings(
  level: CompressionLevel,
  custom?: Partial<RasterSettings>
): RasterSettings {
  const base =
    level === 'custom'
      ? { ...compressionPresets.balanced, ...custom }
      : compressionPresets[level];
  return {
    dpi: clampDpi(base.dpi),
    quality: clampQuality(base.quality),
    grayscale: Boolean(base.grayscale),
  };
}

/**
 * Compare original and compressed sizes. `savedBytes`/`savedPercent` go
 * negative when compression made the file bigger, so callers can warn
 * instead of silently shipping a worse file.
 */
export function computeSavings(
  originalSize: number,
  compressedSize: number
): CompressionStats {
  const savedBytes = originalSize - compressedSize;
  const savedPercent =
    originalSize > 0 ? Math.round((savedBytes / originalSize) * 1000) / 10 : 0;
  return { originalSize, compressedSize, savedBytes, savedPercent };
}

/**
 * Build the output file name, e.g. "report.pdf" → "report-compressed.pdf".
 */
export function buildCompressedFileName(
  fileName: string,
  suffix = '-compressed'
): string {
  const base = (fileName || 'document').replace(/\.pdf$/i, '');
  return `${base || 'document'}${suffix}.pdf`;
}

/**
 * Wrap a compression attempt into a result, keeping whichever of the two
 * documents is smaller. Compression can legitimately lose — re-rendering a
 * PDF that already shares one image across pages, for instance, produces
 * more bytes — so a losing attempt is discarded and the original is handed
 * back with `improved: false`. Callers never get a bigger file.
 */
export function buildCompressResult(
  original: Uint8Array,
  compressed: Uint8Array,
  mode: CompressionMode,
  pageCount: number
): CompressResult {
  const improved = compressed.byteLength < original.byteLength;
  const bytes = improved ? compressed : original;
  return {
    success: true,
    bytes,
    stats: computeSavings(original.byteLength, bytes.byteLength),
    metadata: { mode, pageCount, improved },
  };
}

/**
 * Structural compression: reload the document and write it back with
 * object streams, dropping metadata strings. Keeps text selectable.
 *
 * If the rewrite does not beat the original, the original bytes are
 * returned with `improved: false` — never a bigger file.
 */
export async function compressPdfLossless(
  buffer: ArrayBuffer
): Promise<CompressResult> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    // Strip metadata strings — they are pure overhead for size.
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');

    const pageCount = doc.getPageCount();
    const saved = await doc.save({ useObjectStreams: true });

    return buildCompressResult(
      new Uint8Array(buffer.slice(0)),
      saved,
      'lossless',
      pageCount
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to compress PDF: ${error.message}`
          : 'Failed to compress PDF',
    };
  }
}

/** Turn a canvas into grayscale in place. */
function toGrayscale(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const data = context.getImageData(0, 0, width, height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    // Rec. 601 luma — matches how scanners desaturate.
    const luma = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = luma;
    px[i + 1] = luma;
    px[i + 2] = luma;
  }
  context.putImageData(data, 0, 0);
}

/** Render a canvas to a JPEG blob. */
function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      clampQuality(quality)
    );
  });
}

/**
 * Raster compression: re-render each page to JPEG at the requested DPI and
 * rebuild the PDF from those images. Page dimensions in points are
 * preserved, so the document prints at the same physical size.
 *
 * Browser-only (needs canvas). Calls onProgress(done, total) per page.
 */
export async function compressPdfRaster(
  buffer: ArrayBuffer,
  settings: RasterSettings,
  onProgress?: (done: number, total: number) => void
): Promise<CompressResult> {
  try {
    const { dpi, quality, grayscale } = settings;
    const [pdfjs, { PDFDocument }] = await Promise.all([
      loadPdfjs(),
      import('pdf-lib'),
    ]);

    // pdf.js detaches the buffer it receives — hand it a private copy.
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer.slice(0)),
    }).promise;
    const out = await PDFDocument.create();
    const scale = scaleForDpi(dpi);

    try {
      const total = doc.numPages;
      for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
        const page = await doc.getPage(pageNumber);
        // Unscaled viewport = page size in PDF points.
        const pointViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        // JPEG has no alpha — flatten onto white first.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (grayscale) toGrayscale(context, canvas.width, canvas.height);

        const jpegBlob = await canvasToJpeg(canvas, quality);
        const embedded = await out.embedJpg(await jpegBlob.arrayBuffer());
        const outPage = out.addPage([
          pointViewport.width,
          pointViewport.height,
        ]);
        outPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: pointViewport.width,
          height: pointViewport.height,
        });

        page.cleanup();
        onProgress?.(pageNumber, total);
      }

      const bytes = await out.save({ useObjectStreams: true });
      return buildCompressResult(
        new Uint8Array(buffer.slice(0)),
        bytes,
        'raster',
        total
      );
    } finally {
      await doc.destroy();
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to compress PDF: ${error.message}`
          : 'Failed to compress PDF',
    };
  }
}

/**
 * Compress a PDF buffer with the chosen mode. Thin dispatcher so callers
 * (and the UI) have a single entry point.
 */
export async function compressPdf(
  buffer: ArrayBuffer,
  options: {
    mode: CompressionMode;
    level?: CompressionLevel;
    custom?: Partial<RasterSettings>;
  },
  onProgress?: (done: number, total: number) => void
): Promise<CompressResult> {
  if (options.mode === 'lossless') {
    return compressPdfLossless(buffer);
  }
  const settings = resolveRasterSettings(
    options.level ?? 'balanced',
    options.custom
  );
  return compressPdfRaster(buffer, settings, onProgress);
}
