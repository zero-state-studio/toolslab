// JWT Decoder - Professional JWT token parsing and analysis
export interface JwtDecodedHeader {
  alg?: string; // Algorithm
  typ?: string; // Type
  kid?: string; // Key ID
  [key: string]: any;
}

export interface JwtDecodedPayload {
  iss?: string; // Issuer
  sub?: string; // Subject
  aud?: string | string[]; // Audience
  exp?: number; // Expiration time
  nbf?: number; // Not before
  iat?: number; // Issued at
  jti?: string; // JWT ID
  [key: string]: any;
}

export interface JwtDecodeResult {
  success: boolean;
  error?: string;
  header?: JwtDecodedHeader;
  payload?: JwtDecodedPayload;
  signature?: string;
  isValid: boolean;
  isExpired: boolean;
  timeInfo: {
    issuedAt?: string;
    expiresAt?: string;
    notBefore?: string;
    age?: string;
    timeToExpiry?: string;
  };
  securityInfo: {
    algorithm: string;
    isSecure: boolean;
    warnings: string[];
  };
  claimsAnalysis: {
    standardClaims: Array<{
      key: string;
      value: any;
      description: string;
    }>;
    customClaims: Array<{
      key: string;
      value: any;
    }>;
  };
  metadata: {
    headerSize: number;
    payloadSize: number;
    signatureSize: number;
    totalSize: number;
    structure: 'valid' | 'invalid';
  };
  suggestions: string[];
}

export interface JwtDecodeOptions {
  validateStructure?: boolean;
  analyzeTime?: boolean;
  provideSuggestions?: boolean;
}

// Standard JWT claims with descriptions
const STANDARD_CLAIMS: Record<string, string> = {
  iss: 'Issuer - The entity that issued the JWT',
  sub: 'Subject - The principal that the JWT is about (user ID)',
  aud: 'Audience - The intended recipients of the JWT',
  exp: 'Expiration Time - When the JWT expires (Unix timestamp)',
  nbf: 'Not Before - Time before which the JWT is not valid',
  iat: 'Issued At - Time when the JWT was issued (Unix timestamp)',
  jti: 'JWT ID - Unique identifier for the JWT',
  scope: 'Scope - Permissions granted to the token holder',
  azp: 'Authorized Party - The party to which the ID token was issued',
  nonce: 'Nonce - A random value to prevent replay attacks',
  auth_time: 'Authentication Time - When user authentication occurred',
  acr: 'Authentication Context Class Reference',
  amr: 'Authentication Methods References',
  email: 'Email address of the user',
  email_verified: 'Whether the email address has been verified',
  name: 'Full name of the user',
  given_name: 'Given name of the user',
  family_name: 'Family name of the user',
  picture: 'Profile picture URL',
  roles: 'User roles or permissions',
  groups: 'Groups the user belongs to',
};

// Security assessment for JWT algorithms
const ALGORITHM_SECURITY: Record<
  string,
  { secure: boolean; warnings: string[] }
> = {
  none: {
    secure: false,
    warnings: [
      'Algorithm "none" provides no signature verification',
      'Tokens can be easily forged',
    ],
  },
  HS256: {
    secure: true,
    warnings: [
      'Symmetric algorithm - same key for signing and verification',
      'Key must be kept secret on both client and server',
    ],
  },
  HS384: {
    secure: true,
    warnings: ['Symmetric algorithm - same key for signing and verification'],
  },
  HS512: {
    secure: true,
    warnings: ['Symmetric algorithm - same key for signing and verification'],
  },
  RS256: {
    secure: true,
    warnings: [],
  },
  RS384: {
    secure: true,
    warnings: [],
  },
  RS512: {
    secure: true,
    warnings: [],
  },
  ES256: {
    secure: true,
    warnings: [],
  },
  ES384: {
    secure: true,
    warnings: [],
  },
  ES512: {
    secure: true,
    warnings: [],
  },
  PS256: {
    secure: true,
    warnings: [],
  },
  PS384: {
    secure: true,
    warnings: [],
  },
  PS512: {
    secure: true,
    warnings: [],
  },
};

