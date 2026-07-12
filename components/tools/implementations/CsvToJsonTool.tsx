'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Copy,
  Download,
  Check,
  Upload,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  AlertCircle,
  FileJson,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { BaseToolProps } from '@/lib/types/tools';
import {
  parseCsvToJson,
  detectDelimiter,
  validateCsv,
  getCsvStats,
  CsvToJsonOptions,
} from '@/lib/tools/csv-to-json';

interface CsvToJsonToolProps extends BaseToolProps {}

export default function CsvToJsonTool({ categoryColor, dictionary }: CsvToJsonToolProps) {
  const ui = dictionary?.tools?.['csv-to-json']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [trimValues, setTrimValues] = useState(true);
  const [outputFormat, setOutputFormat] = useState<
    'array' | 'nested' | 'compact'
  >('array');
  const [customHeaders, setCustomHeaders] = useState('');
  const [nullValues, setNullValues] = useState('NULL,N/A,null');
  const [minifyOutput, setMinifyOutput] = useState(false);
  const [stats, setStats] = useState<{ rows: number; columns: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { copied, copy } = useCopy();
  const { downloadJSON } = useDownload();
  const { trackCustom, trackError } = useToolTracking('csv-to-json');
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    delay: 300, // Aumentato delay per aspettare il render completo
  });

  // Scroll to result when output changes
  useEffect(() => {
    if (output) {
      scrollToResult();
    }
  }, [output, scrollToResult]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('Please enter CSV data');
      setStats(null);
      return;
    }

    const startTime = Date.now();

    try {
      setError(null);

      // Parse custom headers
      const headers = customHeaders.trim()
        ? customHeaders.split(',').map((h) => h.trim())
        : [];

      // Parse null values
      const nullValuesList = nullValues.trim()
        ? nullValues.split(',').map((v) => v.trim())
        : [];

      const options: CsvToJsonOptions = {
        delimiter,
        hasHeaders,
        customHeaders: headers,
        trimValues,
        nullValues: nullValuesList,
        outputFormat,
      };

      const result = parseCsvToJson(input, options);

      if (!result.success) {
        setError(result.error || 'Failed to convert CSV');
        setOutput('');
        setStats(null);
        return;
      }

      // Format output
      const jsonString = minifyOutput
        ? JSON.stringify(result.data)
        : JSON.stringify(result.data, null, 2);

      setOutput(jsonString);
      setStats({
        rows: result.rowCount,
        columns: result.columnCount,
      });
      setConvertSuccess(true);
      setTimeout(() => setConvertSuccess(false), 3000);

      // Auto-tracking via centralized analytics
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'csv-to-json',
        input,
        output: jsonString,
        timestamp: startTime,
      });

      // Track successful conversion
      trackCustom({
        inputSize: input.length,
        outputSize: jsonString.length,
        success: true,
        rows: result.rowCount,
        columns: result.columnCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert CSV');
      setOutput('');
      setStats(null);

      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
    }
  }, [
    input,
    delimiter,
    hasHeaders,
    trimValues,
    customHeaders,
    nullValues,
    outputFormat,
    minifyOutput,
    trackError,
    trackCustom,
    addToHistory,
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);

      // Detect if file has headers
      const csvStats = getCsvStats(content, delimiter);
      setHasHeaders(csvStats.hasHeaders);
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    if (!input.trim()) {
      setError('Please enter CSV data');
      return;
    }

    const validation = validateCsv(input, delimiter);

    if (!validation.valid) {
      setError(validation.errors.join(', '));
    } else {
      setError(null);
      const csvStats = getCsvStats(input, delimiter);
      setStats({
        rows: csvStats.rows,
        columns: csvStats.columns,
      });
    }
  };

  const handleCopy = async () => {
    await copy(output);
  };

  const handleDownload = () => {
    if (output) {
      downloadJSON(output, 'converted-data.json');
    }
  };

  const handleExampleData = () => {
    const example = `name,age,city,email
John Doe,30,New York,john@example.com
Jane Smith,25,Los Angeles,jane@example.com
Bob Johnson,35,Chicago,bob@example.com
Alice Williams,28,Houston,alice@example.com`;
    setInput(example);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {ui.inputSectionHeading || 'CSV Input'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExampleData}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {ui.loadExample || 'Load Example'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
            >
              <Upload className="h-3.5 w-3.5" />
              {ui.uploadCsv || 'Upload CSV'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ui.inputPlaceholder || 'Paste your CSV data here or upload a file...'}
          className="min-h-[200px] w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          spellCheck={false}
        />
      </div>

      {/* Options Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="font-medium">{ui.optionsSectionHeading || 'Conversion Options'}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Delimiter */}
          <div>
            <label className="mb-1 block text-sm font-medium">{ui.delimiterLabel || 'Delimiter'}</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value=",">{ui.delimiterComma || 'Comma (,)'}</option>
              <option value=";">{ui.delimiterSemicolon || 'Semicolon (;)'}</option>
              <option value="\t">{ui.delimiterTab || 'Tab'}</option>
              <option value="|">{ui.delimiterPipe || 'Pipe (|)'}</option>
            </select>
          </div>

          {/* Output Format */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {ui.outputFormatLabel || 'Output Format'}
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="array">{ui.outputFormatArray || 'Array of Objects'}</option>
              <option value="nested">{ui.outputFormatNested || 'Nested Object'}</option>
              <option value="compact">{ui.outputFormatCompact || 'Compact Array'}</option>
            </select>
          </div>

          {/* Custom Headers */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {ui.customHeadersLabel || 'Custom Headers'}
            </label>
            <input
              type="text"
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder="col1,col2,col3"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              disabled={hasHeaders}
            />
          </div>

          {/* Null Values */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {ui.nullValuesLabel || 'Null Values'}
            </label>
            <input
              type="text"
              value={nullValues}
              onChange={(e) => setNullValues(e.target.value)}
              placeholder="NULL,N/A,null"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
                className="rounded"
              />
              {ui.checkboxFirstRowHeaders || 'First row contains headers'}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={trimValues}
                onChange={(e) => setTrimValues(e.target.checked)}
                className="rounded"
              />
              {ui.checkboxTrimWhitespace || 'Trim whitespace'}
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={minifyOutput}
                onChange={(e) => setMinifyOutput(e.target.checked)}
                className="rounded"
              />
              {ui.checkboxMinifyOutput || 'Minify JSON output'}
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleConvert}
          disabled={!input.trim()}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
            !input.trim()
              ? 'cursor-not-allowed bg-gray-400'
              : convertSuccess
                ? 'bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {convertSuccess ? (
            <>
              <Check className="h-4 w-4" />
              {ui.btnConverted || 'Converted!'}
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              {ui.btnConvert || 'Convert to JSON'}
            </>
          )}
        </button>

        <button
          onClick={handleValidate}
          disabled={!input.trim()}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {ui.btnValidate || 'Validate CSV'}
        </button>

        <button
          onClick={() => {
            setInput('');
            setOutput('');
            setError(null);
            setStats(null);
          }}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {ui.btnClear || 'Clear'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-gray-700 dark:text-gray-300">
            <strong>{ui.statsRows || 'Rows'}:</strong> {stats.rows}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            <strong>{ui.statsColumns || 'Columns'}:</strong> {stats.columns}
          </span>
        </div>
      )}

      {/* Output Section */}
      <div ref={resultRef}>
        {output && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {ui.outputSectionHeading || 'JSON Output'}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {ui.btnCopied || 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      {ui.btnCopy || 'Copy'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  {ui.btnDownload || 'Download'}
                </button>
              </div>
            </div>
            <div className="relative">
              <pre className="max-h-64 overflow-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono text-sm dark:border-gray-600 dark:bg-gray-700">
                <code className="text-gray-800 dark:text-gray-200">
                  {output}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
