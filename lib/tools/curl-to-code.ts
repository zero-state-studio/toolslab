// cURL to Code Converter - Core Logic
// Production-ready converter with support for 15+ languages and frameworks

// Remove zod import and schema for now - will be added when zod is available

// Types
export interface CurlParseResult {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  auth?: {
    type: 'basic' | 'bearer' | 'apikey' | 'custom';
    credentials: any;
  };
  cookies?: Record<string, string>;
  options: {
    followRedirects?: boolean;
    timeout?: number;
    proxy?: string;
    insecure?: boolean;
    cert?: string;
    compressed?: boolean;
    maxRedirects?: number;
    userAgent?: string;
  };
  files?: Array<{
    fieldName: string;
    fileName: string;
    contentType?: string;
    data?: string;
  }>;
  queryParams?: Record<string, string>;
  formData?: Record<string, any>;
  isMultipart?: boolean;
  rawBody?: string;
  dataType?: 'json' | 'form' | 'multipart' | 'raw' | 'binary';
}

export interface CodeGenerationOptions {
  language: string;
  framework: string;
  errorHandling?: 'none' | 'basic' | 'comprehensive';
  async?: boolean;
  extractEnvVars?: boolean;
  includeTypes?: boolean;
  retryLogic?: boolean;
  retryAttempts?: number;
  includeLogging?: boolean;
  includeComments?: boolean;
  indentSize?: number;
  indentType?: 'spaces' | 'tabs';
  authMethod?: 'headers' | 'params' | 'body';
  timeout?: number;
  validateSSL?: boolean;
  includeTests?: boolean;
  mockResponse?: any;
}

export interface GeneratedCode {
  code: string;
  language: string;
  framework: string;
  fileName: string;
  fileExtension: string;
  types?: string;
  tests?: string;
  envVars?: Record<string, string>;
  imports?: string[];
  dependencies?: string[];
  documentation?: string;
}

export interface ConversionResult {
  success: boolean;
  parsedCurl?: CurlParseResult;
  generatedCode?: GeneratedCode;
  error?: string;
  warnings?: string[];
}

// Language/Framework configurations
// Each framework has an `implemented` flag. UI shows unimplemented combos
// with a "Coming soon" label but prevents selection. The dispatcher in
// `convertCurlToCode` refuses unimplemented combos with an explicit message.
// Tracking for future implementation: RIC-112 epic (children RIC-114..118).
export interface FrameworkEntry {
  id: string;
  implemented: boolean;
}

export interface LanguageEntry {
  name: string;
  frameworks: FrameworkEntry[];
  fileExtension: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageEntry> = {
  javascript: {
    name: 'JavaScript',
    frameworks: [
      { id: 'fetch', implemented: true },
      { id: 'axios', implemented: true },
      { id: 'node-https', implemented: true },
      { id: 'jquery', implemented: true },
      { id: 'xhr', implemented: true },
    ],
    fileExtension: 'js',
  },
  typescript: {
    name: 'TypeScript',
    frameworks: [
      { id: 'fetch', implemented: true },
      { id: 'axios', implemented: true },
      { id: 'node-https', implemented: true },
    ],
    fileExtension: 'ts',
  },
  python: {
    name: 'Python',
    frameworks: [
      { id: 'requests', implemented: true },
      { id: 'urllib', implemented: true },
      { id: 'httpx', implemented: true },
      { id: 'aiohttp', implemented: true },
    ],
    fileExtension: 'py',
  },
  php: {
    name: 'PHP',
    frameworks: [
      { id: 'curl', implemented: true },
      { id: 'guzzle', implemented: true },
      { id: 'file_get_contents', implemented: true },
    ],
    fileExtension: 'php',
  },
  go: {
    name: 'Go',
    frameworks: [
      { id: 'net-http', implemented: true },
      { id: 'resty', implemented: true },
    ],
    fileExtension: 'go',
  },
  java: {
    name: 'Java',
    frameworks: [
      { id: 'httpurlconnection', implemented: true },
      { id: 'apache-httpclient', implemented: false },
      { id: 'okhttp', implemented: true },
      { id: 'spring', implemented: false },
    ],
    fileExtension: 'java',
  },
  csharp: {
    name: 'C#',
    frameworks: [
      { id: 'httpclient', implemented: true },
      { id: 'restsharp', implemented: true },
      { id: 'webrequest', implemented: false },
    ],
    fileExtension: 'cs',
  },
  ruby: {
    name: 'Ruby',
    frameworks: [
      { id: 'net-http', implemented: false },
      { id: 'restclient', implemented: false },
      { id: 'httparty', implemented: false },
    ],
    fileExtension: 'rb',
  },
  rust: {
    name: 'Rust',
    frameworks: [
      { id: 'reqwest', implemented: false },
      { id: 'hyper', implemented: false },
    ],
    fileExtension: 'rs',
  },
  swift: {
    name: 'Swift',
    frameworks: [
      { id: 'urlsession', implemented: false },
      { id: 'alamofire', implemented: false },
    ],
    fileExtension: 'swift',
  },
  kotlin: {
    name: 'Kotlin',
    frameworks: [
      { id: 'okhttp', implemented: false },
      { id: 'ktor', implemented: false },
      { id: 'retrofit', implemented: false },
    ],
    fileExtension: 'kt',
  },
  shell: {
    name: 'Shell',
    frameworks: [
      { id: 'wget', implemented: false },
      { id: 'httpie', implemented: false },
      { id: 'powershell', implemented: false },
    ],
    fileExtension: 'sh',
  },
};

export function isImplemented(language: string, framework: string): boolean {
  const lang = SUPPORTED_LANGUAGES[language];
  if (!lang) return false;
  return lang.frameworks.some((f) => f.id === framework && f.implemented);
}

// cURL Parser
export class CurlParser {
  private command: string;
  private tokens: string[] = [];
  private currentIndex: number = 0;

  constructor(command: string) {
    this.command = this.normalizeCommand(command);
  }

  private normalizeCommand(cmd: string): string {
    // Remove line continuations
    cmd = cmd.replace(/\\\n/g, ' ');
    cmd = cmd.replace(/\\\r\n/g, ' ');

    // Normalize whitespace
    cmd = cmd.replace(/\s+/g, ' ').trim();

    // Ensure it starts with curl
    if (!cmd.toLowerCase().startsWith('curl')) {
      throw new Error('Invalid cURL command: must start with "curl"');
    }

    return cmd;
  }

  private tokenize(): void {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = '';
    let escaped = false;

    for (let i = 0; i < this.command.length; i++) {
      const char = this.command[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = char;
        continue;
      }

      if (char === inQuotes) {
        inQuotes = '';
        continue;
      }

      if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) {
      tokens.push(current);
    }

    // Skip 'curl' at the beginning
    this.tokens = tokens.slice(1);
    this.currentIndex = 0;
  }

  parse(): CurlParseResult {
    this.tokenize();

    const result: CurlParseResult = {
      method: 'GET',
      url: '',
      headers: {},
      options: {},
    };

    while (this.currentIndex < this.tokens.length) {
      const token = this.tokens[this.currentIndex];

      if (token.startsWith('-')) {
        this.parseFlag(token, result);
      } else if (!result.url && this.isUrl(token)) {
        result.url = this.expandUrl(token);
      }

      this.currentIndex++;
    }

    // Post-processing
    this.postProcess(result);

    return result;
  }

  private parseFlag(flag: string, result: CurlParseResult): void {
    const nextToken = this.getNextToken();

    switch (flag) {
      case '-X':
      case '--request':
        result.method = nextToken?.toUpperCase() || 'GET';
        this.currentIndex++;
        break;

      case '-H':
      case '--header':
        if (nextToken) {
          this.parseHeader(nextToken, result);
          this.currentIndex++;
        }
        break;

      case '-d':
      case '--data':
      case '--data-raw':
        if (nextToken) {
          result.body = this.parseData(nextToken, result);
          result.method = result.method === 'GET' ? 'POST' : result.method;
          this.currentIndex++;
        }
        break;

      case '--data-binary':
        if (nextToken) {
          result.body = nextToken;
          result.dataType = 'binary';
          result.method = result.method === 'GET' ? 'POST' : result.method;
          this.currentIndex++;
        }
        break;

      case '-F':
      case '--form':
        if (nextToken) {
          this.parseFormField(nextToken, result);
          result.isMultipart = true;
          result.dataType = 'multipart';
          result.method = result.method === 'GET' ? 'POST' : result.method;
          this.currentIndex++;
        }
        break;

      case '-u':
      case '--user':
        if (nextToken) {
          this.parseAuth(nextToken, result);
          this.currentIndex++;
        }
        break;

      case '-b':
      case '--cookie':
        if (nextToken) {
          this.parseCookie(nextToken, result);
          this.currentIndex++;
        }
        break;

      case '--compressed':
        result.options.compressed = true;
        break;

      case '-k':
      case '--insecure':
        result.options.insecure = true;
        break;

      case '-L':
      case '--location':
        result.options.followRedirects = true;
        break;

      case '--max-time':
        if (nextToken) {
          result.options.timeout = parseInt(nextToken) * 1000;
          this.currentIndex++;
        }
        break;

      case '--proxy':
        if (nextToken) {
          result.options.proxy = nextToken;
          this.currentIndex++;
        }
        break;

      case '--cert':
        if (nextToken) {
          result.options.cert = nextToken;
          this.currentIndex++;
        }
        break;

      case '-A':
      case '--user-agent':
        if (nextToken) {
          result.options.userAgent = nextToken;
          this.currentIndex++;
        }
        break;

      case '--max-redirs':
        if (nextToken) {
          result.options.maxRedirects = parseInt(nextToken);
          this.currentIndex++;
        }
        break;
    }
  }

