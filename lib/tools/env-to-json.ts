/**
 * Convert between .env (dotenv) files and JSON, both directions.
 *
 * The parser follows dotenv conventions: `KEY=value`, optional `export`
 * prefix, `#` comments, blank lines, single/double-quoted values (with escape
 * handling and preserved inner `#`), and unquoted values where a trailing
 * inline comment is stripped. All functions are pure and unit-tested.
 */

export interface EnvToJsonResult {
  success: boolean;
  result?: string;
  error?: string;
  /** Number of variables parsed. */
  count?: number;
}

const LINE_KEY = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=(.*)$/;

/** Parse a .env value, handling quotes, escapes and inline comments. */
function parseEnvValue(raw: string): string {
  let value = raw.trim();
  if (value === '') return '';

  const first = value[0];
  if (first === '"' || first === "'") {
    const end = value.indexOf(first, 1);
    if (end !== -1) {
      const inner = value.slice(1, end);
      if (first === '"') {
        // Double quotes: expand common escape sequences.
        return inner
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      return inner; // single quotes: literal
    }
  }

  // Unquoted: strip an inline comment ( value # comment ) and trim.
  const hash = value.indexOf(' #');
  if (hash !== -1) value = value.slice(0, hash);
  return value.trim();
}

/** Parse a .env document into an ordered key/value object. */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const m = line.match(LINE_KEY);
    if (!m) continue;
    out[m[1]] = parseEnvValue(m[2]);
  }
  return out;
}

/** Convert a .env document to a JSON string. */
export function envToJson(text: string, indent: number | 'tab' = 2): EnvToJsonResult {
  if (!text || !text.trim()) {
    return { success: false, error: 'Input required' };
  }
  const parsed = parseEnv(text);
  const count = Object.keys(parsed).length;
  if (count === 0) {
    return { success: false, error: 'No environment variables found' };
  }
  const space = indent === 'tab' ? '\t' : indent;
  return { success: true, result: JSON.stringify(parsed, null, space), count };
}

/** Quote a value for .env output if it needs it (spaces, #, newlines, quotes). */
export function formatEnvValue(value: string): string {
  if (value === '') return '';
  if (/[\s#"'=]|\\/.test(value) || /[\n\r\t]/.test(value)) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }
  return value;
}

/** Convert a flat JSON object to a .env document. */
export function jsonToEnv(jsonText: string): EnvToJsonResult {
  if (!jsonText || !jsonText.trim()) {
    return { success: false, error: 'Input required' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`,
    };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { success: false, error: 'JSON must be an object of key/value pairs' };
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    let str: string;
    if (value === null) str = '';
    else if (typeof value === 'object') str = JSON.stringify(value);
    else str = String(value);
    lines.push(`${key}=${formatEnvValue(str)}`);
  }
  return { success: true, result: lines.join('\n'), count: lines.length };
}
