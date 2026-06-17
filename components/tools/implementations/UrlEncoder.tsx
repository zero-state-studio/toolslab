'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Copy,
  Download,
  Check,
  Loader2,
  Link,
  Unlink,
  RefreshCw,
  Settings,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Globe,
  Code,
  FileText,
} from 'lucide-react';
import {
  processUrl,
  processUrls,
  generateSampleUrls,
  parseQueryParameters,
  buildQueryString,
  detectEncoding,
  detectOperation,
  UrlEncodeOptions,
  UrlProcessResult,
  SampleUrl,
} from '@/lib/tools/url-encode';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';

interface UrlEncoderProps extends BaseToolProps {}

export default function UrlEncoder({ categoryColor, dictionary }: UrlEncoderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { copied, copy } = useCopy();
  const { downloadText } = useDownload();
  const { trackCustom, trackError } = useToolTracking('url-encode');
  const { addToHistory } = useToolStore();

  const ui = dictionary?.tools?.['url-encode']?.ui ?? {};

  // Processing options
  const [options, setOptions] = useState<UrlEncodeOptions>({
    mode: 'auto',
    type: 'component',
    handlePlusAsSpace: true,
  });

  // UI state
  const [showOptions, setShowOptions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [originalEncoding, setOriginalEncoding] = useState<string>('');
  const [detectedOperation, setDetectedOperation] = useState<
    'encode' | 'decode'
  >('encode');
  const [showSamples, setShowSamples] = useState(false);
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  // Batch processing
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<UrlProcessResult[]>([]);

  // Sample URLs
  const [samples] = useState<SampleUrl[]>(generateSampleUrls());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleProcess = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setSuggestions([]);
      setError(null);
      setMetadata(null);
      setOriginalEncoding('');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      if (batchMode) {
        // Process multiple URLs
        const urls = input.split('\n').filter((url) => url.trim());
        const result = processUrls(urls, options);
        setBatchResults(result.results);
        const batchOutput = result.results
          .map((r) => (r.success ? r.result : `ERROR: ${r.error}`))
          .join('\n');
        setOutput(batchOutput);

        if (batchOutput) {
          addToHistory({
            id: crypto.randomUUID(),
            tool: 'url-encode',
            input,
            output: batchOutput,
            timestamp: startTime,
          });
        }
      } else {
        // Process single URL
        const result = processUrl(input, options);

        if (result.success) {
          setOutput(result.result || '');
          setSuggestions(result.suggestions || []);
          setMetadata(result.metadata);
          setOriginalEncoding(result.originalEncoding || '');
          setDetectedOperation(result.detectedOperation || 'encode');

          // Track successful encoding/decoding
          trackCustom({
            inputSize: input.length,
            outputSize: result.result?.length || 0,
            success: true,
            operation: result.detectedOperation,
          });

          if (result.result) {
            addToHistory({
              id: crypto.randomUUID(),
              tool: 'url-encode',
              input,
              output: result.result,
              timestamp: startTime,
            });
          }

          // Parse query parameters if URL has them
          if (result.metadata?.hasQueryParams && input.includes('?')) {
            try {
              const params = parseQueryParameters(input.split('?')[1] || '');
              setQueryParams(params);
            } catch (e) {
              // Ignore parsing errors
            }
          }
        } else {
          throw new Error(result.error || 'Processing failed');
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setOutput('');
      setSuggestions([]);

      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input, options, batchMode, trackError, addToHistory]);

  // Auto-process when input changes
  useEffect(() => {
    if (input.trim()) {
      const timer = setTimeout(() => {
        handleProcess();
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [input, options, handleProcess]);

  // Load sample URL
  const loadSample = (url: string) => {
    setInput(url);
    setShowSamples(false);
  };

  // Toggle mode (cycle through auto -> encode -> decode -> auto)
  const toggleMode = () => {
    setOptions((prev) => ({
      ...prev,
      mode:
        prev.mode === 'auto'
          ? 'encode'
          : prev.mode === 'encode'
            ? 'decode'
            : 'auto',
    }));
  };

  // Toggle type
  const toggleType = () => {
    setOptions((prev) => ({
      ...prev,
      type: prev.type === 'component' ? 'full' : 'component',
    }));
  };

  // Update query parameter
  const updateQueryParam = (key: string, value: string) => {
    const newParams = { ...queryParams, [key]: value };
    setQueryParams(newParams);

    // Rebuild URL with updated parameters
    if (input.includes('?')) {
      const baseUrl = input.split('?')[0];
      const newQueryString = buildQueryString(newParams);
      setInput(`${baseUrl}?${newQueryString}`);
    }
  };

  // Remove query parameter
  const removeQueryParam = (key: string) => {
    const newParams = { ...queryParams };
    delete newParams[key];
    setQueryParams(newParams);

    if (input.includes('?')) {
      const baseUrl = input.split('?')[0];
      const newQueryString = buildQueryString(newParams);
      setInput(newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl);
    }
  };

  // Get unique categories from samples
  const categories = ['all', ...new Set(samples.map((s) => s.category))];
  const filteredSamples =
    selectedCategory === 'all'
      ? samples
      : samples.filter((s) => s.category === selectedCategory);

  // Detect current encoding
  const currentEncoding = input ? detectEncoding(input) : 'plain';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-800">
          <Link className="h-5 w-5" style={{ color: categoryColor }} />
          <span className="font-medium">{ui.headerTitle || 'URL Encoder/Decoder'}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {ui.headerDescription || 'Encode and decode URL components and query parameters safely'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={toggleMode}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors"
          style={{ borderColor: categoryColor, color: categoryColor }}
        >
          {options.mode === 'auto' ? (
            <RefreshCw className="h-4 w-4" />
          ) : options.mode === 'encode' ? (
            <Link className="h-4 w-4" />
          ) : (
            <Unlink className="h-4 w-4" />
          )}
          {options.mode === 'auto'
            ? (ui.modeAuto || 'Auto')
            : options.mode === 'encode'
              ? (ui.modeEncode || 'Encode')
              : (ui.modeDecode || 'Decode')}
          {options.mode === 'auto' && input && (
            <span className="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">
              ({detectedOperation})
            </span>
          )}
        </button>

        <button
          onClick={toggleType}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors"
          style={{ borderColor: categoryColor, color: categoryColor }}
        >
          {options.type === 'component' ? (
            <Code className="h-4 w-4" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {options.type === 'component' ? (ui.typeComponent || 'Component') : (ui.typeFullUrl || 'Full URL')}
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors"
          style={{ borderColor: categoryColor, color: categoryColor }}
        >
          <Settings className="h-4 w-4" />
          {ui.optionsButton || 'Options'}
        </button>

        <button
          onClick={() => setShowSamples(!showSamples)}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors"
          style={{ borderColor: categoryColor, color: categoryColor }}
        >
          <FileText className="h-4 w-4" />
          {ui.examplesButton || 'Examples'}
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.handlePlusAsSpace}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      handlePlusAsSpace: e.target.checked,
                    }))
                  }
                />
                {ui.optionHandlePlus || 'Handle + as space (in query parameters)'}
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                />
                {ui.optionBatchMode || 'Batch mode (one URL per line)'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Samples Panel */}
      {showSamples && (
        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid max-h-60 gap-2 overflow-y-auto">
              {filteredSamples.map((sample, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-white p-3 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                        {sample.description}
                      </div>
                      <code className="break-all rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                        {sample.url}
                      </code>
                    </div>
                    <button
                      onClick={() => loadSample(sample.url)}
                      className="rounded px-2 py-1 text-xs"
                      style={{ color: categoryColor }}
                    >
                      {ui.loadSampleButton || 'Load'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {batchMode ? (ui.inputLabelBatch || 'URLs (one per line)') : (ui.inputLabelSingle || 'URL or Text')}
          </label>
          {currentEncoding !== 'plain' && (
            <span
              className={`rounded px-2 py-1 text-xs ${
                currentEncoding === 'encoded'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              }`}
            >
              {currentEncoding}
            </span>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            batchMode
              ? 'https://example.com/path with spaces\nhttps://café.example.com/search?q=hello world\n...'
              : 'https://example.com/path with spaces'
          }
          className="h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {metadata && (
          <div className="space-x-4 text-xs text-gray-500">
            {metadata.hasInternationalChars && (
              <span>🌍 International characters</span>
            )}
            {metadata.hasQueryParams && (
              <span>? {metadata.parameterCount} parameters</span>
            )}
            {metadata.hasSpecialChars && <span>⚡ Special characters</span>}
          </div>
        )}
      </div>

      {/* Query Parameters Editor */}
      {metadata?.hasQueryParams && Object.keys(queryParams).length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowQueryParams(!showQueryParams)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {showQueryParams ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Query Parameters ({Object.keys(queryParams).length})
          </button>

          {showQueryParams && (
            <div className="space-y-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-800/50">
              {Object.entries(queryParams).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="flex-1 rounded border bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700"
                  />
                  <span>=</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateQueryParam(key, e.target.value)}
                    className="flex-1 rounded border px-3 py-1 text-sm dark:bg-gray-800"
                  />
                  <button
                    onClick={() => removeQueryParam(key)}
                    className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1 text-sm">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="text-amber-700 dark:text-amber-300">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.outputLabel || 'Result'}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => copy(output)}
              disabled={!output}
              className="flex items-center gap-2 rounded border px-3 py-1 text-sm transition-colors disabled:opacity-50"
              style={{ borderColor: categoryColor, color: categoryColor }}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {ui.copyButton || 'Copy'}
            </button>
            <button
              onClick={() =>
                downloadText(output, { filename: 'url-processed.txt' })
              }
              disabled={!output}
              className="flex items-center gap-2 rounded border px-3 py-1 text-sm transition-colors disabled:opacity-50"
              style={{ borderColor: categoryColor, color: categoryColor }}
            >
              <Download className="h-4 w-4" />
              {ui.downloadButton || 'Download'}
            </button>
          </div>
        </div>
        <textarea
          value={isProcessing ? (ui.processingText || 'Processing...') : output}
          readOnly
          placeholder={ui.outputPlaceholder || 'Processed URL will appear here...'}
          className="h-32 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Batch Results */}
      {batchMode && batchResults.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.batchResultsLabel || 'Batch Results'} ({batchResults.filter((r) => r.success).length}/
            {batchResults.length} successful)
          </label>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {batchResults.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 ${
                  result.success
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                <div className="text-sm">
                  {result.success ? (
                    <code className="break-all">{result.result}</code>
                  ) : (
                    <span className="text-red-700 dark:text-red-300">
                      {result.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {ui.processingText || 'Processing...'}
          </span>
        </div>
      )}
    </div>
  );
}
