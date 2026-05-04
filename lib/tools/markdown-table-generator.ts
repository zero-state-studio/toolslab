/**
 * Markdown Table Generator
 *
 * Build GFM-compatible Markdown tables from raw CSV/TSV input or from
 * structured (headers + rows) data. Supports per-column alignment,
 * escaping of pipes/backslashes, and round-trip parsing of existing
 * Markdown tables back into structured data so the visual editor can
 * resume editing.
 */

export type ColumnAlignment = 'left' | 'center' | 'right' | 'none';

export type Delimiter = ',' | ';' | '\t' | 'auto';

export interface TableData {
  headers: string[];
  rows: string[][];
  alignments: ColumnAlignment[];
}

export interface GenerateOptions {
  /** Pad cells with spaces so columns line up visually. Default: true */
  prettyPrint?: boolean;
  /** Per-column alignment. Length should match number of columns. */
  alignments?: ColumnAlignment[];
}

export interface GenerateResult {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: {
    rowCount: number;
    columnCount: number;
  };
}

export interface ParseCsvOptions {
  /** Delimiter; 'auto' detects between comma, semicolon and tab. */
  delimiter?: Delimiter;
  /** Treat first row as header. Default: true */
  hasHeader?: boolean;
}

export interface ParseCsvResult {
  success: boolean;
  data?: TableData;
  error?: string;
}

export interface ParseMarkdownResult {
  success: boolean;
  data?: TableData;
  error?: string;
}

/**
 * Escape a single cell value so it does not break GFM table syntax.
 * - Pipes inside cells become `\|`
 * - Newlines collapse to a single `<br>` (GFM-compatible line break)
 * - Backslashes are doubled so escapes survive round-trips.
 */
export function escapeCell(value: string): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

/**
 * Inverse of escapeCell — used when re-parsing existing Markdown tables.
 */
function unescapeCell(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\\|/g, '|')
    .replace(/\\\\/g, '\\')
    .trim();
}

function minColumnWidth(alignment: ColumnAlignment): number {
  switch (alignment) {
    case 'center':
      return 5; // ":---:"
    case 'left':
    case 'right':
      return 4; // ":---" or "---:"
    default:
      return 3; // "---"
  }
}

function alignmentMarker(alignment: ColumnAlignment, width: number): string {
  switch (alignment) {
    case 'left':
      return ':' + '-'.repeat(Math.max(width - 1, 3));
    case 'right':
      return '-'.repeat(Math.max(width - 1, 3)) + ':';
    case 'center':
      return ':' + '-'.repeat(Math.max(width - 2, 3)) + ':';
    default:
      return '-'.repeat(Math.max(width, 3));
  }
}

function padCell(
  value: string,
  width: number,
  alignment: ColumnAlignment
): string {
  const diff = width - value.length;
  if (diff <= 0) return value;
  switch (alignment) {
    case 'right':
      return ' '.repeat(diff) + value;
    case 'center': {
      const left = Math.floor(diff / 2);
      const right = diff - left;
      return ' '.repeat(left) + value + ' '.repeat(right);
    }
    default:
      return value + ' '.repeat(diff);
  }
}

/**
 * Generate a GFM Markdown table from structured data.
 */
export function generateMarkdownTable(
  data: TableData,
  options: GenerateOptions = {}
): GenerateResult {
  try {
    const { prettyPrint = true } = options;
    const alignments = options.alignments ?? data.alignments ?? [];

    if (!data.headers || data.headers.length === 0) {
      return { success: false, error: 'At least one column header is required' };
    }

    const colCount = data.headers.length;
    const escapedHeaders = data.headers.map(escapeCell);
    const escapedRows = data.rows.map((row) => {
      const filled = [...row];
      while (filled.length < colCount) filled.push('');
      return filled.slice(0, colCount).map(escapeCell);
    });

    const colAlignments: ColumnAlignment[] = Array.from(
      { length: colCount },
      (_, i) => alignments[i] ?? 'none'
    );

    const widths = escapedHeaders.map((header, colIndex) => {
      if (!prettyPrint) {
        // No padding mode: width is irrelevant for cells, separator fixed at 3.
        return 3;
      }
      let max = header.length;
      for (const row of escapedRows) {
        if (row[colIndex] && row[colIndex].length > max) {
          max = row[colIndex].length;
        }
      }
      // Ensure column is wide enough for the alignment marker.
      return Math.max(max, minColumnWidth(colAlignments[colIndex]));
    });

    const renderRow = (cells: string[]): string => {
      const padded = cells.map((cell, i) =>
        prettyPrint ? padCell(cell, widths[i], colAlignments[i]) : cell
      );
      return `| ${padded.join(' | ')} |`;
    };

    const separator = `| ${colAlignments
      .map((align, i) =>
        prettyPrint ? alignmentMarker(align, widths[i]) : alignmentMarker(align, 3)
      )
      .join(' | ')} |`;

    const lines: string[] = [];
    lines.push(renderRow(escapedHeaders));
    lines.push(separator);
    for (const row of escapedRows) {
      lines.push(renderRow(row));
    }

    return {
      success: true,
      result: lines.join('\n'),
      metadata: {
        rowCount: escapedRows.length,
        columnCount: colCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function detectDelimiter(text: string): Exclude<Delimiter, 'auto'> {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts: Record<Exclude<Delimiter, 'auto'>, number> = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  };
  let best: Exclude<Delimiter, 'auto'> = ',';
  let max = -1;
  (Object.keys(counts) as Array<Exclude<Delimiter, 'auto'>>).forEach((d) => {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  });
  return best;
}

/**
 * Minimal RFC 4180-flavoured CSV/TSV parser. Supports quoted fields,
 * escaped quotes (`""`), and CRLF line endings.
 */
function parseDelimited(
  text: string,
  delimiter: Exclude<Delimiter, 'auto'>
): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      current.push(field);
      field = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      current.push(field);
      field = '';
      // Skip \n in \r\n
      if (char === '\r' && text[i + 1] === '\n') i++;
      // Skip rows that are completely empty
      if (current.length > 1 || (current.length === 1 && current[0] !== '')) {
        rows.push(current);
      }
      current = [];
      continue;
    }

    field += char;
  }

  // Flush trailing field/row
  if (field !== '' || current.length > 0) {
    current.push(field);
    if (current.length > 1 || (current.length === 1 && current[0] !== '')) {
      rows.push(current);
    }
  }

  return rows;
}

