import {
  parseEnv,
  envToJson,
  jsonToEnv,
  formatEnvValue,
} from '@/lib/tools/env-to-json';

describe('.env to JSON', () => {
  describe('parseEnv', () => {
    it('parses basic key=value pairs', () => {
      expect(parseEnv('A=1\nB=hello')).toEqual({ A: '1', B: 'hello' });
    });

    it('ignores comments and blank lines', () => {
      expect(parseEnv('# comment\n\nA=1\n   \n# another\nB=2')).toEqual({
        A: '1',
        B: '2',
      });
    });

    it('handles the export prefix', () => {
      expect(parseEnv('export TOKEN=abc')).toEqual({ TOKEN: 'abc' });
    });

    it('keeps values containing = signs', () => {
      expect(parseEnv('URL=postgres://u:p@host/db?x=1')).toEqual({
        URL: 'postgres://u:p@host/db?x=1',
      });
    });

    it('strips inline comments on unquoted values', () => {
      expect(parseEnv('A=value # trailing comment')).toEqual({ A: 'value' });
    });

    it('preserves # inside quoted values', () => {
      expect(parseEnv('PASS="a#b#c"')).toEqual({ PASS: 'a#b#c' });
    });

    it('handles double-quoted values with escapes', () => {
      expect(parseEnv('MSG="line1\\nline2"')).toEqual({ MSG: 'line1\nline2' });
    });

    it('treats single quotes as literal', () => {
      expect(parseEnv("RAW='a\\nb'")).toEqual({ RAW: 'a\\nb' });
    });

    it('handles empty values', () => {
      expect(parseEnv('EMPTY=')).toEqual({ EMPTY: '' });
    });

    it('skips malformed lines', () => {
      expect(parseEnv('this is not valid\nA=1')).toEqual({ A: '1' });
    });
  });

  describe('envToJson', () => {
    it('converts env to pretty JSON', () => {
      const r = envToJson('A=1\nB=two');
      expect(r.success).toBe(true);
      expect(r.count).toBe(2);
      expect(JSON.parse(r.result!)).toEqual({ A: '1', B: 'two' });
    });

    it('supports tab indentation', () => {
      const r = envToJson('A=1', 'tab');
      expect(r.result).toContain('\t"A"');
    });

    it('errors on empty input', () => {
      expect(envToJson('').success).toBe(false);
    });

    it('errors when no variables are found', () => {
      const r = envToJson('# only comments\n\n');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/No environment variables/);
    });
  });

  describe('formatEnvValue', () => {
    it('leaves simple values unquoted', () => {
      expect(formatEnvValue('hello')).toBe('hello');
      expect(formatEnvValue('123')).toBe('123');
    });

    it('quotes values with spaces or special chars', () => {
      expect(formatEnvValue('hello world')).toBe('"hello world"');
      expect(formatEnvValue('a#b')).toBe('"a#b"');
    });

    it('escapes newlines', () => {
      expect(formatEnvValue('a\nb')).toBe('"a\\nb"');
    });

    it('returns empty for empty', () => {
      expect(formatEnvValue('')).toBe('');
    });
  });

  describe('jsonToEnv', () => {
    it('converts a flat object to .env', () => {
      const r = jsonToEnv('{"A":"1","B":"two words"}');
      expect(r.success).toBe(true);
      expect(r.result).toBe('A=1\nB="two words"');
    });

    it('stringifies non-string values', () => {
      const r = jsonToEnv('{"N":42,"F":true,"O":{"x":1}}');
      expect(r.result).toBe('N=42\nF=true\nO="{\\"x\\":1}"');
    });

    it('emits empty for null', () => {
      expect(jsonToEnv('{"A":null}').result).toBe('A=');
    });

    it('round-trips through env and back', () => {
      const env = 'A=1\nB=two';
      const json = envToJson(env).result!;
      const back = jsonToEnv(json).result!;
      expect(parseEnv(back)).toEqual({ A: '1', B: 'two' });
    });

    it('errors on invalid JSON', () => {
      const r = jsonToEnv('{not json}');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/Invalid JSON/);
    });

    it('errors on non-object JSON', () => {
      expect(jsonToEnv('[1,2,3]').success).toBe(false);
      expect(jsonToEnv('"string"').success).toBe(false);
    });

    it('errors on empty input', () => {
      expect(jsonToEnv('').success).toBe(false);
    });
  });
});
