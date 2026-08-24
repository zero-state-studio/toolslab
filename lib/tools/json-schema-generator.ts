/**
 * JSON Schema Generator — infers a JSON Schema from a JSON sample.
 *
 * The whole inference is pure and synchronous: parse the sample, walk it,
 * and describe what was found. Arrays are the interesting case — item
 * schemas are merged so that a list of similar objects yields one item
 * schema whose `required` is the intersection of the keys actually present
 * in every element, instead of a schema that only fits element zero.
 */

export type SchemaDraft = 'draft-07' | '2020-12';

/** Whether inferred object keys are listed as required. */
export type RequiredMode = 'all' | 'none';

export interface JsonSchemaOptions {
  draft: SchemaDraft;
  requiredMode: RequiredMode;
  /** Detect string formats (date-time, email, uri, uuid, ipv4, …). */
  detectFormats: boolean;
  /** Add the sampled value as `examples` on scalar schemas. */
  includeExamples: boolean;
  /** Emit `additionalProperties: false` on every object. */
  strictObjects: boolean;
  /** Optional schema title. Empty string omits it. */
  title: string;
}

export interface JsonSchemaStats {
  objectCount: number;
  propertyCount: number;
  maxDepth: number;
  detectedFormats: string[];
}

export interface JsonSchemaResult {
  success: boolean;
  /** Pretty-printed schema. */
  result?: string;
  error?: string;
  metadata?: JsonSchemaStats & { draft: SchemaDraft };
}

/** A JSON Schema node. Loose by design — schemas are open-ended. */
export type SchemaNode = Record<string, unknown>;

export const defaultJsonSchemaOptions: JsonSchemaOptions = {
  draft: 'draft-07',
  requiredMode: 'all',
  detectFormats: true,
  includeExamples: false,
  strictObjects: false,
  title: '',
};

/** Guard against pathological nesting; deeper levels become `{}`. */
const MAX_DEPTH = 40;

const DRAFT_URLS: Record<SchemaDraft, string> = {
  'draft-07': 'http://json-schema.org/draft-07/schema#',
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
};

/** Ordered so the most specific pattern wins. */
const FORMAT_PATTERNS: { format: string; test: RegExp }[] = [
  {
    format: 'uuid',
    test: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },
  {
    format: 'date-time',
    test: /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?$/,
  },
  { format: 'date', test: /^\d{4}-\d{2}-\d{2}$/ },
  { format: 'time', test: /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/ },
  {
    format: 'email',
    test: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
  },
  {
    format: 'ipv4',
    test: /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/,
  },
  { format: 'uri', test: /^[a-z][a-z0-9+.-]*:\/\/[^\s]+$/i },
];

const SIMPLE_TYPES = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'null',
]);

/**
 * Detect a JSON Schema `format` for a string value, or undefined when the
 * value looks like plain text.
 */
export function detectStringFormat(value: string): string | undefined {
  if (!value) return undefined;
  for (const { format, test } of FORMAT_PATTERNS) {
    if (test.test(value)) return format;
  }
  return undefined;
}

/** The JSON Schema primitive type name for a value. */
export function jsonTypeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number';
    default:
      return 'object';
  }
}

/** Read a node's `type` as a list, tolerating the single-string form. */
function typeList(node: SchemaNode): string[] {
  const type = node.type;
  if (typeof type === 'string') return [type];
  if (Array.isArray(type)) return type as string[];
  return [];
}

function isSimpleNode(node: SchemaNode): boolean {
  const types = typeList(node);
  return types.length > 0 && types.every((t) => SIMPLE_TYPES.has(t));
}

/**
 * Merge two inferred schemas into one that accepts both inputs.
 *
 * Objects merge property-wise with `required` narrowed to the intersection;
 * arrays merge their item schemas; simple types collapse into a type list
 * (`integer` widening to `number`); anything else falls back to `anyOf`.
 */
export function mergeSchemas(a: SchemaNode, b: SchemaNode): SchemaNode {
  if (JSON.stringify(a) === JSON.stringify(b)) return a;

  const aTypes = typeList(a);
  const bTypes = typeList(b);

  // Empty schema (`{}`) accepts anything already.
  if (aTypes.length === 0 && Object.keys(a).length === 0) return b;
  if (bTypes.length === 0 && Object.keys(b).length === 0) return a;

  if (aTypes.includes('object') && bTypes.includes('object')) {
    return mergeObjectSchemas(a, b);
  }

  if (aTypes.includes('array') && bTypes.includes('array')) {
    const merged: SchemaNode = { type: 'array' };
    const items = mergeMaybe(a.items as SchemaNode, b.items as SchemaNode);
    if (items) merged.items = items;
    return merged;
  }

  if (isSimpleNode(a) && isSimpleNode(b)) {
    return mergeSimpleSchemas(a, b, aTypes, bTypes);
  }

  return { anyOf: [a, b] };
}

function mergeMaybe(
  a: SchemaNode | undefined,
  b: SchemaNode | undefined
): SchemaNode | undefined {
  if (a && b) return mergeSchemas(a, b);
  return a ?? b;
}

function mergeObjectSchemas(a: SchemaNode, b: SchemaNode): SchemaNode {
  const aProps = (a.properties ?? {}) as Record<string, SchemaNode>;
  const bProps = (b.properties ?? {}) as Record<string, SchemaNode>;
  const properties: Record<string, SchemaNode> = {};

  for (const key of Object.keys(aProps)) {
    properties[key] = bProps[key]
      ? mergeSchemas(aProps[key], bProps[key])
      : aProps[key];
  }
  for (const key of Object.keys(bProps)) {
    if (!(key in properties)) properties[key] = bProps[key];
  }

  const merged: SchemaNode = { type: 'object', properties };

  // A key is required only if every merged sample carried it.
  const aRequired = (a.required as string[] | undefined) ?? [];
  const bRequired = (b.required as string[] | undefined) ?? [];
  const required = aRequired.filter((key) => bRequired.includes(key));
  if (required.length > 0) merged.required = required;

  if (a.additionalProperties === false && b.additionalProperties === false) {
    merged.additionalProperties = false;
  }
  return merged;
}

