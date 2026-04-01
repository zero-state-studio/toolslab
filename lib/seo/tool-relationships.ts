/**
 * Tool Relationships Map
 *
 * Defines semantic relationships between tools for intelligent internal linking.
 * Each tool specifies:
 * - workflow: Tools used in same workflow/process
 * - complementary: Tools that work well together
 * - alternatives: Similar tools for different formats
 * - boostVisibility: Flag for under-linked tools that need more visibility
 */

export interface ToolRelationship {
  workflow?: string[]; // Tools in same workflow
  complementary?: string[]; // Tools that complement this one
  alternatives?: string[]; // Similar tools for different formats
  boostVisibility?: boolean; // Needs extra visibility
}

export type ToolRelationships = Record<string, ToolRelationship>;

export const toolRelationships: ToolRelationships = {
  // ==================== JSON/DATA TOOLS ====================
  'json-formatter': {
    workflow: ['json-validator', 'json-to-typescript', 'json-to-csv'],
    complementary: [
      'yaml-json-converter',
      'xml-formatter',
      'eml-to-html',
      'unix-timestamp-converter',
      'base64-to-pdf',
    ],
    alternatives: ['sql-formatter'],
  },

  'json-validator': {
    workflow: ['json-formatter', 'json-to-typescript'],
    complementary: [
      'yaml-json-converter',
      'csv-to-json',
      'unix-timestamp-converter',
      'base64-to-pdf',
    ],
    alternatives: ['xml-formatter'],
  },

  'json-to-csv': {
    workflow: ['json-formatter', 'csv-to-json', 'unix-timestamp-converter'],
    complementary: ['json-to-typescript', 'json-validator'],
    alternatives: ['sql-formatter'],
  },

  'csv-to-json': {
    workflow: ['json-to-csv', 'json-formatter', 'unix-timestamp-converter'],
    complementary: ['json-validator', 'json-to-typescript', 'base64-to-pdf'],
    alternatives: ['sql-formatter'],
  },

  'json-to-typescript': {
    workflow: ['json-formatter', 'json-validator'],
    complementary: [
      'csv-to-json',
      'yaml-json-converter',
      'eml-to-html',
      'curl-to-code',
    ],
    alternatives: [],
  },

  'yaml-json-converter': {
    workflow: ['json-formatter', 'json-validator', 'eml-to-html'],
    complementary: ['xml-formatter', 'json-to-typescript'],
    alternatives: ['sql-formatter'],
  },

  // ==================== FORMATTERS ====================
  'sql-formatter': {
    workflow: ['json-formatter', 'xml-formatter'],
    complementary: ['csv-to-json', 'json-to-csv', 'eml-to-html'],
    alternatives: ['yaml-json-converter'],
  },

  'xml-formatter': {
    workflow: ['json-formatter', 'sql-formatter'],
    complementary: ['yaml-json-converter', 'html-encoder', 'eml-to-html'],
    alternatives: ['json-validator'],
  },

  'css-minifier': {
    workflow: ['js-minifier', 'html-encoder', 'image-optimizer'],
    complementary: ['color-picker', 'gradient-generator', 'eml-to-html'],
    alternatives: ['xml-formatter'],
  },

  'js-minifier': {
    workflow: ['css-minifier', 'html-encoder'],
    complementary: ['json-formatter', 'curl-to-code', 'crontab-builder'],
    alternatives: ['sql-formatter'],
  },

  // ==================== ENCODING/SECURITY ====================
  'base64-encode': {
    workflow: ['base64-to-pdf', 'url-encode', 'eml-to-html'],
    complementary: [
      'hash-generator',
      'jwt-decoder',
      'unix-timestamp-converter',
    ],
    alternatives: [],
  },

  'base64-to-pdf': {
    workflow: ['base64-encode', 'eml-to-html'],
    complementary: ['image-optimizer', 'qr-generator', 'csv-to-json'],
    alternatives: ['url-encode'],
    boostVisibility: true, // Under-linked tool
  },

  'url-encode': {
    workflow: ['base64-encode', 'hash-generator'],
    complementary: ['curl-to-code', 'crontab-builder'],
    alternatives: ['jwt-decoder'],
  },

  'hash-generator': {
    workflow: ['password-generator', 'url-encode'],
    complementary: ['jwt-decoder', 'base64-encode', 'unix-timestamp-converter'],
    alternatives: ['uuid-generator'],
  },

  'jwt-decoder': {
    workflow: ['hash-generator', 'base64-encode', 'curl-to-code'],
    complementary: ['json-formatter', 'unix-timestamp-converter'],
    alternatives: ['url-encode'],
  },

  'password-generator': {
    workflow: ['hash-generator', 'uuid-generator'],
    complementary: [
      'jwt-decoder',
      'base64-encode',
      'unix-timestamp-converter',
      'crontab-builder',
    ],
    alternatives: ['qr-generator'],
  },

  'uuid-generator': {
    workflow: ['password-generator', 'hash-generator'],
    complementary: ['json-formatter', 'api-tester', 'crontab-builder'],
    alternatives: ['qr-generator'],
  },

  // ==================== TEXT/COMPARISON ====================
  'text-diff': {
    workflow: ['list-compare', 'regex-tester'],
    complementary: ['json-formatter', 'markdown-preview', 'eml-to-html'],
    alternatives: ['xml-formatter'],
  },

  'list-compare': {
    workflow: ['text-diff', 'regex-tester'],
    complementary: ['csv-to-json', 'json-to-csv'],
    alternatives: ['sql-formatter'],
    boostVisibility: true,
  },

  'regex-tester': {
    workflow: ['text-diff', 'list-compare'],
    complementary: [
      'url-encode',
      'hash-generator',
      'crontab-builder',
      'curl-to-code',
    ],
    alternatives: ['json-validator'],
  },

  'markdown-preview': {
    workflow: ['text-diff', 'html-encoder', 'eml-to-html'],
    complementary: ['xml-formatter'],
    alternatives: ['json-formatter'],
  },

  // ==================== UTILITIES/TIME ====================
  'unix-timestamp-converter': {
    workflow: ['crontab-builder', 'jwt-decoder', 'api-tester'],
    complementary: ['json-formatter'],
    alternatives: ['hash-generator'],
    boostVisibility: true, // Orphan tool
  },

  'crontab-builder': {
    workflow: ['unix-timestamp-converter', 'regex-tester', 'curl-to-code'],
    complementary: ['api-tester'],
    alternatives: ['json-formatter'],
    boostVisibility: true,
  },

  // ==================== WEB/DESIGN ====================
  'color-picker': {
    workflow: ['gradient-generator', 'css-minifier', 'image-optimizer'],
    complementary: ['favicon-generator', 'qr-generator'],
    alternatives: [],
  },

  'gradient-generator': {
    workflow: ['color-picker', 'css-minifier'],
    complementary: ['favicon-generator', 'image-optimizer'],
    alternatives: ['qr-generator'],
    boostVisibility: true,
  },

  'barcode-generator': {
    workflow: ['qr-generator', 'image-optimizer'],
    complementary: ['color-picker', 'favicon-generator'],
    alternatives: ['qr-generator'],
    boostVisibility: true,
  },

  'qr-generator': {
    workflow: ['uuid-generator', 'url-encode', 'barcode-generator'],
    complementary: ['favicon-generator', 'image-optimizer', 'barcode-generator'],
    alternatives: ['barcode-generator'],
  },

  'favicon-generator': {
    workflow: ['qr-generator', 'image-optimizer'],
    complementary: ['color-picker', 'gradient-generator'],
    alternatives: ['base64-to-pdf'],
    boostVisibility: true, // Orphan tool
  },

  'image-optimizer': {
    workflow: ['favicon-generator', 'qr-generator'],
    complementary: ['base64-to-pdf', 'gradient-generator'],
    alternatives: ['color-picker'],
    boostVisibility: true,
  },

  // ==================== DEVELOPMENT ====================
  'curl-to-code': {
    workflow: ['api-tester', 'jwt-decoder'],
    complementary: ['json-formatter', 'url-encode', 'crontab-builder'],
    alternatives: ['hash-generator'],
    boostVisibility: true, // Orphan tool - only 1 link
  },

  'api-tester': {
    workflow: ['curl-to-code', 'jwt-decoder', 'unix-timestamp-converter'],
    complementary: ['json-formatter', 'json-validator', 'crontab-builder'],
    alternatives: ['url-encode'],
  },

  // ==================== EMAIL/HTML ====================
  'eml-to-html': {
    workflow: ['base64-to-pdf', 'html-encoder'],
    complementary: ['text-diff', 'markdown-preview'],
    alternatives: ['xml-formatter'],
    boostVisibility: true, // Orphan tool - needs major boost
  },

  'html-encoder': {
    workflow: ['eml-to-html', 'xml-formatter', 'markdown-preview'],
    complementary: ['url-encode', 'eml-to-html'],
    alternatives: ['base64-encode'],
  },

  // ==================== SOCIAL MEDIA ====================
  'instagram-font-generator': {
    workflow: ['qr-generator', 'url-encode'],
    complementary: ['text-diff', 'regex-tester', 'markdown-preview'],
    alternatives: ['base64-encode', 'hash-generator'],
  },
};

/**
 * Get all tools that need visibility boost
 */
export function getBoostTools(): string[] {
  return Object.entries(toolRelationships)
    .filter(([_, rel]) => rel.boostVisibility === true)
    .map(([id]) => id);
}

/**
 * Get all related tools for a given tool ID
 */
export function getAllRelatedTools(toolId: string): string[] {
  const relationship = toolRelationships[toolId];
  if (!relationship) return [];

  const related = new Set<string>();

  if (relationship.workflow) {
    relationship.workflow.forEach((id) => related.add(id));
  }
  if (relationship.complementary) {
    relationship.complementary.forEach((id) => related.add(id));
  }
  if (relationship.alternatives) {
    relationship.alternatives.forEach((id) => related.add(id));
  }

  return Array.from(related);
}

/**
 * Check if a tool needs visibility boost
 */
export function needsBoost(toolId: string): boolean {
  return toolRelationships[toolId]?.boostVisibility === true;
}
