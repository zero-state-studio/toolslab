/**
 * HEIC/HEIF → JPG/PNG conversion.
 *
 * Pure helpers (filename, mime, detection, quality) are unit-tested.
 * The actual decode runs in the browser only via the `heic2any` library,
 * which is dynamically imported so it never lands in the server bundle.
 * All processing is client-side — photos never leave the device.
 */

export type HeicTarget = 'jpeg' | 'png';

export interface HeicConvertResult {
  blob: Blob;
  /** Output filename, e.g. "IMG_1234.jpg". */
  fileName: string;
}

/** Extensions/MIME types we accept as HEIC/HEIF input. */
const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_MIME = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

/**
 * Whether a File looks like a HEIC/HEIF image. Browsers frequently report an
 * empty `type` for HEIC, so the filename extension is the reliable signal.
 */
export function isHeicFile(file: { name: string; type?: string }): boolean {
  const type = (file.type || '').toLowerCase();
  return HEIC_MIME.includes(type) || HEIC_EXT.test(file.name);
}

/** MIME type for a conversion target. */
export function heicTargetMime(target: HeicTarget): string {
  return target === 'png' ? 'image/png' : 'image/jpeg';
}

/** File extension for a conversion target. */
export function heicTargetExtension(target: HeicTarget): string {
  return target === 'png' ? 'png' : 'jpg';
}

/** Build the output filename: swap the HEIC extension for the target one. */
export function buildHeicOutputName(baseName: string, target: HeicTarget): string {
  const base = baseName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${heicTargetExtension(target)}`;
}

/** Clamp a 0–1 quality value; default 0.9 on invalid input. */
export function clampHeicQuality(quality: number): number {
  if (Number.isNaN(quality)) return 0.9;
  return Math.min(1, Math.max(0.1, quality));
}

/**
 * Convert a single HEIC/HEIF File to JPG or PNG (browser only).
 * A HEIC file may hold several images (a burst/sequence); only the first
 * frame is returned, which matches what users expect from "convert".
 */
export async function convertHeic(
  file: File,
  target: HeicTarget,
  quality = 0.9
): Promise<HeicConvertResult> {
  if (!isHeicFile(file)) {
    throw new Error('Not a HEIC/HEIF file');
  }
  // Dynamic import keeps the heavy decoder out of the initial bundle and the
  // server build (it touches `window`).
  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({
    blob: file,
    toType: heicTargetMime(target),
    quality: clampHeicQuality(quality),
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return { blob, fileName: buildHeicOutputName(file.name, target) };
}