/**
 * Parse CSV/TSV text into structured TableData.
 */
export function parseCsvToTable(
  text: string,
  options: ParseCsvOptions = {}
): ParseCsvResult {
  try {
    if (!text || !text.trim()) {
      return { success: false, error: 'Input is empty' };
    }
    const { hasHeader = true } = options;
    const requested = options.delimiter ?? 'auto';
    const delimiter: Exclude<Delimiter, 'auto'> =
      requested === 'auto' ? detectDelimiter(text) : requested;

    const rows = parseDelimited(text, delimiter);
    if (rows.length === 0) {
      return { success: false, error: 'No rows detected' };
    }

    const colCount = rows.reduce((max, r) => Math.max(max, r.length), 0);
    const normalised = rows.map((r) => {
      const copy = [...r];
      while (copy.length < colCount) copy.push('');
      return copy;
    });

    let headers: string[];
    let bodyRows: string[][];
    if (hasHeader) {
      headers = normalised[0].map((h) => h.trim());
      bodyRows = normalised.slice(1);
    } else {
      headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
      bodyRows = normalised;
    }

    return {
      success: true,
      data: {
        headers,
        rows: bodyRows,
        alignments: Array.from({ length: colCount }, () => 'none'),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV/TSV',
    };
  }
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let buffer = '';
  let escape = false;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escape) {
      buffer += '\\' + char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '|') {
      cells.push(buffer);
      buffer = '';
      continue;
    }
    buffer += char;
  }
  if (escape) buffer += '\\';
  cells.push(buffer);
  return cells.map(unescapeCell);
}

function parseAlignmentMarker(marker: string): ColumnAlignment {
  const trimmed = marker.trim();
  const startsWithColon = trimmed.startsWith(':');
  const endsWithColon = trimmed.endsWith(':');
  if (startsWithColon && endsWithColon) return 'center';
  if (endsWithColon) return 'right';
  if (startsWithColon) return 'left';
  return 'none';
}

/**
 * Parse an existing GFM Markdown table back into TableData so it can
 * be re-edited inside the visual editor.
 */
export function parseMarkdownTable(input: string): ParseMarkdownResult {
  try {
    if (!input || !input.trim()) {
      return { success: false, error: 'Input is empty' };
    }
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: 'Markdown table requires at least a header and separator row',
      };
    }

    const headerCells = splitTableRow(lines[0]);
    const separatorCells = splitTableRow(lines[1]);

    const isSeparator = separatorCells.every((cell) =>
      /^:?-+:?$/.test(cell.trim())
    );

    if (!isSeparator) {
      return {
        success: false,
        error: 'Second line must be a valid separator row (e.g. | --- | --- |)',
      };
    }

    const alignments = separatorCells.map(parseAlignmentMarker);
    const bodyRows = lines.slice(2).map((line) => {
      const cells = splitTableRow(line);
      while (cells.length < headerCells.length) cells.push('');
      return cells.slice(0, headerCells.length);
    });

    return {
      success: true,
      data: {
        headers: headerCells,
        rows: bodyRows,
        alignments,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to parse Markdown table',
    };
  }
}

/**
 * Convenience: render a TableData to HTML (used for the live preview).
 */
export function tableToHtml(data: TableData): string {
  const align = (a: ColumnAlignment): string =>
    a === 'none' ? '' : ` style="text-align:${a}"`;
  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const headerHtml = data.headers
    .map((h, i) => `<th${align(data.alignments[i] ?? 'none')}>${escapeHtml(h)}</th>`)
    .join('');
  const rowsHtml = data.rows
    .map((row) => {
      const cells = row
        .map(
          (cell, i) =>
            `<td${align(data.alignments[i] ?? 'none')}>${escapeHtml(cell)}</td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}
