'use client';

import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  memo,
} from 'react';
import {
  Copy,
  Download,
  Check,
  Loader2,
  ChevronRight,
  ChevronDown,
  FileJson,
  Minimize2,
  Maximize2,
  Eye,
  Code,
  Search,
  CheckCircle,
  Upload,
  File,
  AlertCircle,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolProcessor } from '@/lib/hooks/useToolProcessor';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps, JsonValue, JsonObject } from '@/lib/types/tools';
import { formatJSON, minifyJSON } from '@/lib/tools/json';

// ============================================================================
// PERFORMANCE OPTIMIZATIONS (Dec 2024)
// ============================================================================
// - Consolidated 12+ useState into useReducer for better state management
// - Memoized renderJsonTree with useMemo
// - Created memoized JsonTreeNode component with React.memo
// - Used useCallback for event handlers
// ============================================================================

interface JsonFormatterProps extends BaseToolProps {}

// State type for useReducer
interface FormatterState {
  input: string;
  output: string;
  viewMode: 'tree' | 'formatted';
  indentSize: number;
  sortKeys: boolean;
  searchKey: string;
  searchResults: Array<{ value: any; path: string }>;
  hasSearched: boolean;
  formatSuccess: boolean;
  copiedPaths: Record<number, boolean>;
  copiedValues: Record<number, boolean>;
  uploadedFileName: string;
  uploadedFileSize: number;
  uploadedFileContent: string;
  isLargeFile: boolean;
  previewLines: number;
  fullFormattedOutput: string;
}

type FormatterAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_OUTPUT'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'tree' | 'formatted' }
  | { type: 'SET_INDENT_SIZE'; payload: number }
  | { type: 'SET_SORT_KEYS'; payload: boolean }
  | { type: 'SET_SEARCH_KEY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: Array<{ value: any; path: string }> }
  | { type: 'SET_HAS_SEARCHED'; payload: boolean }
  | { type: 'SET_FORMAT_SUCCESS'; payload: boolean }
  | { type: 'SET_COPIED_PATH'; payload: { index: number; value: boolean } }
  | { type: 'SET_COPIED_VALUE'; payload: { index: number; value: boolean } }
  | {
      type: 'SET_UPLOADED_FILE';
      payload: { name: string; size: number; content: string };
    }
  | { type: 'CLEAR_UPLOADED_FILE' }
  | {
      type: 'SET_LARGE_FILE_INFO';
      payload: { isLarge: boolean; lines: number };
    }
  | { type: 'SET_FULL_OUTPUT'; payload: string }
  | { type: 'RESET_SEARCH' };

const initialState: FormatterState = {
  input: '',
  output: '',
  viewMode: 'formatted',
  indentSize: 2,
  sortKeys: false,
  searchKey: '',
  searchResults: [],
  hasSearched: false,
  formatSuccess: false,
  copiedPaths: {},
  copiedValues: {},
  uploadedFileName: '',
  uploadedFileSize: 0,
  uploadedFileContent: '',
  isLargeFile: false,
  previewLines: 0,
  fullFormattedOutput: '',
};

function formatterReducer(
  state: FormatterState,
  action: FormatterAction
): FormatterState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_INDENT_SIZE':
      return { ...state, indentSize: action.payload };
    case 'SET_SORT_KEYS':
      return { ...state, sortKeys: action.payload };
    case 'SET_SEARCH_KEY':
      return { ...state, searchKey: action.payload, hasSearched: false };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_HAS_SEARCHED':
      return { ...state, hasSearched: action.payload };
    case 'SET_FORMAT_SUCCESS':
      return { ...state, formatSuccess: action.payload };
    case 'SET_COPIED_PATH':
      return {
        ...state,
        copiedPaths: {
          ...state.copiedPaths,
          [action.payload.index]: action.payload.value,
        },
      };
    case 'SET_COPIED_VALUE':
      return {
        ...state,
        copiedValues: {
          ...state.copiedValues,
          [action.payload.index]: action.payload.value,
        },
      };
    case 'SET_UPLOADED_FILE':
      return {
        ...state,
        uploadedFileName: action.payload.name,
        uploadedFileSize: action.payload.size,
        uploadedFileContent: action.payload.content,
      };
    case 'CLEAR_UPLOADED_FILE':
      return {
        ...state,
        uploadedFileName: '',
        uploadedFileSize: 0,
        uploadedFileContent: '',
        isLargeFile: false,
        input: '',
        output: '',
      };
    case 'SET_LARGE_FILE_INFO':
      return {
        ...state,
        isLargeFile: action.payload.isLarge,
        previewLines: action.payload.lines,
      };
    case 'SET_FULL_OUTPUT':
      return { ...state, fullFormattedOutput: action.payload };
    case 'RESET_SEARCH':
      return { ...state, copiedPaths: {}, copiedValues: {}, hasSearched: true };
    default:
      return state;
  }
}