  private getNextToken(): string | undefined {
    return this.tokens[this.currentIndex + 1];
  }

  private isUrl(token: string): boolean {
    return (
      token.startsWith('http://') ||
      token.startsWith('https://') ||
      token.startsWith('ftp://') ||
      !token.startsWith('-')
    );
  }

  private expandUrl(url: string): string {
    // Add protocol if missing
    if (!url.match(/^[a-z]+:\/\//i)) {
      url = 'https://' + url;
    }
    return url;
  }

  private parseHeader(header: string, result: CurlParseResult): void {
    const colonIndex = header.indexOf(':');
    if (colonIndex > 0) {
      const name = header.substring(0, colonIndex).trim();
      const value = header.substring(colonIndex + 1).trim();
      result.headers[name] = value;

      // Check for authorization header
      if (name.toLowerCase() === 'authorization') {
        this.parseAuthHeader(value, result);
      }
    }
  }

  private parseAuthHeader(value: string, result: CurlParseResult): void {
    if (value.toLowerCase().startsWith('bearer ')) {
      result.auth = {
        type: 'bearer',
        credentials: { token: value.substring(7) },
      };
    } else if (value.toLowerCase().startsWith('basic ')) {
      result.auth = {
        type: 'basic',
        credentials: { encoded: value.substring(6) },
      };
    } else {
      result.auth = {
        type: 'custom',
        credentials: { header: value },
      };
    }
  }

  private parseData(data: string, result: CurlParseResult): any {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(data);
      result.dataType = 'json';
      return parsed;
    } catch {
      // Check if it's form data
      if (data.includes('=') && !data.includes('{')) {
        result.dataType = 'form';
        return this.parseFormData(data);
      }

      // Otherwise treat as raw
      result.dataType = 'raw';
      result.rawBody = data;
      return data;
    }
  }

  private parseFormData(data: string): Record<string, any> {
    const result: Record<string, any> = {};
    const pairs = data.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = value
          ? decodeURIComponent(value)
          : '';
      }
    }

    return result;
  }

  private parseFormField(field: string, result: CurlParseResult): void {
    if (!result.formData) {
      result.formData = {};
    }

    const equalIndex = field.indexOf('=');

    if (equalIndex > 0) {
      const fieldName = field.substring(0, equalIndex);
      const value = field.substring(equalIndex + 1);

      // Check if value starts with @ (file upload)
      if (value.startsWith('@')) {
        const fileName = value.substring(1);

        if (!result.files) {
          result.files = [];
        }

        result.files.push({
          fieldName,
          fileName,
        });
      } else {
        // Regular form field
        result.formData[fieldName] = value;
      }
    }
  }

  private parseAuth(auth: string, result: CurlParseResult): void {
    const colonIndex = auth.indexOf(':');
    if (colonIndex > 0) {
      result.auth = {
        type: 'basic',
        credentials: {
          username: auth.substring(0, colonIndex),
          password: auth.substring(colonIndex + 1),
        },
      };
    }
  }

  private parseCookie(cookie: string, result: CurlParseResult): void {
    if (!result.cookies) {
      result.cookies = {};
    }

    const pairs = cookie.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.trim().split('=');
      if (key) {
        result.cookies[key] = value || '';
      }
    }
  }

  private postProcess(result: CurlParseResult): void {
    // Extract query parameters from URL
    if (result.url) {
      const urlObj = new URL(result.url);
      if (urlObj.search) {
        result.queryParams = {};
        urlObj.searchParams.forEach((value, key) => {
          result.queryParams![key] = value;
        });
        result.url = urlObj.origin + urlObj.pathname;
      }
    }

    // Set Content-Type if not present
    if (result.body && !result.headers['Content-Type']) {
      if (result.dataType === 'json') {
        result.headers['Content-Type'] = 'application/json';
      } else if (result.dataType === 'form') {
        result.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (result.isMultipart) {
        // multipart/form-data boundary will be set by the client
      }
    }

    // Add User-Agent if not present
    if (!result.headers['User-Agent'] && !result.options.userAgent) {
      result.options.userAgent = 'curl/7.68.0';
    }
  }
}

// Type Inference Engine
export class TypeInferenceEngine {
  inferTypes(data: any, name: string = 'Response'): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return `type ${name} = any[];`;

      // Check if all items have the same type
      const types = new Set(data.map((item) => this.getTypeForValue(item)));

      if (types.size === 1) {
        const singleType = Array.from(types)[0];
        // For primitive types, return directly
        if (singleType !== 'Record<string, any>') {
          return `type ${name} = ${singleType}[];`;
        }
      } else if (types.size > 1) {
        // Mixed types
        const typeArray = Array.from(types);
        return `type ${name} = (${typeArray.join(' | ')})[];`;
      }

      // For objects, use the item pattern
      const itemType = this.inferTypes(data[0], `${name}Item`);
      return `${itemType}\n\ntype ${name} = ${name}Item[];`;
    }

    if (typeof data === 'object' && data !== null) {
      const fields: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        const fieldType = this.getTypeForValue(value);
        const optional = this.isOptional(key, value) ? '?' : '';
        fields.push(
          `  ${this.sanitizeFieldName(key)}${optional}: ${fieldType};`
        );
      }

      return `interface ${name} {\n${fields.join('\n')}\n}`;
    }

    return `type ${name} = ${this.getTypeForValue(data)};`;
  }

  private getTypeForValue(value: any): string {
    if (value === null || value === undefined) return 'any';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const types = new Set(value.map((v) => this.getTypeForValue(v)));
      if (types.size === 1) {
        return `${Array.from(types)[0]}[]`;
      }
      return `(${Array.from(types).join(' | ')})[]`;
    }

    if (typeof value === 'object') {
      return 'Record<string, any>';
    }

    return 'any';
  }

  private sanitizeFieldName(name: string): string {
    // Wrap in quotes if contains special characters
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return `"${name}"`;
    }
    return name;
  }

  private isOptional(key: string, value: any): boolean {
    // Simple heuristic: fields with null values are optional
    return value === null;
  }
}

// Code Generator Base Class
export abstract class CodeGenerator {
  protected options: CodeGenerationOptions;
  protected indent: string;

  constructor(options: CodeGenerationOptions) {
    this.options = {
      errorHandling: 'basic',
      async: true,
      extractEnvVars: true,
      includeTypes: true,
      includeComments: true,
      indentSize: 2,
      indentType: 'spaces',
      ...options,
    };

    this.indent =
      this.options.indentType === 'tabs'
        ? '\t'
        : ' '.repeat(this.options.indentSize || 2);
  }

  abstract generate(curl: CurlParseResult): GeneratedCode;

  protected extractEnvVars(curl: CurlParseResult): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Extract from auth
    if (curl.auth?.type === 'bearer') {
      envVars['API_TOKEN'] = curl.auth.credentials.token;
    } else if (curl.auth?.type === 'basic') {
      envVars['API_USERNAME'] = curl.auth.credentials.username;
      envVars['API_PASSWORD'] = curl.auth.credentials.password;
    }

    // Extract API keys from headers
    for (const [key, value] of Object.entries(curl.headers)) {
      if (
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token')
      ) {
        const envKey = key.toUpperCase().replace(/-/g, '_');
        envVars[envKey] = value;
      }
    }

    return envVars;
  }

  protected formatJson(obj: any): string {
    return JSON.stringify(obj, null, parseInt(this.indent));
  }
}

