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

    // Extract metadata
    const metadata = extractPdfMetadata(uint8Array);

    // Validate PDF header if requested
    if (options.validatePdfHeader !== false && !metadata.isPdf) {
      const detectedFileType = detectFileType(uint8Array);
      const errorDetail = detectedFileType
        ? `The data appears to be a ${detectedFileType}, not a PDF.`
        : 'PDF files should start with "%PDF-" header within the first 1024 bytes.';
      return {
        success: false,
        error: `The decoded data does not appear to be a valid PDF file. ${errorDetail}`,
        detectedFileType,
        metadata,
      };
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