/**
 * Base64URL encode a UTF-8 string or raw bytes (no padding, URL-safe alphabet)
 */
function base64UrlEncode(input: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input;
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode function
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  switch (base64.length % 4) {
    case 0:
      break;
    case 2:
      base64 += '==';
      break;
    case 3:
      base64 += '=';
      break;
    default:
      throw new Error('Invalid base64url string');
  }

  try {
    // Decode base64 and handle UTF-8
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    throw new Error('Invalid base64url encoding');
  }
}

/**
 * Format Unix timestamp to readable date
 */
function formatTimestamp(timestamp: number): string {
  try {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Calculate relative time from Unix timestamp
 */
function getRelativeTime(timestamp: number): string {
  try {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);

    if (absDiff < 60) {
      return diff > 0 ? 'in a few seconds' : 'a few seconds ago';
    } else if (absDiff < 3600) {
      const mins = Math.floor(absDiff / 60);
      return diff > 0
        ? `in ${mins} minute${mins > 1 ? 's' : ''}`
        : `${mins} minute${mins > 1 ? 's' : ''} ago`;
    } else if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return diff > 0
        ? `in ${hours} hour${hours > 1 ? 's' : ''}`
        : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(absDiff / 86400);
      return diff > 0
        ? `in ${days} day${days > 1 ? 's' : ''}`
        : `${days} day${days > 1 ? 's' : ''} ago`;
    }
  } catch {
    return 'unknown';
  }
}

/**
 * Validate JWT structure
 */
function validateJwtStructure(token: string): {
  valid: boolean;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required' };
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return { valid: false, error: 'Token cannot be empty' };
  }

  const parts = trimmedToken.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: `Invalid JWT structure: expected 3 parts separated by dots, got ${parts.length}`,
    };
  }

  const [header, payload, signature] = parts;

  if (!header) {
    return { valid: false, error: 'Missing JWT header' };
  }

  if (!payload) {
    return { valid: false, error: 'Missing JWT payload' };
  }

  // Signature can be empty for unsigned tokens
  if (signature === undefined) {
    return { valid: false, error: 'Missing JWT signature section' };
  }

  return { valid: true };
}

/**
 * Analyze JWT claims and categorize them
 */
function analyzeClaims(payload: JwtDecodedPayload): {
  standardClaims: Array<{ key: string; value: any; description: string }>;
  customClaims: Array<{ key: string; value: any }>;
} {
  const standardClaims = [];
  const customClaims = [];

  for (const [key, value] of Object.entries(payload)) {
    if (STANDARD_CLAIMS[key]) {
      standardClaims.push({
        key,
        value,
        description: STANDARD_CLAIMS[key],
      });
    } else {
      customClaims.push({
        key,
        value,
      });
    }
  }

  return { standardClaims, customClaims };
}

/**
 * Generate tool chaining suggestions based on JWT content
 */
function generateSuggestions(
  header: JwtDecodedHeader,
  payload: JwtDecodedPayload
): string[] {
  const suggestions = [];

  // Check for Base64 encoded data in payload
  if (
    payload &&
    Object.values(payload).some(
      (value) =>
        typeof value === 'string' &&
        value.length > 20 &&
        /^[A-Za-z0-9+/=]+$/.test(value)
    )
  ) {
    suggestions.push(
      'Found potential Base64 data in payload - try the Base64 Decoder tool'
    );
  }

  // Check for JSON strings in payload
  if (
    payload &&
    Object.values(payload).some(
      (value) =>
        typeof value === 'string' &&
        (value.startsWith('{') || value.startsWith('['))
    )
  ) {
    suggestions.push(
      'Found JSON strings in payload - try the JSON Formatter tool'
    );
  }

  // Check for URLs in payload
  if (
    payload &&
    Object.values(payload).some(
      (value) =>
        typeof value === 'string' &&
        (value.startsWith('http://') || value.startsWith('https://'))
    )
  ) {
    suggestions.push(
      'Found URLs in payload - try URL encoding/decoding tools if needed'
    );
  }

  // Check for hashed values
  if (
    payload &&
    Object.values(payload).some(
      (value) => typeof value === 'string' && /^[a-f0-9]{32,}$/.test(value)
    )
  ) {
    suggestions.push(
      'Found potential hash values - try the Hash Generator tool for verification'
    );
  }

  // Security suggestions
  if (header?.alg === 'none') {
    suggestions.push(
      'Consider using a secure signing algorithm instead of "none" for production tokens'
    );
  }

  if (payload?.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    suggestions.push(
      'Token is expired - check expiration handling in your application'
    );
  }

  return suggestions;
}