// JavaScript/TypeScript Fetch Generator
export class FetchGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const envVars = this.options.extractEnvVars
      ? this.extractEnvVars(curl)
      : {};
    const isTypeScript = this.options.language === 'typescript';

    let code = '';
    const imports: string[] = [];
    let types = '';

    // Generate types if TypeScript
    if (isTypeScript && this.options.includeTypes && curl.body) {
      const inferenceEngine = new TypeInferenceEngine();
      types = inferenceEngine.inferTypes(curl.body, 'RequestBody');
      if (this.options.mockResponse) {
        types +=
          '\n\n' +
          inferenceEngine.inferTypes(this.options.mockResponse, 'ResponseData');
      }
    }

    // Build fetch options
    const fetchOptions: any = {
      method: curl.method,
    };

    // Headers
    if (Object.keys(curl.headers).length > 0) {
      fetchOptions.headers = { ...curl.headers };
    }

    // Body
    if (curl.body) {
      if (curl.dataType === 'json') {
        fetchOptions.body = 'JSON.stringify(data)';
      } else if (curl.dataType === 'form') {
        fetchOptions.body = 'new URLSearchParams(data)';
      } else {
        fetchOptions.body = 'body';
      }
    }

    // Build the function
    const funcName = 'makeRequest';
    const asyncKeyword = this.options.async ? 'async ' : '';

    code += this.options.includeComments
      ? '// Auto-generated from cURL command\n'
      : '';

    if (isTypeScript && types) {
      code += `${types}\n\n`;
    }

    code += `${asyncKeyword}function ${funcName}(`;

    if (curl.body) {
      code += isTypeScript ? 'data: RequestBody' : 'data';
    }

    code += `) {\n`;

    // Add URL construction
    let url = `'${curl.url}'`;
    if (curl.queryParams) {
      code += `${this.indent}const params = new URLSearchParams(${this.formatJson(curl.queryParams)});\n`;
      code += `${this.indent}const url = \`${curl.url}?\${params}\`;\n`;
      url = 'url';
    }

    // Build options string
    const optionsStr = this.buildFetchOptionsString(fetchOptions, curl);

    // Add try-catch if error handling enabled
    if (this.options.errorHandling !== 'none') {
      code += `${this.indent}try {\n`;
      code += `${this.indent}${this.indent}const response = ${this.options.async ? 'await ' : ''}fetch(${url}, ${optionsStr});\n`;

      if (this.options.errorHandling === 'comprehensive') {
        code += `${this.indent}${this.indent}if (!response.ok) {\n`;
        code += `${this.indent}${this.indent}${this.indent}throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
        code += `${this.indent}${this.indent}}\n`;
      }

      code += `${this.indent}${this.indent}const data = ${this.options.async ? 'await ' : ''}response.json();\n`;
      code += `${this.indent}${this.indent}return data;\n`;
      code += `${this.indent}} catch (error) {\n`;
      code += `${this.indent}${this.indent}console.error('Request failed:', error);\n`;

      if (this.options.retryLogic) {
        code += `${this.indent}${this.indent}// Retry logic here\n`;
      }

      code += `${this.indent}${this.indent}throw error;\n`;
      code += `${this.indent}}\n`;
    } else {
      code += `${this.indent}const response = ${this.options.async ? 'await ' : ''}fetch(${url}, ${optionsStr});\n`;
      code += `${this.indent}return ${this.options.async ? 'await ' : ''}response.json();\n`;
    }

    code += '}\n';

    // Add example usage
    if (this.options.includeComments) {
      code += '\n// Example usage:\n';
      if (curl.body) {
        code += `// ${funcName}(${this.formatJson(curl.body)})`;
      } else {
        code += `// ${funcName}()`;
      }

      if (this.options.async) {
        code += `.then(result => console.log(result))`;
      }

      code += ';\n';
    }

    return {
      code,
      language: this.options.language,
      framework: this.options.framework,
      fileName: 'api-request',
      fileExtension: isTypeScript ? 'ts' : 'js',
      types,
      imports,
      envVars,
    };
  }

  private buildFetchOptionsString(options: any, curl: CurlParseResult): string {
    let str = '{\n';

    str += `${this.indent}${this.indent}method: '${options.method}',\n`;

    if (options.headers) {
      str += `${this.indent}${this.indent}headers: ${this.formatJson(options.headers)},\n`;
    }

    if (options.body) {
      str += `${this.indent}${this.indent}body: ${options.body},\n`;
    }

    if (curl.options.followRedirects !== undefined) {
      str += `${this.indent}${this.indent}redirect: '${curl.options.followRedirects ? 'follow' : 'manual'}',\n`;
    }

    if (this.options.timeout) {
      str += `${this.indent}${this.indent}signal: AbortSignal.timeout(${this.options.timeout}),\n`;
    }

    str += `${this.indent}}`;

    return str;
  }
}

// Python Requests Generator
export class PythonRequestsGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const envVars = this.options.extractEnvVars
      ? this.extractEnvVars(curl)
      : {};

    let code = '';
    const imports: string[] = ['import requests'];

    if (envVars && Object.keys(envVars).length > 0) {
      imports.push('import os');
    }

    if (curl.body && curl.dataType === 'json') {
      imports.push('import json');
    }

    // Add imports
    code += imports.join('\n') + '\n\n';

    // Add function
    const funcName = 'make_request';
    const asyncDef = this.options.framework === 'aiohttp' ? 'async def' : 'def';

    code += `${asyncDef} ${funcName}(`;

    if (curl.body) {
      code += 'data';
    }

    code += '):\n';

    // Build URL
    code += `${this.indent}url = "${curl.url}"\n`;

    if (curl.queryParams) {
      code += `${this.indent}params = ${this.pythonDict(curl.queryParams)}\n`;
    }

    // Headers
    if (Object.keys(curl.headers).length > 0) {
      code += `${this.indent}headers = ${this.pythonDict(curl.headers)}\n`;
    }

    // Auth
    if (curl.auth?.type === 'basic') {
      const username = envVars['API_USERNAME']
        ? 'os.getenv("API_USERNAME")'
        : `"${curl.auth.credentials.username}"`;
      const password = envVars['API_PASSWORD']
        ? 'os.getenv("API_PASSWORD")'
        : `"${curl.auth.credentials.password}"`;
      code += `${this.indent}auth = (${username}, ${password})\n`;
    }

    // Make request
    code += '\n';

    if (this.options.errorHandling !== 'none') {
      code += `${this.indent}try:\n`;
      code += `${this.indent}${this.indent}response = requests.${curl.method.toLowerCase()}(\n`;
      code += `${this.indent}${this.indent}${this.indent}url,\n`;

      if (curl.queryParams) {
        code += `${this.indent}${this.indent}${this.indent}params=params,\n`;
      }

      if (Object.keys(curl.headers).length > 0) {
        code += `${this.indent}${this.indent}${this.indent}headers=headers,\n`;
      }

      if (curl.body) {
        if (curl.dataType === 'json') {
          code += `${this.indent}${this.indent}${this.indent}json=data,\n`;
        } else {
          code += `${this.indent}${this.indent}${this.indent}data=data,\n`;
        }
      }

      if (curl.auth?.type === 'basic') {
        code += `${this.indent}${this.indent}${this.indent}auth=auth,\n`;
      }

      if (curl.options.timeout) {
        code += `${this.indent}${this.indent}${this.indent}timeout=${curl.options.timeout / 1000},\n`;
      }

      if (curl.options.insecure) {
        code += `${this.indent}${this.indent}${this.indent}verify=False,\n`;
      }

      code += `${this.indent}${this.indent})\n`;

      if (this.options.errorHandling === 'comprehensive') {
        code += `${this.indent}${this.indent}response.raise_for_status()\n`;
      }

      code += `${this.indent}${this.indent}return response.json()\n`;
      code += `${this.indent}except requests.RequestException as e:\n`;
      code += `${this.indent}${this.indent}print(f"Request failed: {e}")\n`;

      if (this.options.retryLogic) {
        code += `${this.indent}${this.indent}# Add retry logic here\n`;
      }

      code += `${this.indent}${this.indent}raise\n`;
    } else {
      code += `${this.indent}response = requests.${curl.method.toLowerCase()}(url`;

      if (curl.queryParams) code += ', params=params';
      if (Object.keys(curl.headers).length > 0) code += ', headers=headers';
      if (curl.body)
        code += curl.dataType === 'json' ? ', json=data' : ', data=data';

      code += ')\n';
      code += `${this.indent}return response.json()\n`;
    }

    // Add example usage
    if (this.options.includeComments) {
      code += '\n# Example usage:\n';
      code += '# result = ' + funcName;

      if (curl.body) {
        code += `(${this.pythonDict(curl.body)})`;
      } else {
        code += '()';
      }

      code += '\n# print(result)\n';
    }

    return {
      code,
      language: 'python',
      framework: 'requests',
      fileName: 'api_request',
      fileExtension: 'py',
      imports,
      envVars,
      dependencies: ['requests'],
    };
  }

  private pythonDict(obj: any): string {
    if (typeof obj !== 'object') return JSON.stringify(obj);

    const items = Object.entries(obj).map(([key, value]) => {
      const quotedKey = `"${key}"`;
      const quotedValue = typeof value === 'string' ? `"${value}"` : value;
      return `${quotedKey}: ${quotedValue}`;
    });

    return `{${items.join(', ')}}`;
  }
}

// ============================================================================
// PHP Generators (RIC-114)
// ============================================================================

/**
 * Helpers shared across PHP generators.
 */
