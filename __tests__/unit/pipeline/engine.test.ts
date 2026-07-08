import { runPipeline, getCompatibleAdapters } from '@/lib/pipeline/engine';
import { getAdapter, listAdapters } from '@/lib/pipeline/adapters';

describe('pipeline engine', () => {
  describe('runPipeline', () => {
    it('runs a two-step text pipeline sequentially', async () => {
      const result = await runPipeline(
        [
          { toolId: 'base64-encode', options: {} },
          { toolId: 'base64-decode', options: {} },
        ],
        'hello pipeline'
      );

      expect(result.ok).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].output).toBe(
        Buffer.from('hello pipeline').toString('base64')
      );
      expect(result.output).toBe('hello pipeline');
    });

    it('feeds each step the previous output', async () => {
      const result = await runPipeline(
        [
          { toolId: 'csv-to-json', options: {} },
          { toolId: 'json-minify', options: {} },
        ],
        'name,age\nAda,36\nAlan,41'
      );

      expect(result.ok).toBe(true);
      const parsed = JSON.parse(result.output!);
      expect(parsed).toEqual([
        { name: 'Ada', age: 36 },
        { name: 'Alan', age: 41 },
      ]);
    });

    it('stops at the first failing step and reports the error', async () => {
      const result = await runPipeline(
        [
          { toolId: 'json-format', options: {} },
          { toolId: 'base64-encode', options: {} },
        ],
        'this is not json {{{'
      );

      expect(result.ok).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].ok).toBe(false);
      expect(result.steps[0].error).toBeTruthy();
      expect(result.output).toBeUndefined();
    });

    it('fails gracefully on unknown toolId', async () => {
      const result = await runPipeline(
        [{ toolId: 'does-not-exist', options: {} }],
        'x'
      );
      expect(result.ok).toBe(false);
      expect(result.steps[0].error).toMatch(/unknown/i);
    });

    it('reports per-step timing', async () => {
      const result = await runPipeline(
        [{ toolId: 'base64-encode', options: {} }],
        'x'
      );
      expect(result.steps[0].ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCompatibleAdapters', () => {
    it('returns all adapters when there is no previous step', () => {
      expect(getCompatibleAdapters(null)).toHaveLength(listAdapters().length);
    });

    it('suggests json consumers after a json-producing step', () => {
      const csvToJson = getAdapter('csv-to-json')!;
      const ids = getCompatibleAdapters(csvToJson).map((a) => a.id);
      expect(ids).toContain('json-minify'); // accepts json
      expect(ids).toContain('base64-encode'); // accepts any text
      expect(ids).not.toContain('sql-format'); // sql only
    });
  });
});
