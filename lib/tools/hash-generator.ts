import type { HashAlgorithm } from '@/lib/types/tools';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OutputFormat = 'hex' | 'hex-upper' | 'base64';
export type HashMode = 'hash' | 'hmac';
export type InputMode = 'text' | 'file' | 'bulk';
export type SaltPosition = 'prepend' | 'append';

export interface HashResult {
  success: boolean;
  algorithm: HashAlgorithm;
  hash?: string;
  error?: string;
}

export interface AllHashesResult {
  success: boolean;
  hashes: Record<string, string>;
  error?: string;
}

export interface FileHashResult {
  success: boolean;
  algorithm: HashAlgorithm;
  hash?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface BulkHashResult {
  input: string;
  hash: string;
}

export interface DetectedHashType {
  algorithm: string;
  confidence: 'high' | 'medium';
}

export interface AlgorithmInfo {
  name: string;
  outputBits: number;
  outputHexLength: number;
  secure: boolean;
  warning?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ALL_ALGORITHMS: HashAlgorithm[] = [
  'SHA-256',
  'SHA-512',
  'SHA-384',
  'SHA-1',
  'MD5',
  'CRC32',
];

export const HMAC_ALGORITHMS: HashAlgorithm[] = [
  'SHA-256',
  'SHA-512',
  'SHA-384',
  'SHA-1',
];

const ALGORITHM_INFO: Record<string, AlgorithmInfo> = {
  'SHA-256': {
    name: 'SHA-256',
    outputBits: 256,
    outputHexLength: 64,
    secure: true,
  },
  'SHA-512': {
    name: 'SHA-512',
    outputBits: 512,
    outputHexLength: 128,
    secure: true,
  },
  'SHA-384': {
    name: 'SHA-384',
    outputBits: 384,
    outputHexLength: 96,
    secure: true,
  },
  'SHA-1': {
    name: 'SHA-1',
    outputBits: 160,
    outputHexLength: 40,
    secure: false,
    warning:
      'SHA-1 is cryptographically broken. Do not use for security purposes.',
  },
  MD5: {
    name: 'MD5',
    outputBits: 128,
    outputHexLength: 32,
    secure: false,
    warning:
      'MD5 is cryptographically broken. Do not use for security purposes.',
  },
  CRC32: {
    name: 'CRC32',
    outputBits: 32,
    outputHexLength: 8,
    secure: false,
    warning: 'CRC32 is a checksum, not a cryptographic hash. Use only for error detection.',
  },
};

// File hashing chunk size: 2MB
const FILE_CHUNK_SIZE = 2 * 1024 * 1024;

// ─── MD5 Implementation ────────────────────────────────────────────────────

function md5RotateLeft(n: number, s: number): number {
  return (n << s) | (n >>> (32 - s));
}

function md5AddUnsigned(x: number, y: number): number {
  return (
    ((x & 0x7fffffff) + (y & 0x7fffffff)) ^
    (x & 0x80000000) ^
    (y & 0x80000000)
  );
}

function md5F(x: number, y: number, z: number): number {
  return (x & y) | (~x & z);
}
function md5G(x: number, y: number, z: number): number {
  return (x & z) | (y & ~z);
}
function md5H(x: number, y: number, z: number): number {
  return x ^ y ^ z;
}
function md5I(x: number, y: number, z: number): number {
  return y ^ (x | ~z);
}

function md5Round(
  fn: (x: number, y: number, z: number) => number,
  a: number,
  b: number,
  c: number,
  d: number,
  x: number,
  s: number,
  ac: number
): number {
  a = md5AddUnsigned(a, md5AddUnsigned(md5AddUnsigned(fn(b, c, d), x), ac));
  return md5AddUnsigned(md5RotateLeft(a, s), b);
}

function md5ConvertToWordArray(str: string): number[] {
  const lMessageLength = str.length;
  const lNumberOfWordsTemp1 = lMessageLength + 8;
  const lNumberOfWordsTemp2 =
    (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
  const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
  const lWordArray = new Array(lNumberOfWords - 1);
  let lBytePosition = 0;
  let lByteCount = 0;
  while (lByteCount < lMessageLength) {
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] =
      lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
    lByteCount++;
  }
  const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
  lBytePosition = (lByteCount % 4) * 8;
  lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
  lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
  lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
  return lWordArray;
}

function md5WordToHex(lValue: number): string {
  let result = '';
  for (let lCount = 0; lCount <= 3; lCount++) {
    const lByte = (lValue >>> (lCount * 8)) & 255;
    const temp = '0' + lByte.toString(16);
    result += temp.substr(temp.length - 2, 2);
  }
  return result;
}

export function md5(input: string): string {
  const x = md5ConvertToWordArray(input);
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;

    a = md5Round(md5F, a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = md5Round(md5F, d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = md5Round(md5F, c, d, a, b, x[k + 2], S13, 0x242070db);
    b = md5Round(md5F, b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = md5Round(md5F, a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = md5Round(md5F, d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = md5Round(md5F, c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = md5Round(md5F, b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = md5Round(md5F, a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = md5Round(md5F, d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = md5Round(md5F, c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = md5Round(md5F, b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = md5Round(md5F, a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = md5Round(md5F, d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = md5Round(md5F, c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = md5Round(md5F, b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = md5Round(md5G, a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = md5Round(md5G, d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = md5Round(md5G, c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = md5Round(md5G, b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = md5Round(md5G, a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = md5Round(md5G, d, a, b, c, x[k + 10], S22, 0x2441453);
    c = md5Round(md5G, c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = md5Round(md5G, b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = md5Round(md5G, a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = md5Round(md5G, d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = md5Round(md5G, c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = md5Round(md5G, b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = md5Round(md5G, a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = md5Round(md5G, d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = md5Round(md5G, c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = md5Round(md5G, b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = md5Round(md5H, a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = md5Round(md5H, d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = md5Round(md5H, c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = md5Round(md5H, b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = md5Round(md5H, a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = md5Round(md5H, d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = md5Round(md5H, c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = md5Round(md5H, b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = md5Round(md5H, a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = md5Round(md5H, d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = md5Round(md5H, c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = md5Round(md5H, b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = md5Round(md5H, a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = md5Round(md5H, d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = md5Round(md5H, c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = md5Round(md5H, b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = md5Round(md5I, a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = md5Round(md5I, d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = md5Round(md5I, c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = md5Round(md5I, b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = md5Round(md5I, a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = md5Round(md5I, d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = md5Round(md5I, c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = md5Round(md5I, b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = md5Round(md5I, a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = md5Round(md5I, d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = md5Round(md5I, c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = md5Round(md5I, b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = md5Round(md5I, a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = md5Round(md5I, d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = md5Round(md5I, c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = md5Round(md5I, b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = md5AddUnsigned(a, AA);
    b = md5AddUnsigned(b, BB);
    c = md5AddUnsigned(c, CC);
    d = md5AddUnsigned(d, DD);
  }

  return (
    md5WordToHex(a) +
    md5WordToHex(b) +
    md5WordToHex(c) +
    md5WordToHex(d)
  ).toLowerCase();
}

// ─── CRC32 Implementation ──────────────────────────────────────────────────

const CRC32_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

export function crc32(input: string): string {
  let crc = 0 ^ -1;
  for (let i = 0; i < input.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ input.charCodeAt(i)) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0');
}

export function crc32Bytes(data: Uint8Array): string {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0');
}

// ─── Core Hash Functions ───────────────────────────────────────────────────

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateHash(
  input: string,
  algorithm: HashAlgorithm,
  salt?: string,
  saltPosition: SaltPosition = 'prepend'
): Promise<HashResult> {
  try {
    const textToHash = salt
      ? saltPosition === 'prepend'
        ? `${salt}${input}`
        : `${input}${salt}`
      : input;

    let hash: string;

    if (algorithm === 'MD5') {
      hash = md5(textToHash);
    } else if (algorithm === 'CRC32') {
      hash = crc32(textToHash);
    } else {
      const encoder = new TextEncoder();
      const data = encoder.encode(textToHash);
      const hashBuffer = await crypto.subtle.digest(algorithm, data);
      hash = arrayBufferToHex(hashBuffer);
    }

    return { success: true, algorithm, hash };
  } catch (error) {
    return {
      success: false,
      algorithm,
      error: error instanceof Error ? error.message : 'Hash generation failed',
    };
  }
}

export async function generateAllHashes(
  input: string,
  salt?: string,
  saltPosition: SaltPosition = 'prepend'
): Promise<AllHashesResult> {
  try {
    const hashes: Record<string, string> = {};

    for (const algo of ALL_ALGORITHMS) {
      const result = await generateHash(input, algo, salt, saltPosition);
      if (result.success && result.hash) {
        hashes[algo] = result.hash;
      }
    }

    return { success: true, hashes };
  } catch (error) {
    return {
      success: false,
      hashes: {},
      error: error instanceof Error ? error.message : 'Hash generation failed',
    };
  }
}

// ─── HMAC ──────────────────────────────────────────────────────────────────

export async function generateHmac(
  input: string,
  key: string,
  algorithm: HashAlgorithm
): Promise<HashResult> {
  if (!HMAC_ALGORITHMS.includes(algorithm)) {
    return {
      success: false,
      algorithm,
      error: `HMAC is not supported for ${algorithm}. Use SHA-1, SHA-256, SHA-384, or SHA-512.`,
    };
  }

  if (!key) {
    return { success: false, algorithm, error: 'HMAC key is required' };
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(input);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hash = arrayBufferToHex(signature);

    return { success: true, algorithm, hash };
  } catch (error) {
    return {
      success: false,
      algorithm,
      error: error instanceof Error ? error.message : 'HMAC generation failed',
    };
  }
}

export async function generateAllHmacs(
  input: string,
  key: string
): Promise<AllHashesResult> {
  try {
    const hashes: Record<string, string> = {};

    for (const algo of HMAC_ALGORITHMS) {
      const result = await generateHmac(input, key, algo);
      if (result.success && result.hash) {
        hashes[`HMAC-${algo}`] = result.hash;
      }
    }

    return { success: true, hashes };
  } catch (error) {
    return {
      success: false,
      hashes: {},
      error: error instanceof Error ? error.message : 'HMAC generation failed',
    };
  }
}

// ─── File Hashing ──────────────────────────────────────────────────────────

export async function hashFile(
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (progress: number) => void
): Promise<FileHashResult> {
  try {
    if (algorithm === 'MD5' || algorithm === 'CRC32') {
      // For MD5/CRC32, read the entire file as text (they operate on strings)
      // For large files this is inefficient but acceptable for browser use
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      onProgress?.(50);

      let hash: string;
      if (algorithm === 'CRC32') {
        hash = crc32Bytes(data);
      } else {
        // Convert to string for MD5 (note: this is byte-level, not UTF-8)
        const decoder = new TextDecoder('latin1');
        hash = md5(decoder.decode(data));
      }

      onProgress?.(100);
      return {
        success: true,
        algorithm,
        hash,
        fileName: file.name,
        fileSize: file.size,
      };
    }

    // For SHA algorithms, use streaming with Web Crypto API
    // Read file in chunks for progress tracking
    const totalSize = file.size;
    let processedSize = 0;
    const chunks: Uint8Array[] = [];

    const reader = file.stream().getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      processedSize += value.length;
      onProgress?.(Math.round((processedSize / totalSize) * 90));
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const hashBuffer = await crypto.subtle.digest(algorithm, combined);
    const hash = arrayBufferToHex(hashBuffer);
    onProgress?.(100);

    return {
      success: true,
      algorithm,
      hash,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    return {
      success: false,
      algorithm,
      error: error instanceof Error ? error.message : 'File hashing failed',
      fileName: file.name,
      fileSize: file.size,
    };
  }
}

export async function hashFileAllAlgorithms(
  file: File,
  onProgress?: (progress: number) => void
): Promise<AllHashesResult> {
  try {
    const hashes: Record<string, string> = {};
    const totalAlgos = ALL_ALGORITHMS.length;

    for (let i = 0; i < totalAlgos; i++) {
      const algo = ALL_ALGORITHMS[i];
      const result = await hashFile(file, algo, (p) => {
        const baseProgress = (i / totalAlgos) * 100;
        const algoProgress = (p / 100) * (100 / totalAlgos);
        onProgress?.(Math.round(baseProgress + algoProgress));
      });
      if (result.success && result.hash) {
        hashes[algo] = result.hash;
      }
    }

    return { success: true, hashes };
  } catch (error) {
    return {
      success: false,
      hashes: {},
      error: error instanceof Error ? error.message : 'File hashing failed',
    };
  }
}

// ─── Output Format Conversion ──────────────────────────────────────────────

export function formatHash(hexHash: string, format: OutputFormat): string {
  switch (format) {
    case 'hex':
      return hexHash.toLowerCase();
    case 'hex-upper':
      return hexHash.toUpperCase();
    case 'base64': {
      const bytes = new Uint8Array(
        hexHash.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );
      return btoa(String.fromCharCode(...bytes));
    }
    default:
      return hexHash;
  }
}

// ─── Hash Type Detection ───────────────────────────────────────────────────

const HASH_LENGTH_MAP: Record<number, DetectedHashType[]> = {
  8: [{ algorithm: 'CRC32', confidence: 'high' }],
  32: [{ algorithm: 'MD5', confidence: 'high' }],
  40: [{ algorithm: 'SHA-1', confidence: 'high' }],
  64: [{ algorithm: 'SHA-256', confidence: 'high' }],
  96: [{ algorithm: 'SHA-384', confidence: 'high' }],
  128: [{ algorithm: 'SHA-512', confidence: 'high' }],
};

export function detectHashType(hash: string): DetectedHashType[] {
  const cleaned = hash.trim().toLowerCase();

  // Must be valid hex
  if (!/^[a-f0-9]+$/.test(cleaned)) {
    // Check if it's base64
    if (/^[A-Za-z0-9+/]+=*$/.test(hash.trim())) {
      try {
        const decoded = atob(hash.trim());
        const hexLength = decoded.length * 2;
        const matches = HASH_LENGTH_MAP[hexLength];
        if (matches) {
          return matches.map((m) => ({ ...m, confidence: 'medium' as const }));
        }
      } catch {
        // Not valid base64
      }
    }
    return [];
  }

  return HASH_LENGTH_MAP[cleaned.length] || [];
}

// ─── Bulk Hashing ──────────────────────────────────────────────────────────

export async function bulkHash(
  inputs: string[],
  algorithm: HashAlgorithm
): Promise<BulkHashResult[]> {
  const results: BulkHashResult[] = [];

  for (const input of inputs) {
    const trimmed = input.trim();
    if (!trimmed) continue;

    const result = await generateHash(trimmed, algorithm);
    results.push({
      input: trimmed,
      hash: result.success && result.hash ? result.hash : 'ERROR',
    });
  }

  return results;
}

// ─── Algorithm Info ────────────────────────────────────────────────────────

export function getAlgorithmInfo(algorithm: string): AlgorithmInfo | undefined {
  return ALGORITHM_INFO[algorithm];
}

export function isAlgorithmSecure(algorithm: string): boolean {
  const info = ALGORITHM_INFO[algorithm];
  return info ? info.secure : false;
}

// ─── Utility: Format all hashes for copy ───────────────────────────────────

export function formatAllHashesForCopy(
  hashes: Record<string, string>,
  format: OutputFormat = 'hex'
): string {
  return Object.entries(hashes)
    .map(([algo, hash]) => `${algo.padEnd(10)} ${formatHash(hash, format)}`)
    .join('\n');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
