/**
 * Registry tool ids that have at least one pipeline adapter.
 *
 * Kept in a tiny standalone module because ToolPageClient (in every tool
 * page's first load) needs only this set — importing adapters.ts there would
 * drag all adapter metadata into every tool page bundle.
 *
 * Keep in sync with lib/pipeline/adapters.ts (enforced by a unit test).
 */
export const ADAPTER_TOOL_IDS = new Set([
  'base64-encode',
  'json-formatter',
  'csv-to-json',
  'json-to-csv',
  'hash-generator',
  'url-encode',
  'jwt-decoder',
  'yaml-json-converter',
  'xml-to-json-converter',
  'sql-formatter',
  'string-case-converter',
  'list-compare',
]);