/**
 * Main JWT decoder function
 */
export function decodeJwt(
  token: string,
  options: JwtDecodeOptions = {}
): JwtDecodeResult {
  const {
    validateStructure = true,
    analyzeTime = true,
    provideSuggestions = true,
  } = options;

  try {
    // Validate structure first
    if (validateStructure) {
      const structureValidation = validateJwtStructure(token);
      if (!structureValidation.valid) {
        return {
          success: false,
          error: structureValidation.error,
          isValid: false,
          isExpired: false,
          timeInfo: {},
          securityInfo: {
            algorithm: 'unknown',
            isSecure: false,
            warnings: ['Invalid token structure'],
          },
          claimsAnalysis: {
            standardClaims: [],
            customClaims: [],
          },
          metadata: {
            headerSize: 0,
            payloadSize: 0,
            signatureSize: 0,
            totalSize: token ? token.length : 0,
            structure: 'invalid',
          },
          suggestions: [],
        };
      }
    }

    const parts = token.trim().split('.');
    const [headerPart, payloadPart, signaturePart] = parts;

    // Decode header
    let header: JwtDecodedHeader;
    try {
      const decodedHeader = base64UrlDecode(headerPart);
      header = JSON.parse(decodedHeader);
    } catch (error) {
      return {
        success: false,
        error: `Invalid JWT header: ${error instanceof Error ? error.message : 'Failed to decode'}`,
        isValid: false,
        isExpired: false,
        timeInfo: {},
        securityInfo: {
          algorithm: 'unknown',
          isSecure: false,
          warnings: ['Invalid header encoding'],
        },
        claimsAnalysis: {
          standardClaims: [],
          customClaims: [],
        },
        metadata: {
          headerSize: headerPart.length,
          payloadSize: payloadPart.length,
          signatureSize: signaturePart.length,
          totalSize: token.length,
          structure: 'invalid',
        },
        suggestions: [],
      };
    }

    // Decode payload
    let payload: JwtDecodedPayload;
    try {
      const decodedPayload = base64UrlDecode(payloadPart);
      payload = JSON.parse(decodedPayload);
    } catch (error) {
      return {
        success: false,
        error: `Invalid JWT payload: ${error instanceof Error ? error.message : 'Failed to decode'}`,
        header,
        isValid: false,
        isExpired: false,
        timeInfo: {},
        securityInfo: {
          algorithm: header?.alg || 'unknown',
          isSecure: false,
          warnings: ['Invalid payload encoding'],
        },
        claimsAnalysis: {
          standardClaims: [],
          customClaims: [],
        },
        metadata: {
          headerSize: headerPart.length,
          payloadSize: payloadPart.length,
          signatureSize: signaturePart.length,
          totalSize: token.length,
          structure: 'invalid',
        },
        suggestions: [],
      };
    }

    // Analyze time-based claims
    const timeInfo: JwtDecodeResult['timeInfo'] = {};
    let isExpired = false;

    if (analyzeTime) {
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp) {
        timeInfo.expiresAt = formatTimestamp(payload.exp);
        timeInfo.timeToExpiry = getRelativeTime(payload.exp);
        isExpired = payload.exp < now;
      }

      if (payload.iat) {
        timeInfo.issuedAt = formatTimestamp(payload.iat);
        timeInfo.age = getRelativeTime(payload.iat);
      }

      if (payload.nbf) {
        timeInfo.notBefore = formatTimestamp(payload.nbf);
      }
    }

    // Security analysis
    const algorithm = header?.alg || 'unknown';
    const algorithmInfo = ALGORITHM_SECURITY[algorithm] || {
      secure: false,
      warnings: [`Unknown algorithm: ${algorithm}`],
    };

    const securityInfo: JwtDecodeResult['securityInfo'] = {
      algorithm,
      isSecure: algorithmInfo.secure,
      warnings: [...algorithmInfo.warnings],
    };

    // Additional security warnings
    if (isExpired) {
      securityInfo.warnings.push('Token is expired');
    }

    if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) {
      securityInfo.warnings.push(
        'Token is not yet valid (nbf claim in future)'
      );
    }

    // Analyze claims
    const claimsAnalysis = analyzeClaims(payload);

    // Generate suggestions
    const suggestions = provideSuggestions
      ? generateSuggestions(header, payload)
      : [];

    // Calculate metadata
    const metadata: JwtDecodeResult['metadata'] = {
      headerSize: headerPart.length,
      payloadSize: payloadPart.length,
      signatureSize: signaturePart.length,
      totalSize: token.length,
      structure: 'valid',
    };

    return {
      success: true,
      header,
      payload,
      signature: signaturePart,
      isValid: true,
      isExpired,
      timeInfo,
      securityInfo,
      claimsAnalysis,
      metadata,
      suggestions,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode JWT',
      isValid: false,
      isExpired: false,
      timeInfo: {},
      securityInfo: {
        algorithm: 'unknown',
        isSecure: false,
        warnings: ['Processing error'],
      },
      claimsAnalysis: {
        standardClaims: [],
        customClaims: [],
      },
      metadata: {
        headerSize: 0,
        payloadSize: 0,
        signatureSize: 0,
        totalSize: token.length,
        structure: 'invalid',
      },
      suggestions: [],
    };
  }
}

