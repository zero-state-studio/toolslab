import {
  generateMarkdownTable,
  parseCsvToTable,
  parseMarkdownTable,
  escapeCell,
  tableToHtml,
  TableData,
} from '@/lib/tools/markdown-table-generator';

describe('Markdown Table Generator', () => {
  describe('generateMarkdownTable', () => {
    it('renders a basic GFM table with pretty padding', () => {
      const data: TableData = {
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25'],
        ],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      expect(result.result).toBe(
        [
          '| Name  | Age |',
          '| ----- | --- |',
          '| Alice | 30  |',
          '| Bob   | 25  |',
        ].join('\n')
      );
      expect(result.metadata).toEqual({ rowCount: 2, columnCount: 2 });
    });

    it('emits alignment markers in the separator row', () => {
      const data: TableData = {
        headers: ['Left', 'Center', 'Right'],
        rows: [['a', 'b', 'c']],
        alignments: ['left', 'center', 'right'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      const lines = (result.result ?? '').split('\n');
      expect(lines[1]).toBe('| :--- | :----: | ----: |');
    });

    it('escapes pipes and newlines in cell content', () => {
      const data: TableData = {
        headers: ['A', 'B'],
        rows: [['a|b', 'line1\nline2']],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      expect(result.result).toContain('a\\|b');
      expect(result.result).toContain('line1<br>line2');
    });

    it('pads rows that are shorter than the header', () => {
      const data: TableData = {
        headers: ['A', 'B', 'C'],
        rows: [['1', '2']],
        alignments: ['none', 'none', 'none'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      expect(result.result?.split('\n')[2]).toBe('| 1   | 2   |     |');
    });

    it('truncates rows that exceed the header length', () => {
      const data: TableData = {
        headers: ['A', 'B'],
        rows: [['1', '2', '3']],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      const last = result.result?.split('\n').slice(-1)[0];
      expect(last).toBe('| 1   | 2   |');
    });

    it('skips pretty padding when disabled', () => {
      const data: TableData = {
        headers: ['Name', 'Age'],
        rows: [['Alice', '30']],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data, { prettyPrint: false });
      expect(result.success).toBe(true);
      expect(result.result).toBe(
        ['| Name | Age |', '| --- | --- |', '| Alice | 30 |'].join('\n')
      );
    });

    it('fails when no headers provided', () => {
      const result = generateMarkdownTable({
        headers: [],
        rows: [],
        alignments: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('uses alignments from options to override TableData', () => {
      const data: TableData = {
        headers: ['A', 'B'],
        rows: [['1', '2']],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data, {
        alignments: ['right', 'left'],
      });
      expect(result.result?.split('\n')[1]).toBe('| ---: | :--- |');
    });

    it('handles unicode cell content', () => {
      const data: TableData = {
        headers: ['名前', '年齢'],
        rows: [['田中 🎉', '30']],
        alignments: ['none', 'none'],
      };
      const result = generateMarkdownTable(data);
      expect(result.success).toBe(true);
      expect(result.result).toContain('田中 🎉');
    });
  });

  describe('parseCsvToTable', () => {
    it('parses CSV with header row by default', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = parseCsvToTable(csv);
      expect(result.success).toBe(true);
      expect(result.data?.headers).toEqual(['name', 'age']);
      expect(result.data?.rows).toEqual([
        ['Alice', '30'],
        ['Bob', '25'],
      ]);
    });

    it('auto-detects semicolon delimiter', () => {
      const csv = 'name;age\nAlice;30';
      const result = parseCsvToTable(csv, { delimiter: 'auto' });
      expect(result.success).toBe(true);
      expect(result.data?.rows).toEqual([['Alice', '30']]);
    });

    it('auto-detects tab delimiter', () => {
      const csv = 'name\tage\nAlice\t30';
      const result = parseCsvToTable(csv);
      expect(result.success).toBe(true);
      expect(result.data?.rows).toEqual([['Alice', '30']]);
    });

    it('synthesises column headers when hasHeader=false', () => {
      const csv = 'Alice,30\nBob,25';
      const result = parseCsvToTable(csv, { hasHeader: false });
      expect(result.success).toBe(true);
      expect(result.data?.headers).toEqual(['Column 1', 'Column 2']);
      expect(result.data?.rows).toHaveLength(2);
    });

    it('handles quoted values containing the delimiter', () => {
      const csv = 'name,note\nAlice,"hello, world"\nBob,plain';
      const result = parseCsvToTable(csv);
      expect(result.success).toBe(true);
      expect(result.data?.rows[0]).toEqual(['Alice', 'hello, world']);
    });

    it('handles escaped double quotes inside quoted fields', () => {
      const csv = 'name,quote\nAlice,"she said ""hi"""';
      const result = parseCsvToTable(csv);
      expect(result.success).toBe(true);
      expect(result.data?.rows[0][1]).toBe('she said "hi"');
    });

    it('rejects empty input', () => {
      const result = parseCsvToTable('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('parseMarkdownTable', () => {
    it('round-trips a generated table', () => {
      const data: TableData = {
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25'],
        ],
        alignments: ['left', 'right'],
      };
      const generated = generateMarkdownTable(data);
      const parsed = parseMarkdownTable(generated.result ?? '');
      expect(parsed.success).toBe(true);
      expect(parsed.data?.headers).toEqual(['Name', 'Age']);
      expect(parsed.data?.rows).toEqual([
        ['Alice', '30'],
        ['Bob', '25'],
      ]);
      expect(parsed.data?.alignments).toEqual(['left', 'right']);
    });

    it('decodes escaped pipes back into literal pipes', () => {
      const md = '| A | B |\n| --- | --- |\n| a\\|b | c |';
      const parsed = parseMarkdownTable(md);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.rows[0][0]).toBe('a|b');
    });

    it('rejects input without separator row', () => {
      const md = '| Name | Age |\n| Alice | 30 |';
      const parsed = parseMarkdownTable(md);
      expect(parsed.success).toBe(false);
    });

    it('rejects empty input', () => {
      expect(parseMarkdownTable('').success).toBe(false);
    });
  });

  describe('escapeCell', () => {
    it('handles null and undefined safely', () => {
      expect(escapeCell(undefined as unknown as string)).toBe('');
      expect(escapeCell(null as unknown as string)).toBe('');
    });

    it('doubles backslashes', () => {
      expect(escapeCell('a\\b')).toBe('a\\\\b');
    });
  });

  describe('tableToHtml', () => {
    it('renders an HTML table preserving alignment styles', () => {
      const data: TableData = {
        headers: ['A', 'B'],
        rows: [['1', '2']],
        alignments: ['left', 'right'],
      };
      const html = tableToHtml(data);
      expect(html).toContain('<th style="text-align:left">A</th>');
      expect(html).toContain('<td style="text-align:right">2</td>');
    });

    it('escapes HTML special characters in cells', () => {
      const data: TableData = {
        headers: ['A'],
        rows: [['<script>alert(1)</script>']],
        alignments: ['none'],
      };
      const html = tableToHtml(data);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});