function phpEscape(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function phpAssocArray(obj: Record<string, unknown>, indent: string): string {
  const lines = Object.entries(obj).map(
    ([k, v]) =>
      `${indent}${indent}'${phpEscape(k)}' => '${phpEscape(String(v))}',`
  );
  return `[\n${lines.join('\n')}\n${indent}]`;
}

/**
 * PHP + Guzzle (GuzzleHttp\\Client).
 * Modern PHP HTTP client; requires `composer require guzzlehttp/guzzle`.
 */
export class PhpGuzzleGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const imports = ['use GuzzleHttp\\Client;', 'use GuzzleHttp\\RequestOptions;'];
    const envVars = this.extractEnvVars(curl);

    let code = '<?php\n\n';
    code += 'require_once __DIR__ . \'/vendor/autoload.php\';\n\n';
    for (const imp of imports) code += imp + '\n';
    code += '\n$client = new Client([\n';
    code += `${this.indent}'base_uri' => '${phpEscape(curl.url)}',\n`;
    if (curl.options.timeout) {
      code += `${this.indent}'timeout'  => ${curl.options.timeout / 1000},\n`;
    }
    if (curl.options.insecure) {
      code += `${this.indent}'verify'   => false,\n`;
    }
    code += ']);\n\n';

    const requestOpts: string[] = [];
    if (Object.keys(curl.headers).length > 0) {
      requestOpts.push(
        `${this.indent}'headers' => ${phpAssocArray(curl.headers, this.indent)}`
      );
    }
    if (curl.queryParams) {
      requestOpts.push(
        `${this.indent}'query' => ${phpAssocArray(curl.queryParams, this.indent)}`
      );
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        requestOpts.push(
          `${this.indent}'json' => ${phpAssocArray(curl.body as Record<string, unknown>, this.indent)}`
        );
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        requestOpts.push(
          `${this.indent}'form_params' => ${phpAssocArray(curl.body as Record<string, unknown>, this.indent)}`
        );
      } else {
        requestOpts.push(
          `${this.indent}'body' => '${phpEscape(String(curl.body))}'`
        );
      }
    }
    if (curl.auth?.type === 'basic') {
      requestOpts.push(
        `${this.indent}'auth' => ['${phpEscape(curl.auth.credentials.username)}', '${phpEscape(curl.auth.credentials.password)}']`
      );
    }

    code += 'try {\n';
    if (requestOpts.length > 0) {
      code += `${this.indent}$response = $client->request('${method}', '', [\n`;
      code += requestOpts.join(',\n') + ',\n';
      code += `${this.indent}]);\n`;
    } else {
      code += `${this.indent}$response = $client->request('${method}', '');\n`;
    }
    code += `${this.indent}$body = $response->getBody()->getContents();\n`;
    code += `${this.indent}$data = json_decode($body, true);\n`;
    code += `${this.indent}print_r($data);\n`;
    code += '} catch (\\GuzzleHttp\\Exception\\RequestException $e) {\n';
    code += `${this.indent}echo 'Request failed: ' . $e->getMessage();\n`;
    code += '}\n';

    return {
      code,
      language: 'php',
      framework: 'guzzle',
      fileName: 'api_request',
      fileExtension: 'php',
      imports,
      envVars,
      dependencies: ['guzzlehttp/guzzle'],
    };
  }
}

/**
 * PHP + native cURL extension (ext-curl).
 * Zero-dependency, works on any PHP install with curl extension enabled.
 */
export class PhpCurlGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);

    let url = curl.url;
    if (curl.queryParams) {
      const qs = Object.entries(curl.queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }

    let code = '<?php\n\n';
    code += `$ch = curl_init('${phpEscape(url)}');\n\n`;
    code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
    code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');\n`;

    if (curl.options.timeout) {
      code += `curl_setopt($ch, CURLOPT_TIMEOUT, ${curl.options.timeout / 1000});\n`;
    }
    if (curl.options.insecure) {
      code += `curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);\n`;
      code += `curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);\n`;
    }
    if (curl.options.followRedirects) {
      code += `curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);\n`;
    }

    if (Object.keys(curl.headers).length > 0) {
      const hdrs = Object.entries(curl.headers)
        .map(([k, v]) => `'${phpEscape(k)}: ${phpEscape(String(v))}'`)
        .join(', ');
      code += `curl_setopt($ch, CURLOPT_HTTPHEADER, [${hdrs}]);\n`;
    }

    if (curl.auth?.type === 'basic') {
      code += `curl_setopt($ch, CURLOPT_USERPWD, '${phpEscape(curl.auth.credentials.username)}:${phpEscape(curl.auth.credentials.password)}');\n`;
    }

    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `$payload = json_encode(${phpAssocArray(curl.body as Record<string, unknown>, this.indent)});\n`;
        code += `curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\n`;
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        code += `curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(${phpAssocArray(curl.body as Record<string, unknown>, this.indent)}));\n`;
      } else {
        code += `curl_setopt($ch, CURLOPT_POSTFIELDS, '${phpEscape(String(curl.body))}');\n`;
      }
    }

    code += '\n$response = curl_exec($ch);\n';
    code += '$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\n';
    code += '$error = curl_error($ch);\n';
    code += 'curl_close($ch);\n\n';
    code += 'if ($error) {\n';
    code += `${this.indent}echo 'Request failed: ' . $error;\n`;
    code += '} else {\n';
    code += `${this.indent}$data = json_decode($response, true);\n`;
    code += `${this.indent}print_r($data);\n`;
    code += '}\n';

    return {
      code,
      language: 'php',
      framework: 'curl',
      fileName: 'api_request',
      fileExtension: 'php',
      imports: [],
      envVars,
      dependencies: ['ext-curl'],
    };
  }
}

/**
 * PHP + file_get_contents via stream context.
 * Zero-dependency, no ext-curl required. Limited to simple use cases.
 */
export class PhpFileGetContentsGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);

    let url = curl.url;
    if (curl.queryParams) {
      const qs = Object.entries(curl.queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headerLines = Object.entries(curl.headers).map(
      ([k, v]) => `${k}: ${v}`
    );
    if (curl.auth?.type === 'basic') {
      const token = `base64_encode('${phpEscape(curl.auth.credentials.username)}:${phpEscape(curl.auth.credentials.password)}')`;
      headerLines.push(`Authorization: Basic ' . ${token} . '`);
    }

    let code = '<?php\n\n';
    code += '$options = [\n';
    code += `${this.indent}'http' => [\n`;
    code += `${this.indent}${this.indent}'method'  => '${method}',\n`;
    if (headerLines.length > 0) {
      code += `${this.indent}${this.indent}'header'  => "${headerLines.map(phpEscape).join('\\r\\n')}",\n`;
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}'content' => json_encode(${phpAssocArray(curl.body as Record<string, unknown>, this.indent + this.indent)}),\n`;
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}'content' => http_build_query(${phpAssocArray(curl.body as Record<string, unknown>, this.indent + this.indent)}),\n`;
      } else {
        code += `${this.indent}${this.indent}'content' => '${phpEscape(String(curl.body))}',\n`;
      }
    }
    if (curl.options.timeout) {
      code += `${this.indent}${this.indent}'timeout' => ${curl.options.timeout / 1000},\n`;
    }
    if (curl.options.insecure) {
      code += `${this.indent}'ssl' => [\n`;
      code += `${this.indent}${this.indent}'verify_peer' => false,\n`;
      code += `${this.indent}${this.indent}'verify_peer_name' => false,\n`;
      code += `${this.indent}],\n`;
    }
    code += `${this.indent}],\n`;
    code += '];\n\n';
    code += `$context = stream_context_create($options);\n`;
    code += `$response = @file_get_contents('${phpEscape(url)}', false, $context);\n\n`;
    code += 'if ($response === false) {\n';
    code += `${this.indent}echo 'Request failed';\n`;
    code += '} else {\n';
    code += `${this.indent}$data = json_decode($response, true);\n`;
    code += `${this.indent}print_r($data);\n`;
    code += '}\n';

    return {
      code,
      language: 'php',
      framework: 'file_get_contents',
      fileName: 'api_request',
      fileExtension: 'php',
      imports: [],
      envVars,
      dependencies: [],
    };
  }
}

// ============================================================================
// Go Generators (RIC-115)
// ============================================================================

