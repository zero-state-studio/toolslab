/**
 * Base64 to PDF Converter
 * Converts Base64 encoded data to PDF files for download
 */

import { decodeBase64ToBytes } from '@/lib/utils/base64-decode';

export interface Base64ToPdfResult {
  success: boolean;
  error?: string;
  pdfBlob?: Blob;
  fileSize?: number;
  fileName?: string;
  detectedFileType?: string | null;
  /** Input was Base64-encoded more than once and got decoded automatically */
  wasDoubleEncoded?: boolean;
  /** First chars of the decoded data when it is readable text (error aid) */
  decodedPreview?: string;
  /** Input looks like natural language pasted by mistake, not Base64 */
  inputLooksLikeText?: boolean;
  /** Notes about automatic repairs applied to produce the PDF */
  warnings?: string[];
  metadata?: {
    isPdf: boolean;
    hasValidHeader: boolean;
    estimatedSize: number;
  };
}

export interface Base64ToPdfOptions {
  fileName?: string;
  validatePdfHeader?: boolean;
}

/**
 * Normalizes Base64 input by converting Base64url (- and _) to standard Base64 (+ and /)
 * and adding missing padding if needed.
 */
export function normalizeBase64(str: string): string {
  let normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const remainder = normalized.length % 4;
  if (remainder !== 0) {
    normalized += '='.repeat(4 - remainder);
  }
  return normalized;
}

/**
 * Validates if a string is valid Base64 (standard or Base64url)
 */
export function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) {
    return false;
  }

  // Remove whitespace and newlines, normalize Base64url
  const cleanStr = normalizeBase64(str.replace(/\s+/g, ''));

  // Check if string contains only valid Base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleanStr)) {
    return false;
  }

  // Check if length is valid (multiple of 4)
  if (cleanStr.length % 4 !== 0) {
    return false;
  }

  return true;
}

/**
 * Detects the file type from the first bytes (magic bytes / file signature)
 */
export function detectFileType(uint8Array: Uint8Array): string | null {
  const b = uint8Array;
  if (b.length < 4) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'JPEG image';
  // PNG: 89 50 4E 47
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return 'PNG image';
  // GIF: 47 49 46 38
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return 'GIF image';
  // WebP: RIFF....WEBP
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'WebP image';
  // BMP: 42 4D
  if (b[0] === 0x42 && b[1] === 0x4d) return 'BMP image';
  // ZIP / Office Open XML (DOCX, XLSX, PPTX): 50 4B 03 04
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04)
    return 'ZIP/Office file';
  // GZIP: 1F 8B
  if (b[0] === 0x1f && b[1] === 0x8b) return 'GZIP archive';
  // MP4/MOV: ftyp at offset 4
  if (
    b.length >= 8 &&
    b[4] === 0x66 &&
    b[5] === 0x74 &&
    b[6] === 0x79 &&
    b[7] === 0x70
  )
    return 'MP4/video file';
  // XML/SVG/HTML: starts with '<'
  if (b[0] === 0x3c) return 'XML/HTML/SVG file';
  // Plain text (printable ASCII)
  if (b[0] >= 0x20 && b[0] < 0x7f) return 'plain text file';

  return null;
}

/** Max nested decode attempts when recovering multi-encoded input */
const MAX_NESTED_DECODES = 2;

/**
 * Checks whether the leading bytes are printable ASCII (tab/CR/LF allowed)
 */
function isPrintableAscii(bytes: Uint8Array, limit = 512): boolean {
  const n = Math.min(bytes.length, limit);
  if (n === 0) return false;
  for (let i = 0; i < n; i++) {
    const c = bytes[i];
    if (c === 0x09 || c === 0x0a || c === 0x0d) continue;
    if (c < 0x20 || c > 0x7e) return false;
  }
  return true;
}

/**
 * Converts bytes to a string, chunked to avoid call-stack limits
 */
function asciiFromBytes(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

/**
 * Heuristic: input is natural language pasted by mistake, not Base64.
 * Words-only text survives the charset check (letters are valid Base64 and
 * whitespace gets stripped), then decodes to garbage — catch it up front.
 * Real Base64 is one continuous string or MIME-wrapped at 64/76 chars, so
 * many short whitespace-separated words without +, / or = means prose.
 */
export function looksLikeNaturalText(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /[+/=]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 3) return false;
  const shortWords = words.filter((w) => w.length <= 20).length;
  return shortWords / words.length >= 0.8;
}

/**
 * Checks if the decoded Base64 data represents a PDF file.
 * Searches within the first 1024 bytes as allowed by the PDF spec.
 */