// Memoized JSON Tree Node component for better performance
interface JsonTreeNodeProps {
  data: JsonValue;
  depth: number;
}

const JsonTreeNode = memo(function JsonTreeNode({
  data,
  depth,
}: JsonTreeNodeProps) {
  if (data === null) return <span className="text-gray-500">null</span>;
  if (typeof data === 'boolean')
    return (
      <span className="text-purple-600 dark:text-purple-400">
        {String(data)}
      </span>
    );
  if (typeof data === 'number')
    return <span className="text-blue-600 dark:text-blue-400">{data}</span>;
  if (typeof data === 'string')
    return (
      <span className="text-green-600 dark:text-green-400">
        &ldquo;{data}&rdquo;
      </span>
    );

  if (Array.isArray(data)) {
    return (
      <details open={depth < 2} className="ml-4">
        <summary className="cursor-pointer rounded px-1 hover:bg-gray-100 dark:hover:bg-gray-700">
          <span className="text-gray-500">Array[{data.length}]</span>
        </summary>
        <div className="ml-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-400">{index}:</span>
              <JsonTreeNode data={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return (
      <details open={depth < 2} className="ml-4">
        <summary className="cursor-pointer rounded px-1 hover:bg-gray-100 dark:hover:bg-gray-700">
          <span className="text-gray-500">Object{`{${entries.length}}`}</span>
        </summary>
        <div className="ml-4">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400">
                &ldquo;{key}&rdquo;:
              </span>
              <JsonTreeNode data={value} depth={depth + 1} />
            </div>
          ))}
        </div>
      </details>
    );
  }

  return <span>{String(data)}</span>;
});

