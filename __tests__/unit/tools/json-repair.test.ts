import { repairJson, stripCodeFence } from '@/lib/tools/json-repair';

describe('JSON Repair', () => {
  describe('repairJson', () => {
    it('removes trailing commas', () => {
      const r = repairJson('{"a":1,"b":2,}');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ a: 1, b: 2 });
    });

    it('converts single quotes to double quotes', () => {
      const r = repairJson("{'name':'Ada'}");
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ name: 'Ada' });
    });

    it('quotes unquoted keys', () => {
      const r = repairJson('{name:"Ada",age:36}');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ name: 'Ada', age: 36 });
    });

    it('fixes Python literals', () => {
      const r = repairJson('{"ok":True,"err":None,"no":False}');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ ok: true, err: null, no: false });
    });

    it('repairs truncated JSON by closing brackets', () => {
      const r = repairJson('{"a":[1,2,3');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ a: [1, 2, 3] });
    });

    it('respects minified output when indent is 0', () => {
      const r = repairJson('{"a":1,}', { indent: 0 });
      expect(r.result).toBe('{"a":1}');
    });

    it('pretty-prints with 2 spaces by default', () => {
      const r = repairJson('{"a":1}');
      expect(r.result).toContain('\n  "a": 1');
    });

    it('supports tab indentation', () => {
      const r = repairJson('{"a":1}', { indent: 'tab' });
      expect(r.result).toContain('\t"a": 1');
    });

    it('flags whether anything changed', () => {
      const clean = repairJson('{\n  "a": 1\n}');
      expect(clean.changed).toBe(false);
      const dirty = repairJson('{a:1}');
      expect(dirty.changed).toBe(true);
    });

    it('errors on empty input', () => {
      expect(repairJson('').success).toBe(false);
      expect(repairJson('   ').success).toBe(false);
    });

    it('coerces bare text into a JSON string', () => {
      const r = repairJson('hello world');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toBe('hello world');
    });
  });

  describe('stripCodeFence', () => {
    it('strips a ```json fence', () => {
      expect(stripCodeFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it('strips a plain ``` fence', () => {
      expect(stripCodeFence('```\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it('leaves unfenced input untouched', () => {
      expect(stripCodeFence('{"a":1}')).toBe('{"a":1}');
    });

    it('repairs JSON wrapped in a markdown fence end-to-end', () => {
      const r = repairJson('```json\n{a:1,}\n```');
      expect(r.success).toBe(true);
      expect(JSON.parse(r.result!)).toEqual({ a: 1 });
    });
  });
});