function goEscape(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Go stdlib `net/http` generator. Zero third-party dependencies,
 * production-grade ergonomics: context.Background, defer Body.Close,
 * proper error handling via `if err != nil`.
 */
export class GoNetHttpGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = new Set<string>([
      'bytes',
      'context',
      'fmt',
      'io',
      'net/http',
      'time',
    ]);

    let url = curl.url;
    if (curl.queryParams) {
      const qs = Object.entries(curl.queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }

    const hasBody = !!curl.body;
    let bodyInit = '';
    if (hasBody) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        bodyInit = `payload := []byte(\`${JSON.stringify(curl.body)}\`)\n${this.indent}body := bytes.NewBuffer(payload)`;
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        imports.add('net/url');
        imports.add('strings');
        const form = Object.entries(curl.body as Record<string, unknown>)
          .map(([k, v]) => `${this.indent}${this.indent}"${goEscape(k)}": {"${goEscape(String(v))}"},`)
          .join('\n');
        bodyInit = `form := url.Values{\n${form}\n${this.indent}}\n${this.indent}body := strings.NewReader(form.Encode())`;
      } else {
        imports.add('strings');
        bodyInit = `body := strings.NewReader("${goEscape(String(curl.body))}")`;
      }
    }

    const timeoutSec = (curl.options.timeout || 30000) / 1000;

    let code = 'package main\n\n';
    code += 'import (\n';
    for (const imp of Array.from(imports).sort())
      code += `${this.indent}"${imp}"\n`;
    code += ')\n\n';
    code += 'func main() {\n';
    code += `${this.indent}ctx, cancel := context.WithTimeout(context.Background(), ${timeoutSec}*time.Second)\n`;
    code += `${this.indent}defer cancel()\n\n`;

    if (hasBody) code += `${this.indent}${bodyInit}\n\n`;

    code += `${this.indent}req, err := http.NewRequestWithContext(ctx, "${method}", "${goEscape(url)}", `;
    code += hasBody ? 'body)\n' : 'nil)\n';
    code += `${this.indent}if err != nil {\n`;
    code += `${this.indent}${this.indent}fmt.Println("failed to build request:", err)\n`;
    code += `${this.indent}${this.indent}return\n`;
    code += `${this.indent}}\n\n`;

    for (const [k, v] of Object.entries(curl.headers)) {
      code += `${this.indent}req.Header.Set("${goEscape(k)}", "${goEscape(String(v))}")\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}req.SetBasicAuth("${goEscape(curl.auth.credentials.username)}", "${goEscape(curl.auth.credentials.password)}")\n`;
    }

    code += `\n${this.indent}client := &http.Client{Timeout: ${timeoutSec} * time.Second}\n`;
    if (curl.options.insecure) {
      imports.add('crypto/tls');
      code += `${this.indent}// NOTE: TLS verification disabled — do not use in production.\n`;
      code += `${this.indent}client.Transport = &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}\n`;
    }
    code += `${this.indent}resp, err := client.Do(req)\n`;
    code += `${this.indent}if err != nil {\n`;
    code += `${this.indent}${this.indent}fmt.Println("request failed:", err)\n`;
    code += `${this.indent}${this.indent}return\n`;
    code += `${this.indent}}\n`;
    code += `${this.indent}defer resp.Body.Close()\n\n`;
    code += `${this.indent}respBody, err := io.ReadAll(resp.Body)\n`;
    code += `${this.indent}if err != nil {\n`;
    code += `${this.indent}${this.indent}fmt.Println("read body failed:", err)\n`;
    code += `${this.indent}${this.indent}return\n`;
    code += `${this.indent}}\n`;
    code += `${this.indent}fmt.Printf("status: %s\\n", resp.Status)\n`;
    code += `${this.indent}fmt.Println(string(respBody))\n`;
    code += '}\n';

    return {
      code,
      language: 'go',
      framework: 'net-http',
      fileName: 'main',
      fileExtension: 'go',
      imports: Array.from(imports),
      envVars,
      dependencies: [],
    };
  }
}

/**
 * Go + `github.com/go-resty/resty/v2`. Fluent HTTP client popular for
 * production API clients and service-to-service calls.
 */
export class GoRestyGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ['fmt', 'time', 'github.com/go-resty/resty/v2'];

    let code = 'package main\n\n';
    code += 'import (\n';
    for (const imp of imports) code += `${this.indent}"${imp}"\n`;
    code += ')\n\n';
    code += 'func main() {\n';
    code += `${this.indent}client := resty.New().SetTimeout(${(curl.options.timeout || 30000) / 1000} * time.Second)\n`;
    if (curl.options.insecure) {
      code += `${this.indent}client.SetTLSClientConfig(nil) // TODO: set InsecureSkipVerify if really needed\n`;
    }

    code += `${this.indent}req := client.R()\n`;

    for (const [k, v] of Object.entries(curl.headers)) {
      code += `${this.indent}req.SetHeader("${goEscape(k)}", "${goEscape(String(v))}")\n`;
    }
    if (curl.queryParams) {
      for (const [k, v] of Object.entries(curl.queryParams)) {
        code += `${this.indent}req.SetQueryParam("${goEscape(k)}", "${goEscape(String(v))}")\n`;
      }
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}req.SetBasicAuth("${goEscape(curl.auth.credentials.username)}", "${goEscape(curl.auth.credentials.password)}")\n`;
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `${this.indent}req.SetHeader("Content-Type", "application/json")\n`;
        code += `${this.indent}req.SetBody(\`${JSON.stringify(curl.body)}\`)\n`;
      } else {
        code += `${this.indent}req.SetBody(\`${String(curl.body).replace(/`/g, '\\`')}\`)\n`;
      }
    }

    const methodFn = method.charAt(0) + method.slice(1).toLowerCase();
    code += `\n${this.indent}resp, err := req.${methodFn}("${goEscape(curl.url)}")\n`;
    code += `${this.indent}if err != nil {\n`;
    code += `${this.indent}${this.indent}fmt.Println("request failed:", err)\n`;
    code += `${this.indent}${this.indent}return\n`;
    code += `${this.indent}}\n`;
    code += `${this.indent}fmt.Printf("status: %d\\n", resp.StatusCode())\n`;
    code += `${this.indent}fmt.Println(string(resp.Body()))\n`;
    code += '}\n';

    return {
      code,
      language: 'go',
      framework: 'resty',
      fileName: 'main',
      fileExtension: 'go',
      imports,
      envVars,
      dependencies: ['github.com/go-resty/resty/v2'],
    };
  }
}

// ============================================================================
// JavaScript / TypeScript additional generators (RIC-116)
// ============================================================================

function jsEscape(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

/**
 * axios generator — the most popular JS HTTP client for Node and browsers.
 */
export class AxiosGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toLowerCase();
    const envVars = this.extractEnvVars(curl);
    const isTs = this.options.language === 'typescript';
    const imports = [
      isTs
        ? "import axios, { AxiosRequestConfig } from 'axios';"
        : "import axios from 'axios';",
    ];

    const config: string[] = [];
    config.push(`method: '${method}'`);
    config.push(`url: '${jsEscape(curl.url)}'`);
    if (Object.keys(curl.headers).length > 0) {
      config.push(`headers: ${JSON.stringify(curl.headers, null, 2)}`);
    }
    if (curl.queryParams) {
      config.push(`params: ${JSON.stringify(curl.queryParams, null, 2)}`);
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        config.push(`data: ${JSON.stringify(curl.body, null, 2)}`);
      } else {
        config.push(`data: \`${jsEscape(String(curl.body))}\``);
      }
    }
    if (curl.auth?.type === 'basic') {
      config.push(
        `auth: { username: '${jsEscape(curl.auth.credentials.username)}', password: '${jsEscape(curl.auth.credentials.password)}' }`
      );
    }
    if (curl.options.timeout) {
      config.push(`timeout: ${curl.options.timeout}`);
    }

    const cfgType = isTs ? ': AxiosRequestConfig' : '';
    let code = imports.join('\n') + '\n\n';
    code += `const config${cfgType} = {\n${this.indent}${config.join(`,\n${this.indent}`)},\n};\n\n`;
    code += 'async function request() {\n';
    code += `${this.indent}try {\n`;
    code += `${this.indent}${this.indent}const response = await axios.request(config);\n`;
    code += `${this.indent}${this.indent}console.log(response.data);\n`;
    code += `${this.indent}${this.indent}return response.data;\n`;
    code += `${this.indent}} catch (error) {\n`;
    code += `${this.indent}${this.indent}if (axios.isAxiosError(error)) {\n`;
    code += `${this.indent}${this.indent}${this.indent}console.error('Axios error:', error.response?.status, error.response?.data);\n`;
    code += `${this.indent}${this.indent}} else {\n`;
    code += `${this.indent}${this.indent}${this.indent}console.error('Unexpected error:', error);\n`;
    code += `${this.indent}${this.indent}}\n`;
    code += `${this.indent}${this.indent}throw error;\n`;
    code += `${this.indent}}\n`;
    code += '}\n\nrequest();\n';

    return {
      code,
      language: this.options.language,
      framework: 'axios',
      fileName: 'api_request',
      fileExtension: isTs ? 'ts' : 'js',
      imports,
      envVars,
      dependencies: ['axios'],
    };
  }
}

/**
 * Node.js stdlib https module.
 */