export default function JsonFormatter({ categoryColor, dictionary }: JsonFormatterProps) {
  const ui = dictionary?.tools?.['json-formatter']?.ui ?? {};
  // Consolidated state with useReducer for better performance
  const [state, dispatch] = useReducer(formatterReducer, initialState);
  const {
    input,
    output,
    viewMode,
    indentSize,
    sortKeys,
    searchKey,
    searchResults,
    hasSearched,
    formatSuccess,
    copiedPaths,
    copiedValues,
    uploadedFileName,
    uploadedFileSize,
    uploadedFileContent,
    isLargeFile,
    previewLines,
    fullFormattedOutput,
  } = state;

  const outputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Auto-fix notes from formatJSON/minifyJSON (e.g. "wrapped NDJSON into array")
  const [fixWarnings, setFixWarnings] = useState<string[]>([]);

  // Use unified hooks
  const { copied, copy } = useCopy();
  const { isProcessing, error, processSync } = useToolProcessor<
    string,
    string
  >();
  const { downloadJSON, downloadText } = useDownload();
  const { trackError } = useToolTracking('json-formatter');
  const { addToHistory } = useToolStore();

  const formatJson = useCallback(() => {
    // Use uploaded file content if available, otherwise use manual input
    const contentToProcess = uploadedFileContent || input;

    if (!contentToProcess.trim()) {
      dispatch({ type: 'SET_OUTPUT', payload: '' });
      return;
    }

    // Estimate processing time for very large files
    const inputSizeMB = uploadedFileName
      ? uploadedFileSize / (1024 * 1024)
      : new Blob([contentToProcess]).size / (1024 * 1024);

    // Warn user about potentially long processing time for files > 50MB
    if (inputSizeMB > 50) {
      const confirmed = window.confirm(
        `⚠️ Very large file detected (${inputSizeMB.toFixed(1)} MB)\n\n` +
          `Processing may take several minutes and could use significant memory.\n` +
          `For files over 500MB, consider using a desktop JSON tool instead.\n\n` +
          `Continue processing?`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      const startTime = Date.now();
      let warnings: string[] | undefined;
      const result = processSync(contentToProcess, (inputText) => {
        // Use the robust formatJSON function that handles Python-style syntax
        const formatResult = formatJSON(inputText);

        if (!formatResult.success) {
          throw new Error(formatResult.error || 'Failed to parse JSON');
        }

        warnings = formatResult.warnings;

        const parsed = JSON.parse(formatResult.result || '{}');

        // Sort keys if enabled
        const processObject = (obj: JsonValue): JsonValue => {
          if (!sortKeys || typeof obj !== 'object' || obj === null) return obj;

          if (Array.isArray(obj)) {
            return obj.map(processObject);
          }

          const sorted: JsonObject = {};
          Object.keys(obj as JsonObject)
            .sort()
            .forEach((key) => {
              sorted[key] = processObject((obj as JsonObject)[key]);
            });
          return sorted;
        };

        const processed = sortKeys ? processObject(parsed) : parsed;
        return JSON.stringify(processed, null, indentSize);
      });

      // Store the full formatted output
      dispatch({ type: 'SET_FULL_OUTPUT', payload: result });

      // Check if we should limit preview (only for uploaded files > 5MB)
      const lines = result.split('\n');
      const totalLines = lines.length;
      const fileSizeMB = uploadedFileSize / (1024 * 1024); // Convert bytes to MB
      const shouldLimitPreview = Boolean(
        uploadedFileName && fileSizeMB > 5 && totalLines > 200
      );

      dispatch({
        type: 'SET_LARGE_FILE_INFO',
        payload: { isLarge: shouldLimitPreview, lines: totalLines },
      });

      // If it's a large uploaded file, show only the first 200 lines in the preview
      if (shouldLimitPreview) {
        const preview = lines.slice(0, 200).join('\n');
        dispatch({ type: 'SET_OUTPUT', payload: preview });
      } else {
        dispatch({ type: 'SET_OUTPUT', payload: result });
      }

      setFixWarnings(warnings ?? []);
      dispatch({ type: 'SET_FORMAT_SUCCESS', payload: true });
      setTimeout(
        () => dispatch({ type: 'SET_FORMAT_SUCCESS', payload: false }),
        3000
      );

      addToHistory({
        id: crypto.randomUUID(),
        tool: 'json-formatter',
        input: contentToProcess,
        output: result,
        timestamp: startTime,
      });

      // Auto-scroll to output
      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err) {
      setFixWarnings([]);
      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        contentToProcess.length
      );
      // Error is handled by useToolProcessor
    }
  }, [
    input,
    uploadedFileContent,
    uploadedFileName,
    uploadedFileSize,
    sortKeys,
    indentSize,
    processSync,
    trackError,
    addToHistory,
  ]);

  const minifyJson = useCallback(() => {
    // Use uploaded file content if available, otherwise use manual input
    const contentToProcess = uploadedFileContent || input;

    if (!contentToProcess.trim()) {
      dispatch({ type: 'SET_OUTPUT', payload: '' });
      return;
    }

    try {
      const startTime = Date.now();
      let warnings: string[] | undefined;
      const result = processSync(contentToProcess, (inputText) => {
        // Use the robust minifyJSON function that handles Python-style syntax
        const minifyResult = minifyJSON(inputText);

        if (!minifyResult.success) {
          throw new Error(minifyResult.error || 'Failed to parse JSON');
        }

        warnings = minifyResult.warnings;
        return minifyResult.result || '';
      });

      setFixWarnings(warnings ?? []);
      dispatch({ type: 'SET_OUTPUT', payload: result });

      addToHistory({
        id: crypto.randomUUID(),
        tool: 'json-formatter',
        input: contentToProcess,
        output: result,
        timestamp: startTime,
      });
    } catch (err) {
      setFixWarnings([]);
      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        contentToProcess.length
      );
      // Error is handled by useToolProcessor
    }
  }, [
    input,
    uploadedFileContent,
    processSync,
    trackError,
    addToHistory,
  ]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check if it's a JSON file
      if (
        !file.name.toLowerCase().endsWith('.json') &&
        file.type !== 'application/json'
      ) {
        dispatch({ type: 'SET_FORMAT_SUCCESS', payload: false });
        // Handle error through the error state if needed
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        dispatch({
          type: 'SET_UPLOADED_FILE',
          payload: { name: file.name, size: file.size, content },
        });

        // Auto-format the uploaded JSON (formatJson will be called via useEffect or manually)
      };
      reader.readAsText(file);
    },
    []
  );

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCopy = useCallback(async () => {
    await copy(output);
    // Don't clear search results when copying output
  }, [copy, output]);

  const handleCopyPath = useCallback(async (path: string, index: number) => {
    await navigator.clipboard.writeText(path);
    dispatch({ type: 'SET_COPIED_PATH', payload: { index, value: true } });
    setTimeout(() => {
      dispatch({ type: 'SET_COPIED_PATH', payload: { index, value: false } });
    }, 2000);
  }, []);

  const handleCopyValue = useCallback(async (value: any, index: number) => {
    const valueString =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    await navigator.clipboard.writeText(valueString);
    dispatch({ type: 'SET_COPIED_VALUE', payload: { index, value: true } });
    setTimeout(() => {
      dispatch({ type: 'SET_COPIED_VALUE', payload: { index, value: false } });
    }, 2000);
  }, []);

  const handleDownload = async () => {
    if (!output) return;

    try {
      // Use full formatted output for large files, or regular output for smaller files
      const contentToDownload = fullFormattedOutput || output;
      const filename = uploadedFileName
        ? uploadedFileName.replace('.json', '_formatted.json')
        : 'formatted.json';

      // Try to download as JSON if valid, otherwise as text
      try {
        const parsed = JSON.parse(contentToDownload);
        await downloadJSON(parsed, filename);
      } catch {
        await downloadText(contentToDownload, {
          filename: filename.replace('.json', '.txt'),
          mimeType: 'text/plain',
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const searchJsonKey = useCallback(() => {
    dispatch({ type: 'RESET_SEARCH' });

    if (!output || !searchKey.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    try {
      const data = JSON.parse(output);
      const results: Array<{ value: any; path: string }> = [];

      const findAllKeys = (
        obj: any,
        key: string,
        path: string[] = []
      ): void => {
        // Check if current object has the key
        if (
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          key in obj
        ) {
          results.push({
            value: obj[key],
            path: [...path, `['${key}']`].join(''),
          });
        }

        // Recursively search in nested objects
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              findAllKeys(obj[i], key, [...path, `[${i}]`]);
            }
          } else {
            for (const [k, v] of Object.entries(obj)) {
              if (k !== key) {
                // Don't go deeper for the same key we just found
                findAllKeys(v, key, [...path, `['${k}']`]);
              }
            }
          }
        }
      };

      findAllKeys(data, searchKey);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (err) {
      console.error('Search error:', err);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    }
  }, [output, searchKey]);

  // Memoized tree view - only re-renders when output changes
  const memoizedTreeView = useMemo(() => {
    if (!output) return null;
    try {
      const data = JSON.parse(output);
      return <JsonTreeNode data={data} depth={0} />;
    } catch {
      return (
        <div className="text-red-500">
          {ui.treeViewError || 'Error rendering tree view. Please use formatted view.'}
        </div>
      );
    }
  }, [output]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileJson className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ui.headerTitle || 'JSON Formatter & Validator'}
          </h3>
        </div>
      </div>

      <div className="relative space-y-4 p-4">
        {/* Processing Overlay */}
        {isProcessing && !uploadedFileName && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-300 bg-white/90 px-4 py-5 shadow-lg dark:border-gray-600 dark:bg-gray-900/90">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {ui.processingOverlayTitle || 'Processing JSON...'}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {ui.processingOverlaySubtext || 'Large JSON detected. This may take a moment.'}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ui.inputLabel || 'Input JSON'}
            </label>
            <button
              onClick={handleFileUploadClick}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <Upload className="h-4 w-4" />
              {ui.uploadButton || 'Upload JSON File'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {uploadedFileName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <File className="h-4 w-4" />
              <span>{ui.uploadedPrefix || 'Uploaded:'} {uploadedFileName}</span>
            </div>
          )}
          <div className="relative">
            <textarea
              value={uploadedFileName ? '' : input}
              onChange={(e) => {
                dispatch({ type: 'SET_INPUT', payload: e.target.value });
                // Reset upload states when manually editing
                if (uploadedFileName) {
                  dispatch({ type: 'CLEAR_UPLOADED_FILE' });
                }
              }}
              placeholder={
                uploadedFileName
                  ? ''
                  : (ui.inputPlaceholder || '{"key": "value", "array": [1, 2, 3]} or upload a JSON file above')
              }
              className="h-48 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
              style={{
                borderColor: error ? '#ef4444' : `${categoryColor}30`,
              }}
              onFocus={(e) => (e.target.style.borderColor = categoryColor)}
              onBlur={(e) =>
                (e.target.style.borderColor = error
                  ? '#ef4444'
                  : `${categoryColor}30`)
              }
              disabled={!!uploadedFileName}
            />
            {uploadedFileName && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100/80 backdrop-blur-sm dark:bg-gray-800/80">
                <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white/90 px-4 py-3 shadow-sm dark:border-gray-600 dark:bg-gray-900/90">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {ui.processingPrefix || 'Processing:'} {uploadedFileName}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {(uploadedFileSize / (1024 * 1024)).toFixed(1)} MB -
                          {' '}{ui.pleaseWait || 'Please wait...'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <File className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {uploadedFileName}
                      </span>
                      <button
                        onClick={() =>
                          dispatch({ type: 'CLEAR_UPLOADED_FILE' })
                        }
                        className="ml-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title={ui.removeFileTitle || 'Remove file and clear input'}
                        aria-label={ui.removeFileAriaLabel || 'Remove uploaded file'}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="animate-shake text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              {ui.indentLabel || 'Indent:'}
            </label>
            <select
              value={indentSize}
              onChange={(e) =>
                dispatch({
                  type: 'SET_INDENT_SIZE',
                  payload: Number(e.target.value),
                })
              }
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value={2}>{ui.indent2Spaces || '2 spaces'}</option>
              <option value={4}>{ui.indent4Spaces || '4 spaces'}</option>
              <option value={0}>{ui.indentTab || 'Tab'}</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) =>
                dispatch({ type: 'SET_SORT_KEYS', payload: e.target.checked })
              }
              className="rounded"
              style={{ accentColor: categoryColor }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {ui.sortKeysLabel || 'Sort keys'}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={formatJson}
            disabled={(!input && !uploadedFileName) || isProcessing}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: categoryColor,
              boxShadow: `0 3px 10px ${categoryColor}40`,
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {ui.processingButton || 'Processing...'}
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                {ui.formatButton || 'Format'}
              </>
            )}
          </button>
          <button
            onClick={minifyJson}
            disabled={(!input && !uploadedFileName) || isProcessing}
            className="flex items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: categoryColor,
              color: categoryColor,
            }}
          >
            <Minimize2 className="h-3.5 w-3.5" />
            {ui.minifyButton || 'Minify'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Auto-fix Warnings */}
        {!error && fixWarnings.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            {fixWarnings.map((warning) => (
              <p
                key={warning}
                className="text-sm text-amber-700 dark:text-amber-300"
              >
                ⚠ {warning}
              </p>
            ))}
          </div>
        )}

        {/* Success Indicator */}
        {formatSuccess && (
          <div className="animate-slideIn flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{ui.successMessage || 'JSON formatted successfully!'}</span>
          </div>
        )}

        {/* Output Section */}
        {output && !error && (
          <div className="animate-slideIn space-y-2" ref={outputRef}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.outputLabel || 'Output'}{' '}
                {isLargeFile && (
                  <span className="text-gray-500">
                    {ui.previewNote || '(Preview - First 200 lines)'}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    dispatch({
                      type: 'SET_VIEW_MODE',
                      payload: viewMode === 'tree' ? 'formatted' : 'tree',
                    })
                  }
                  className="flex items-center gap-1 rounded-lg px-3 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={`Switch to ${viewMode === 'tree' ? 'formatted' : 'tree'} view`}
                >
                  {viewMode === 'tree' ? (
                    <>
                      <Code className="h-4 w-4" />
                      <span className="text-sm">{ui.viewCode || 'Code'}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{ui.viewTree || 'Tree'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">{ui.copiedButton || 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">{ui.copyButton || 'Copy'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm">{ui.downloadButton || 'Download'}</span>
                </button>
              </div>
            </div>

            {viewMode === 'formatted' ? (
              <div className="relative">
                <pre
                  className="min-h-64 w-full resize-y overflow-auto rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 dark:bg-gray-900 dark:text-white"
                  style={{
                    borderColor: formatSuccess
                      ? '#10b981'
                      : `${categoryColor}30`,
                    height: '30rem',
                  }}
                >
                  <code className="language-json">{output}</code>
                </pre>
                {isLargeFile && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {ui.largeFileTitle || 'Large file detected'} ({previewLines} lines total,{' '}
                        {(uploadedFileSize / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                      {ui.largeFileDescription || 'Only the first 200 lines are shown above. Download the complete formatted file using the button above to view the full content.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="min-h-64 w-full resize-y overflow-auto rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm dark:bg-gray-900"
                style={{
                  borderColor: formatSuccess ? '#10b981' : `${categoryColor}30`,
                  height: '30rem',
                }}
              >
                {memoizedTreeView}
              </div>
            )}

            {/* JSON Key Search Section */}
            <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={ui.searchPlaceholder || 'Search for a key in JSON...'}
                  value={searchKey}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_SEARCH_KEY',
                      payload: e.target.value,
                    })
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchJsonKey();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={searchJsonKey}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
                  style={{ backgroundColor: categoryColor }}
                >
                  {ui.searchButton || 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="animate-slideIn space-y-3">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {ui.foundPrefix || 'Found'} {searchResults.length} {searchResults.length > 1 ? (ui.foundOccurrences || 'occurrences') : (ui.foundOccurrence || 'occurrence')}:
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="space-y-2 rounded-lg bg-white p-4 dark:bg-gray-800"
                    >
                      {searchResults.length > 1 && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {ui.occurrencePrefix || 'Occurrence'} {index + 1}
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {ui.valueLabel || 'Value:'}
                          </span>
                          <button
                            onClick={() => handleCopyValue(result.value, index)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {copiedValues[index] ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">{ui.copiedButton || 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>{ui.copyValueButton || 'Copy Value'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-gray-100 p-2 text-sm dark:bg-gray-900">
                          <code className="break-all">
                            {JSON.stringify(result.value, null, 2)}
                          </code>
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {ui.pathLabel || 'Path:'}
                          </span>
                          <button
                            onClick={() => handleCopyPath(result.path, index)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {copiedPaths[index] ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">{ui.copiedButton || 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>{ui.copyPathButton || 'Copy Path'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <code className="block overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-100 p-2 text-sm text-purple-600 dark:bg-gray-900 dark:text-purple-400">
                          {result.path}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && searchKey && searchResults.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {ui.noKeyPrefix || 'No key'} &ldquo;{searchKey}&rdquo; {ui.noKeyFound || 'found in the JSON.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