export function isPdfData(uint8Array: Uint8Array): boolean {
  // PDF files start with "%PDF-" which is [37, 80, 68, 70, 45] in bytes
  const pdfHeader = [37, 80, 68, 70, 45]; // %PDF-
  const searchLimit = Math.min(uint8Array.length - pdfHeader.length, 1024);

  if (uint8Array.length < pdfHeader.length) {
    return false;
  }

  for (let offset = 0; offset <= searchLimit; offset++) {
    let match = true;
    for (let i = 0; i < pdfHeader.length; i++) {
      if (uint8Array[offset + i] !== pdfHeader[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }

  return false;
}

/** Finds the byte offset of an ASCII sequence, or -1 */
function findAsciiSequence(
  bytes: Uint8Array,
  ascii: string,
  limit = Infinity
): number {
  const seq = Array.from(ascii, (c) => c.charCodeAt(0));
  const end = Math.min(bytes.length - seq.length, limit);
  for (let offset = 0; offset <= end; offset++) {
    let match = true;
    for (let i = 0; i < seq.length; i++) {
      if (bytes[offset + i] !== seq[i]) {
        match = false;
        break;
      }
    }
    if (match) return offset;
  }
  return -1;
}

/** PDF body structures that indicate the data is a PDF missing its header.
 * "Strong" markers are PDF-specific; weak ones ("stream", "trailer") also
 * occur in ordinary prose, so at least one strong marker is required. */
const PDF_BODY_MARKERS_STRONG = ['endobj', 'xref', '%%EOF'];
const PDF_BODY_MARKERS_WEAK = ['stream', 'trailer'];

/**
 * Attempts to repair decoded data that is a PDF with a broken/missing header:
 * - "%PDF-" present but beyond the 1024-byte spec window → strip junk prefix
 * - header partially cut at the start (e.g. "PDF-1.4" or "DF-1.4") → rebuild it
 * - no header but ≥2 distinct PDF body structures → prepend "%PDF-1.4\n"
 * Returns null when the data doesn't look like PDF content at all — a fake
 * repaired file that won't open is worse UX than a clear error.
 */
export function repairPdfHeader(
  bytes: Uint8Array
): { bytes: Uint8Array; warning: string } | null {
  // Case 1: header exists but past the 1024-byte window isPdfData searches
  const headerOffset = findAsciiSequence(bytes, '%PDF-');
  if (headerOffset > 0) {
    return {
      bytes: bytes.subarray(headerOffset),
      warning: `Removed ${headerOffset} bytes of non-PDF content before the "%PDF-" header`,
    };
  }

  // Case 2: header cut at the start — data begins mid-way through "%PDF-".
  // Require a version number ("1." / "2.") right after the tail so random
  // binary starting with e.g. "F-" doesn't get a header glued on.
  const headerTails = ['PDF-', 'DF-', 'F-'];
  for (const tail of headerTails) {
    const afterTail = tail.length;
    const startsWithTail =
      findAsciiSequence(bytes.subarray(0, afterTail), tail) === 0;
    const hasVersion =
      bytes.length > afterTail + 1 &&
      bytes[afterTail] >= 0x30 &&
      bytes[afterTail] <= 0x39 && // digit
      bytes[afterTail + 1] === 0x2e; // '.'
    if (startsWithTail && hasVersion) {
      const missing = '%PDF-'.slice(0, 5 - tail.length);
      const repaired = new Uint8Array(missing.length + bytes.length);
      repaired.set(Array.from(missing, (c) => c.charCodeAt(0)));
      repaired.set(bytes, missing.length);
      return {
        bytes: repaired,
        warning: `Rebuilt the truncated "%PDF-" header (input started with "${tail}")`,
      };
    }
  }

  // Case 3: no header at all, but the body clearly contains PDF structures
  const strongFound = PDF_BODY_MARKERS_STRONG.filter(
    (marker) => findAsciiSequence(bytes, marker) !== -1
  );
  const weakFound = PDF_BODY_MARKERS_WEAK.filter(
    (marker) => findAsciiSequence(bytes, marker) !== -1
  );
  if (strongFound.length >= 1 && strongFound.length + weakFound.length >= 2) {
    const header = '%PDF-1.4\n';
    const repaired = new Uint8Array(header.length + bytes.length);
    repaired.set(Array.from(header, (c) => c.charCodeAt(0)));
    repaired.set(bytes, header.length);
    return {
      bytes: repaired,
      warning:
        'The "%PDF-" header was missing and has been added automatically. If the file does not open, the source data may be incomplete.',
    };
  }

  return null;
}

/**
 * Extracts basic metadata from PDF bytes
 */
export function extractPdfMetadata(uint8Array: Uint8Array): {
  isPdf: boolean;
  hasValidHeader: boolean;
  estimatedSize: number;
} {
  const isPdf = isPdfData(uint8Array);
  const hasValidHeader = isPdf;
  const estimatedSize = uint8Array.length;

  return {
    isPdf,
    hasValidHeader,
    estimatedSize,
  };
}

/**
 * Converts Base64 string to PDF file
 */
export async function base64ToPdf(
  base64Data: string,
  options: Base64ToPdfOptions = {}
): Promise<Base64ToPdfResult> {
  try {
    // Clean input data
    let cleanBase64 = base64Data.trim();

    // Remove data URL prefix if present
    if (cleanBase64.startsWith('data:')) {
      const commaIndex = cleanBase64.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64 = cleanBase64.substring(commaIndex + 1);
      }
    }

    // Plain-text paste guard: catch prose before it decodes to garbage
    if (looksLikeNaturalText(cleanBase64)) {
      return {
        success: false,
        error:
          'The input looks like plain text, not Base64. This tool decodes Base64 data back into a PDF file — paste a Base64 string instead (PDF data usually starts with "JVBERi0").',
        inputLooksLikeText: true,
      };
    }

    // Remove whitespace and newlines
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    // Normalize Base64url to standard Base64 (convert - to + and _ to /)
    cleanBase64 = normalizeBase64(cleanBase64);

    // Validate Base64 format
    if (!isValidBase64(cleanBase64)) {
      return {
        success: false,
        error:
          'Invalid Base64 format. Please ensure your data contains only valid Base64 characters.',
      };
    }

    // Decode Base64 to binary data off the main thread (avoids INP spikes).
    let uint8Array: Uint8Array;
    try {
      uint8Array = await decodeBase64ToBytes(cleanBase64);
    } catch (error) {
      return {
        success: false,
        error:
          'Failed to decode Base64 data. The data may be corrupted or incomplete.',
      };
    }

    // Recover multi-encoded input: when the decoded bytes are themselves
    // Base64 text (e.g. "JVBERi0..." = "%PDF-" still encoded), keep decoding
    // until a PDF emerges. Only commit the deeper level if it IS a PDF, so
    // error reporting stays on the first decode otherwise.
    let wasDoubleEncoded = false;
    if (!isPdfData(uint8Array)) {
      let candidate = uint8Array;
      for (let depth = 0; depth < MAX_NESTED_DECODES; depth++) {
        if (!isPrintableAscii(candidate)) break;
        const innerBase64 = normalizeBase64(
          asciiFromBytes(candidate).replace(/\s+/g, '')
        );
        if (innerBase64.length === 0 || !isValidBase64(innerBase64)) break;
        try {
          candidate = await decodeBase64ToBytes(innerBase64);
        } catch {
          break;
        }
        if (isPdfData(candidate)) {
          uint8Array = candidate;
          wasDoubleEncoded = true;
          break;
        }
      }
    }

    // Extract metadata
    let metadata = extractPdfMetadata(uint8Array);
    const warnings: string[] = [];

    // Validate PDF header if requested
    if (options.validatePdfHeader !== false && !metadata.isPdf) {
      // Broken/missing header on otherwise-PDF data is repairable
      const repaired = repairPdfHeader(uint8Array);
      if (repaired) {
        uint8Array = repaired.bytes;
        warnings.push(repaired.warning);
        metadata = extractPdfMetadata(uint8Array);
      } else {
        const detectedFileType = detectFileType(uint8Array);
        const errorDetail = detectedFileType
          ? `The data appears to be a ${detectedFileType}, not a PDF.`
          : 'PDF files should start with "%PDF-" header within the first 1024 bytes.';
        // Readable decoded content helps users recognize what they pasted
        const decodedPreview = isPrintableAscii(uint8Array, 50)
          ? asciiFromBytes(uint8Array.subarray(0, 50)) +
            (uint8Array.length > 50 ? '…' : '')
          : undefined;
        return {
          success: false,
          error: `The decoded data does not appear to be a valid PDF file. ${errorDetail}`,
          detectedFileType,
          decodedPreview,
          metadata,
        };
      }
    }

    // Create PDF blob - create a copy of the bytes
    const pdfBlob = new Blob([uint8Array.slice()], { type: 'application/pdf' });

    // Generate filename
    const fileName = options.fileName || `document_${Date.now()}.pdf`;

    return {
      success: true,
      pdfBlob,
      fileSize: uint8Array.length,
      fileName,
      wasDoubleEncoded,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during conversion.',
    };
  }
}

/**
 * Downloads a blob as a file
 */
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

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Estimates Base64 decoded size
 */
export function estimateDecodedSize(base64String: string): number {
  // Remove whitespace
  const cleanString = base64String.replace(/\s+/g, '');

  // Each Base64 character represents 6 bits, so 4 characters = 3 bytes
  // Account for padding
  const paddingCount = (cleanString.match(/=/g) || []).length;
  const base64Length = cleanString.length;

  return Math.floor((base64Length * 3) / 4) - paddingCount;
}