export class NodeHttpsGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ["const https = require('https');", "const { URL } = require('url');"];

    let code = imports.join('\n') + '\n\n';
    code += `const target = new URL('${jsEscape(curl.url)}');\n\n`;
    code += 'const options = {\n';
    code += `${this.indent}hostname: target.hostname,\n`;
    code += `${this.indent}port: target.port || 443,\n`;
    code += `${this.indent}path: target.pathname + target.search,\n`;
    code += `${this.indent}method: '${method}',\n`;
    if (Object.keys(curl.headers).length > 0) {
      code += `${this.indent}headers: ${JSON.stringify(curl.headers, null, 2).replace(/\n/g, '\n' + this.indent)},\n`;
    }
    if (curl.options.timeout) code += `${this.indent}timeout: ${curl.options.timeout},\n`;
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}auth: '${jsEscape(curl.auth.credentials.username)}:${jsEscape(curl.auth.credentials.password)}',\n`;
    }
    code += '};\n\n';
    code += 'const req = https.request(options, (res) => {\n';
    code += `${this.indent}let data = '';\n`;
    code += `${this.indent}res.on('data', (chunk) => { data += chunk; });\n`;
    code += `${this.indent}res.on('end', () => {\n`;
    code += `${this.indent}${this.indent}console.log('status:', res.statusCode);\n`;
    code += `${this.indent}${this.indent}console.log(data);\n`;
    code += `${this.indent}});\n`;
    code += '});\n\n';
    code += "req.on('error', (err) => console.error('request failed:', err));\n";
    if (curl.body) {
      const payload =
        curl.dataType === 'json' && typeof curl.body === 'object'
          ? JSON.stringify(curl.body)
          : String(curl.body);
      code += `req.write(\`${jsEscape(payload)}\`);\n`;
    }
    code += 'req.end();\n';

    return {
      code,
      language: this.options.language,
      framework: 'node-https',
      fileName: 'api_request',
      fileExtension: this.options.language === 'typescript' ? 'ts' : 'js',
      imports,
      envVars,
      dependencies: [],
    };
  }
}

/**
 * jQuery $.ajax (legacy browser codebases).
 */
export class JQueryGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);

    let code = '$.ajax({\n';
    code += `${this.indent}url: '${jsEscape(curl.url)}',\n`;
    code += `${this.indent}method: '${method}',\n`;
    if (Object.keys(curl.headers).length > 0) {
      code += `${this.indent}headers: ${JSON.stringify(curl.headers, null, 2).replace(/\n/g, '\n' + this.indent)},\n`;
    }
    if (curl.queryParams) {
      code += `${this.indent}data: ${JSON.stringify(curl.queryParams, null, 2).replace(/\n/g, '\n' + this.indent)},\n`;
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `${this.indent}contentType: 'application/json',\n`;
        code += `${this.indent}data: JSON.stringify(${JSON.stringify(curl.body)}),\n`;
      } else {
        code += `${this.indent}data: \`${jsEscape(String(curl.body))}\`,\n`;
      }
    }
    if (curl.options.timeout) code += `${this.indent}timeout: ${curl.options.timeout},\n`;
    code += `${this.indent}success: (data, status, xhr) => {\n`;
    code += `${this.indent}${this.indent}console.log('response:', data);\n`;
    code += `${this.indent}},\n`;
    code += `${this.indent}error: (xhr, status, err) => {\n`;
    code += `${this.indent}${this.indent}console.error('request failed:', status, err);\n`;
    code += `${this.indent}},\n`;
    code += '});\n';

    return {
      code,
      language: this.options.language,
      framework: 'jquery',
      fileName: 'api_request',
      fileExtension: 'js',
      imports: [],
      envVars,
      dependencies: ['jquery'],
    };
  }
}

/**
 * XMLHttpRequest (educational / pre-fetch codebases).
 */
export class XhrGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);

    let url = curl.url;
    if (curl.queryParams) {
      const qs = Object.entries(curl.queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }

    let code = 'const xhr = new XMLHttpRequest();\n';
    code += `xhr.open('${method}', '${jsEscape(url)}');\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      code += `xhr.setRequestHeader('${jsEscape(k)}', '${jsEscape(String(v))}');\n`;
    }
    if (curl.auth?.type === 'basic') {
      const token = `btoa('${jsEscape(curl.auth.credentials.username)}:${jsEscape(curl.auth.credentials.password)}')`;
      code += `xhr.setRequestHeader('Authorization', 'Basic ' + ${token});\n`;
    }
    if (curl.options.timeout) code += `xhr.timeout = ${curl.options.timeout};\n`;
    code += '\nxhr.onload = () => {\n';
    code += `${this.indent}if (xhr.status >= 200 && xhr.status < 300) console.log(xhr.responseText);\n`;
    code += `${this.indent}else console.error('HTTP', xhr.status, xhr.statusText);\n`;
    code += '};\n';
    code += "xhr.onerror = () => console.error('network error');\n";

    if (curl.body) {
      const payload =
        curl.dataType === 'json' && typeof curl.body === 'object'
          ? `JSON.stringify(${JSON.stringify(curl.body)})`
          : `\`${jsEscape(String(curl.body))}\``;
      code += `xhr.send(${payload});\n`;
    } else {
      code += 'xhr.send();\n';
    }

    return {
      code,
      language: this.options.language,
      framework: 'xhr',
      fileName: 'api_request',
      fileExtension: 'js',
      imports: [],
      envVars,
      dependencies: [],
    };
  }
}

// ============================================================================
// Python additional generators (RIC-116)
// ============================================================================

function pyDict(obj: Record<string, unknown>, indent: string): string {
  const items = Object.entries(obj).map(
    ([k, v]) =>
      `${indent}${indent}"${k}": ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)},`
  );
  return `{\n${items.join('\n')}\n${indent}}`;
}

export class PythonHttpxGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toLowerCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ['import httpx'];

    let code = imports.join('\n') + '\n\n';
    code += 'def main():\n';
    code += `${this.indent}with httpx.Client(timeout=${(curl.options.timeout || 30000) / 1000}`;
    if (curl.options.insecure) code += ', verify=False';
    code += ') as client:\n';
    code += `${this.indent}${this.indent}response = client.${method}(\n`;
    code += `${this.indent}${this.indent}${this.indent}"${curl.url}",\n`;
    if (Object.keys(curl.headers).length > 0) {
      code += `${this.indent}${this.indent}${this.indent}headers=${pyDict(curl.headers, this.indent + this.indent + this.indent)},\n`;
    }
    if (curl.queryParams) {
      code += `${this.indent}${this.indent}${this.indent}params=${pyDict(curl.queryParams, this.indent + this.indent + this.indent)},\n`;
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}${this.indent}json=${pyDict(curl.body as Record<string, unknown>, this.indent + this.indent + this.indent)},\n`;
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}${this.indent}data=${pyDict(curl.body as Record<string, unknown>, this.indent + this.indent + this.indent)},\n`;
      }
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}${this.indent}auth=("${curl.auth.credentials.username}", "${curl.auth.credentials.password}"),\n`;
    }
    code += `${this.indent}${this.indent})\n`;
    code += `${this.indent}${this.indent}response.raise_for_status()\n`;
    code += `${this.indent}${this.indent}print(response.json())\n\n`;
    code += 'if __name__ == "__main__":\n';
    code += `${this.indent}main()\n`;

    return {
      code,
      language: 'python',
      framework: 'httpx',
      fileName: 'api_request',
      fileExtension: 'py',
      imports,
      envVars,
      dependencies: ['httpx'],
    };
  }
}

export class PythonAioHttpGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toLowerCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ['import aiohttp', 'import asyncio'];

    let code = imports.join('\n') + '\n\n';
    code += 'async def main():\n';
    code += `${this.indent}timeout = aiohttp.ClientTimeout(total=${(curl.options.timeout || 30000) / 1000})\n`;
    code += `${this.indent}async with aiohttp.ClientSession(timeout=timeout) as session:\n`;
    code += `${this.indent}${this.indent}async with session.${method}(\n`;
    code += `${this.indent}${this.indent}${this.indent}"${curl.url}",\n`;
    if (Object.keys(curl.headers).length > 0) {
      code += `${this.indent}${this.indent}${this.indent}headers=${pyDict(curl.headers, this.indent + this.indent + this.indent)},\n`;
    }
    if (curl.body) {
      if (curl.dataType === 'json' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}${this.indent}json=${pyDict(curl.body as Record<string, unknown>, this.indent + this.indent + this.indent)},\n`;
      } else if (curl.dataType === 'form' && typeof curl.body === 'object') {
        code += `${this.indent}${this.indent}${this.indent}data=${pyDict(curl.body as Record<string, unknown>, this.indent + this.indent + this.indent)},\n`;
      }
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}${this.indent}auth=aiohttp.BasicAuth("${curl.auth.credentials.username}", "${curl.auth.credentials.password}"),\n`;
    }
    code += `${this.indent}${this.indent}) as response:\n`;
    code += `${this.indent}${this.indent}${this.indent}response.raise_for_status()\n`;
    code += `${this.indent}${this.indent}${this.indent}data = await response.json()\n`;
    code += `${this.indent}${this.indent}${this.indent}print(data)\n\n`;
    code += 'asyncio.run(main())\n';

    return {
      code,
      language: 'python',
      framework: 'aiohttp',
      fileName: 'api_request',
      fileExtension: 'py',
      imports,
      envVars,
      dependencies: ['aiohttp'],
    };
  }
}

export class PythonUrllibGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ['import json', 'import urllib.request', 'import urllib.parse'];

    let url = curl.url;
    if (curl.queryParams) {
      imports.push('from urllib.parse import urlencode');
      url += (url.includes('?') ? '&' : '?') + '<QUERY>';
    }

    let code = imports.join('\n') + '\n\n';
    if (curl.queryParams) {
      code += `query = urlencode(${pyDict(curl.queryParams, this.indent)})\n`;
      code += `url = f"${curl.url}${curl.url.includes('?') ? '&' : '?'}{query}"\n\n`;
    } else {
      code += `url = "${curl.url}"\n\n`;
    }

    const bodyVar = curl.body
      ? curl.dataType === 'json' && typeof curl.body === 'object'
        ? `json.dumps(${pyDict(curl.body as Record<string, unknown>, this.indent)}).encode()`
        : curl.dataType === 'form' && typeof curl.body === 'object'
          ? `urllib.parse.urlencode(${pyDict(curl.body as Record<string, unknown>, this.indent)}).encode()`
          : `b"${String(curl.body)}"`
      : 'None';

    code += `req = urllib.request.Request(url, method="${method}", data=${bodyVar})\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      code += `req.add_header("${k}", "${v}")\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `import base64\n`;
      code += `creds = base64.b64encode(b"${curl.auth.credentials.username}:${curl.auth.credentials.password}").decode()\n`;
      code += `req.add_header("Authorization", f"Basic {creds}")\n`;
    }
    code += '\nwith urllib.request.urlopen(req) as response:\n';
    code += `${this.indent}body = response.read().decode()\n`;
    code += `${this.indent}print(f"status: {response.status}")\n`;
    code += `${this.indent}print(body)\n`;

    return {
      code,
      language: 'python',
      framework: 'urllib',
      fileName: 'api_request',
      fileExtension: 'py',
      imports,
      envVars,
      dependencies: [],
    };
  }
}

// ============================================================================
// Java + C# Generators (RIC-117)
// ============================================================================

function javaEscape(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export class JavaHttpClientGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = [
      'import java.net.URI;',
      'import java.net.http.HttpClient;',
      'import java.net.http.HttpRequest;',
      'import java.net.http.HttpResponse;',
      'import java.time.Duration;',
    ];

    const bodyPublisher =
      curl.body && curl.dataType === 'json' && typeof curl.body === 'object'
        ? `HttpRequest.BodyPublishers.ofString("${javaEscape(JSON.stringify(curl.body))}")`
        : curl.body
          ? `HttpRequest.BodyPublishers.ofString("${javaEscape(String(curl.body))}")`
          : 'HttpRequest.BodyPublishers.noBody()';

    let code = imports.join('\n') + '\n\n';
    code += 'public class ApiRequest {\n';
    code += `${this.indent}public static void main(String[] args) throws Exception {\n`;
    code += `${this.indent}${this.indent}HttpClient client = HttpClient.newBuilder()\n`;
    code += `${this.indent}${this.indent}${this.indent}.connectTimeout(Duration.ofSeconds(${(curl.options.timeout || 30000) / 1000}))\n`;
    code += `${this.indent}${this.indent}${this.indent}.build();\n\n`;
    code += `${this.indent}${this.indent}HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()\n`;
    code += `${this.indent}${this.indent}${this.indent}.uri(URI.create("${javaEscape(curl.url)}"))\n`;
    code += `${this.indent}${this.indent}${this.indent}.timeout(Duration.ofSeconds(${(curl.options.timeout || 30000) / 1000}))\n`;
    code += `${this.indent}${this.indent}${this.indent}.method("${method}", ${bodyPublisher});\n\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      code += `${this.indent}${this.indent}reqBuilder.header("${javaEscape(k)}", "${javaEscape(String(v))}");\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}String creds = java.util.Base64.getEncoder().encodeToString("${javaEscape(curl.auth.credentials.username)}:${javaEscape(curl.auth.credentials.password)}".getBytes());\n`;
      code += `${this.indent}${this.indent}reqBuilder.header("Authorization", "Basic " + creds);\n`;
    }
    code += `\n${this.indent}${this.indent}HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());\n`;
    code += `${this.indent}${this.indent}System.out.println("status: " + response.statusCode());\n`;
    code += `${this.indent}${this.indent}System.out.println(response.body());\n`;
    code += `${this.indent}}\n`;
    code += '}\n';

    return {
      code,
      language: 'java',
      framework: 'httpurlconnection',
      fileName: 'ApiRequest',
      fileExtension: 'java',
      imports,
      envVars,
      dependencies: [],
    };
  }
}

