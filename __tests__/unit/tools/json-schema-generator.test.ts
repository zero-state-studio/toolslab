import { convertJsonToTypeScript } from '@/lib/tools/json-to-typescript';
import {
  generateJsonSchema,
  buildSchemaDocument,
  inferSchemaFromValue,
  mergeSchemas,
  detectStringFormat,
  jsonTypeOf,
  defaultJsonSchemaOptions,
} from '@/lib/tools/json-schema-generator';

/** Parse a generator result back into an object for assertions. */
function schemaOf(input: string, options = {}) {
  const result = generateJsonSchema(input, options);
  expect(result.success).toBe(true);
  return JSON.parse(result.result!);
}

describe('jsonTypeOf', () => {
  it('distinguishes integer from number', () => {
    expect(jsonTypeOf(42)).toBe('integer');
    expect(jsonTypeOf(-7)).toBe('integer');
    expect(jsonTypeOf(3.14)).toBe('number');
  });

  it('reports null, arrays and objects', () => {
    expect(jsonTypeOf(null)).toBe('null');
    expect(jsonTypeOf([])).toBe('array');
    expect(jsonTypeOf({})).toBe('object');
  });

  it('reports strings and booleans', () => {
    expect(jsonTypeOf('x')).toBe('string');
    expect(jsonTypeOf(false)).toBe('boolean');
  });
});

describe('detectStringFormat', () => {
  it('detects date-time with and without timezone', () => {
    expect(detectStringFormat('2026-08-14T09:30:00Z')).toBe('date-time');
    expect(detectStringFormat('2026-08-14T09:30:00.123+02:00')).toBe(
      'date-time'
    );
  });

  it('detects date and time', () => {
    expect(detectStringFormat('2026-08-14')).toBe('date');
    expect(detectStringFormat('09:30:00')).toBe('time');
  });

  it('detects uuid before date-time', () => {
    expect(detectStringFormat('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(
      'uuid'
    );
  });

  it('detects email, uri and ipv4', () => {
    expect(detectStringFormat('dev@toolslab.dev')).toBe('email');
    expect(detectStringFormat('https://toolslab.dev/tools')).toBe('uri');
    expect(detectStringFormat('192.168.1.10')).toBe('ipv4');
  });

  it('rejects near-misses', () => {
    expect(detectStringFormat('not an email@')).toBeUndefined();
    expect(detectStringFormat('999.1.1.1')).toBeUndefined();
    expect(detectStringFormat('')).toBeUndefined();
    expect(detectStringFormat('just text')).toBeUndefined();
  });
});

describe('mergeSchemas', () => {
  it('returns the same schema when both sides are identical', () => {
    const node = { type: 'string' };
    expect(mergeSchemas(node, { type: 'string' })).toEqual({ type: 'string' });
  });

  it('collapses a nullable scalar into a type list', () => {
    expect(mergeSchemas({ type: 'string' }, { type: 'null' })).toEqual({
      type: ['string', 'null'],
    });
  });

  it('widens integer to number', () => {
    expect(mergeSchemas({ type: 'integer' }, { type: 'number' })).toEqual({
      type: 'number',
    });
  });

  it('keeps a format only when both sides agree', () => {
    expect(
      mergeSchemas(
        { type: 'string', format: 'email' },
        { type: 'string', format: 'email' }
      )
    ).toEqual({ type: 'string', format: 'email' });

    expect(
      mergeSchemas(
        { type: 'string', format: 'email' },
        { type: 'string', format: 'uri' }
      )
    ).toEqual({ type: 'string' });
  });

  it('narrows object required to the intersection', () => {
    const a = {
      type: 'object',
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['id', 'name'],
    };
    const b = {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    };

    expect(mergeSchemas(a, b)).toEqual({
      type: 'object',
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['id'],
    });
  });

  it('drops required entirely when nothing is shared', () => {
    const merged = mergeSchemas(
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
      },
      { type: 'object', properties: { b: { type: 'string' } }, required: ['b'] }
    );

    expect(merged.required).toBeUndefined();
    expect(Object.keys(merged.properties as object)).toEqual(['a', 'b']);
  });

  it('merges array item schemas', () => {
    expect(
      mergeSchemas(
        { type: 'array', items: { type: 'integer' } },
        { type: 'array', items: { type: 'string' } }
      )
    ).toEqual({ type: 'array', items: { type: ['integer', 'string'] } });
  });

  it('keeps additionalProperties: false only when both sides have it', () => {
    const strict = {
      type: 'object',
      properties: {},
      additionalProperties: false,
    };
    expect(mergeSchemas(strict, strict).additionalProperties).toBe(false);
    expect(
      mergeSchemas(strict, { type: 'object', properties: {} })
        .additionalProperties
    ).toBeUndefined();
  });

  it('falls back to anyOf for incompatible shapes', () => {
    const merged = mergeSchemas(
      { type: 'object', properties: {} },
      { type: 'array', items: {} }
    );
    expect(merged.anyOf).toHaveLength(2);
  });

  it('treats an empty schema as accepting anything', () => {
    expect(mergeSchemas({}, { type: 'string' })).toEqual({ type: 'string' });
    expect(mergeSchemas({ type: 'string' }, {})).toEqual({ type: 'string' });
  });
});

