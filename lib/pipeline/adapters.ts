/**
 * Pipeline adapters — first wave (12 tool families, text-based).
 *
 * Each adapter is a thin wrapper around the pure functions in lib/tools/*.
 * Tool logic is NEVER duplicated here. Heavy tool modules are loaded lazily
 * inside run() so the /pipeline route stays light until a step executes.
 */

import type {
  PipelineAdapter,
  AdapterRunResult,
} from './types';

const ok = (output: string): AdapterRunResult => ({ ok: true, output });
const fail = (error: string): AdapterRunResult => ({ ok: false, error });

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

const adapters: PipelineAdapter[] = [
  // ── Base64 ────────────────────────────────────────────────────────────────
  {
    id: 'base64-encode',
    toolId: 'base64-encode',
    label: 'Base64 Encode',
    description: 'Encode text to Base64',
    accepts: 'any',
    produces: 'text',
    options: [
      { key: 'urlSafe', label: 'URL-safe variant', type: 'boolean', default: false },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/base64');
      try {
        return ok(
          options.urlSafe ? m.encodeBase64URLSafe(input) : m.encodeBase64(input)
        );
      } catch (e) {
        return fail(errMessage(e, 'Base64 encoding failed'));
      }
    },
  },
  {
    id: 'base64-decode',
    toolId: 'base64-encode',
    label: 'Base64 Decode',
    description: 'Decode Base64 to text',
    accepts: 'any',
    produces: 'text',
    options: [
      { key: 'urlSafe', label: 'URL-safe variant', type: 'boolean', default: false },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/base64');
      try {
        return ok(
          options.urlSafe
            ? m.decodeBase64URLSafe(input.trim())
            : m.decodeBase64(input.trim())
        );
      } catch (e) {
        return fail(errMessage(e, 'Invalid Base64 input'));
      }
    },
  },

  // ── JSON ──────────────────────────────────────────────────────────────────
  {
    id: 'json-format',
    toolId: 'json-formatter',
    label: 'JSON Format',
    description: 'Format and validate JSON',
    accepts: ['json', 'text'],
    produces: 'json',
    async run(input) {
      const m = await import('@/lib/tools/json');
      const res = m.formatJSON(input);
      return res.success && res.result !== undefined
        ? ok(res.result)
        : fail(res.error || 'Invalid JSON');
    },
  },
  {
    id: 'json-minify',
    toolId: 'json-formatter',
    label: 'JSON Minify',
    description: 'Minify JSON to a single line',
    accepts: ['json'],
    produces: 'json',
    async run(input) {
      const m = await import('@/lib/tools/json');
      const res = m.minifyJSON(input);
      return res.success && res.result !== undefined
        ? ok(res.result)
        : fail(res.error || 'Invalid JSON');
    },
  },

  // ── CSV ───────────────────────────────────────────────────────────────────
  {
    id: 'csv-to-json',
    toolId: 'csv-to-json',
    label: 'CSV → JSON',
    description: 'Convert CSV rows to a JSON array',
    accepts: ['csv', 'text'],
    produces: 'json',
    options: [
      {
        key: 'delimiter',
        label: 'Delimiter',
        type: 'select',
        choices: [
          { value: ',', label: 'Comma (,)' },
          { value: ';', label: 'Semicolon (;)' },
          { value: '\t', label: 'Tab' },
          { value: '|', label: 'Pipe (|)' },
        ],
        default: ',',
      },
      { key: 'hasHeaders', label: 'First row is header', type: 'boolean', default: true },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/csv-to-json');
      const res = m.parseCsvToJson(input, {
        delimiter: (options.delimiter as string) || ',',
        hasHeaders: options.hasHeaders !== false,
        detectTypes: true,
      });
      return res.success
        ? ok(JSON.stringify(res.data, null, 2))
        : fail(res.error || 'CSV parsing failed');
    },
  },
  {
    id: 'json-to-csv',
    toolId: 'json-to-csv',
    label: 'JSON → CSV',
    description: 'Convert a JSON array to CSV',
    accepts: ['json'],
    produces: 'csv',
    options: [
      {
        key: 'delimiter',
        label: 'Delimiter',
        type: 'select',
        choices: [
          { value: ',', label: 'Comma (,)' },
          { value: ';', label: 'Semicolon (;)' },
          { value: '\t', label: 'Tab' },
        ],
        default: ',',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/json-to-csv');
      const res = m.convertJsonToCsv(input, {
        delimiter: (options.delimiter as string) || ',',
      });
      return res.success && res.csv !== undefined
        ? ok(res.csv)
        : fail(res.error || 'JSON → CSV conversion failed');
    },
  },

  // ── Hash ──────────────────────────────────────────────────────────────────
  {
    id: 'hash-generate',
    toolId: 'hash-generator',
    label: 'Hash',
    description: 'Hash the input (MD5/SHA)',
    accepts: 'any',
    produces: 'text',
    options: [
      {
        key: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        choices: [
          { value: 'SHA-256', label: 'SHA-256' },
          { value: 'SHA-512', label: 'SHA-512' },
          { value: 'SHA-1', label: 'SHA-1' },
          { value: 'MD5', label: 'MD5' },
        ],
        default: 'SHA-256',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/hash-generator');
      const algorithm = ((options.algorithm as string) || 'SHA-256') as Parameters<
        typeof m.generateHash
      >[1];
      const res = await m.generateHash(input, algorithm);
      return res.success && res.hash
        ? ok(res.hash)
        : fail(res.error || 'Hashing failed');
    },
  },

  // ── URL ───────────────────────────────────────────────────────────────────
  {
    id: 'url-encode',
    toolId: 'url-encode',
    label: 'URL Encode',
    description: 'Percent-encode the input',
    accepts: 'any',
    produces: 'text',
    options: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        choices: [
          { value: 'component', label: 'Component' },
          { value: 'full', label: 'Full URL' },
        ],
        default: 'component',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/url-encode');
      try {
        return ok(
          options.mode === 'full'
            ? m.encodeFullUrl(input)
            : m.encodeUrlComponent(input)
        );
      } catch (e) {
        return fail(errMessage(e, 'URL encoding failed'));
      }
    },
  },
  {
    id: 'url-decode',
    toolId: 'url-encode',
    label: 'URL Decode',
    description: 'Decode percent-encoded input',
    accepts: 'any',
    produces: 'text',
    options: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        choices: [
          { value: 'component', label: 'Component' },
          { value: 'full', label: 'Full URL' },
        ],
        default: 'component',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/url-encode');
      try {
        return ok(
          options.mode === 'full'
            ? m.decodeFullUrl(input)
            : m.decodeUrlComponent(input, false)
        );
      } catch (e) {
        return fail(errMessage(e, 'URL decoding failed'));
      }
    },
  },

  // ── JWT ───────────────────────────────────────────────────────────────────
  {
    id: 'jwt-decode',
    toolId: 'jwt-decoder',
    label: 'JWT Decode',
    description: 'Decode a JWT to header + payload JSON',
    accepts: 'any',
    produces: 'json',
    async run(input) {
      const m = await import('@/lib/tools/jwt-decoder');
      const res = m.decodeJwt(input.trim(), {
        analyzeTime: false,
        provideSuggestions: false,
      });
      if (!res.success) return fail(res.error || 'Invalid JWT');
      return ok(
        JSON.stringify({ header: res.header, payload: res.payload }, null, 2)
      );
    },
  },

  // ── YAML ──────────────────────────────────────────────────────────────────
  {
    id: 'yaml-to-json',
    toolId: 'yaml-json-converter',
    label: 'YAML → JSON',
    description: 'Convert YAML to JSON',
    accepts: ['yaml', 'text'],
    produces: 'json',
    async run(input) {
      const m = await import('@/lib/tools/yaml-json');
      const res = m.yamlToJson(input);
      return res.success && res.output !== undefined
        ? ok(res.output)
        : fail(res.error || 'YAML → JSON conversion failed');
    },
  },
  {
    id: 'json-to-yaml',
    toolId: 'yaml-json-converter',
    label: 'JSON → YAML',
    description: 'Convert JSON to YAML',
    accepts: ['json'],
    produces: 'yaml',
    async run(input) {
      const m = await import('@/lib/tools/yaml-json');
      const res = m.jsonToYaml(input);
      return res.success && res.output !== undefined
        ? ok(res.output)
        : fail(res.error || 'JSON → YAML conversion failed');
    },
  },

  // ── XML ───────────────────────────────────────────────────────────────────
  {
    id: 'xml-to-json',
    toolId: 'xml-to-json-converter',
    label: 'XML → JSON',
    description: 'Convert XML to JSON',
    accepts: ['xml', 'text'],
    produces: 'json',
    async run(input) {
      const m = await import('@/lib/tools/xml-to-json');
      const res = m.xmlToJson(input);
      return res.success && res.result !== undefined
        ? ok(res.result)
        : fail(res.error || 'XML → JSON conversion failed');
    },
  },

  // ── SQL ───────────────────────────────────────────────────────────────────
  {
    id: 'sql-format',
    toolId: 'sql-formatter',
    label: 'SQL Format',
    description: 'Format a SQL query',
    accepts: ['sql'],
    produces: 'sql',
    options: [
      {
        key: 'keywordCase',
        label: 'Keywords',
        type: 'select',
        choices: [
          { value: 'uppercase', label: 'UPPERCASE' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'unchanged', label: 'Unchanged' },
        ],
        default: 'uppercase',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/sql-formatter');
      const res = m.formatSQL(input, {
        dialect: 'postgresql',
        indentSize: 2,
        keywordCase: ((options.keywordCase as string) ||
          'uppercase') as import('@/lib/tools/sql-formatter').KeywordCase,
        linesBetweenQueries: 1,
        maxLineLength: 80,
        preserveComments: true,
      });
      return res.success && res.formatted !== undefined
        ? ok(res.formatted)
        : fail(res.error || 'SQL formatting failed');
    },
  },

  // ── Text utilities ────────────────────────────────────────────────────────
  {
    id: 'case-convert',
    toolId: 'string-case-converter',
    label: 'Case Convert',
    description: 'Convert text between naming conventions',
    accepts: 'any',
    produces: 'text',
    options: [
      {
        key: 'caseType',
        label: 'Case',
        type: 'select',
        choices: [
          { value: 'camelCase', label: 'camelCase' },
          { value: 'PascalCase', label: 'PascalCase' },
          { value: 'snake_case', label: 'snake_case' },
          { value: 'kebab-case', label: 'kebab-case' },
          { value: 'CONSTANT_CASE', label: 'CONSTANT_CASE' },
          { value: 'Title Case', label: 'Title Case' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'UPPERCASE', label: 'UPPERCASE' },
        ],
        default: 'camelCase',
      },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/string-case-converter');
      try {
        const caseType = ((options.caseType as string) ||
          'camelCase') as import('@/lib/tools/string-case-converter').CaseType;
        return ok(m.convertToCase(m.splitIntoWords(input), caseType));
      } catch (e) {
        return fail(errMessage(e, 'Case conversion failed'));
      }
    },
  },
  {
    id: 'list-transform',
    toolId: 'list-compare',
    label: 'List Transform',
    description: 'Trim, dedupe and sort a list (one item per line)',
    accepts: 'any',
    produces: 'text',
    options: [
      { key: 'removeDuplicates', label: 'Remove duplicates', type: 'boolean', default: true },
      {
        key: 'sort',
        label: 'Sort',
        type: 'select',
        choices: [
          { value: 'none', label: 'No sorting' },
          { value: 'alphabetical', label: 'Alphabetical' },
          { value: 'numerical', label: 'Numerical' },
          { value: 'length', label: 'By length' },
        ],
        default: 'none',
      },
      { key: 'trim', label: 'Trim whitespace', type: 'boolean', default: true },
    ],
    async run(input, options) {
      const m = await import('@/lib/tools/list-compare');
      const parsed = m.parseList(input);
      if (!parsed.success || !parsed.items) {
        return fail(parsed.error || 'List parsing failed');
      }
      const sort = options.sort as string;
      const items = m.transformList(parsed.items, {
        trim: options.trim !== false,
        removeDuplicates: options.removeDuplicates !== false,
        ...(sort && sort !== 'none'
          ? { sort: sort as 'alphabetical' | 'numerical' | 'length' }
          : {}),
      });
      return ok(items.join('\n'));
    },
  },
];

const byId = new Map(adapters.map((a) => [a.id, a]));

export function listAdapters(): PipelineAdapter[] {
  return adapters;
}

export function getAdapter(id: string): PipelineAdapter | undefined {
  return byId.get(id);
}

/** Tool registry ids that have at least one adapter (for tool-page CTAs) */
export function adapterToolIds(): Set<string> {
  return new Set(adapters.map((a) => a.toolId));
}
