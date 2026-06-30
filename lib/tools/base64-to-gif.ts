/**
 * Base64 to GIF Converter
 * Converts Base64 encoded data to GIF image files for download
 */

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

export interface Base64ToGifResult {
  success: boolean;
  error?: string;
  gifBlob?: Blob;
  fileSize?: number;
  fileName?: string;
  corrections?: string[];
  wrongFormat?: { detected: string; expected: string };
  metadata?: {
    isGif: boolean;
    hasValidHeader: boolean;
    estimatedSize: number;
    version?: 'GIF87a' | 'GIF89a';
    width?: number;
    height?: number;
    frameCount?: number;
  };
}

export interface Base64ToGifOptions {
  fileName?: string;
  validateGifHeader?: boolean;
}

/**
 * Checks if the decoded Base64 data represents a GIF file
 */
export function isGifData(uint8Array: Uint8Array): {
  isGif: boolean;
  version?: 'GIF87a' | 'GIF89a';
} {
  // GIF files start with "GIF87a" or "GIF89a"
  const gifHeader = [71, 73, 70]; // "GIF"

  if (uint8Array.length < 6) {
    return { isGif: false };
  }

  for (let i = 0; i < gifHeader.length; i++) {
    if (uint8Array[i] !== gifHeader[i]) {
      return { isGif: false };
    }
  }

  if (uint8Array[3] === 56 && uint8Array[4] === 57 && uint8Array[5] === 97) {
    return { isGif: true, version: 'GIF89a' };
  }

  if (uint8Array[3] === 56 && uint8Array[4] === 55 && uint8Array[5] === 97) {
    return { isGif: true, version: 'GIF87a' };
  }

  return { isGif: false };
}

/**
 * Counts the number of image frames in a GIF
 * Each frame starts with an Image Descriptor (byte 0x2C)
 */
export function countGifFrames(uint8Array: Uint8Array): number {
  let frameCount = 0;
  // Start after the header (13 bytes: 6 header + 7 logical screen descriptor)
  for (let i = 13; i < uint8Array.length; i++) {
    if (uint8Array[i] === 0x2c) {
      frameCount++;
    }
  }
  return Math.max(frameCount, 1); // At least 1 frame if valid GIF
}

/**
 * Extracts GIF dimensions from Logical Screen Descriptor (bytes 6-9, little-endian)
 */
export function extractGifDimensions(uint8Array: Uint8Array): {
  width?: number;
  height?: number;
} {
  if (uint8Array.length < 10) {
    return {};
  }

  const width = uint8Array[6] | (uint8Array[7] << 8);
  const height = uint8Array[8] | (uint8Array[9] << 8);

  return { width, height };
}

/**
 * Extracts basic metadata from GIF bytes
 */
export function extractGifMetadata(uint8Array: Uint8Array): {
  isGif: boolean;
  hasValidHeader: boolean;
  estimatedSize: number;
  version?: 'GIF87a' | 'GIF89a';
  width?: number;
  height?: number;
  frameCount?: number;
} {
  const { isGif, version } = isGifData(uint8Array);
  const hasValidHeader = isGif;
  const estimatedSize = uint8Array.length;
  const dimensions = extractGifDimensions(uint8Array);
  const frameCount = isGif ? countGifFrames(uint8Array) : undefined;

  return {
    isGif,
    hasValidHeader,
    estimatedSize,
    version,
    width: dimensions.width,
    height: dimensions.height,
    frameCount,
  };
}

/**
 * Converts Base64 string to GIF file with auto-correction of common input errors
 */
export async function base64ToGif(
  base64Data: string,
  options: Base64ToGifOptions = {}
): Promise<Base64ToGifResult> {
  try {
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
      options.validateGifHeader !== false &&
      detectedFormat &&
      detectedFormat !== 'unknown' &&
      detectedFormat !== 'gif'
    ) {
      return {
        success: false,
        error: `This data appears to be a ${detectedFormat.toUpperCase()} image, not GIF.`,
        corrections: corrections.length > 0 ? corrections : undefined,
        wrongFormat: { detected: detectedFormat, expected: 'gif' },
      };
    }

    // Validate Base64 format
    if (!isValidBase64(cleanBase64)) {
      return {
        success: false,
        error:
          'Invalid Base64 format. Please ensure your data contains only valid Base64 characters.',
        corrections: corrections.length > 0 ? corrections : undefined,
      };
    }

    // Decode Base64 to binary data off the main thread (avoids INP spikes).
    let uint8Array: Uint8Array<ArrayBuffer>;
    try {
      uint8Array = await decodeBase64ToBytes(cleanBase64);
    } catch (error) {
      return {
        success: false,
        error:
          'Failed to decode Base64 data. The data may be corrupted or incomplete.',
        corrections: corrections.length > 0 ? corrections : undefined,
      };
    }

    // Extract metadata
    const metadata = extractGifMetadata(uint8Array);

    // Validate GIF header if requested
    if (options.validateGifHeader !== false && !metadata.isGif) {
      return {
        success: false,
        error:
          'The decoded data does not appear to be a valid GIF file. GIF files should start with "GIF87a" or "GIF89a" header.',
        metadata,
        corrections: corrections.length > 0 ? corrections : undefined,
      };
    }

    // Create GIF blob
    const gifBlob = new Blob([uint8Array], { type: 'image/gif' });

    // Generate filename
    const fileName = options.fileName || `image_${Date.now()}.gif`;

    return {
      success: true,
      gifBlob,
      fileSize: uint8Array.length,
      fileName,
      metadata,
      corrections: corrections.length > 0 ? corrections : undefined,
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
