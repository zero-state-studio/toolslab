import {
  sanitizeBase64Input,
  isValidBase64,
  estimateDecodedSize,
  formatFileSize,
  downloadBlob,
  exceedsMaxSize,
  MAX_BASE64_INPUT_SIZE,
} from './base64-common';
import { decodeBase64ToBytes } from '@/lib/utils/base64-decode';

export type { SanitizeResult } from './base64-common';
export {
  isValidBase64,
  estimateDecodedSize,
  formatFileSize,
  downloadBlob,
  sanitizeBase64Input,
};

export interface Base64ToPngOptions {
  fileName?: string;
  validatePngHeader?: boolean;
}

export interface Base64ToPngResult {
  success: boolean;
  pngBlob?: Blob;
  error?: string;
  fileName?: string;
  fileSize?: number;
  corrections?: string[];
  wrongFormat?: { detected: string; expected: string };
  metadata?: {
    width?: number;
    height?: number;
    colorType?: string;
    bitDepth?: number;
  };
}

/**
 * Checks if binary data is a valid PNG image
 */
export function isPngData(uint8Array: Uint8Array): {
  isPng: boolean;
  colorType?: string;
  bitDepth?: number;
} {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A (8 bytes)
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

  if (uint8Array.length < 8) {
    return { isPng: false };
  }

  for (let i = 0; i < 8; i++) {
    if (uint8Array[i] !== pngSignature[i]) {
      return { isPng: false };
    }
  }

  if (uint8Array.length >= 26) {
    const bitDepth = uint8Array[24];
    const colorTypeValue = uint8Array[25];

    return {
      isPng: true,
      bitDepth,
      colorType: getColorTypeName(colorTypeValue),
    };
  }

  return { isPng: true };
}

/**
 * PNG color type mapping
 */
const COLOR_TYPES: Record<number, string> = {
  0: 'Grayscale',
  2: 'Truecolor',
  3: 'Indexed',
  4: 'Grayscale with Alpha',
  6: 'Truecolor with Alpha',
};

function getColorTypeName(value: number): string {
  return COLOR_TYPES[value] || 'Unknown';
}

/**
 * Extracts PNG metadata from binary data using DataView for correct unsigned reads
 */
export function extractPngMetadata(uint8Array: Uint8Array) {
  const metadata: {
    width?: number;
    height?: number;
    bitDepth?: number;
    colorType?: string;
  } = {};

  // PNG IHDR chunk: signature(8) + chunk_length(4) + "IHDR"(4) + width(4) + height(4) + bitDepth(1) + colorType(1)
  if (uint8Array.length >= 26) {
    const view = new DataView(
      uint8Array.buffer,
      uint8Array.byteOffset,
      uint8Array.byteLength
    );

    // Width and Height (4 bytes each, big-endian, unsigned)
    metadata.width = view.getUint32(16);
    metadata.height = view.getUint32(20);

    // Bit depth
    metadata.bitDepth = uint8Array[24];

    // Color type
    metadata.colorType = getColorTypeName(uint8Array[25]);
  }

  return metadata;
}

/**
 * Converts Base64 string to PNG Blob with auto-correction of common input errors
 */
export async function base64ToPng(
  base64Data: string,
  options: Base64ToPngOptions = {}
): Promise<Base64ToPngResult> {
  try {
    const { fileName = `png-${Date.now()}.png`, validatePngHeader = true } =
      options;

    // Check size limit
    if (exceedsMaxSize(base64Data)) {
      return {
        success: false,
        error: `Input too large. Maximum size is ${formatFileSize(MAX_BASE64_INPUT_SIZE)}.`,
      };
    }

    // Sanitize input with auto-corrections
    const {
      cleaned: cleanBase64,
      corrections,
      detectedFormat,
    } = sanitizeBase64Input(base64Data);

    // Check for wrong format (only when header validation is enabled)
    if (
      validatePngHeader &&
      detectedFormat &&
      detectedFormat !== 'unknown' &&
      detectedFormat !== 'png'
    ) {
      return {
        success: false,
        error: `This data appears to be a ${detectedFormat.toUpperCase()} image, not PNG.`,
        corrections: corrections.length > 0 ? corrections : undefined,
        wrongFormat: { detected: detectedFormat, expected: 'png' },
      };
    }

    // Validate Base64 format
    if (!isValidBase64(cleanBase64)) {
      return {
        success: false,
        error: 'Invalid Base64 format',
        corrections: corrections.length > 0 ? corrections : undefined,
      };
    }

    // Decode Base64 to binary off the main thread (avoids INP spikes).
    const uint8Array = await decodeBase64ToBytes(cleanBase64);

    // Validate PNG header if required
    if (validatePngHeader) {
      const pngCheck = isPngData(uint8Array);
      if (!pngCheck.isPng) {
        return {
          success: false,
          error:
            'Data does not appear to be a PNG image. Please check your Base64 string.',
          corrections: corrections.length > 0 ? corrections : undefined,
        };
      }
    }

    // Extract metadata
    const metadata = extractPngMetadata(uint8Array);

    // Create Blob
    const pngBlob = new Blob([uint8Array], { type: 'image/png' });

    return {
      success: true,
      pngBlob,
      fileName,
      fileSize: uint8Array.length,
      metadata,
      corrections: corrections.length > 0 ? corrections : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to convert Base64 to PNG',
    };
  }
}