/**
 * Generate sample JWTs for testing
 */
export function generateSampleJwts(): { [key: string]: string } {
  return {
    'Standard JWT':
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'Expired JWT':
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4lMHu6Ej4JdJ_Kn7hOJKL8L3zCJLJX_nVQBG8G8a4s8',
    'Complex Claims JWT':
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InB1YmxpY19rZXkifQ.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlcl8xMjM0NSIsImF1ZCI6WyJhcGkxIiwiYXBpMiJdLCJleHAiOjE3MDk2ODQ4MDAsIm5iZiI6MTcwOTU5ODQwMCwiaWF0IjoxNzA5NTk4NDAwLCJqdGkiOiJ1bmlxdWVfaWRfMTIzNDUiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sInBlcm1pc3Npb25zIjp7InJlYWQiOnRydWUsIndyaXRlIjp0cnVlLCJkZWxldGUiOmZhbHNlfX0.signature_would_be_here',
    'Unsigned JWT (alg: none)':
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',
  };
}

// ============================================================================
// JWT Signing (encode)
// ============================================================================

export type JwtAlgorithm =
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'none';

export interface JwtSignHeader {
  alg: JwtAlgorithm;
  typ?: string;
  kid?: string;
  [key: string]: any;
}

export interface JwtSignOptions {
  header: JwtSignHeader;
  payload: Record<string, any>;
  secret?: string;
  privateKeyPem?: string;
}

export interface JwtSignResult {
  success: boolean;
  token?: string;
  error?: string;
}

const HMAC_HASHES: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

const RSA_HASHES: Record<string, string> = {
  RS256: 'SHA-256',
  RS384: 'SHA-384',
  RS512: 'SHA-512',
};

const ECDSA_PARAMS: Record<string, { hash: string; namedCurve: string }> = {
  ES256: { hash: 'SHA-256', namedCurve: 'P-256' },
  ES384: { hash: 'SHA-384', namedCurve: 'P-384' },
  ES512: { hash: 'SHA-512', namedCurve: 'P-521' },
};