function mergeSimpleSchemas(
  a: SchemaNode,
  b: SchemaNode,
  aTypes: string[],
  bTypes: string[]
): SchemaNode {
  const types = Array.from(new Set([...aTypes, ...bTypes]));

  // A sample of both 3 and 3.5 is just a number.
  if (types.includes('number') && types.includes('integer')) {
    types.splice(types.indexOf('integer'), 1);
  }

  const merged: SchemaNode = {
    type: types.length === 1 ? types[0] : types,
  };

  // Keep the format only when both sides agree on it.
  if (a.format && a.format === b.format) merged.format = a.format;

  const examples = mergeExamples(a.examples, b.examples);
  if (examples) merged.examples = examples;

  return merged;
}

function mergeExamples(a: unknown, b: unknown): unknown[] | undefined {
  const list = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  if (list.length === 0) return undefined;
  const unique: unknown[] = [];
  for (const item of list) {
    if (!unique.some((seen) => JSON.stringify(seen) === JSON.stringify(item))) {
      unique.push(item);
    }
  }
  return unique.slice(0, 3);
}

interface InferContext {
  options: JsonSchemaOptions;
  stats: {
    objectCount: number;
    propertyCount: number;
    maxDepth: number;
    formats: Set<string>;
  };
}

function inferNode(
  value: unknown,
  context: InferContext,
  depth: number
): SchemaNode {
  const { options, stats } = context;
  if (depth > stats.maxDepth) stats.maxDepth = depth;
  if (depth >= MAX_DEPTH) return {};

  const type = jsonTypeOf(value);

  if (type === 'object') {
    stats.objectCount++;
    const source = value as Record<string, unknown>;
    const properties: Record<string, SchemaNode> = {};
    const keys = Object.keys(source);

    for (const key of keys) {
      stats.propertyCount++;
      properties[key] = inferNode(source[key], context, depth + 1);
    }

    const node: SchemaNode = { type: 'object', properties };
    if (options.requiredMode === 'all' && keys.length > 0) {
      node.required = keys;
    }
    if (options.strictObjects) node.additionalProperties = false;
    return node;
  }

  if (type === 'array') {
    const items = value as unknown[];
    const node: SchemaNode = { type: 'array' };
    if (items.length === 0) {
      // No sample to learn from — stay permissive.
      node.items = {};
      return node;
    }
    node.items = items
      .map((item) => inferNode(item, context, depth + 1))
      .reduce((acc, cur) => mergeSchemas(acc, cur));
    return node;
  }

  const node: SchemaNode = { type };

  if (type === 'string' && options.detectFormats) {
    const format = detectStringFormat(value as string);
    if (format) {
      node.format = format;
      stats.formats.add(format);
    }
  }

  if (options.includeExamples && type !== 'null') {
    node.examples = [value];
  }

  return node;
}

/**
 * Infer a schema node (without `$schema`/`title`) from an already-parsed
 * value. Exported for callers that have data rather than a JSON string.
 */
export function inferSchemaFromValue(
  value: unknown,
  options: Partial<JsonSchemaOptions> = {}
): { schema: SchemaNode; stats: JsonSchemaStats } {
  const resolved = { ...defaultJsonSchemaOptions, ...options };
  const context: InferContext = {
    options: resolved,
    stats: {
      objectCount: 0,
      propertyCount: 0,
      maxDepth: 0,
      formats: new Set<string>(),
    },
  };
  const schema = inferNode(value, context, 0);
  return {
    schema,
    stats: {
      objectCount: context.stats.objectCount,
      propertyCount: context.stats.propertyCount,
      maxDepth: context.stats.maxDepth,
      detectedFormats: Array.from(context.stats.formats).sort(),
    },
  };
}

/**
 * Build a complete schema document (`$schema`, optional title, inferred
 * body) from an already-parsed value. `$schema` comes first and the title
 * second — the conventional reading order for a schema file.
 */
export function buildSchemaDocument(
  value: unknown,
  options: Partial<JsonSchemaOptions> = {}
): { document: SchemaNode; stats: JsonSchemaStats } {
  const resolved = { ...defaultJsonSchemaOptions, ...options };
  const { schema, stats } = inferSchemaFromValue(value, resolved);
  const document: SchemaNode = { $schema: DRAFT_URLS[resolved.draft] };
  if (resolved.title.trim()) document.title = resolved.title.trim();
  Object.assign(document, schema);
  return { document, stats };
}

/**
 * Generate a JSON Schema document from a JSON sample string.
 */
export function generateJsonSchema(
  input: string,
  options: Partial<JsonSchemaOptions> = {}
): JsonSchemaResult {
  const resolved = { ...defaultJsonSchemaOptions, ...options };

  if (!input || !input.trim()) {
    return {
      success: false,
      error: 'Paste a JSON sample to generate a schema',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${
        error instanceof Error ? error.message : 'could not parse input'
      }`,
    };
  }

  try {
    const { document, stats } = buildSchemaDocument(parsed, resolved);

    return {
      success: true,
      result: JSON.stringify(document, null, 2),
      metadata: { ...stats, draft: resolved.draft },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to generate schema: ${error.message}`
          : 'Failed to generate schema',
    };
  }
}
