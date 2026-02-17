'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Download,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  Info,
  RefreshCw,
  Settings,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  formatSQL,
  validateSQL,
  SqlFormatterOptions,
  SqlDialect,
  KeywordCase,
  detectSqlDialect,
} from '@/lib/tools/sql-formatter';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import { useSmartDebounce } from '@/lib/hooks/useSmartDebounce';

interface SqlFormatterProps extends BaseToolProps {}

export default function SqlFormatter({ categoryColor }: SqlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('mysql');
  const [indentSize, setIndentSize] = useState(2);
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('uppercase');
  const [linesBetweenQueries, setLinesBetweenQueries] = useState(1);
  const [maxLineLength, setMaxLineLength] = useState(80);
  const [preserveComments, setPreserveComments] = useState(true);
  const [autoDetectDialect, setAutoDetectDialect] = useState(true);
  const [detectedDialect, setDetectedDialect] = useState<SqlDialect | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    import('@/lib/tools/sql-formatter').SqlValidationError[]
  >([]);
  const [validationWarnings, setValidationWarnings] = useState<
    import('@/lib/tools/sql-formatter').SqlValidationWarning[]
  >([]);
  const [stats, setStats] = useState<{
    lines: number;
    characters: number;
    keywords: number;
    statements: number;
  } | null>(null);
  const [formatSuccess, setFormatSuccess] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const { copied, copy } = useCopy();
  const { downloadText } = useDownload();
  const { trackUse, trackCustom, trackError } =
    useToolTracking('sql-formatter');

  // PHASE 1 OPTIMIZATION: Debounce dialect detection (20-40ms saved per keystroke)
  const debouncedInput = useSmartDebounce(input, {
    delay: 300,
    maxWait: 1000,
    adaptive: true,
  });

  // Auto-detect dialect when debounced input changes
  useEffect(() => {
    if (autoDetectDialect && debouncedInput.trim()) {
      const detected = detectSqlDialect(debouncedInput);
      setDetectedDialect(detected);
    } else if (!autoDetectDialect) {
      setDetectedDialect(null);
    }
  }, [debouncedInput, autoDetectDialect]);

  const handleFormat = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError('Please enter SQL to format');
      setStats(null);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setWarning(null);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // Auto-detect dialect if enabled
      let actualDialect = dialect;
      if (autoDetectDialect) {
        actualDialect = detectSqlDialect(input);
        setDetectedDialect(actualDialect);
      } else {
        setDetectedDialect(null);
      }

      const options: SqlFormatterOptions = {
        dialect: actualDialect,
        indentSize,
        keywordCase,
        linesBetweenQueries,
        maxLineLength,
        preserveComments,
      };

      // First validate the SQL to get structured errors/warnings
      const validation = validateSQL(input);

      if (!validation.valid) {
        setValidationErrors(validation.errors || []);
        setValidationWarnings(validation.warnings || []);
      }

      const result = formatSQL(input, options);

      if (!result.success) {
        setError(result.error || 'Failed to format SQL');
        setOutput('');
        setStats(null);
        return;
      }

      // Show warning if there are validation issues
      if (result.warning) {
        setWarning(result.warning);
        // Parse the warning JSON and add to validationWarnings
        try {
          const warningData = JSON.parse(result.warning);
          if (warningData.warnings) {
            setValidationWarnings(warningData.warnings);
          }
        } catch (e) {
          // If parsing fails, just set the warning as text
          console.error('Failed to parse warning:', e);
        }
      }

      setOutput(result.formatted || '');
      setStats({
        lines: result.lines || 0,
        characters: result.characters || 0,
        keywords: result.keywords || 0,
        statements: result.statements || 0,
      });
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 3000);

      // Track successful formatting
      trackCustom({
        inputSize: input.length,
        outputSize: result.formatted?.length || 0,
        success: true,
        dialect: actualDialect,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format SQL');
      setOutput('');
      setStats(null);

      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    input,
    dialect,
    autoDetectDialect,
    indentSize,
    keywordCase,
    linesBetweenQueries,
    maxLineLength,
    preserveComments,
    trackUse,
    trackError,
  ]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter SQL to validate');
      return;
    }

    const validation = validateSQL(input);

    setValidationErrors(validation.errors || []);
    setValidationWarnings(validation.warnings || []);

    if (!validation.valid) {
      setError(null); // Clear general error since we're showing structured validation
    } else {
      setError(null);
      setValidationErrors([]);
      setValidationWarnings([]);
      // Show success message briefly
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 2000);
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await copy(output);
  }, [output, copy]);

  const handleDownload = useCallback(() => {
    if (output) {
      downloadText(output, { filename: 'formatted-query.sql' });
    }
  }, [output, downloadText]);

  const handleExampleSql = () => {
    const example = `with monthly_sales as(select date_trunc('month',order_date)as month,sum(total_amount)as revenue,count(*)as order_count from orders where order_date>=current_date-interval '12 months'group by date_trunc('month',order_date)),top_products as(select p.name,sum(oi.quantity*oi.price)as product_revenue from order_items oi join products p on oi.product_id=p.id join orders o on oi.order_id=o.id where o.order_date>=current_date-interval '3 months'group by p.id,p.name order by product_revenue desc limit 5)select ms.month,ms.revenue,ms.order_count,case when ms.revenue>lag(ms.revenue)over(order by ms.month)then'Growth'when ms.revenue<lag(ms.revenue)over(order by ms.month)then'Decline'else'Stable'end as trend,(select string_agg(tp.name,', ')from top_products tp)as top_products_last_quarter from monthly_sales ms order by ms.month desc;`;
    setInput(example);
    setError(null);
    setWarning(null);
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            SQL Input
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExampleSql}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Load Complex
            </button>
            <button
              onClick={() => {
                const errorExample = `SELECT 
    u.name,
    o.total_amount,
    non_existent_column,
    COUNT(*) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.customer_id
WHERE o.status = 'completed'
    AND u.created_at > o.order_date  -- Logica questionabile
GROUP BY u.name  -- Manca o.total_amount nel GROUP BY
HAVING order_count > 5
ORDER BY unknown_column;  -- Colonna non definita`;
                setInput(errorExample);
                setError(null);
                setWarning(null);
                setValidationErrors([]);
                setValidationWarnings([]);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Load Errors
            </button>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
            >
              <Settings className="h-3.5 w-3.5" />
              Options
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your SQL query or script here..."
          className="min-h-[200px] w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          spellCheck={false}
        />
      </div>

      {/* Options Section */}
      {showOptions && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Formatting Options</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* SQL Dialect */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                SQL Dialect
              </label>
              <div className="flex gap-2">
                <select
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as SqlDialect)}
                  disabled={autoDetectDialect}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="sqlserver">SQL Server</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={autoDetectDialect}
                    onChange={(e) => setAutoDetectDialect(e.target.checked)}
                    className="rounded"
                  />
                  Auto
                </label>
              </div>
            </div>

            {/* Keyword Case */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Keyword Case
              </label>
              <select
                value={keywordCase}
                onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="unchanged">Unchanged</option>
              </select>
            </div>

            {/* Indentation */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Indentation
              </label>
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>Tab (8 spaces)</option>
              </select>
            </div>

            {/* Max Line Length */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Max Line Length
              </label>
              <input
                type="number"
                value={maxLineLength}
                onChange={(e) => setMaxLineLength(Number(e.target.value))}
                min="40"
                max="200"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Lines Between Queries */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Lines Between Queries
              </label>
              <input
                type="number"
                value={linesBetweenQueries}
                onChange={(e) => setLinesBetweenQueries(Number(e.target.value))}
                min="0"
                max="5"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Preserve Comments */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preserveComments}
                  onChange={(e) => setPreserveComments(e.target.checked)}
                  className="rounded"
                />
                Preserve comments
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleFormat}
          disabled={!input.trim() || isProcessing}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
            !input.trim() || isProcessing
              ? 'cursor-not-allowed bg-gray-400'
              : formatSuccess
                ? 'bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Formatting...
            </>
          ) : formatSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Formatted!
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Format SQL
            </>
          )}
        </button>

        <button
          onClick={handleValidate}
          disabled={!input.trim()}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <FileText className="h-4 w-4" />
          Validate SQL
        </button>

        <button
          onClick={() => {
            setInput('');
            setOutput('');
            setError(null);
            setWarning(null);
            setStats(null);
            setValidationErrors([]);
            setValidationWarnings([]);
          }}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Clear
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

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-red-900 dark:text-red-100">
              Validation Errors
            </h3>
          </div>
          <div className="space-y-2">
            {validationErrors.map((err, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="inline-flex min-w-[60px] items-center rounded bg-red-200 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-800/50 dark:text-red-200">
                  L{err.line}:C{err.column}
                </span>
                <span className="text-red-700 dark:text-red-300">
                  {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Warnings Display */}
      {validationWarnings.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-medium text-orange-900 dark:text-orange-100">
              Validation Warnings
            </h3>
          </div>
          <div className="space-y-2">
            {validationWarnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="inline-flex min-w-[40px] items-center rounded bg-orange-200 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-800/50 dark:text-orange-200">
                  L{warning.line}
                </span>
                <span className="text-orange-700 dark:text-orange-300">
                  {warning.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-gray-700 dark:text-gray-300">
            <strong>Lines:</strong> {stats.lines}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            <strong>Characters:</strong> {stats.characters}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            <strong>Keywords:</strong> {stats.keywords}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            <strong>Statements:</strong> {stats.statements}
          </span>
          {autoDetectDialect && detectedDialect && (
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Detected Dialect:</strong>{' '}
              {detectedDialect === 'mysql'
                ? 'MySQL'
                : detectedDialect === 'postgresql'
                  ? 'PostgreSQL'
                  : detectedDialect === 'sqlite'
                    ? 'SQLite'
                    : detectedDialect === 'sqlserver'
                      ? 'SQL Server'
                      : detectedDialect}
            </span>
          )}
        </div>
      )}

      {/* Output Section */}
      {output && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Formatted SQL
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                title="Copy formatted SQL"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                title="Download formatted SQL"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
          <div className="relative">
            <pre className="max-h-96 overflow-auto rounded-md border border-gray-300 bg-gray-50 p-4 font-mono text-sm dark:border-gray-600 dark:bg-gray-700">
              <code className="text-gray-800 dark:text-gray-200">{output}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4" />
          Usage Tips
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Use auto-detect dialect for best keyword recognition</li>
          <li>
            • Choose uppercase keywords for better readability and standards
          </li>
          <li>• Enable comment preservation to keep important documentation</li>
          <li>• Use 4-space indentation for optimal balance of readability</li>
        </ul>
      </div>
    </div>
  );
}
