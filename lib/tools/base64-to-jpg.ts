import {
  sanitizeBase64Input,
  isValidBase64,
  estimateDecodedSize,
  formatFileSize,
  downloadBlob,
  exceedsMaxSize,
  MAX_BASE64_INPUT_SIZE,
  detectFormatFromBase64,
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

export interface Base64ToJpgOptions {
  fileName?: string;
  validateJpegHeader?: boolean;
}

export interface Base64ToJpgResult {
  success: boolean;
  jpgBlob?: Blob;
  error?: string;
  fileName?: string;
  fileSize?: number;
  corrections?: string[];
  wrongFormat?: { detected: string; expected: string };
  metadata?: {
    width?: number;
    height?: number;
    quality?: string;
  };
}

/**
 * Checks if binary data is a valid JPEG image
 */
export function isJpegData(uint8Array: Uint8Array): {
  isJpeg: boolean;
  quality?: string;
} {
  // JPEG signature: FF D8 FF (Start of Image marker)
  if (uint8Array.length < 3) {
    return { isJpeg: false };
  }

  const hasJpegStart =
    uint8Array[0] === 0xff && uint8Array[1] === 0xd8 && uint8Array[2] === 0xff;

  if (!hasJpegStart) {
    return { isJpeg: false };
  }

  let quality = 'Unknown';
  if (uint8Array.length > 0) {
    const bytesPerPixel = uint8Array.length / 1000;
    if (bytesPerPixel < 10) {
      quality = 'Low';
    } else if (bytesPerPixel < 30) {
      quality = 'Medium';
    } else {
      quality = 'High';
    }
  }

  return { isJpeg: true, quality };
}

/**
 * Extracts JPEG metadata from binary data
 */
export function extractJpegMetadata(uint8Array: Uint8Array) {
  const metadata: {
    width?: number;
    height?: number;
    quality?: string;
  } = {};

  let i = 2; // Skip initial FF D8

  while (i < uint8Array.length - 8) {
    if (uint8Array[i] === 0xff) {
      const marker = uint8Array[i + 1];

      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        if (i + 9 < uint8Array.length) {
          metadata.height = (uint8Array[i + 5] << 8) | uint8Array[i + 6];
          metadata.width = (uint8Array[i + 7] << 8) | uint8Array[i + 8];
          break;
        }
      }

      const segmentLength = (uint8Array[i + 2] << 8) | uint8Array[i + 3];
      i += segmentLength + 2;
    } else {
      i++;
    }
  }

  const jpegCheck = isJpegData(uint8Array);
  metadata.quality = jpegCheck.quality;

  return metadata;
}

/**
 * Converts Base64 string to JPEG Blob with auto-correction of common input errors
 */
export async function base64ToJpg(
  base64Data: string,
  options: Base64ToJpgOptions = {}
): Promise<Base64ToJpgResult> {
  try {
    const { fileName = `jpeg-${Date.now()}.jpg`, validateJpegHeader = true } =
      options;

    // Check size limit
    if (exceedsMaxSize(base64Data)) {
      return {
        success: false,
        error: `Input too large. Maximum size is ${formatFileSize(MAX_BASE64_INPUT_SIZE)}.`,
      };
    }

    // Sanitize input with auto-corrections (handles Base64url, data URL prefix,
    // whitespace, PEM headers, quotes, line numbers, missing padding)
    const {
      cleaned: cleanBase64,
      corrections,
      detectedFormat,
    } = sanitizeBase64Input(base64Data);

    // Check for wrong format before trying to decode
    if (
      validateJpegHeader &&
      detectedFormat &&
      detectedFormat !== 'unknown' &&
      detectedFormat !== 'jpeg'
    ) {
      return {
        success: false,
        error: `This data appears to be a ${detectedFormat.toUpperCase()} image, not JPEG.`,
        corrections: corrections.length > 0 ? corrections : undefined,
        wrongFormat: { detected: detectedFormat, expected: 'jpeg' },
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

    // Validate JPEG header if required
    if (validateJpegHeader) {
      const jpegCheck = isJpegData(uint8Array);
      if (!jpegCheck.isJpeg) {
        return {
          success: false,
          error:
            'Data does not appear to be a JPEG image. Please check your Base64 string.',
          corrections: corrections.length > 0 ? corrections : undefined,
        };
      }
    }

    // Extract metadata
    const metadata = extractJpegMetadata(uint8Array);

    // Create Blob
    const jpgBlob = new Blob([uint8Array], { type: 'image/jpeg' });

    return {
      success: true,
      jpgBlob,
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
          : 'Failed to convert Base64 to JPEG',
    };
  }
}
