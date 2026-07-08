import {
  md5,
  crc32,
  generateHash,
  generateAllHashes,
  generateHmac,
  detectHashType,
  formatHash,
  bulkHash,
  getAlgorithmInfo,
  isAlgorithmSecure,
  formatAllHashesForCopy,
  formatFileSize,
  ALL_ALGORITHMS,
  HMAC_ALGORITHMS,
} from '@/lib/tools/hash-generator';

// ─── MD5 Tests (RFC 1321 test vectors) ─────────────────────────────────────

describe('md5', () => {
  it('should hash empty string correctly', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should hash "a" correctly', () => {
    expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
  });

  it('should hash "abc" correctly', () => {
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('should hash "message digest" correctly', () => {
    expect(md5('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
  });

  it('should hash "abcdefghijklmnopqrstuvwxyz" correctly', () => {
    expect(md5('abcdefghijklmnopqrstuvwxyz')).toBe(
      'c3fcd3d76192e4007dfb496cca67e13b'
    );
  });

  it('should return lowercase hex', () => {
    const result = md5('test');
    expect(result).toBe(result.toLowerCase());
  });

  it('should be deterministic', () => {
    expect(md5('hello world')).toBe(md5('hello world'));
  });

  it('should produce different hashes for different inputs', () => {
    expect(md5('hello')).not.toBe(md5('world'));
  });
});

// ─── CRC32 Tests ────────────────────────────────────────────────────────────

describe('crc32', () => {
  it('should hash empty string correctly', () => {
    expect(crc32('')).toBe('00000000');
  });

  it('should hash "123456789" correctly', () => {
    // Standard CRC32 test vector
    expect(crc32('123456789')).toBe('cbf43926');
  });

  it('should return 8-character hex string', () => {
    expect(crc32('anything')).toHaveLength(8);
  });

  it('should be deterministic', () => {
    expect(crc32('test')).toBe(crc32('test'));
  });
});

// ─── generateHash Tests ────────────────────────────────────────────────────

// crypto.subtle is not available in Jest jsdom environment
const hasSubtle = typeof globalThis.crypto?.subtle?.digest === 'function';
const itSubtle = hasSubtle ? it : it.skip;

describe('generateHash', () => {
  itSubtle('should generate SHA-256 hash', async () => {
    const result = await generateHash('hello', 'SHA-256');
    expect(result.success).toBe(true);
    expect(result.algorithm).toBe('SHA-256');
    expect(result.hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  itSubtle('should generate SHA-512 hash', async () => {
    const result = await generateHash('hello', 'SHA-512');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(128);
  });

  itSubtle('should generate SHA-384 hash', async () => {
    const result = await generateHash('hello', 'SHA-384');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(96);
  });

  itSubtle('should generate SHA-1 hash', async () => {
    const result = await generateHash('hello', 'SHA-1');
    expect(result.success).toBe(true);
    expect(result.hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('should generate MD5 hash', async () => {
    const result = await generateHash('hello', 'MD5');
    expect(result.success).toBe(true);
    expect(result.hash).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('should generate CRC32 hash', async () => {
    const result = await generateHash('hello', 'CRC32');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(8);
  });

  it('should prepend salt by default', async () => {
    const withSalt = await generateHash('hello', 'MD5', 'salt');
    const manual = await generateHash('salthello', 'MD5');
    expect(withSalt.hash).toBe(manual.hash);
  });

  it('should support append salt position', async () => {
    const withSalt = await generateHash('hello', 'MD5', 'salt', 'append');
    const manual = await generateHash('hellosalt', 'MD5');
    expect(withSalt.hash).toBe(manual.hash);
  });

  itSubtle('should handle empty input', async () => {
    const result = await generateHash('', 'SHA-256');
    expect(result.success).toBe(true);
    // SHA-256 of empty string
    expect(result.hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  itSubtle('should handle unicode input', async () => {
    const result = await generateHash('Hello, World! Emoji: \u{1F600}', 'SHA-256');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(64);
  });
});

// ─── generateAllHashes Tests ───────────────────────────────────────────────

describe('generateAllHashes', () => {
  itSubtle('should generate hashes for all algorithms', async () => {
    const result = await generateAllHashes('test');
    expect(result.success).toBe(true);
    expect(Object.keys(result.hashes)).toHaveLength(ALL_ALGORITHMS.length);
  });

  itSubtle('should include all expected algorithms', async () => {
    const result = await generateAllHashes('test');
    for (const algo of ALL_ALGORITHMS) {
      expect(result.hashes[algo]).toBeDefined();
    }
  });

  it('should pass salt through to all algorithms', async () => {
    const withSalt = await generateAllHashes('test', 'mysalt');
    const manual = await generateHash('mysalttest', 'MD5');
    expect(withSalt.hashes['MD5']).toBe(manual.hash);
  });
});

// ─── HMAC Tests ────────────────────────────────────────────────────────────

describe('generateHmac', () => {
  itSubtle('should generate HMAC-SHA256', async () => {
    const result = await generateHmac('hello', 'secret', 'SHA-256');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(64);
  });

  itSubtle('should generate HMAC-SHA512', async () => {
    const result = await generateHmac('hello', 'secret', 'SHA-512');
    expect(result.success).toBe(true);
    expect(result.hash).toHaveLength(128);
  });

  it('should reject MD5 for HMAC', async () => {
    const result = await generateHmac('hello', 'key', 'MD5');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not supported');
  });

  it('should reject CRC32 for HMAC', async () => {
    const result = await generateHmac('hello', 'key', 'CRC32');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not supported');
  });

  it('should reject empty key', async () => {
    const result = await generateHmac('hello', '', 'SHA-256');
    expect(result.success).toBe(false);
    expect(result.error).toContain('key is required');
  });

  itSubtle('should be deterministic', async () => {
    const r1 = await generateHmac('msg', 'key', 'SHA-256');
    const r2 = await generateHmac('msg', 'key', 'SHA-256');
    expect(r1.hash).toBe(r2.hash);
  });

  itSubtle('should produce different output for different keys', async () => {
    const r1 = await generateHmac('msg', 'key1', 'SHA-256');
    const r2 = await generateHmac('msg', 'key2', 'SHA-256');
    expect(r1.hash).not.toBe(r2.hash);
  });
});

// ─── formatHash Tests ──────────────────────────────────────────────────────

describe('formatHash', () => {
  const sampleHex = '5d41402abc4b2a76b9719d911017c592';

  it('should return lowercase hex', () => {
    expect(formatHash(sampleHex, 'hex')).toBe(sampleHex.toLowerCase());
  });

  it('should return uppercase hex', () => {
    expect(formatHash(sampleHex, 'hex-upper')).toBe(sampleHex.toUpperCase());
  });

  it('should return base64', () => {
    const b64 = formatHash(sampleHex, 'base64');
    expect(b64).toBeTruthy();
    // Base64 should only contain valid chars
    expect(/^[A-Za-z0-9+/]+=*$/.test(b64)).toBe(true);
  });

  it('should roundtrip hex -> base64 -> hex', () => {
    const b64 = formatHash(sampleHex, 'base64');
    const decoded = atob(b64);
    const reHex = Array.from(decoded)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    expect(reHex).toBe(sampleHex.toLowerCase());
  });
});

// ─── detectHashType Tests ──────────────────────────────────────────────────

describe('detectHashType', () => {
  it('should detect MD5 (32 chars)', () => {
    const types = detectHashType('d41d8cd98f00b204e9800998ecf8427e');
    expect(types).toHaveLength(1);
    expect(types[0].algorithm).toBe('MD5');
    expect(types[0].confidence).toBe('high');
  });

  it('should detect SHA-1 (40 chars)', () => {
    const types = detectHashType(
      'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'
    );
    expect(types[0].algorithm).toBe('SHA-1');
  });

  it('should detect SHA-256 (64 chars)', () => {
    const types = detectHashType(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
    expect(types[0].algorithm).toBe('SHA-256');
  });

  it('should detect SHA-384 (96 chars)', () => {
    const hash = 'a'.repeat(96);
    const types = detectHashType(hash);
    expect(types[0].algorithm).toBe('SHA-384');
  });

  it('should detect SHA-512 (128 chars)', () => {
    const hash = 'a'.repeat(128);
    const types = detectHashType(hash);
    expect(types[0].algorithm).toBe('SHA-512');
  });

  it('should detect CRC32 (8 chars)', () => {
    const types = detectHashType('cbf43926');
    expect(types[0].algorithm).toBe('CRC32');
  });

  it('should return empty for invalid hex', () => {
    const types = detectHashType('not-a-hash!');
    expect(types).toHaveLength(0);
  });

  it('should return empty for unknown length', () => {
    const types = detectHashType('abcdef'); // 6 chars - no known algorithm
    expect(types).toHaveLength(0);
  });

  it('should handle whitespace', () => {
    const types = detectHashType('  d41d8cd98f00b204e9800998ecf8427e  ');
    expect(types[0].algorithm).toBe('MD5');
  });
});

// ─── bulkHash Tests ────────────────────────────────────────────────────────

describe('bulkHash', () => {
  it('should hash multiple inputs', async () => {
    const results = await bulkHash(['hello', 'world'], 'MD5');
    expect(results).toHaveLength(2);
    expect(results[0].input).toBe('hello');
    expect(results[0].hash).toBe('5d41402abc4b2a76b9719d911017c592');
    expect(results[1].input).toBe('world');
  });

  it('should skip empty lines', async () => {
    const results = await bulkHash(['hello', '', '  ', 'world'], 'MD5');
    expect(results).toHaveLength(2);
  });

  it('should trim inputs', async () => {
    const results = await bulkHash(['  hello  '], 'MD5');
    expect(results[0].input).toBe('hello');
  });

  it('should handle empty array', async () => {
    const results = await bulkHash([], 'SHA-256');
    expect(results).toHaveLength(0);
  });
});

// ─── Algorithm Info Tests ──────────────────────────────────────────────────

describe('getAlgorithmInfo', () => {
  it('should return info for SHA-256', () => {
    const info = getAlgorithmInfo('SHA-256');
    expect(info).toBeDefined();
    expect(info!.outputBits).toBe(256);
    expect(info!.outputHexLength).toBe(64);
    expect(info!.secure).toBe(true);
  });

  it('should return warning for MD5', () => {
    const info = getAlgorithmInfo('MD5');
    expect(info!.secure).toBe(false);
    expect(info!.warning).toContain('broken');
  });

  it('should return warning for SHA-1', () => {
    const info = getAlgorithmInfo('SHA-1');
    expect(info!.secure).toBe(false);
    expect(info!.warning).toContain('broken');
  });

  it('should return warning for CRC32', () => {
    const info = getAlgorithmInfo('CRC32');
    expect(info!.secure).toBe(false);
    expect(info!.warning).toContain('checksum');
  });

  it('should return undefined for unknown algorithm', () => {
    expect(getAlgorithmInfo('UNKNOWN')).toBeUndefined();
  });
});

describe('isAlgorithmSecure', () => {
  it('should mark SHA-256 as secure', () => {
    expect(isAlgorithmSecure('SHA-256')).toBe(true);
  });

  it('should mark SHA-512 as secure', () => {
    expect(isAlgorithmSecure('SHA-512')).toBe(true);
  });

  it('should mark MD5 as insecure', () => {
    expect(isAlgorithmSecure('MD5')).toBe(false);
  });

  it('should mark SHA-1 as insecure', () => {
    expect(isAlgorithmSecure('SHA-1')).toBe(false);
  });
});

// ─── Utility Tests ─────────────────────────────────────────────────────────

describe('formatAllHashesForCopy', () => {
  it('should format hashes as aligned text', () => {
    const hashes = { MD5: 'abc123', 'SHA-256': 'def456' };
    const result = formatAllHashesForCopy(hashes);
    expect(result).toContain('MD5');
    expect(result).toContain('SHA-256');
    expect(result).toContain('abc123');
    expect(result).toContain('def456');
    expect(result.split('\n')).toHaveLength(2);
  });

  it('should apply output format', () => {
    const hashes = { MD5: 'abc123' };
    const result = formatAllHashesForCopy(hashes, 'hex-upper');
    expect(result).toContain('ABC123');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

// ─── Constants Tests ───────────────────────────────────────────────────────

describe('constants', () => {
  it('ALL_ALGORITHMS should contain 6 algorithms', () => {
    expect(ALL_ALGORITHMS).toHaveLength(6);
  });

  it('HMAC_ALGORITHMS should contain only SHA algorithms', () => {
    for (const algo of HMAC_ALGORITHMS) {
      expect(algo.startsWith('SHA-')).toBe(true);
    }
  });

  it('HMAC_ALGORITHMS should not contain MD5 or CRC32', () => {
    expect(HMAC_ALGORITHMS).not.toContain('MD5');
    expect(HMAC_ALGORITHMS).not.toContain('CRC32');
  });
});