describe('generateJsonSchema', () => {
  it('generates a draft-07 schema for a flat object', () => {
    const schema = schemaOf('{"id":1,"name":"Ada","active":true}');

    expect(schema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['id', 'name', 'active'],
    });
  });

  it('switches the $schema URL for draft 2020-12', () => {
    const schema = schemaOf('{"a":1}', { draft: '2020-12' });
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  });

  it('omits required when requiredMode is none', () => {
    const schema = schemaOf('{"a":1,"b":2}', { requiredMode: 'none' });
    expect(schema.required).toBeUndefined();
    expect(Object.keys(schema.properties)).toEqual(['a', 'b']);
  });

  it('describes nested objects recursively', () => {
    const schema = schemaOf('{"user":{"address":{"city":"Turin"}}}');

    expect(schema.properties.user.properties.address).toEqual({
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    });
  });

  it('merges heterogeneous array items into one item schema', () => {
    const schema = schemaOf(
      '[{"id":1,"name":"a"},{"id":2},{"id":3,"name":"c","extra":true}]'
    );

    expect(schema.type).toBe('array');
    expect(schema.items.required).toEqual(['id']);
    expect(Object.keys(schema.items.properties)).toEqual([
      'id',
      'name',
      'extra',
    ]);
  });

  it('leaves items permissive for an empty array', () => {
    const schema = schemaOf('{"tags":[]}');
    expect(schema.properties.tags).toEqual({ type: 'array', items: {} });
  });

  it('detects string formats when enabled', () => {
    const schema = schemaOf(
      '{"email":"dev@toolslab.dev","created":"2026-08-14T09:30:00Z"}'
    );

    expect(schema.properties.email).toEqual({
      type: 'string',
      format: 'email',
    });
    expect(schema.properties.created.format).toBe('date-time');
  });

  it('skips format detection when disabled', () => {
    const schema = schemaOf('{"email":"dev@toolslab.dev"}', {
      detectFormats: false,
    });
    expect(schema.properties.email).toEqual({ type: 'string' });
  });

  it('adds examples only when requested', () => {
    expect(schemaOf('{"a":"x"}').properties.a.examples).toBeUndefined();
    expect(
      schemaOf('{"a":"x"}', { includeExamples: true }).properties.a.examples
    ).toEqual(['x']);
  });

  it('never puts examples on a null value', () => {
    const schema = schemaOf('{"a":null}', { includeExamples: true });
    expect(schema.properties.a).toEqual({ type: 'null' });
  });

  it('emits additionalProperties: false in strict mode', () => {
    const schema = schemaOf('{"a":{"b":1}}', { strictObjects: true });
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.a.additionalProperties).toBe(false);
  });

  it('includes a trimmed title when provided', () => {
    expect(schemaOf('{"a":1}', { title: '  User  ' }).title).toBe('User');
    expect(schemaOf('{"a":1}', { title: '   ' }).title).toBeUndefined();
  });

  it('handles a scalar root', () => {
    expect(schemaOf('"hello"').type).toBe('string');
    expect(schemaOf('42').type).toBe('integer');
    expect(schemaOf('null').type).toBe('null');
  });

  it('reports stats about the sample', () => {
    const result = generateJsonSchema(
      '{"user":{"email":"a@b.co","tags":["x"]}}'
    );

    expect(result.metadata).toEqual({
      objectCount: 2,
      propertyCount: 3,
      maxDepth: 3,
      detectedFormats: ['email'],
      draft: 'draft-07',
    });
  });

  it('rejects empty and whitespace-only input', () => {
    expect(generateJsonSchema('')).toEqual({
      success: false,
      error: 'Paste a JSON sample to generate a schema',
    });
    expect(generateJsonSchema('   \n ').success).toBe(false);
  });

  it('reports malformed JSON with the parser message', () => {
    const result = generateJsonSchema('{"a":}');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/^Invalid JSON: /);
    expect(result.result).toBeUndefined();
  });

  it('preserves unicode keys and values', () => {
    const schema = schemaOf('{"città":"Torino","emoji":"🧪"}');
    expect(Object.keys(schema.properties)).toEqual(['città', 'emoji']);
    expect(schema.required).toEqual(['città', 'emoji']);
  });

  it('handles a large array without losing the merged shape', () => {
    const items = Array.from({ length: 2000 }, (_, i) =>
      i % 2 === 0 ? { id: i, flag: true } : { id: i }
    );
    const schema = schemaOf(JSON.stringify(items));

    expect(schema.items.required).toEqual(['id']);
    expect(schema.items.properties.flag).toEqual({ type: 'boolean' });
  });

  it('produces valid JSON output', () => {
    const result = generateJsonSchema('{"a":[1,2.5,null]}');
    expect(() => JSON.parse(result.result!)).not.toThrow();
    expect(JSON.parse(result.result!).properties.a.items).toEqual({
      type: ['number', 'null'],
    });
  });
});

