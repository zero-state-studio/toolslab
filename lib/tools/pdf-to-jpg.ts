/**
 * PDF to JPG/PNG Converter — renders PDF pages to raster images
 * entirely in the browser using pdf.js. No upload, fully client-side.
 *
 * pdf.js is loaded via dynamic import so the heavy library and its
 * worker stay out of the initial route chunk.
 */

import { fileToArrayBuffer, formatFileSize } from './image-to-pdf';
import { configurePdfWorker } from './pdf-merger-splitter';

export { fileToArrayBuffer, formatFileSize };

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface PdfToImageOptions {
  format: ImageFormat;
  /** 0.1–1.0 — only applies to lossy formats (jpeg/webp). */
  quality: number;
  /** Render scale. Use scaleForDpi() to derive from a target DPI. */
  scale: number;
  /** 1-based page numbers to render. Omit/empty = all pages. */
  pages?: number[];
}

export interface RenderedImage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

/** Validate that a File looks like a PDF (by type or extension). */
export function isPdfFileName(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/** Clamp a 0–1 image quality value into the usable range. */
export function clampQuality(quality: number): number {
  if (Number.isNaN(quality)) return 0.92;
  return Math.min(1, Math.max(0.1, quality));
}

/** Convert a target DPI to a pdf.js render scale (PDF base is 72 DPI). */
export function scaleForDpi(dpi: number): number {
  if (!Number.isFinite(dpi) || dpi <= 0) return 1;
  return dpi / 72;
}

/** File extension for an image format. */
export function imageExtension(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/** MIME type for an image format. */
export function mimeForFormat(format: ImageFormat): string {
  return `image/${format}`;
}

/**
 * Build a zero-padded per-page file name, e.g. "report_page-03.jpg".
 */
export function buildImageFileName(
  baseName: string,
  pageNumber: number,
  totalPages: number,
  format: ImageFormat
): string {
  const safeBase = baseName.replace(/\.pdf$/i, '') || 'document';
  const width = String(totalPages).length;
  const padded = String(pageNumber).padStart(width, '0');
  return `${safeBase}_page-${padded}.${imageExtension(format)}`;
}

/**
 * Resolve which 1-based pages to render given a total and an optional
 * explicit selection. Invalid/out-of-range entries are dropped; the
 * result is sorted and de-duplicated. Empty selection = all pages.
 */
export function resolvePages(totalPages: number, pages?: number[]): number[] {
  if (!pages || pages.length === 0) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const valid = pages.filter(
    (p) => Number.isInteger(p) && p >= 1 && p <= totalPages
  );
  return Array.from(new Set(valid)).sort((a, b) => a - b);
}

/** Load a PDF document with pdf.js, configuring the worker once. */
export async function loadPdf(buffer: ArrayBuffer) {
  const pdfjs = await import('pdfjs-dist');
  configurePdfWorker(pdfjs);
  // Copy into a fresh Uint8Array — pdf.js detaches the buffer it receives.
  const data = new Uint8Array(buffer.slice(0));
  return pdfjs.getDocument({ data }).promise;
}

/** Read the page count of a PDF buffer. */
export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const doc = await loadPdf(buffer);
  const n = doc.numPages;
  await doc.destroy();
  return n;
}

/** Render a single canvas to a Blob in the requested format. */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      mimeForFormat(format),
      format === 'png' ? undefined : clampQuality(quality)
    );
  });
}

/**
 * Convert a PDF buffer to one image per selected page. Browser-only
 * (uses canvas). Calls onProgress(done, total) after each page.
 */
export async function convertPdfToImages(
  buffer: ArrayBuffer,
  options: PdfToImageOptions,
  onProgress?: (done: number, total: number) => void
): Promise<RenderedImage[]> {
  const doc = await loadPdf(buffer);
  try {
    const pageNumbers = resolvePages(doc.numPages, options.pages);
    const images: RenderedImage[] = [];

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNumber = pageNumbers[i];
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: options.scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      // White background for formats without alpha (jpeg).
      if (options.format === 'jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const blob = await canvasToBlob(canvas, options.format, options.quality);
      images.push({
        pageNumber,
        blob,
        width: canvas.width,
        height: canvas.height,
      });
      page.cleanup();
      onProgress?.(i + 1, pageNumbers.length);
    }

    return images;
  } finally {
    await doc.destroy();
  }
}

/** Bundle rendered images into a single ZIP blob. */
export async function zipImages(
  baseName: string,
  images: RenderedImage[]
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const total = images.length;
  for (const img of images) {
    const name = buildImageFileName(
      baseName,
      img.pageNumber,
      total,
      // Infer format from blob MIME for a correct extension.
      (img.blob.type.split('/')[1] as ImageFormat) || 'jpeg'
    );
    zip.file(name, img.blob);
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Trigger a browser download of any Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
