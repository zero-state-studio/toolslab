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

    it('returns true for js + axios (implemented in RIC-116)', () => {
      expect(isImplemented('javascript', 'axios')).toBe(true);
    });

    it('returns true for python + httpx (implemented in RIC-116)', () => {
      expect(isImplemented('python', 'httpx')).toBe(true);
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

    it('returns true for go + net-http (implemented in RIC-115)', () => {
      expect(isImplemented('go', 'net-http')).toBe(true);
    });

    it('returns true for go + resty (implemented in RIC-115)', () => {
      expect(isImplemented('go', 'resty')).toBe(true);
    });

    it('returns true for java + okhttp (implemented in RIC-117)', () => {
      expect(isImplemented('java', 'okhttp')).toBe(true);
    });

    it('returns true for csharp + httpclient (implemented in RIC-117)', () => {
      expect(isImplemented('csharp', 'httpclient')).toBe(true);
    });

    it('returns true for ruby + net-http (implemented in RIC-118)', () => {
      expect(isImplemented('ruby', 'net-http')).toBe(true);
    });

    it('returns true for shell + httpie (implemented in RIC-118)', () => {
      expect(isImplemented('shell', 'httpie')).toBe(true);
    });

    it('returns false for rust + reqwest (intentionally unimplemented)', () => {
      expect(isImplemented('rust', 'reqwest')).toBe(false);
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

    it('generates JS axios code with AxiosRequestConfig pattern', () => {
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
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain("import axios");
      expect(result.generatedCode?.code).toContain('axios.request(config)');
      expect(result.generatedCode?.code).toContain('axios.isAxiosError');
      expect(result.generatedCode?.dependencies).toContain('axios');
    });

    it('generates Java HttpClient code with URI + HttpRequest.Builder', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'java',
        framework: 'httpurlconnection',
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
      expect(result.generatedCode?.code).toContain('java.net.http.HttpClient');
      expect(result.generatedCode?.code).toContain('HttpRequest.newBuilder');
      expect(result.generatedCode?.code).toContain('HttpResponse.BodyHandlers.ofString');
    });

    it('generates Java OkHttp code with Request.Builder', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'java',
        framework: 'okhttp',
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
      expect(result.generatedCode?.code).toContain('OkHttpClient');
      expect(result.generatedCode?.code).toContain('Request.Builder');
      expect(result.generatedCode?.dependencies).toContain('com.squareup.okhttp3:okhttp');
    });

    it('generates C# HttpClient code with async/await', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'csharp',
        framework: 'httpclient',
        errorHandling: 'basic',
        async: true,
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
      expect(result.generatedCode?.code).toContain('System.Net.Http');
      expect(result.generatedCode?.code).toContain('HttpRequestMessage');
      expect(result.generatedCode?.code).toContain('EnsureSuccessStatusCode');
    });

    it('generates C# RestSharp code with RestClient', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'csharp',
        framework: 'restsharp',
        errorHandling: 'basic',
        async: true,
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
      expect(result.generatedCode?.code).toContain('using RestSharp');
      expect(result.generatedCode?.code).toContain('new RestClient');
      expect(result.generatedCode?.dependencies).toContain('RestSharp');
    });

    it('generates Ruby Net::HTTP code with URI.parse + Net::HTTP.start block', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'ruby',
        framework: 'net-http',
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
      expect(result.generatedCode?.code).toContain('require "net/http"');
      expect(result.generatedCode?.code).toContain('URI(');
      expect(result.generatedCode?.code).toContain('Net::HTTP.start');
    });

    it('generates Ruby HTTParty code with options hash', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'ruby',
        framework: 'httparty',
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
      expect(result.generatedCode?.code).toContain('require "httparty"');
      expect(result.generatedCode?.code).toContain('HTTParty.get');
      expect(result.generatedCode?.dependencies).toContain('httparty');
    });

    it('generates HTTPie command with short-hand syntax', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'shell',
        framework: 'httpie',
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
      expect(result.generatedCode?.code).toContain('http');
      expect(result.generatedCode?.code).toContain('GET');
      expect(result.generatedCode?.dependencies).toContain('httpie');
    });

    it('generates wget command with --method and -qO-', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'shell',
        framework: 'wget',
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
      expect(result.generatedCode?.code).toContain('wget');
      expect(result.generatedCode?.code).toContain('--method=GET');
    });

    it('generates PowerShell Invoke-RestMethod command', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'shell',
        framework: 'powershell',
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
      expect(result.generatedCode?.code).toContain('Invoke-RestMethod');
      expect(result.generatedCode?.code).toContain('-Method GET');
    });

    it('generates Python httpx code with Client context manager', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'python',
        framework: 'httpx',
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
      expect(result.generatedCode?.code).toContain('import httpx');
      expect(result.generatedCode?.code).toContain('httpx.Client');
      expect(result.generatedCode?.code).toContain('raise_for_status()');
      expect(result.generatedCode?.dependencies).toContain('httpx');
    });

    it('refuses rust + reqwest (intentionally unimplemented) with explicit error', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'rust',
        framework: 'reqwest',
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

    it('generates Go net/http code with context and defer Body.Close', () => {
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
        indentType: 'tabs',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('package main');
      expect(result.generatedCode?.code).toContain('"net/http"');
      expect(result.generatedCode?.code).toContain('context.WithTimeout');
      expect(result.generatedCode?.code).toContain('http.NewRequestWithContext');
      expect(result.generatedCode?.code).toContain('defer resp.Body.Close()');
      expect(result.generatedCode?.dependencies).toEqual([]);
    });

    it('generates Go Resty code with fluent client', () => {
      const result = convertCurlToCode(baseCurl, {
        language: 'go',
        framework: 'resty',
        errorHandling: 'basic',
        async: false,
        extractEnvVars: false,
        includeTypes: false,
        retryLogic: false,
        retryAttempts: 3,
        includeLogging: false,
        includeComments: false,
        indentSize: 4,
        indentType: 'tabs',
        timeout: 30000,
        validateSSL: true,
        includeTests: false,
      });
      expect(result.success).toBe(true);
      expect(result.generatedCode?.code).toContain('resty.New()');
      expect(result.generatedCode?.code).toContain('client.R()');
      expect(result.generatedCode?.dependencies).toContain(
        'github.com/go-resty/resty/v2'
      );
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
