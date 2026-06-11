'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ColumnAlignment,
  Delimiter,
  TableData,
  generateMarkdownTable,
  parseCsvToTable,
  parseMarkdownTable,
  tableToHtml,
} from '@/lib/tools/markdown-table-generator';
import { useCopy } from '@/lib/hooks/useCopy';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { useToolStore } from '@/lib/store/toolStore';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';

type EditorMode = 'visual' | 'paste';

const DEFAULT_TABLE: TableData = {
  headers: ['Name', 'Role', 'Email'],
  rows: [
    ['Alice', 'Designer', 'alice@example.com'],
    ['Bob', 'Engineer', 'bob@example.com'],
    ['Carol', 'PM', 'carol@example.com'],
  ],
  alignments: ['left', 'left', 'left'],
};

const ALIGNMENT_ICON: Record<ColumnAlignment, React.ReactNode> = {
  left: <AlignLeft className="h-4 w-4" />,
  center: <AlignCenter className="h-4 w-4" />,
  right: <AlignRight className="h-4 w-4" />,
  none: <Minus className="h-4 w-4" />,
};

const ALIGNMENT_ORDER: ColumnAlignment[] = ['none', 'left', 'center', 'right'];

function cycleAlignment(current: ColumnAlignment): ColumnAlignment {
  const idx = ALIGNMENT_ORDER.indexOf(current);
  return ALIGNMENT_ORDER[(idx + 1) % ALIGNMENT_ORDER.length];
}

