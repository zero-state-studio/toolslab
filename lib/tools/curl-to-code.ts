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
      { id: 'axios', implemented: false },
      { id: 'node-https', implemented: false },
      { id: 'jquery', implemented: false },
      { id: 'xhr', implemented: false },
    ],
    fileExtension: 'js',
  },
  typescript: {
    name: 'TypeScript',
    frameworks: [
      { id: 'fetch', implemented: true },
      { id: 'axios', implemented: false },
      { id: 'node-https', implemented: false },
    ],
    fileExtension: 'ts',
  },
  python: {
    name: 'Python',
    frameworks: [
      { id: 'requests', implemented: true },
      { id: 'urllib', implemented: false },
      { id: 'httpx', implemented: false },
      { id: 'aiohttp', implemented: false },
    ],
    fileExtension: 'py',
  },
  php: {
    name: 'PHP',
    frameworks: [
      { id: 'curl', implemented: false },
      { id: 'guzzle', implemented: false },
      { id: 'file_get_contents', implemented: false },
    ],
    fileExtension: 'php',
  },
  go: {
    name: 'Go',
    frameworks: [
      { id: 'net-http', implemented: false },
      { id: 'resty', implemented: false },
    ],
    fileExtension: 'go',
  },
  java: {
    name: 'Java',
    frameworks: [
      { id: 'httpurlconnection', implemented: false },
      { id: 'apache-httpclient', implemented: false },
      { id: 'okhttp', implemented: false },
      { id: 'spring', implemented: false },
    ],
    fileExtension: 'java',
  },
  csharp: {
    name: 'C#',
    frameworks: [
      { id: 'httpclient', implemented: false },
      { id: 'restsharp', implemented: false },
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