export class JavaOkHttpGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = [
      'import okhttp3.*;',
      'import java.util.concurrent.TimeUnit;',
    ];

    const hasJsonBody =
      curl.body && curl.dataType === 'json' && typeof curl.body === 'object';
    const mediaType = hasJsonBody ? 'application/json' : 'text/plain';
    const bodyStr = hasJsonBody
      ? JSON.stringify(curl.body)
      : curl.body
        ? String(curl.body)
        : '';

    let code = imports.join('\n') + '\n\n';
    code += 'public class ApiRequest {\n';
    code += `${this.indent}public static void main(String[] args) throws Exception {\n`;
    code += `${this.indent}${this.indent}OkHttpClient client = new OkHttpClient.Builder()\n`;
    code += `${this.indent}${this.indent}${this.indent}.connectTimeout(${(curl.options.timeout || 30000) / 1000}, TimeUnit.SECONDS)\n`;
    code += `${this.indent}${this.indent}${this.indent}.readTimeout(${(curl.options.timeout || 30000) / 1000}, TimeUnit.SECONDS)\n`;
    code += `${this.indent}${this.indent}${this.indent}.build();\n\n`;
    if (curl.body) {
      code += `${this.indent}${this.indent}RequestBody body = RequestBody.create("${javaEscape(bodyStr)}", MediaType.parse("${mediaType}"));\n\n`;
    }
    code += `${this.indent}${this.indent}Request.Builder reqBuilder = new Request.Builder()\n`;
    code += `${this.indent}${this.indent}${this.indent}.url("${javaEscape(curl.url)}")\n`;
    code += `${this.indent}${this.indent}${this.indent}.method("${method}", ${curl.body ? 'body' : 'null'});\n\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      code += `${this.indent}${this.indent}reqBuilder.header("${javaEscape(k)}", "${javaEscape(String(v))}");\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}reqBuilder.header("Authorization", Credentials.basic("${javaEscape(curl.auth.credentials.username)}", "${javaEscape(curl.auth.credentials.password)}"));\n`;
    }
    code += `\n${this.indent}${this.indent}try (Response response = client.newCall(reqBuilder.build()).execute()) {\n`;
    code += `${this.indent}${this.indent}${this.indent}System.out.println("status: " + response.code());\n`;
    code += `${this.indent}${this.indent}${this.indent}System.out.println(response.body() != null ? response.body().string() : "");\n`;
    code += `${this.indent}${this.indent}}\n`;
    code += `${this.indent}}\n`;
    code += '}\n';

    return {
      code,
      language: 'java',
      framework: 'okhttp',
      fileName: 'ApiRequest',
      fileExtension: 'java',
      imports,
      envVars,
      dependencies: ['com.squareup.okhttp3:okhttp'],
    };
  }
}

function csEscape(str: string): string {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export class CsharpHttpClientGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = [
      'using System;',
      'using System.Net.Http;',
      'using System.Net.Http.Headers;',
      'using System.Text;',
      'using System.Threading.Tasks;',
    ];

    let code = imports.join('\n') + '\n\n';
    code += 'public class ApiRequest {\n';
    code += `${this.indent}public static async Task<string> SendAsync() {\n`;
    code += `${this.indent}${this.indent}using var client = new HttpClient();\n`;
    code += `${this.indent}${this.indent}client.Timeout = TimeSpan.FromSeconds(${(curl.options.timeout || 30000) / 1000});\n\n`;
    code += `${this.indent}${this.indent}var request = new HttpRequestMessage(new HttpMethod("${method}"), "${csEscape(curl.url)}");\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      if (k.toLowerCase() === 'content-type') continue; // set on body below
      code += `${this.indent}${this.indent}request.Headers.TryAddWithoutValidation("${csEscape(k)}", "${csEscape(String(v))}");\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}var creds = Convert.ToBase64String(Encoding.UTF8.GetBytes("${csEscape(curl.auth.credentials.username)}:${csEscape(curl.auth.credentials.password)}"));\n`;
      code += `${this.indent}${this.indent}request.Headers.Authorization = new AuthenticationHeaderValue("Basic", creds);\n`;
    }
    if (curl.body) {
      const payload =
        curl.dataType === 'json' && typeof curl.body === 'object'
          ? JSON.stringify(curl.body)
          : String(curl.body);
      const mediaType =
        curl.dataType === 'json'
          ? 'application/json'
          : curl.dataType === 'form'
            ? 'application/x-www-form-urlencoded'
            : 'text/plain';
      code += `${this.indent}${this.indent}request.Content = new StringContent("${csEscape(payload)}", Encoding.UTF8, "${mediaType}");\n`;
    }
    code += `\n${this.indent}${this.indent}var response = await client.SendAsync(request);\n`;
    code += `${this.indent}${this.indent}response.EnsureSuccessStatusCode();\n`;
    code += `${this.indent}${this.indent}return await response.Content.ReadAsStringAsync();\n`;
    code += `${this.indent}}\n\n`;
    code += `${this.indent}public static async Task Main() {\n`;
    code += `${this.indent}${this.indent}var body = await SendAsync();\n`;
    code += `${this.indent}${this.indent}Console.WriteLine(body);\n`;
    code += `${this.indent}}\n`;
    code += '}\n';

    return {
      code,
      language: 'csharp',
      framework: 'httpclient',
      fileName: 'ApiRequest',
      fileExtension: 'cs',
      imports,
      envVars,
      dependencies: [],
    };
  }
}

