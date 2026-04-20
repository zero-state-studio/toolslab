import {
  convertCurlToCode,
  isImplemented,
  SUPPORTED_LANGUAGES,
} from '@/lib/tools/curl-to-code';

const baseCurl = 'curl https://api.example.com/users';

describe('curl-to-code dispatcher safety', () => {
  describe('isImplemented', () => {
    it('returns true for js + fetch', () => {
      expect(isImplemented('javascript', 'fetch')).toBe(true);
    });

    it('returns true for ts + fetch', () => {
      expect(isImplemented('typescript', 'fetch')).toBe(true);
    });

    it('returns true for python + requests', () => {
      expect(isImplemented('python', 'requests')).toBe(true);
    });

    it('returns false for js + axios (not yet implemented)', () => {
      expect(isImplemented('javascript', 'axios')).toBe(false);
    });

    it('returns false for python + httpx (not yet implemented)', () => {
      expect(isImplemented('python', 'httpx')).toBe(false);
    });

    it('returns true for php + guzzle (implemented in RIC-114)', () => {
      expect(isImplemented('php', 'guzzle')).toBe(true);
    });

    it('returns true for php + curl (implemented in RIC-114)', () => {
      expect(isImplemented('php', 'curl')).toBe(true);
    });

    it('returns true for php + file_get_contents (implemented in RIC-114)', () => {
      expect(isImplemented('php', 'file_get_contents')).toBe(true);
    });

    it('returns false for go + net-http (not yet implemented)', () => {
      expect(isImplemented('go', 'net-http')).toBe(false);
    });

    it('returns false for unknown language', () => {
      expect(isImplemented('cobol', 'anything')).toBe(false);
    });

    it('returns false for unknown framework within known language', () => {
      expect(isImplemented('javascript', 'bogus-framework')).toBe(false);
    });
  });

  describe('convertCurlToCode (dispatcher)', () => {
    it('generates code for js + fetch', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'javascript',
        framework: 'fetch',
        errorHandling: 'basic',
        async: true,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 2,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('fetch');
    });

    it('generates code for python + requests', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'python',
        framework: 'requests',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('requests');
    });

    it('refuses js + axios (not implemented) with explicit error — no silent fallback', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'javascript',
        framework: 'axios',
        errorHandling: 'basic',
        async: true,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 2,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/coming soon/i);
      expect(result.generatedCode).toBeUndefined();
    });

    it('refuses go + net-http (not yet implemented) with explicit error', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'go',
        framework: 'net-http',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/coming soon/i);
    });

    it('generates PHP Guzzle code with GuzzleHttp\\Client', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'php',
        framework: 'guzzle',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('<?php');
      expect(result.generatedCode?.code).toContain('use GuzzleHttp\\Client');
      expect(result.generatedCode?.code).toContain("$client->request('GET'");
      expect(result.generatedCode?.dependencies).toContain('guzzlehttp/guzzle');
    });

    it('generates PHP native cURL code with curl_init + CURLOPT_*', () => {
      const curlWithPost =
        "curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"Alice\"}'";
      const result = convertCurlToCode(curlWithPost, {
        language: 'php',
        framework: 'curl',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('curl_init');
      expect(result.generatedCode?.code).toContain('curl_setopt');
      expect(result.generatedCode?.code).toContain('CURLOPT_CUSTOMREQUEST');
      expect(result.generatedCode?.code).toContain('POST');
      expect(result.generatedCode?.code).toContain('CURLOPT_HTTPHEADER');
      expect(result.generatedCode?.code).toContain('curl_exec');
      expect(result.generatedCode?.dependencies).toEqual(['ext-curl']);
    });

    it('generates PHP file_get_contents code with stream_context_create', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'php',
        framework: 'file_get_contents',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('<?php');
      expect(result.generatedCode?.code).toContain('stream_context_create');
      expect(result.generatedCode?.code).toContain('file_get_contents');
      expect(result.generatedCode?.dependencies).toEqual([]);
    });

    it('rejects unknown language', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'cobol',
        framework: 'anything',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 2,
        indentType: 'spaces',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not recognized/i);
    });

    it('all combos flagged implemented:true actually dispatch to a generator', () => {
      for (const [langKey, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
        for (const fw of lang.frameworks) {
          if (!fw.implemented) continue;
          const result = convertCurlToCode(baseCurl, {
            language: langKey,
            framework: fw.id,
            errorHandling: 'basic',
            async: false,
            extractEnvVars: false,
            includeTypes: false,
            retryLogic: false,
            retryAttempts: 3,
            includeLogging: false,
            includeComments: false,
            indentSize: 2,
            indentType: 'spaces',
            timeout: 30000,
            validateSSL: true,
            includeTests: false,
          });
          expect(result.success).toBe(true);
          expect(result.generatedCode?.code).toBeTruthy();
        }
      }
    });
  });
});
