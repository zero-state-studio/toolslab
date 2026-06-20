/**
 * Shared image utilities for the Image Resizer and Image Compressor tools.
 * Pure geometry/format helpers are unit-tested; canvas operations run in
 * the browser only. All processing is client-side — files never upload.
 */

import { formatFileSize } from './image-to-pdf';

export { formatFileSize };

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface ResizeOptions {
  /** Target width in px. */
  width?: number;
  /** Target height in px. */
  height?: number;
  /** Uniform scale factor (e.g. 0.5 = half). Overrides width/height. */
  scale?: number;
  /** Keep the original aspect ratio when only one dimension is given. */
  keepAspect?: boolean;
  format?: ImageFormat;
  /** 0–1, lossy formats only. */
  quality?: number;
}

export interface CompressOptions {
  format?: ImageFormat;
  /** 0–1 quality for lossy output. */
  quality: number;
  /** Optional max width/height to also shrink very large images. */
  maxDimension?: number;
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

export const SUPPORTED_INPUT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
];

/** Whether a File is a supported raster image. */
export function isImageFile(file: File): boolean {
  return (
    SUPPORTED_INPUT.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)
  );
}

/** Clamp a 0–1 quality value; default 0.8 on invalid input. */
export function clampQuality(quality: number): number {
  if (Number.isNaN(quality)) return 0.8;
  return Math.min(1, Math.max(0.05, quality));
}

/** File extension for an image format. */
export function imageExtension(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/** MIME type for an image format. */
export function mimeForFormat(format: ImageFormat): string {
  return `image/${format}`;
}

/** Build an output filename, e.g. "photo-resized.webp". */
export function buildOutputName(
  baseName: string,
  suffix: string,
  format: ImageFormat
): string {
  const base = baseName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}-${suffix}.${imageExtension(format)}`;
}

/**
 * Compute target dimensions from resize options and source size.
 * Precedence: scale > explicit width/height (with optional aspect lock).
 * Always returns positive integers >= 1.
 */
export function computeResizeDimensions(
  srcWidth: number,
  srcHeight: number,
  opts: ResizeOptions
): { width: number; height: number } {
  const ratio = srcWidth > 0 && srcHeight > 0 ? srcWidth / srcHeight : 1;

  if (opts.scale && opts.scale > 0) {
    return {
      width: Math.max(1, Math.round(srcWidth * opts.scale)),
      height: Math.max(1, Math.round(srcHeight * opts.scale)),
    };
  }

  const keep = opts.keepAspect ?? true;
  let { width, height } = opts;

  if (width && !height) {
    height = keep ? Math.round(width / ratio) : srcHeight;
  } else if (height && !width) {
    width = keep ? Math.round(height * ratio) : srcWidth;
  } else if (width && height && keep) {
    // Fit within the box, preserving aspect ratio.
    const fit = Math.min(width / srcWidth, height / srcHeight);
    width = Math.round(srcWidth * fit);
    height = Math.round(srcHeight * fit);
  }

  return {
    width: Math.max(1, Math.round(width || srcWidth)),
    height: Math.max(1, Math.round(height || srcHeight)),
  };
}

/** Clamp dimensions so neither side exceeds maxDimension, keeping aspect. */
export function clampToMax(
  width: number,
  height: number,
  maxDimension?: number
): { width: number; height: number } {
  if (!maxDimension || (width <= maxDimension && height <= maxDimension)) {
    return { width, height };
  }
  const fit = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * fit)),
    height: Math.max(1, Math.round(height * fit)),
  };
}

/** Load a File into an HTMLImageElement (browser only). */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

/** Draw an image to a canvas at target size and export as a Blob. */
function drawToBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Could not get canvas context'));
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      mimeForFormat(format),
      format === 'png' ? undefined : clampQuality(quality)
    );
  });
}

/** Resize an image File to new dimensions (browser only). */
export async function resizeImage(
  file: File,
  opts: ResizeOptions
): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const format = opts.format ?? 'png';
  const { width, height } = computeResizeDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts
  );
  const blob = await drawToBlob(img, width, height, format, opts.quality ?? 0.92);
  return { blob, width, height };
}

/** Compress an image File, optionally capping its largest dimension. */
export async function compressImage(
  file: File,
  opts: CompressOptions
): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const format = opts.format ?? 'jpeg';
  const { width, height } = clampToMax(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxDimension
  );
  const blob = await drawToBlob(img, width, height, format, opts.quality);
  return { blob, width, height };
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