function pemToPkcs8DerBytes(pem: string): Uint8Array {
  const normalized = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const binary =
    typeof atob !== 'undefined'
      ? atob(normalized)
      : Buffer.from(normalized, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function requireSubtleCrypto(): SubtleCrypto {
  const subtle =
    typeof globalThis !== 'undefined' &&
    (globalThis as any).crypto &&
    (globalThis as any).crypto.subtle;
  if (!subtle) {
    throw new Error(
      'Web Crypto API (crypto.subtle) is not available in this environment'
    );
  }
  return subtle as SubtleCrypto;
}

/**
 * Sign a JWT with the given header, payload, and secret/private key.
 * Returns `{ success: true, token }` on success, or `{ success: false, error }` on failure.
 */
export async function signJwt(
  options: JwtSignOptions
): Promise<JwtSignResult> {
  try {
    const { header, payload, secret, privateKeyPem } = options;

    if (!header || typeof header !== 'object') {
      return { success: false, error: 'Header is required' };
    }
    if (!header.alg) {
      return { success: false, error: 'Header "alg" is required' };
    }
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Payload is required' };
    }

    const alg = header.alg;

    // Preserve caller's key order; only inject typ=JWT if missing
    const fullHeader: Record<string, any> = { ...header };
    if (fullHeader.typ === undefined) {
      fullHeader.typ = 'JWT';
    }

    const headerB64 = base64UrlEncode(JSON.stringify(fullHeader));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;
    const signingBytes = new TextEncoder().encode(signingInput);

    // alg=none → empty signature
    if (alg === 'none') {
      return { success: true, token: `${signingInput}.` };
    }

    // HMAC family
    if (alg in HMAC_HASHES) {
      if (!secret) {
        return {
          success: false,
          error: `${alg} requires a secret`,
        };
      }
      const subtle = requireSubtleCrypto();
      const keyBytes = new TextEncoder().encode(secret);
      const cryptoKey = await subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: HMAC_HASHES[alg] },
        false,
        ['sign']
      );
      const sigBuffer = await subtle.sign('HMAC', cryptoKey, signingBytes);
      const signatureB64 = base64UrlEncode(new Uint8Array(sigBuffer));
      return { success: true, token: `${signingInput}.${signatureB64}` };
    }

    // RSASSA-PKCS1-v1_5 family
    if (alg in RSA_HASHES) {
      if (!privateKeyPem) {
        return {
          success: false,
          error: `${alg} requires a private key (PEM)`,
        };
      }
      const subtle = requireSubtleCrypto();
      const der = pemToPkcs8DerBytes(privateKeyPem);
      const cryptoKey = await subtle.importKey(
        'pkcs8',
        der as any,
        { name: 'RSASSA-PKCS1-v1_5', hash: RSA_HASHES[alg] },
        false,
        ['sign']
      );
      const sigBuffer = await subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signingBytes
      );
      const signatureB64 = base64UrlEncode(new Uint8Array(sigBuffer));
      return { success: true, token: `${signingInput}.${signatureB64}` };
    }

    // ECDSA family
    if (alg in ECDSA_PARAMS) {
      if (!privateKeyPem) {
        return {
          success: false,
          error: `${alg} requires a private key (PEM)`,
        };
      }
      const subtle = requireSubtleCrypto();
      const { hash, namedCurve } = ECDSA_PARAMS[alg];
      const der = pemToPkcs8DerBytes(privateKeyPem);
      const cryptoKey = await subtle.importKey(
        'pkcs8',
        der as any,
        { name: 'ECDSA', namedCurve },
        false,
        ['sign']
      );
      const sigBuffer = await subtle.sign(
        { name: 'ECDSA', hash },
        cryptoKey,
        signingBytes
      );
      // Web Crypto returns raw r||s concatenation — the exact format JWT expects.
      const signatureB64 = base64UrlEncode(new Uint8Array(sigBuffer));
      return { success: true, token: `${signingInput}.${signatureB64}` };
    }

    return {
      success: false,
      error: `Unsupported algorithm: ${alg}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign JWT',
    };
  }
}

/**
 * Validate multiple JWTs from input (line-separated)
 */
export function decodeMultipleJwts(
  input: string,
  options: JwtDecodeOptions = {}
): JwtDecodeResult[] {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line) => decodeJwt(line, options));
}
