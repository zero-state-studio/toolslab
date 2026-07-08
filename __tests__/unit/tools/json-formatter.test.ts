import { formatJSON, minifyJSON, validateJSON } from '@/lib/tools/json';
import { TEST_JSON } from '../../fixtures/test-data';

describe('JSON Formatter', () => {
  describe('formatJSON', () => {
    it('should format valid JSON with proper indentation', () => {
      const result = formatJSON(TEST_JSON.valid.simple);
      expect(result.success).toBe(true);
      expect(result.result).toContain('\n');
      expect(result.result).toContain('  ');
    });

    it('should handle nested objects correctly', () => {
      const result = formatJSON(TEST_JSON.valid.nested);
      expect(result.success).toBe(true);
      expect(result.result?.split('\n').length).toBeGreaterThan(3);
    });

    it('should auto-fix trailing commas with a warning', () => {
      // Pre-existing lenient behavior: preprocessJSON strips trailing commas
      const result = formatJSON(TEST_JSON.invalid.syntaxError);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
    });

    it('should return error for unrecoverable input', () => {
      const result = formatJSON('this is not json at all');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const result = formatJSON(TEST_JSON.edge.unicode);
      expect(result.success).toBe(true);
      expect(result.result).toContain('🐙');
    });

    it('should handle empty JSON', () => {
      const result = formatJSON(TEST_JSON.edge.empty);
      expect(result.success).toBe(true);
      expect(result.result).toBe('{}');
    });

    it('should preserve special characters', () => {
      const result = formatJSON(TEST_JSON.edge.specialChars);
      expect(result.success).toBe(true);
      expect(result.result).toContain('\\\\');
    });

    it('should handle large JSON files', () => {
      const startTime = performance.now();
      const result = formatJSON(TEST_JSON.edge.largeFile);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should process within 500ms
    });
  });

  describe('minifyJSON', () => {
    it('should remove all unnecessary whitespace', () => {
      const formatted = '{ "name": "test", "value": 123 }';
      const result = minifyJSON(formatted);
      expect(result.success).toBe(true);
      expect(result.result).toBe('{"name":"test","value":123}');
    });

    it('should handle arrays correctly', () => {
      const input = '{ "items": [ 1, 2, 3 ] }';
      const result = minifyJSON(input);
      expect(result.success).toBe(true);
      expect(result.result).toBe('{"items":[1,2,3]}');
    });

    it('should preserve string content', () => {
      const input = '{ "text": "  spaced  text  " }';
      const result = minifyJSON(input);
      expect(result.success).toBe(true);
      expect(result.result).toContain('"  spaced  text  "');
    });

    it('should handle nested structures', () => {
      const result = minifyJSON(TEST_JSON.valid.complex);
      expect(result.success).toBe(true);
      expect(result.result).not.toContain('\n');
      expect(result.result).not.toMatch(/\s{2,}/);
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON', () => {
      const result = validateJSON(TEST_JSON.valid.simple);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should flag auto-fixed trailing commas with a warning', () => {
      // Pre-existing lenient behavior: preprocessJSON strips trailing commas
      const result = validateJSON(TEST_JSON.invalid.syntaxError);
      expect(result.valid).toBe(true);
      expect(result.warnings?.join(' ')).toContain('automatically fixed');
    });

    it('should detect unfixable syntax errors', () => {
      const result = validateJSON('{"name":ToolsLab}');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle incomplete JSON', () => {
      const result = validateJSON(TEST_JSON.invalid.incomplete);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected end');
    });

    it('should validate complex nested structures', () => {
      const result = validateJSON(TEST_JSON.valid.complex);
      expect(result.valid).toBe(true);
    });

    it('should handle empty input', () => {
      const result = validateJSON('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty input');
    });

    it('should detect duplicate keys', () => {
      const duplicateKeys = '{"name": "test", "name": "duplicate"}';
      const result = validateJSON(duplicateKeys);
      // Note: Standard JSON.parse doesn't detect duplicates, but we should
      expect(result.warnings).toContain('Duplicate key detected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      const result = formatJSON(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('should handle undefined input gracefully', () => {
      const result = formatJSON(undefined as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('should handle very deep nesting', () => {
      let deepJSON = '{"level1":';
      for (let i = 2; i <= 100; i++) {
        deepJSON += `{"level${i}":`;
      }
      deepJSON += '"value"';
      for (let i = 0; i < 100; i++) {
        deepJSON += '}';
      }
      // Note: no extra closing brace needed, we already have 100 opens and 100 closes

      const result = formatJSON(deepJSON);
      expect(result.success).toBe(true);
    });
  });

  describe('Multi-value and garbage-wrapped input recovery', () => {
    it('wraps concatenated objects into an array', () => {
      const result = formatJSON('{"a": 1}{"b": 2}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual([{ a: 1 }, { b: 2 }]);
      expect(result.warnings?.join(' ')).toContain('wrapped them into an array');
    });

    it('wraps NDJSON lines into an array', () => {
      const result = formatJSON('{"a": 1}\n{"b": 2}\n{"c": 3}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    });

    it('wraps comma-separated values pasted without brackets', () => {
      const result = formatJSON('{"a": 1},{"b": 2}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('handles concatenated arrays', () => {
      const result = formatJSON('[1,2][3,4]');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('ignores trailing non-JSON content with a warning', () => {
      const result = formatJSON('{"a": 1} some trailing note');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual({ a: 1 });
      expect(result.warnings?.join(' ')).toContain('trailing non-JSON content');
    });

    it('ignores leading non-JSON content (log prefix) with a warning', () => {
      const result = formatJSON('2026-07-08 INFO response: {"a": 1}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual({ a: 1 });
      expect(result.warnings?.join(' ')).toContain('leading non-JSON content');
    });

    it('is string-aware: braces inside strings do not split values', () => {
      const result = formatJSON('{"text": "a } b"}{"x": "{ y"}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual([
        { text: 'a } b' },
        { x: '{ y' },
      ]);
    });

    it('minifyJSON recovers concatenated objects too', () => {
      const result = minifyJSON('{"a": 1}{"b": 2}');
      expect(result.success).toBe(true);
      expect(result.result).toBe('[{"a":1},{"b":2}]');
    });

    it('still fails on plain prose', () => {
      const result = formatJSON('this is not json at all');
      expect(result.success).toBe(false);
    });

    it('repairs truncated JSON via jsonrepair with a warning', () => {
      const result = formatJSON('{"a": {"b": 1}');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.result!)).toEqual({ a: { b: 1 } });
      expect(result.warnings).toContain(
        'Applied JSON repair to fix malformed input'
      );
    });
  });

  describe('Malformed JSON Auto-Fix', () => {
    it('should fix single quotes to double quotes', () => {
      const input = "{'name': 'John', 'age': 30}";
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toContain('"name"');
      expect(result.result).toContain('"John"');
    });

    it('should preserve apostrophes in strings', () => {
      const input =
        "{'message': 'It\\'s John\\'s birthday', 'note': 'Don\\'t forget'}";
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.result).toContain("It's");
      expect(result.result).toContain("John's");
      expect(result.result).toContain("Don't");
    });

    it('should convert boolean values to lowercase', () => {
      const input = '{"isActive": TRUE, "isValid": FALSE, "data": NULL}';
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toContain('true');
      expect(result.result).toContain('false');
      expect(result.result).toContain('null');
      expect(result.result).not.toContain('TRUE');
      expect(result.result).not.toContain('FALSE');
      expect(result.result).not.toContain('NULL');
    });

    it('should add missing quotes to keys', () => {
      const input = '{name: "John", age: 30, city: "New York"}';
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toContain('"name"');
      expect(result.result).toContain('"age"');
      expect(result.result).toContain('"city"');
    });

    it('should escape unescaped characters', () => {
      const input = '{"text": "Line 1\nLine 2\tTabbed"}';
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      // The newline and tab should be properly escaped in the output
      const parsed = JSON.parse(result.result!);
      expect(parsed.text).toContain('Line 1');
      expect(parsed.text).toContain('Line 2');
      expect(parsed.text).toContain('Tabbed');
    });

    it('should remove trailing commas', () => {
      const input = '{"name": "John", "items": [1, 2, 3,], "age": 30,}';
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toBeDefined();
      // Verify the JSON is valid
      expect(() => JSON.parse(result.result!)).not.toThrow();
    });

    it('should handle mixed issues', () => {
      const input =
        "{name: 'John O\\'Connor', active: TRUE, items: [1,2,3,], data: NULL,}";
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toContain('"name"');
      expect(result.result).toContain("John O'Connor");
      expect(result.result).toContain('true');
      expect(result.result).toContain('null');
      expect(() => JSON.parse(result.result!)).not.toThrow();
    });

    it('should handle already valid JSON without warnings', () => {
      const input = '{"name": "John", "age": 30, "active": true}';
      const result = formatJSON(input);
      expect(result.success).toBe(true);
      expect(result.warnings).toBeUndefined();
      expect(result.result).toBeDefined();
    });

    it('should handle Python-style dictionary with single quotes and Python values', () => {
      const pythonStyleJSON =
        "{'controvalore_euro_totale_ordine': '0.0', 'ora_ordine': '08:17:31', 'point_of_presence': '1001010', 'tipo_documento_vendita': 'RICEVUTA', 'flag_dailysales': '1', 'id_corporate': '15928027', 'waybill': '', 'tasso_cambio': '1.0', 'totale': '50.0', 'brand': 'MM', 'channel': '[{\"payment_method\": \"AXERVE_CC\", \"transaction_customer_id\": \"AX_000000000001096\", \"payment_processor\": \"AXERVE\", \"shop_login\": \"TEST\"}]', 'delivery_type': '', 'order_source': '', 'num_ordine': '1096', 'spese_spedizione': '0.0', 'controvalore_euro_spese_spedizione': '0.0', 'data_ordine': '2025-08-28 08:17:31', 'groupage': '', 'divisa': 'GBP', 'bank': '', 'tot_capi': '1', 'cod_negozio': '90001', 'region': 'GB', 'tipo_servizio_corriere': '[\"\"]', 'soggetto_assegnatario': '1001010', 'shipset': '01', 'stato': 'IN_LAVORAZIONE', 'flag_prenotato': True, 'packaging': '', 'imponibile_spese_spedizione': '0.0', 'ship_method': 'standard', 'metodo_spedizione': 'UPS', 'mittente_prioritario': None, 'controvalore_euro_imponibile_spese_spedizione': '0.0', 'online_exchange': 'N', 'online_exchange_rma': None, 'merchant': 'DT', 'original_order': '', 'valore_capi': '50.0', 'totale_ordine': '50.0'}";

      const result = formatJSON(pythonStyleJSON);
      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'Applied automatic fixes to malformed JSON'
      );
      expect(result.result).toBeDefined();

      // Verify specific conversions
      expect(result.result).toContain('"controvalore_euro_totale_ordine"');
      expect(result.result).toContain('true'); // True -> true
      expect(result.result).toContain('null'); // None -> null
      expect(result.result).not.toContain('True');
      expect(result.result).not.toContain('None');

      // Verify the result is valid JSON
      expect(() => JSON.parse(result.result!)).not.toThrow();
    });
  });
});
