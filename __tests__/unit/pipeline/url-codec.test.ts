import {
  encodePipeline,
  decodePipeline,
} from '@/lib/pipeline/url-codec';
import type { SharedPipeline } from '@/lib/pipeline/types';

describe('pipeline url-codec', () => {
  const sample: SharedPipeline = {
    name: 'CSV → JSON → hash',
    steps: [
      { toolId: 'csv-to-json', options: { delimiter: ';' } },
      { toolId: 'json-minify', options: {} },
      { toolId: 'hash-generate', options: { algorithm: 'MD5' } },
    ],
  };

  it('roundtrips a pipeline through encode/decode', () => {
    const encoded = encodePipeline(sample);
    expect(typeof encoded).toBe('string');
    expect(decodePipeline(encoded)).toEqual(sample);
  });

  it('produces URL-safe output (no +, /, =, #, ?)', () => {
    const encoded = encodePipeline(sample);
    expect(encoded).not.toMatch(/[+/=#?&\s]/);
  });

  it('roundtrips unicode names and option values', () => {
    const p: SharedPipeline = {
      name: 'città → 日本語 ✓',
      steps: [{ toolId: 'case-convert', options: { caseType: 'Title Case' } }],
    };
    expect(decodePipeline(encodePipeline(p))).toEqual(p);
  });

  it('returns null for garbage input', () => {
    expect(decodePipeline('not-valid-base64url-@@@')).toBeNull();
    expect(decodePipeline('')).toBeNull();
    // valid base64 of a non-pipeline JSON shape
    expect(decodePipeline(Buffer.from('{"foo":1}').toString('base64url'))).toBeNull();
    // valid base64 of a non-JSON string
    expect(decodePipeline(Buffer.from('hello').toString('base64url'))).toBeNull();
  });

  it('rejects pipelines with malformed steps', () => {
    const bad = Buffer.from(
      encodeURIComponent(JSON.stringify({ name: 'x', steps: [{ nope: true }] }))
    ).toString('base64url');
    expect(decodePipeline(bad)).toBeNull();
  });
});