export default function MarkdownTableGenerator({ dictionary }: BaseToolProps) {
  const ui = dictionary?.tools?.['markdown-table-generator']?.ui ?? {};
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { trackUse, trackError } = useToolTracking('markdown-table-generator');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });
  const { copied, copy } = useCopy();

  const [mode, setMode] = useState<EditorMode>('visual');
  const [table, setTable] = useState<TableData>(DEFAULT_TABLE);
  const [pasteInput, setPasteInput] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate Markdown output from current table state
  const output = useMemo(() => {
    const result = generateMarkdownTable(table, { prettyPrint });
    if (!result.success) {
      return '';
    }
    return result.result ?? '';
  }, [table, prettyPrint]);

  // Auto-scroll to result when output changes
  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  // Track usage when output is meaningful
  useEffect(() => {
    if (!isHydrated || !output) return;
    const startTime = Date.now();
    const summary = `${table.headers.length} cols × ${table.rows.length} rows`;
    trackUse(summary, output, { success: true, source: mode });
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'markdown-table-generator',
      input: summary,
      output,
      timestamp: startTime,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output]);

  const updateHeader = useCallback((index: number, value: string) => {
    setTable((prev) => {
      const headers = [...prev.headers];
      headers[index] = value;
      return { ...prev, headers };
    });
  }, []);

  const updateCell = useCallback(
    (rowIdx: number, colIdx: number, value: string) => {
      setTable((prev) => {
        const rows = prev.rows.map((row) => [...row]);
        if (!rows[rowIdx]) return prev;
        rows[rowIdx][colIdx] = value;
        return { ...prev, rows };
      });
    },
    []
  );

  const cycleAlign = useCallback((index: number) => {
    setTable((prev) => {
      const alignments = [...prev.alignments];
      alignments[index] = cycleAlignment(alignments[index] ?? 'none');
      return { ...prev, alignments };
    });
  }, []);

  const addRow = useCallback(() => {
    setTable((prev) => ({
      ...prev,
      rows: [...prev.rows, prev.headers.map(() => '')],
    }));
  }, []);

  const removeRow = useCallback((rowIdx: number) => {
    setTable((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIdx),
    }));
  }, []);

  const moveRow = useCallback((rowIdx: number, direction: 'up' | 'down') => {
    setTable((prev) => {
      const rows = [...prev.rows];
      const target = direction === 'up' ? rowIdx - 1 : rowIdx + 1;
      if (target < 0 || target >= rows.length) return prev;
      [rows[rowIdx], rows[target]] = [rows[target], rows[rowIdx]];
      return { ...prev, rows };
    });
  }, []);

  const addColumn = useCallback(() => {
    setTable((prev) => ({
      headers: [...prev.headers, `Column ${prev.headers.length + 1}`],
      rows: prev.rows.map((row) => [...row, '']),
      alignments: [...prev.alignments, 'none'],
    }));
  }, []);

  const removeColumn = useCallback((colIdx: number) => {
    setTable((prev) => {
      if (prev.headers.length <= 1) return prev;
      return {
        headers: prev.headers.filter((_, i) => i !== colIdx),
        rows: prev.rows.map((row) => row.filter((_, i) => i !== colIdx)),
        alignments: prev.alignments.filter((_, i) => i !== colIdx),
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setTable({
      headers: ['Column 1', 'Column 2'],
      rows: [['', '']],
      alignments: ['none', 'none'],
    });
    setPasteInput('');
    setError(null);
  }, []);

  const handleResetExample = useCallback(() => {
    setTable(DEFAULT_TABLE);
    setError(null);
  }, []);

  const handleParsePaste = useCallback(() => {
    if (!pasteInput.trim()) {
      setError('Paste CSV, TSV or a Markdown table to import');
      return;
    }

    // Try Markdown table first (cheap heuristic: contains a separator row)
    const looksLikeMarkdown = /\|.*\|[\s\S]*\|\s*:?-+:?\s*\|/.test(pasteInput);
    if (looksLikeMarkdown) {
      const parsed = parseMarkdownTable(pasteInput);
      if (parsed.success && parsed.data) {
        setTable(parsed.data);
        setError(null);
        setMode('visual');
        return;
      }
      // Fall through to CSV if MD parse fails
    }

    const parsed = parseCsvToTable(pasteInput, { delimiter, hasHeader });
    if (parsed.success && parsed.data) {
      setTable(parsed.data);
      setError(null);
      setMode('visual');
    } else {
      const message = parsed.error ?? 'Could not parse input';
      setError(message);
      trackError(new Error(message), pasteInput.length);
    }
  }, [pasteInput, delimiter, hasHeader, trackError]);

  const handleCopy = useCallback(async () => {
    if (output) await copy(output);
  }, [copy, output]);

  const previewHtml = useMemo(() => tableToHtml(table), [table]);

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === 'visual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('visual')}
        >
          {ui.visualEditor || 'Visual editor'}
        </Button>
        <Button
          variant={mode === 'paste' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('paste')}
        >
          {ui.pasteCsvTsvMarkdown || 'Paste CSV / TSV / Markdown'}
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetExample}>
            <RefreshCw className="mr-1 h-4 w-4" /> {ui.example || 'Example'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="mr-1 h-4 w-4" /> {ui.clear || 'Clear'}
          </Button>
        </div>
      </div>

      {/* Paste mode */}
      {mode === 'paste' && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="delimiter">{ui.delimiterLabel || 'Delimiter'}</Label>
              <Select
                value={delimiter}
                onValueChange={(v) => setDelimiter(v as Delimiter)}
              >
                <SelectTrigger id="delimiter" className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{ui.autoDetect || 'Auto detect'}</SelectItem>
                  <SelectItem value=",">{ui.commaOption || 'Comma (,)'}</SelectItem>
                  <SelectItem value=";">{ui.semicolonOption || 'Semicolon (;)'}</SelectItem>
                  <SelectItem value="\t">{ui.tabOption || 'Tab'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="hasHeader"
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hasHeader">{ui.firstRowIsHeader || 'First row is header'}</Label>
            </div>
            <Button onClick={handleParsePaste} className="ml-auto">
              {ui.import || 'Import'}
            </Button>
          </div>
          <Textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder={'name,role,email\nAlice,Designer,alice@example.com'}
            rows={8}
            className="font-mono text-sm"
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Visual editor */}
      {mode === 'visual' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {table.headers.map((header, colIdx) => (
                  <th key={colIdx} className="border-b p-2 text-left">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => updateHeader(colIdx, e.target.value)}
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 font-semibold dark:border-gray-600 dark:bg-gray-900"
                        aria-label={`Header column ${colIdx + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cycleAlign(colIdx)}
                        title={`Alignment: ${table.alignments[colIdx] ?? 'none'}`}
                      >
                        {ALIGNMENT_ICON[table.alignments[colIdx] ?? 'none']}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(colIdx)}
                        disabled={table.headers.length <= 1}
                        title={ui.removeColumn || 'Remove column'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </th>
                ))}
                <th className="border-b p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addColumn}
                    title={ui.addColumn || 'Add column'}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b last:border-0">
                  {table.headers.map((_, colIdx) => (
                    <td key={colIdx} className="p-2">
                      <input
                        type="text"
                        value={row[colIdx] ?? ''}
                        onChange={(e) =>
                          updateCell(rowIdx, colIdx, e.target.value)
                        }
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
                        aria-label={`Row ${rowIdx + 1} column ${colIdx + 1}`}
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRow(rowIdx, 'up')}
                        disabled={rowIdx === 0}
                        title={ui.moveUp || 'Move up'}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRow(rowIdx, 'down')}
                        disabled={rowIdx === table.rows.length - 1}
                        title={ui.moveDown || 'Move down'}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIdx)}
                        title={ui.removeRow || 'Remove row'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t p-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" /> {ui.addRow || 'Add row'}
            </Button>
          </div>
        </div>
      )}

      {/* Output */}
      <div ref={resultRef} className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Label className="font-semibold">{ui.markdownOutput || 'Markdown output'}</Label>
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                id="prettyPrint"
                type="checkbox"
                checked={prettyPrint}
                onChange={(e) => setPrettyPrint(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="prettyPrint">{ui.prettyPadding || 'Pretty padding'}</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-1 h-4 w-4" /> {ui.hidePreview || 'Hide preview'}
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" /> {ui.showPreview || 'Show preview'}
                </>
              )}
            </Button>
            <Button onClick={handleCopy} disabled={!output}>
              {copied ? (
                <>
                  <Check className="mr-1 h-4 w-4" /> {ui.copied || 'Copied'}
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" /> {ui.copyMarkdown || 'Copy Markdown'}
                </>
              )}
            </Button>
          </div>
        </div>

        <Textarea
          value={output}
          readOnly
          rows={Math.min(Math.max(table.rows.length + 4, 6), 16)}
          className="font-mono text-sm"
          placeholder={ui.outputPlaceholder || 'Markdown table will appear here...'}
        />

        {showPreview && output && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              {ui.livePreview || 'Live preview'}
            </div>
            <div
              className="markdown-table-preview overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {table.headers.length} columns · {table.rows.length} rows ·{' '}
          {output.length} characters
        </div>
      </div>

      <style jsx>{`
        .markdown-table-preview :global(table) {
          border-collapse: collapse;
          width: 100%;
        }
        .markdown-table-preview :global(th),
        .markdown-table-preview :global(td) {
          border: 1px solid rgb(229 231 235);
          padding: 0.5rem 0.75rem;
        }
        :global(.dark) .markdown-table-preview :global(th),
        :global(.dark) .markdown-table-preview :global(td) {
          border-color: rgb(55 65 81);
        }
        .markdown-table-preview :global(thead) {
          background: rgb(243 244 246);
        }
        :global(.dark) .markdown-table-preview :global(thead) {
          background: rgb(31 41 55);
        }
      `}</style>
    </div>
  );
}