describe('buildSchemaDocument', () => {
  it('puts $schema and title before the inferred body', () => {
    const { document } = buildSchemaDocument({ a: 1 }, { title: 'User' });

    expect(Object.keys(document)).toEqual([
      '$schema',
      'title',
      'type',
      'properties',
      'required',
    ]);
  });

  it('returns the same stats as the string entry point', () => {
    const value = { user: { email: 'a@b.co' } };
    const { stats } = buildSchemaDocument(value);
    const viaString = generateJsonSchema(JSON.stringify(value));

    expect(stats.detectedFormats).toEqual(['email']);
    expect(viaString.metadata!.objectCount).toBe(stats.objectCount);
  });
});

describe('json-to-typescript JSON Schema output', () => {
  it('emits a real schema instead of an empty shell', () => {
    const result = convertJsonToTypeScript(
      '{"id":1,"email":"dev@toolslab.dev"}',
      { generateJsonSchema: true, rootInterfaceName: 'User' }
    );

    expect(result.success).toBe(true);
    const schema = JSON.parse(result.jsonSchema!);
    expect(schema.title).toBe('User');
    expect(schema.properties).toEqual({
      id: { type: 'integer' },
      email: { type: 'string', format: 'email' },
    });
    expect(schema.required).toEqual(['id', 'email']);
  });

  it('handles an array root that the old stub always typed as object', () => {
    const result = convertJsonToTypeScript('[{"a":1},{"a":2,"b":3}]', {
      generateJsonSchema: true,
    });

    const schema = JSON.parse(result.jsonSchema!);
    expect(schema.type).toBe('array');
    expect(schema.items.required).toEqual(['a']);
  });

  it('omits the schema when the option is off', () => {
    const result = convertJsonToTypeScript('{"a":1}');
    expect(result.jsonSchema).toBeUndefined();
  });
});

describe('inferSchemaFromValue', () => {
  it('works on already-parsed data without a $schema wrapper', () => {
    const { schema, stats } = inferSchemaFromValue({ a: 1 });

    expect(schema).toEqual({
      type: 'object',
      properties: { a: { type: 'integer' } },
      required: ['a'],
    });
    expect(schema.$schema).toBeUndefined();
    expect(stats.objectCount).toBe(1);
  });

  it('stops descending at the depth guard', () => {
    // 45 levels deep — beyond MAX_DEPTH (40).
    let value: unknown = 'leaf';
    for (let i = 0; i < 45; i++) value = { nested: value };

    const { schema } = inferSchemaFromValue(value);
    let node: any = schema;
    let depth = 0;
    while (node?.properties?.nested) {
      node = node.properties.nested;
      depth++;
    }

    expect(depth).toBeLessThan(45);
    expect(node).toEqual({});
  });

  it('uses the documented defaults', () => {
    expect(defaultJsonSchemaOptions).toEqual({
      draft: 'draft-07',
      requiredMode: 'all',
      detectFormats: true,
      includeExamples: false,
      strictObjects: false,
      title: '',
    });
  });
});
