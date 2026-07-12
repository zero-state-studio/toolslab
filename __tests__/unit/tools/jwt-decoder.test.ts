import { webcrypto } from 'crypto';

if (!(globalThis as any).crypto?.subtle) {
  (globalThis as any).crypto = webcrypto;
}

import {
  decodeJwt,
  generateSampleJwts,
  decodeMultipleJwts,
  signJwt,
  JwtDecodeOptions,
  JwtSignOptions,
} from '@/lib/tools/jwt-decoder';

describe('JWT Decoder', () => {
  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const result = decodeJwt(token);

      expect(result.success).toBe(true);
      expect(result.header).toEqual({
        alg: 'HS256',
        typ: 'JWT',
      });
      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      });
      expect(result.signature).toBe(
        'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      );
      expect(result.isValid).toBe(true);
    });

    it('should decode JWT with complex claims', () => {
      const token =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InB1YmxpY19rZXkifQ.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlcl8xMjM0NSIsImF1ZCI6WyJhcGkxIiwiYXBpMiJdLCJleHAiOjE3MDk2ODQ4MDAsIm5iZiI6MTcwOTU5ODQwMCwiaWF0IjoxNzA5NTk4NDAwLCJqdGkiOiJ1bmlxdWVfaWRfMTIzNDUiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sInBlcm1pc3Npb25zIjp7InJlYWQiOnRydWUsIndyaXRlIjp0cnVlLCJkZWxldGUiOmZhbHNlfX0.signature_would_be_here';

      const result = decodeJwt(token);

      expect(result.success).toBe(true);
      expect(result.header?.kid).toBe('public_key');
      expect(result.payload?.iss).toBe('https://example.com');
      expect(result.payload?.aud).toEqual(['api1', 'api2']);
      expect(result.payload?.roles).toEqual(['admin', 'user']);
      expect(result.claimsAnalysis.standardClaims.length).toBeGreaterThan(5);
      expect(result.claimsAnalysis.customClaims.length).toBeGreaterThan(0);
    });

    it('should handle expired JWT tokens', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4lMHu6Ej4JdJ_Kn7hOJKL8L3zCJLJX_nVQBG8G8a4s8';

      const result = decodeJwt(expiredToken);

      expect(result.success).toBe(true);
      expect(result.isExpired).toBe(true);
      expect(result.payload?.exp).toBe(1516242622);
      expect(result.timeInfo.expiresAt).toBeDefined();
      expect(result.securityInfo.warnings).toContain('Token is expired');
    });

    it('should handle unsigned JWT tokens (alg: none)', () => {
      const unsignedToken =
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.';

      const result = decodeJwt(unsignedToken);

      expect(result.success).toBe(true);
      expect(result.header?.alg).toBe('none');
      expect(result.signature).toBe('');
      expect(result.securityInfo.isSecure).toBe(false);
      expect(result.securityInfo.warnings).toContain(
        'Algorithm "none" provides no signature verification'
      );
    });

    it('should detect invalid JWT structure', () => {
      const invalidToken = 'invalid.jwt';

      const result = decodeJwt(invalidToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JWT structure');
      expect(result.isValid).toBe(false);
    });

    it('should handle empty input', () => {
      const result = decodeJwt('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token is required');
      expect(result.isValid).toBe(false);
    });

    it('should handle whitespace-only input', () => {
      const result = decodeJwt('   \n\t   ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token cannot be empty');
      expect(result.isValid).toBe(false);
    });

    it('should handle malformed Base64URL encoding', () => {
      const malformedToken = 'invalid_base64.invalid_base64.invalid_base64';

      const result = decodeJwt(malformedToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JWT header');
      expect(result.isValid).toBe(false);
    });

    it('should handle invalid JSON in header', () => {
      // Base64URL encode invalid JSON: "{"alg":"HS256""
      const invalidHeaderToken =
        'eyJhbGciOiJIUzI1NiI.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';

      const result = decodeJwt(invalidHeaderToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JWT header');
      expect(result.isValid).toBe(false);
    });

    it('should handle invalid JSON in payload', () => {
      // Valid header, invalid payload JSON
      const invalidPayloadToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIg.signature';

      const result = decodeJwt(invalidPayloadToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JWT payload');
      expect(result.isValid).toBe(false);
    });

    it('should calculate token metadata correctly', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const parts = token.split('.');

      const result = decodeJwt(token);

      expect(result.success).toBe(true);
      expect(result.metadata.headerSize).toBe(parts[0].length);
      expect(result.metadata.payloadSize).toBe(parts[1].length);
      expect(result.metadata.signatureSize).toBe(parts[2].length);
      expect(result.metadata.totalSize).toBe(token.length);
      expect(result.metadata.structure).toBe('valid');
    });

    it('should analyze security for different algorithms', () => {
      const tokens = {
        hs256:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        rs256:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        none: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.',
      };

      const hs256Result = decodeJwt(tokens.hs256);
      expect(hs256Result.securityInfo.algorithm).toBe('HS256');
      expect(hs256Result.securityInfo.isSecure).toBe(true);
      expect(hs256Result.securityInfo.warnings).toContain(
        'Symmetric algorithm - same key for signing and verification'
      );

      const rs256Result = decodeJwt(tokens.rs256);
      expect(rs256Result.securityInfo.algorithm).toBe('RS256');
      expect(rs256Result.securityInfo.isSecure).toBe(true);
      expect(rs256Result.securityInfo.warnings).toHaveLength(0);

      const noneResult = decodeJwt(tokens.none);
      expect(noneResult.securityInfo.algorithm).toBe('none');
      expect(noneResult.securityInfo.isSecure).toBe(false);
      expect(noneResult.securityInfo.warnings.length).toBeGreaterThan(0);
    });

    it('should categorize claims correctly', () => {
      const tokenWithMixedClaims =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlcl8xMjM0NSIsImF1ZCI6ImFwaSIsImV4cCI6MTcwOTY4NDgwMCwiaWF0IjoxNzA5NTk4NDAwLCJjdXN0b21fY2xhaW0iOiJ2YWx1ZSIsImFub3RoZXJfY3VzdG9tIjp7Im5lc3RlZCI6dHJ1ZX19.signature';

      const result = decodeJwt(tokenWithMixedClaims);

      expect(result.success).toBe(true);

      const standardClaimKeys = result.claimsAnalysis.standardClaims.map(
        (c) => c.key
      );
      expect(standardClaimKeys).toContain('iss');
      expect(standardClaimKeys).toContain('sub');
      expect(standardClaimKeys).toContain('aud');
      expect(standardClaimKeys).toContain('exp');
      expect(standardClaimKeys).toContain('iat');

      const customClaimKeys = result.claimsAnalysis.customClaims.map(
        (c) => c.key
      );
      expect(customClaimKeys).toContain('custom_claim');
      expect(customClaimKeys).toContain('another_custom');
    });

    it('should format time information correctly', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 3600; // 1 hour from now
      const pastTime = currentTime - 3600; // 1 hour ago

      const tokenWithTimes =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(
          JSON.stringify({
            sub: '1234567890',
            iat: pastTime,
            exp: futureTime,
            nbf: currentTime,
          })
        )
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(tokenWithTimes);

      expect(result.success).toBe(true);
      expect(result.timeInfo.issuedAt).toBeDefined();
      expect(result.timeInfo.expiresAt).toBeDefined();
      expect(result.timeInfo.notBefore).toBeDefined();
      expect(result.timeInfo.age).toBeDefined();
      expect(result.timeInfo.timeToExpiry).toBeDefined();
      expect(result.isExpired).toBe(false);
    });

    it('should generate tool suggestions', () => {
      const tokenWithBase64Data =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(
          JSON.stringify({
            sub: '1234567890',
            data: 'SGVsbG8gV29ybGQ=', // Base64 encoded data
            url: 'https://example.com/api',
            hash: '5d41402abc4b2a76b9719d911017c592', // MD5 hash
          })
        )
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(tokenWithBase64Data);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.includes('Base64'))).toBe(true);
    });

    it('should handle JWT with missing optional sections', () => {
      const tokenMissingParts =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';

      const result = decodeJwt(tokenMissingParts);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expected 3 parts');
    });

    it('should respect decoding options', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const optionsNoValidation: JwtDecodeOptions = {
        validateStructure: false,
        analyzeTime: false,
        provideSuggestions: false,
      };

      const result = decodeJwt(token, optionsNoValidation);

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle very long JWT tokens', () => {
      // Create a JWT with a very large payload
      const largePayload = {
        sub: '1234567890',
        name: 'John Doe',
        // Add a large amount of data
        largeArray: Array(1000).fill('data'),
        largeString: 'x'.repeat(10000),
      };

      const largeToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify(largePayload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(largeToken);

      expect(result.success).toBe(true);
      expect(result.payload?.largeArray).toHaveLength(1000);
      expect(result.metadata.totalSize).toBeGreaterThan(10000);
    });

    it('should handle JWT with special characters in payload', () => {
      // Pre-encoded base64url payload:
      // {"sub":"1234567890","name":"José García-Fernández",
      //  "symbols":"!@#$%^&*()_+{}|:\"<>?[]\\;',./`~"}
      const specialToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpvc8OpIEdhcmPDrWEtRmVybsOhbmRleiIsInN5bWJvbHMiOiIhQCMkJV4mKigpXyt7fXw6XCI8Pj9bXVxcOycsLi9gfiJ9.signature';

      const result = decodeJwt(specialToken);

      expect(result.success).toBe(true);
      expect(result.payload?.name).toContain('García');
      expect(result.payload?.symbols).toBe('!@#$%^&*()_+{}|:"<>?[]\\;\',./`~');
    });
  });

  describe('generateSampleJwts', () => {
    it('should generate sample JWT tokens', () => {
      const samples = generateSampleJwts();

      expect(Object.keys(samples)).toContain('Standard JWT');
      expect(Object.keys(samples)).toContain('Expired JWT');
      expect(Object.keys(samples)).toContain('Complex Claims JWT');
      expect(Object.keys(samples)).toContain('Unsigned JWT (alg: none)');

      // Each sample should be a valid JWT structure
      Object.values(samples).forEach((token) => {
        expect(token.split('.')).toHaveLength(3);
      });
    });

    it('should generate decodable sample tokens', () => {
      const samples = generateSampleJwts();

      Object.entries(samples).forEach(([name, token]) => {
        const result = decodeJwt(token);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('decodeMultipleJwts', () => {
    it('should decode multiple JWT tokens from input', () => {
      const multipleTokens = `
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature1

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIn0.signature2

eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiI1NTU1NTU1NTU1In0.
      `;

      const results = decodeMultipleJwts(multipleTokens);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect(results[0].payload?.sub).toBe('1234567890');
      expect(results[1].payload?.sub).toBe('9876543210');
      expect(results[2].payload?.sub).toBe('5555555555');
    });

    it('should handle empty lines in multiple tokens input', () => {
      const inputWithEmptyLines = `


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature


`;

      const results = decodeMultipleJwts(inputWithEmptyLines);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should return empty array for empty input', () => {
      const results = decodeMultipleJwts('');
      expect(results).toHaveLength(0);

      const resultsWhitespace = decodeMultipleJwts('   \n\n   ');
      expect(resultsWhitespace).toHaveLength(0);
    });

    it('should handle mix of valid and invalid tokens', () => {
      const mixedTokens = `
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature
invalid.token
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.
      `;

      const results = decodeMultipleJwts(mixedTokens);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Real-world JWT scenarios', () => {
    it('should decode Auth0 JWT structure', () => {
      const auth0Token =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InB1YmxpY19rZXkifQ.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDEyMzQ1Njc4OTAiLCJhdWQiOlsiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJodHRwczovL2V4YW1wbGUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImV4cCI6MTcwOTY4NDgwMCwiaWF0IjoxNzA5NTk4NDAwLCJhdXRoX3RpbWUiOjE3MDk1OTg0MDAsImF6cCI6ImNsaWVudF9pZF8xMjM0NSIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpvaG4gRG9lIiwicGljdHVyZSI6Imh0dHBzOi8vZ3JhdmF0YXIuY29tL2F2YXRhci9oYXNoIn0.signature';

      const result = decodeJwt(auth0Token);

      expect(result.success).toBe(true);
      expect(result.header?.alg).toBe('RS256');
      expect(result.header?.kid).toBe('public_key');
      expect(result.payload?.iss).toContain('auth0.com');
      expect(result.payload?.sub).toContain('auth0|');
      expect(result.payload?.scope).toContain('openid');
      expect(result.claimsAnalysis.standardClaims.length).toBeGreaterThan(5);
    });

    it('should decode Firebase JWT structure', () => {
      const firebaseToken =
        'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZpcmViYXNlX2tleV9pZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vcHJvamVjdC1pZCIsImF1ZCI6InByb2plY3QtaWQiLCJhdXRoX3RpbWUiOjE3MDk1OTg0MDAsInVzZXJfaWQiOiJ1c2VyX2lkXzEyMzQ1IiwicHJvdmlkZXJfaWQiOiJnb29nbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7InNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIiwiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEyMzQ1Njc4OTAiXSwiZW1haWwiOlsidXNlckBleGFtcGxlLmNvbSJdfX0sImV4cCI6MTcwOTY4NDgwMCwiaWF0IjoxNzA5NTk4NDAwLCJzdWIiOiJ1c2VyX2lkXzEyMzQ1In0.signature';

      const result = decodeJwt(firebaseToken);

      expect(result.success).toBe(true);
      expect(result.payload?.iss).toContain('securetoken.google.com');
      expect(result.payload?.firebase).toBeDefined();
      expect(result.payload?.provider_id).toBe('google.com');
      expect(
        result.claimsAnalysis.customClaims.some((c) => c.key === 'firebase')
      ).toBe(true);
    });

    it('should decode refresh token structure', () => {
      const refreshToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidG9rZW5fdHlwZSI6InJlZnJlc2giLCJqdGkiOiJyZWZyZXNoX3Rva2VuX2lkXzEyMzQ1IiwiaWF0IjoxNzA5NTk4NDAwLCJleHAiOjE3MTIxOTA0MDAsInNjb3BlIjoicmVmcmVzaCJ9.signature';

      const result = decodeJwt(refreshToken);

      expect(result.success).toBe(true);
      expect(result.payload?.token_type).toBe('refresh');
      expect(result.payload?.scope).toBe('refresh');
      expect(
        result.claimsAnalysis.customClaims.some((c) => c.key === 'token_type')
      ).toBe(true);
    });

    it('should handle Microsoft Azure AD JWT', () => {
      const azureToken =
        'eyJhbGciOiJSUzI1NiIsImtpZCI6Im1pY3Jvc29mdF9rZXlfaWQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJjbGllbnRfaWRfMTIzNDUiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vdGVuYW50X2lkL3YyLjAiLCJpYXQiOjE3MDk1OTg0MDAsIm5iZiI6MTcwOTU5ODQwMCwiZXhwIjoxNzA5Njg0ODAwLCJhaW8iOiJBVFFBeS84VEFBQUEiLCJhenAiOiJjbGllbnRfaWRfMTIzNDUiLCJhenBhY3IiOiIxIiwibmFtZSI6IkpvaG4gRG9lIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidXNlckBleGFtcGxlLmNvbSIsInN1YiI6InN1YmplY3RfaWRfMTIzNDUiLCJ0aWQiOiJ0ZW5hbnRfaWRfMTIzNDUiLCJ1dGkiOiJ1bmlxdWVfaWRfMTIzNDUiLCJ2ZXIiOiIyLjAifQ.signature';

      const result = decodeJwt(azureToken);

      expect(result.success).toBe(true);
      expect(result.payload?.iss).toContain('login.microsoftonline.com');
      expect(result.payload?.ver).toBe('2.0');
      expect(
        result.claimsAnalysis.customClaims.some((c) => c.key === 'tid')
      ).toBe(true); // tenant id
      expect(
        result.claimsAnalysis.standardClaims.some((c) => c.key === 'azp')
      ).toBe(true); // authorized party
    });

    it('should handle JWT with nested object claims', () => {
      const nestedClaimsPayload = {
        sub: '1234567890',
        user_metadata: {
          preferences: {
            theme: 'dark',
            language: 'en',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        app_metadata: {
          roles: ['admin', 'user'],
          permissions: ['read', 'write', 'delete'],
          department: 'Engineering',
        },
        custom_claims: {
          organization_id: 'org_123',
          subscription_level: 'premium',
          features: ['feature_a', 'feature_b'],
        },
      };

      const nestedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify(nestedClaimsPayload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(nestedToken);

      expect(result.success).toBe(true);
      expect(result.payload?.user_metadata?.preferences?.theme).toBe('dark');
      expect(result.payload?.app_metadata?.roles).toContain('admin');
      expect(result.claimsAnalysis.customClaims.length).toBeGreaterThanOrEqual(
        3
      );
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => decodeJwt(null as any)).not.toThrow();
      expect(() => decodeJwt(undefined as any)).not.toThrow();

      const nullResult = decodeJwt(null as any);
      expect(nullResult.success).toBe(false);

      const undefinedResult = decodeJwt(undefined as any);
      expect(undefinedResult.success).toBe(false);
    });

    it('should handle extremely long tokens gracefully', () => {
      const veryLongPayload = {
        sub: '1234567890',
        data: 'x'.repeat(100000), // 100KB string
      };

      const longToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify(veryLongPayload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(longToken);
      expect(result.success).toBe(true);
      expect(result.metadata.totalSize).toBeGreaterThan(100000);
    });

    it('should handle tokens with only dots', () => {
      const dotsOnlyToken = '...';
      const result = decodeJwt(dotsOnlyToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expected 3 parts');
    });

    it('should handle tokens with too many parts', () => {
      const tooManyPartsToken = 'part1.part2.part3.part4.part5';
      const result = decodeJwt(tooManyPartsToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expected 3 parts');
    });

    it('should preserve exact claim values including edge cases', () => {
      const edgeCasePayload = {
        sub: '1234567890',
        zero: 0,
        empty_string: '',
        null_value: null,
        boolean_true: true,
        boolean_false: false,
        negative_number: -123,
        decimal: 123.456,
        empty_array: [],
        empty_object: {},
      };

      const edgeCaseToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify(edgeCasePayload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '') +
        '.signature';

      const result = decodeJwt(edgeCaseToken);

      expect(result.success).toBe(true);
      expect(result.payload?.zero).toBe(0);
      expect(result.payload?.empty_string).toBe('');
      expect(result.payload?.null_value).toBe(null);
      expect(result.payload?.boolean_true).toBe(true);
      expect(result.payload?.boolean_false).toBe(false);
      expect(result.payload?.negative_number).toBe(-123);
      expect(result.payload?.decimal).toBe(123.456);
      expect(result.payload?.empty_array).toEqual([]);
      expect(result.payload?.empty_object).toEqual({});
    });
  });

  describe('signJwt', () => {
    async function generateRsaPemKeyPair(
      hash: 'SHA-256' | 'SHA-384' | 'SHA-512'
    ): Promise<{ privatePem: string; publicPem: string }> {
      const keyPair = (await (globalThis as any).crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash,
        },
        true,
        ['sign', 'verify']
      )) as { privateKey: CryptoKey; publicKey: CryptoKey };

      const priv = new Uint8Array(
        await (globalThis as any).crypto.subtle.exportKey(
          'pkcs8',
          keyPair.privateKey
        )
      );
      const pub = new Uint8Array(
        await (globalThis as any).crypto.subtle.exportKey(
          'spki',
          keyPair.publicKey
        )
      );

      const toPem = (buf: Uint8Array, label: string) => {
        const b64 = Buffer.from(buf).toString('base64');
        const lines = b64.match(/.{1,64}/g) || [b64];
        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
      };

      return {
        privatePem: toPem(priv, 'PRIVATE KEY'),
        publicPem: toPem(pub, 'PUBLIC KEY'),
      };
    }

    async function generateEcPemKeyPair(
      namedCurve: 'P-256' | 'P-384' | 'P-521'
    ): Promise<{ privatePem: string; publicPem: string }> {
      const keyPair = (await (globalThis as any).crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve },
        true,
        ['sign', 'verify']
      )) as { privateKey: CryptoKey; publicKey: CryptoKey };

      const priv = new Uint8Array(
        await (globalThis as any).crypto.subtle.exportKey(
          'pkcs8',
          keyPair.privateKey
        )
      );
      const pub = new Uint8Array(
        await (globalThis as any).crypto.subtle.exportKey(
          'spki',
          keyPair.publicKey
        )
      );

      const toPem = (buf: Uint8Array, label: string) => {
        const b64 = Buffer.from(buf).toString('base64');
        const lines = b64.match(/.{1,64}/g) || [b64];
        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
      };

      return {
        privatePem: toPem(priv, 'PRIVATE KEY'),
        publicPem: toPem(pub, 'PUBLIC KEY'),
      };
    }

    const basePayload = {
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    };

    it('should sign HS256 and produce a decodable token with 3 parts', async () => {
      const result = await signJwt({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: basePayload,
        secret: 'my-256-bit-secret',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.token).toBeDefined();
      expect(result.token!.split('.')).toHaveLength(3);

      const decoded = decodeJwt(result.token!);
      expect(decoded.success).toBe(true);
      expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(decoded.payload).toEqual(basePayload);
      expect(decoded.signature!.length).toBeGreaterThan(0);
    });

    it('should match the canonical HS256 test vector', async () => {
      // Reference vector (commonly cited): header {"alg":"HS256","typ":"JWT"},
      // payload {"sub":"1234567890","name":"John Doe","iat":1516239022},
      // secret "your-256-bit-secret"
      // → token suffix "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      const result = await signJwt({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
        secret: 'your-256-bit-secret',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBe(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      );
    });

    it('should sign HS384 and produce a decodable token', async () => {
      const result = await signJwt({
        header: { alg: 'HS384', typ: 'JWT' },
        payload: basePayload,
        secret: 'hs384-secret',
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.header?.alg).toBe('HS384');
    });

    it('should sign HS512 and produce a decodable token', async () => {
      const result = await signJwt({
        header: { alg: 'HS512', typ: 'JWT' },
        payload: basePayload,
        secret: 'hs512-secret',
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.header?.alg).toBe('HS512');
    });

    it('should sign RS256 with a PEM private key', async () => {
      const { privatePem } = await generateRsaPemKeyPair('SHA-256');

      const result = await signJwt({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: basePayload,
        privateKeyPem: privatePem,
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.header?.alg).toBe('RS256');
      expect(decoded.payload).toEqual(basePayload);
      expect(decoded.signature!.length).toBeGreaterThan(0);
    });

    it('should sign RS384 with a PEM private key', async () => {
      const { privatePem } = await generateRsaPemKeyPair('SHA-384');

      const result = await signJwt({
        header: { alg: 'RS384', typ: 'JWT' },
        payload: basePayload,
        privateKeyPem: privatePem,
      });

      expect(result.success).toBe(true);
    });

    it('should sign ES256 with a PEM private key', async () => {
      const { privatePem } = await generateEcPemKeyPair('P-256');

      const result = await signJwt({
        header: { alg: 'ES256', typ: 'JWT' },
        payload: basePayload,
        privateKeyPem: privatePem,
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.header?.alg).toBe('ES256');
    });

    it('should sign ES384 with a PEM private key', async () => {
      const { privatePem } = await generateEcPemKeyPair('P-384');

      const result = await signJwt({
        header: { alg: 'ES384', typ: 'JWT' },
        payload: basePayload,
        privateKeyPem: privatePem,
      });

      expect(result.success).toBe(true);
    });

    it('should produce an unsigned token with alg=none and empty signature', async () => {
      const result = await signJwt({
        header: { alg: 'none', typ: 'JWT' },
        payload: basePayload,
      });

      expect(result.success).toBe(true);
      const parts = result.token!.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[2]).toBe('');
    });

    it('should return error when HS256 secret is missing', async () => {
      const result = await signJwt({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: basePayload,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('secret');
      expect(result.token).toBeUndefined();
    });

    it('should return error when RS256 private key is missing', async () => {
      const result = await signJwt({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: basePayload,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('private key');
    });

    it('should return error for unsupported algorithm', async () => {
      const result = await signJwt({
        header: { alg: 'BOGUS' as any, typ: 'JWT' },
        payload: basePayload,
        secret: 'x',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/unsupported|algorithm/i);
    });

    it('should return error when header alg is missing', async () => {
      const result = await signJwt({
        header: {} as any,
        payload: basePayload,
        secret: 'x',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/alg/i);
    });

    it('should preserve custom header fields like kid', async () => {
      const result = await signJwt({
        header: { alg: 'HS256', typ: 'JWT', kid: 'key-123' },
        payload: basePayload,
        secret: 'x',
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.header?.kid).toBe('key-123');
    });

    it('should handle complex nested payloads', async () => {
      const complexPayload = {
        sub: 'user-1',
        roles: ['admin', 'editor'],
        meta: {
          org: 'acme',
          flags: { beta: true, tier: 3 },
        },
        scope: ['read', 'write'],
      };

      const result = await signJwt({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: complexPayload,
        secret: 'nested',
      });

      expect(result.success).toBe(true);
      const decoded = decodeJwt(result.token!);
      expect(decoded.payload).toEqual(complexPayload);
    });
  });
});
