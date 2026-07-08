import { getAdapter, listAdapters } from '@/lib/pipeline/adapters';
import { ADAPTER_TOOL_IDS } from '@/lib/pipeline/adapter-tool-ids';

async function run(toolId: string, input: string, options: Record<string, unknown> = {}) {
  const adapter = getAdapter(toolId);
  if (!adapter) throw new Error(`adapter ${toolId} not registered`);
  return adapter.run(input, options);
}

describe('pipeline adapters', () => {
  it('registers the full first wave', () => {
    const ids = listAdapters().map((a) => a.id);
    for (const id of [
      'base64-encode',
      'base64-decode',
      'json-format',
      'json-minify',
      'csv-to-json',
      'json-to-csv',
      'hash-generate',
      'url-encode',
      'url-decode',
      'jwt-decode',
      'yaml-to-json',
      'json-to-yaml',
      'xml-to-json',
      'sql-format',
      'case-convert',
      'list-transform',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('keeps adapter-tool-ids in sync with the registry', () => {
    const fromAdapters = new Set(listAdapters().map((a) => a.toolId));
    expect(Array.from(fromAdapters).sort()).toEqual(
      Array.from(ADAPTER_TOOL_IDS).sort()
    );
  });

  it('every adapter declares label, io types and a linked tool', () => {
    for (const a of listAdapters()) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.toolId.length).toBeGreaterThan(0);
      expect(a.produces).toBeTruthy();
      expect(a.accepts === 'any' || a.accepts.length > 0).toBe(true);
    }
  });

  it('base64 encodes and decodes', async () => {
    const enc = await run('base64-encode', 'ToolsLab ✓');
    expect(enc).toEqual({ ok: true, output: Buffer.from('ToolsLab ✓').toString('base64') });
    const dec = await run('base64-decode', enc.ok ? enc.output : '');
    expect(dec).toEqual({ ok: true, output: 'ToolsLab ✓' });
  });

  it('base64-decode fails on invalid input', async () => {
    const res = await run('base64-decode', '!!!not base64!!!');
    expect(res.ok).toBe(false);
  });

  it('formats and minifies JSON', async () => {
    const fmt = await run('json-format', '{"a":1,"b":[1,2]}');
    expect(fmt.ok).toBe(true);
    if (fmt.ok) expect(fmt.output).toContain('\n');
    const min = await run('json-minify', fmt.ok ? fmt.output : '');
    expect(min).toEqual({ ok: true, output: '{"a":1,"b":[1,2]}' });
  });

  it('converts CSV to JSON with options', async () => {
    const res = await run('csv-to-json', 'a;b\n1;2', { delimiter: ';' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(JSON.parse(res.output)).toEqual([{ a: 1, b: 2 }]);
  });

  it('converts JSON to CSV', async () => {
    const res = await run('json-to-csv', '[{"a":1,"b":"x"},{"a":2,"b":"y"}]');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.output).toContain('a');
      expect(res.output).toContain('x');
      expect(res.output.split('\n').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('hashes with MD5 deterministically', async () => {
    const res = await run('hash-generate', 'hello', { algorithm: 'MD5' });
    expect(res).toEqual({ ok: true, output: '5d41402abc4b2a76b9719d911017c592' });
  });

  it('url encodes and decodes', async () => {
    const enc = await run('url-encode', 'a b&c=d');
    expect(enc).toEqual({ ok: true, output: 'a%20b%26c%3Dd' });
    const dec = await run('url-decode', 'a%20b%26c%3Dd');
    expect(dec).toEqual({ ok: true, output: 'a b&c=d' });
  });

  it('decodes a JWT to JSON', async () => {
    // {"alg":"HS256","typ":"JWT"} . {"sub":"42","name":"Ada"}
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5hbWUiOiJBZGEifQ.sig';
    const res = await run('jwt-decode', token);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsed = JSON.parse(res.output);
      expect(parsed.payload.name).toBe('Ada');
      expect(parsed.header.alg).toBe('HS256');
    }
  });

  it('converts YAML to JSON and back', async () => {
    const toJson = await run('yaml-to-json', 'name: Ada\nage: 36');
    expect(toJson.ok).toBe(true);
    if (toJson.ok) expect(JSON.parse(toJson.output)).toEqual({ name: 'Ada', age: 36 });

    const toYaml = await run('json-to-yaml', '{"name":"Ada","age":36}');
    expect(toYaml.ok).toBe(true);
    if (toYaml.ok) {
      expect(toYaml.output).toContain('name: Ada');
      expect(toYaml.output).toContain('age: 36');
    }
  });

  it('converts XML to JSON', async () => {
    const res = await run('xml-to-json', '<user><name>Ada</name></user>');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.output).toContain('Ada');
  });

  it('formats SQL with uppercase keywords', async () => {
    const res = await run('sql-format', 'select id from users where id = 1');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.output).toContain('SELECT');
      expect(res.output).toContain('FROM');
    }
  });

  it('converts string case', async () => {
    const res = await run('case-convert', 'hello world example', {
      caseType: 'camelCase',
    });
    expect(res).toEqual({ ok: true, output: 'helloWorldExample' });
  });

  it('transforms lists (dedupe + sort)', async () => {
    const res = await run('list-transform', 'pear\napple\npear\nbanana', {
      removeDuplicates: true,
      sort: 'alphabetical',
    });
    expect(res).toEqual({ ok: true, output: 'apple\nbanana\npear' });
  });
});