export class CsharpRestSharpGenerator extends CodeGenerator {
  generate(curl: CurlParseResult): GeneratedCode {
    const method = curl.method.toUpperCase();
    const envVars = this.extractEnvVars(curl);
    const imports = ['using RestSharp;', 'using System.Threading.Tasks;'];

    let code = imports.join('\n') + '\n\n';
    code += 'public class ApiRequest {\n';
    code += `${this.indent}public static async Task<RestResponse> SendAsync() {\n`;
    code += `${this.indent}${this.indent}var options = new RestClientOptions("${csEscape(curl.url)}") { MaxTimeout = ${curl.options.timeout || 30000} };\n`;
    code += `${this.indent}${this.indent}var client = new RestClient(options);\n`;
    code += `${this.indent}${this.indent}var request = new RestRequest("", Method.${method.charAt(0) + method.slice(1).toLowerCase()});\n`;
    for (const [k, v] of Object.entries(curl.headers)) {
      code += `${this.indent}${this.indent}request.AddHeader("${csEscape(k)}", "${csEscape(String(v))}");\n`;
    }
    if (curl.auth?.type === 'basic') {
      code += `${this.indent}${this.indent}client.Authenticator = new RestSharp.Authenticators.HttpBasicAuthenticator("${csEscape(curl.auth.credentials.username)}", "${csEscape(curl.auth.credentials.password)}");\n`;
    }
    if (curl.body) {
      const payload =
        curl.dataType === 'json' && typeof curl.body === 'object'
          ? JSON.stringify(curl.body)
          : String(curl.body);
      code += `${this.indent}${this.indent}request.AddStringBody("${csEscape(payload)}", DataFormat.${curl.dataType === 'json' ? 'Json' : 'None'});\n`;
    }
    code += `${this.indent}${this.indent}return await client.ExecuteAsync(request);\n`;
    code += `${this.indent}}\n`;
    code += '}\n';

    return {
      code,
      language: 'csharp',
      framework: 'restsharp',
      fileName: 'ApiRequest',
      fileExtension: 'cs',
      imports,
      envVars,
      dependencies: ['RestSharp'],
    };
  }
}

// Main converter function
export function convertCurlToCode(
  curlCommand: string,
  options: CodeGenerationOptions
): ConversionResult {
  try {
    // Parse cURL command
    const parser = new CurlParser(curlCommand);
    const parsedCurl = parser.parse();

    // Validate parsed result
    if (!parsedCurl.url) {
      return {
        success: false,
        error: 'Invalid cURL command: no URL found',
      };
    }

    // Generate code based on language and framework.
    // Any combo not implemented returns an explicit error — never fall
    // back silently to a different framework (previous bug).
    const lang = SUPPORTED_LANGUAGES[options.language];
    if (!lang) {
      return {
        success: false,
        error: `Language "${options.language}" is not recognized`,
      };
    }

    if (!isImplemented(options.language, options.framework)) {
      return {
        success: false,
        error: `${lang.name} + "${options.framework}" generator is coming soon. Pick an available combination (e.g., JavaScript + fetch or Python + requests).`,
      };
    }

    let generator: CodeGenerator;

    if (
      (options.language === 'javascript' ||
        options.language === 'typescript') &&
      options.framework === 'fetch'
    ) {
      generator = new FetchGenerator(options);
    } else if (
      options.language === 'python' &&
      options.framework === 'requests'
    ) {
      generator = new PythonRequestsGenerator(options);
    } else if (options.language === 'php' && options.framework === 'guzzle') {
      generator = new PhpGuzzleGenerator(options);
    } else if (options.language === 'php' && options.framework === 'curl') {
      generator = new PhpCurlGenerator(options);
    } else if (
      options.language === 'php' &&
      options.framework === 'file_get_contents'
    ) {
      generator = new PhpFileGetContentsGenerator(options);
    } else if (options.language === 'go' && options.framework === 'net-http') {
      generator = new GoNetHttpGenerator(options);
    } else if (options.language === 'go' && options.framework === 'resty') {
      generator = new GoRestyGenerator(options);
    } else if (
      (options.language === 'javascript' ||
        options.language === 'typescript') &&
      options.framework === 'axios'
    ) {
      generator = new AxiosGenerator(options);
    } else if (
      (options.language === 'javascript' ||
        options.language === 'typescript') &&
      options.framework === 'node-https'
    ) {
      generator = new NodeHttpsGenerator(options);
    } else if (
      options.language === 'javascript' &&
      options.framework === 'jquery'
    ) {
      generator = new JQueryGenerator(options);
    } else if (options.language === 'javascript' && options.framework === 'xhr') {
      generator = new XhrGenerator(options);
    } else if (options.language === 'python' && options.framework === 'httpx') {
      generator = new PythonHttpxGenerator(options);
    } else if (
      options.language === 'python' &&
      options.framework === 'aiohttp'
    ) {
      generator = new PythonAioHttpGenerator(options);
    } else if (
      options.language === 'python' &&
      options.framework === 'urllib'
    ) {
      generator = new PythonUrllibGenerator(options);
    } else if (
      options.language === 'java' &&
      options.framework === 'httpurlconnection'
    ) {
      generator = new JavaHttpClientGenerator(options);
    } else if (
      options.language === 'java' &&
      options.framework === 'okhttp'
    ) {
      generator = new JavaOkHttpGenerator(options);
    } else if (
      options.language === 'csharp' &&
      options.framework === 'httpclient'
    ) {
      generator = new CsharpHttpClientGenerator(options);
    } else if (
      options.language === 'csharp' &&
      options.framework === 'restsharp'
    ) {
      generator = new CsharpRestSharpGenerator(options);
    } else {
      // Safety net: registry marked implemented but dispatcher missing case.
      // This indicates a bug in the isImplemented flags or a missing generator
      // class — surface explicitly instead of falling back.
      return {
        success: false,
        error: `Internal: generator missing for ${options.language} + ${options.framework}. Please report this.`,
      };
    }

    const generatedCode = generator.generate(parsedCurl);

    return {
      success: true,
      parsedCurl,
      generatedCode,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to convert cURL command',
    };
  }
}

// Batch converter for multiple cURL commands
export function batchConvert(
  curlCommands: string[],
  options: CodeGenerationOptions
): ConversionResult[] {
  return curlCommands.map((cmd) => convertCurlToCode(cmd, options));
}

// Utility to detect cURL from various formats
export function detectAndNormalizeCurl(input: string): string | null {
  const original = input;

  // Remove comments
  input = input.replace(/#.*$/gm, '');

  // Check if it's a cURL command
  if (input.toLowerCase().includes('curl')) {
    return original; // Return original input with comments
  }

  // Check if it's HAR format (more specific check)
  if (
    input.includes('"method"') &&
    input.includes('"url"') &&
    (input.includes('"log"') || input.includes('"entries"'))
  ) {
    // Convert HAR to cURL (simplified)
    try {
      const har = JSON.parse(input);
      return harToCurl(har);
    } catch {
      // Not valid HAR
    }
  }

  return null;
}

// HAR to cURL converter (simplified)
function harToCurl(har: any): string {
  const entry = har.log?.entries?.[0] || har;
  const request = entry.request;

  if (!request) return '';

  let curl = 'curl';

  // Method
  if (request.method !== 'GET') {
    curl += ` -X ${request.method}`;
  }

  // URL
  curl += ` '${request.url}'`;

  // Headers
  if (request.headers) {
    for (const header of request.headers) {
      curl += ` -H '${header.name}: ${header.value}'`;
    }
  }

  // Body
  if (request.postData?.text) {
    curl += ` -d '${request.postData.text}'`;
  }

  return curl;
}

// Validation functions (replacing zod schemas for now)
export function validateCurlCommand(command: string): {
  valid: boolean;
  error?: string;
} {
  if (!command || command.length < 4) {
    return { valid: false, error: 'cURL command is too short' };
  }

  if (!command.toLowerCase().includes('curl')) {
    return { valid: false, error: 'Input must be a valid cURL command' };
  }

  return { valid: true };
}

export function validateCodeGenerationOptions(options: CodeGenerationOptions): {
  valid: boolean;
  error?: string;
} {
  const validLanguages = [
    'javascript',
    'typescript',
    'python',
    'php',
    'go',
    'java',
    'csharp',
    'ruby',
    'rust',
    'swift',
    'kotlin',
    'shell',
  ];

  if (!validLanguages.includes(options.language)) {
    return { valid: false, error: 'Invalid language specified' };
  }

  if (!options.framework || options.framework.length === 0) {
    return { valid: false, error: 'Framework must be specified' };
  }

  return { valid: true };
}
