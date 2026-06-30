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

export interface Base64ToWebpOptions {
  fileName?: string;
  validateWebpHeader?: boolean;
}

export interface Base64ToWebpResult {
  success: boolean;
  webpBlob?: Blob;
  error?: string;
  fileName?: string;
  fileSize?: number;
  corrections?: string[];
  wrongFormat?: { detected: string; expected: string };
  metadata?: {
    width?: number;
    height?: number;
    hasAlpha?: boolean;
    isAnimated?: boolean;
    compressionType?: string;
  };
}

/**
 * Checks if binary data is a valid WebP image
 */
export function isWebpData(uint8Array: Uint8Array): {
  isWebp: boolean;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  compressionType?: string;
} {
  // WebP signature: RIFF....WEBP
  if (uint8Array.length < 12) {
    return { isWebp: false };
  }

  const hasRiffSignature =
    uint8Array[0] === 0x52 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x46;

  if (!hasRiffSignature) {
    return { isWebp: false };
  }

  const hasWebpSignature =
    uint8Array[8] === 0x57 &&
    uint8Array[9] === 0x45 &&
    uint8Array[10] === 0x42 &&
    uint8Array[11] === 0x50;

  if (!hasWebpSignature) {
    return { isWebp: false };
  }

  let hasAlpha = false;
  let isAnimated = false;
  let compressionType = 'Unknown';

  if (uint8Array.length >= 16) {
    const chunkType = String.fromCharCode(
      uint8Array[12],
      uint8Array[13],
      uint8Array[14],
      uint8Array[15]
    );

    if (chunkType === 'VP8L') {
      compressionType = 'Lossless';
      hasAlpha = true;
    } else if (chunkType === 'VP8 ') {
      compressionType = 'Lossy';
    } else if (chunkType === 'VP8X') {
      compressionType = 'Extended';
      if (uint8Array.length >= 21) {
        const flags = uint8Array[20];
        hasAlpha = (flags & 0x10) !== 0;
        isAnimated = (flags & 0x02) !== 0;
      }
    }
  }

  return { isWebp: true, hasAlpha, isAnimated, compressionType };
}

/**
 * Extracts WebP metadata from binary data
 */
export function extractWebpMetadata(uint8Array: Uint8Array) {
  const metadata: {
    width?: number;
    height?: number;
    hasAlpha?: boolean;
    isAnimated?: boolean;
    compressionType?: string;
  } = {};

  if (uint8Array.length < 30) {
    return metadata;
  }

  const webpInfo = isWebpData(uint8Array);
  metadata.hasAlpha = webpInfo.hasAlpha;
  metadata.isAnimated = webpInfo.isAnimated;
  metadata.compressionType = webpInfo.compressionType;

  const chunkType = String.fromCharCode(
    uint8Array[12],
    uint8Array[13],
    uint8Array[14],
    uint8Array[15]
  );

  if (chunkType === 'VP8 ' && uint8Array.length >= 30) {
    metadata.width = ((uint8Array[26] | (uint8Array[27] << 8)) & 0x3fff) + 1;
    metadata.height = ((uint8Array[28] | (uint8Array[29] << 8)) & 0x3fff) + 1;
  } else if (chunkType === 'VP8L' && uint8Array.length >= 25) {
    const bits =
      uint8Array[21] |
      (uint8Array[22] << 8) |
      (uint8Array[23] << 16) |
      (uint8Array[24] << 24);
    metadata.width = (bits & 0x3fff) + 1;
    metadata.height = ((bits >> 14) & 0x3fff) + 1;
  } else if (chunkType === 'VP8X' && uint8Array.length >= 30) {
    metadata.width =
      1 + (uint8Array[24] | (uint8Array[25] << 8) | (uint8Array[26] << 16));
    metadata.height =
      1 + (uint8Array[27] | (uint8Array[28] << 8) | (uint8Array[29] << 16));
  }

  return metadata;
}

/**
 * Converts Base64 string to WebP Blob with auto-correction of common input errors
 */
export async function base64ToWebp(
  base64Data: string,
  options: Base64ToWebpOptions = {}
): Promise<Base64ToWebpResult> {
  try {
    const { fileName = `webp-${Date.now()}.webp`, validateWebpHeader = true } =
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
      validateWebpHeader &&
      detectedFormat &&
      detectedFormat !== 'unknown' &&
      detectedFormat !== 'webp'
    ) {
      return {
        success: false,
        error: `This data appears to be a ${detectedFormat.toUpperCase()} image, not WebP.`,
        corrections: corrections.length > 0 ? corrections : undefined,
        wrongFormat: { detected: detectedFormat, expected: 'webp' },
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

    // Validate WebP header if required
    if (validateWebpHeader) {
      const webpCheck = isWebpData(uint8Array);
      if (!webpCheck.isWebp) {
        return {
          success: false,
          error:
            'Data does not appear to be a WebP image. Please check your Base64 string.',
          corrections: corrections.length > 0 ? corrections : undefined,
        };
      }
    }

    // Extract metadata
    const metadata = extractWebpMetadata(uint8Array);

    // Create Blob
    const webpBlob = new Blob([uint8Array], { type: 'image/webp' });

    return {
      success: true,
      webpBlob,
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
          : 'Failed to convert Base64 to WebP',
    };
  }
}
