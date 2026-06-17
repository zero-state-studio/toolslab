'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Download,
  Check,
  Loader2,
  Upload,
  FileText,
  Image,
  Lock,
  Unlock,
  RefreshCw,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  processBase64Input,
  processFile,
  getFileExtensionFromMimeType,
  Base64Options,
  FileProcessResult,
} from '@/lib/tools/base64';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

interface Base64ToolProps {
  categoryColor: string;
  dictionary?: any;
}

export default function Base64Tool({ categoryColor, dictionary }: Base64ToolProps) {
  const ui = dictionary?.tools?.['base64-encode']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { copied, copy } = useCopy();
  const { downloadText, downloadBase64AsBinary } = useDownload();
  const { trackUse, trackError } = useToolTracking('base64-encode');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });
  const [fileInfo, setFileInfo] = useState<FileProcessResult | null>(null);
  const [operation, setOperation] = useState<'auto' | 'encode' | 'decode'>(
    'auto'
  );
  const [options, setOptions] = useState<Base64Options>({
    urlSafe: false,
    lineBreaks: false,
    lineLength: 76,
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detectedOperation, setDetectedOperation] = useState<
    'encode' | 'decode'
  >('encode');
  const [mimeType, setMimeType] = useState<string>('');
  const [isDataURL, setIsDataURL] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Helper to extract tool link from suggestion text
  const getToolLinkFromSuggestion = useCallback(
    (suggestion: string): string | null => {
      const toolMappings: Record<string, string> = {
        'Base64 to PNG': '/tools/base64-to-png',
        'Base64 to JPG': '/tools/base64-to-jpg',
        'Base64 to JPEG': '/tools/base64-to-jpg',
        'Base64 to WEBP': '/tools/base64-to-webp',
        'Base64 to GIF': '/tools/base64-to-gif',
        'Base64 to PDF': '/tools/base64-to-pdf',
        'JSON Formatter': '/tools/json-formatter',
        'JWT Decoder': '/tools/jwt-decoder',
      };

      for (const [toolName, url] of Object.entries(toolMappings)) {
        if (suggestion.includes(toolName)) {
          return url;
        }
      }
      return null;
    },
    []
  );

  const handleProcess = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = processBase64Input(
        input,
        options,
        operation === 'auto' ? undefined : operation
      );

      setOutput(result.output);
      setSuggestions(result.suggestions || []);
      setDetectedOperation(result.operation);
      setMimeType(result.mimeType || '');
      setIsDataURL(result.isDataURL || false);

      // Track successful operation
      trackUse(input, result.output, {
        success: true,
      });

      // Auto-scroll to result
      scrollToResult();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setOutput('');
      setSuggestions([]);

      // Track error
      trackError(
        err instanceof Error ? err : new Error(errorMessage),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input, options, operation, trackUse, trackError, scrollToResult]);

  // Auto-process when input changes and operation is auto
  useEffect(() => {
    if (input.trim() && operation === 'auto') {
      const timer = setTimeout(() => {
        handleProcess();
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [input, operation, handleProcess]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await processFile(file);
      setFileInfo(result);
      setInput(result.base64);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await copy(output);
  };

  const handleDownload = async () => {
    if (!output) return;

    try {
      const effectiveOp = getEffectiveOperation();
      if (effectiveOp === 'decode' && mimeType && !isDataURL) {
        // Download as binary file
        const extension = getFileExtensionFromMimeType(mimeType);
        const filename = `decoded.${extension}`;
        await downloadBase64AsBinary(output, filename, mimeType);
      } else if (effectiveOp === 'decode' && output.length < 1000000) {
        // Download decoded text
        await downloadText(output, {
          filename: 'decoded.txt',
          mimeType: 'text/plain',
        });
      } else {
        // Download Base64 text
        await downloadText(output, {
          filename: 'encoded.txt',
          mimeType: 'text/plain',
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setSuggestions([]);
    setFileInfo(null);
    setMimeType('');
    setIsDataURL(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertSample = (sample: string) => {
    setInput(sample);
  };

  // Calculate the actual operation that will be performed
  const getEffectiveOperation = (): 'encode' | 'decode' => {
    if (operation !== 'auto') {
      return operation;
    }
    return detectedOperation;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setOperation('auto')}
              className={`rounded px-3 py-1 text-xs ${operation === 'auto' ? 'text-white' : 'text-gray-600'}`}
              style={{
                backgroundColor:
                  operation === 'auto' ? categoryColor : 'transparent',
              }}
            >
              {ui.modeAuto || 'Auto'}
            </button>
            <button
              onClick={() => setOperation('encode')}
              className={`rounded px-3 py-1 text-xs ${operation === 'encode' ? 'text-white' : 'text-gray-600'}`}
              style={{
                backgroundColor:
                  operation === 'encode' ? categoryColor : 'transparent',
              }}
            >
              {ui.modeEncode || 'Encode'}
            </button>
            <button
              onClick={() => setOperation('decode')}
              className={`rounded px-3 py-1 text-xs ${operation === 'decode' ? 'text-white' : 'text-gray-600'}`}
              style={{
                backgroundColor:
                  operation === 'decode' ? categoryColor : 'transparent',
              }}
            >
              {ui.modeDecode || 'Decode'}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {getEffectiveOperation() === 'encode'
              ? `📤 ${ui.statusEncoding || 'Encoding'}`
              : `📥 ${ui.statusDecoding || 'Decoding'}`}
          </div>

          {mimeType && (
            <div className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
              {mimeType}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={ui.ariaToggleOptions || 'Toggle options'}
            aria-expanded={showOptions}
          >
            <Settings className="h-4 w-4" />
          </button>

          {fileInfo && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">{fileInfo.fileName}</span>
              <span className="ml-2">
                ({Math.round(fileInfo.size / 1024)} KB)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Options Panel */}
        {showOptions && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {ui.optionsTitle || 'Options'}
            </h4>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.urlSafe}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      urlSafe: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">{ui.optionUrlSafe || 'URL Safe (- _ instead of + /)'}</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.lineBreaks}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      lineBreaks: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">{ui.optionLineBreaks || 'Line breaks (MIME format)'}</span>
              </label>
            </div>
          </div>
        )}

        {/* Sample Data */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => insertSample('Hello World! 🌍')}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {ui.sampleText || 'Sample Text'}
          </button>
          <button
            onClick={() =>
              insertSample(
                'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
              )
            }
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {ui.sampleJwtPayload || 'JWT Payload'}
          </button>
          <button
            onClick={() =>
              insertSample(
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
              )
            }
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {ui.sampleDataUrl || 'Data URL'}
          </button>
        </div>

        {/* File Upload Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group w-full rounded-lg border-2 border-dashed p-6 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
            style={{ borderColor: `${categoryColor}40` }}
          >
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-6 w-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              <div className="text-center">
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {ui.uploadDropText || 'Drop file here or click to upload'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ui.uploadMaxSize || 'Max file size: 10MB'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* File Info */}
        {fileInfo && fileInfo.dataURL && (
          <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5" />
              <div>
                <p className="font-medium">{fileInfo.fileName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fileInfo.mimeType} • {Math.round(fileInfo.size / 1024)}KB
                </p>
              </div>
              <div className="ml-auto flex h-12 w-12 items-center justify-center rounded border bg-gray-100 dark:bg-gray-800">
                <img
                  src={fileInfo.dataURL}
                  alt={`Preview of ${fileInfo.fileName}`}
                  className="h-full w-full rounded object-cover"
                  width="48"
                  height="48"
                />
              </div>
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ui.labelInput || 'Input'}
            </label>
            <span className="text-xs text-gray-500">
              {input.length} characters
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.inputPlaceholder || 'Enter text to encode or Base64 string to decode...'}
            className="h-32 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
            style={{
              borderColor: error ? '#ef4444' : `${categoryColor}30`,
            }}
            onFocus={(e) => (e.target.style.borderColor = categoryColor)}
            onBlur={(e) =>
              (e.target.style.borderColor = error
                ? '#ef4444'
                : `${categoryColor}30`)
            }
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleProcess}
            disabled={!input || isProcessing}
            className="flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: categoryColor,
              boxShadow: `0 4px 12px ${categoryColor}40`,
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {ui.btnProcessing || 'Processing...'}
              </>
            ) : (
              <>
                {getEffectiveOperation() === 'encode' ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                {getEffectiveOperation() === 'encode'
                  ? (ui.btnEncode || 'Encode')
                  : (ui.btnDecode || 'Decode')}
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg border-2 px-6 py-3 font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: categoryColor,
              color: categoryColor,
            }}
          >
            <X className="h-4 w-4" />
            {ui.btnClear || 'Clear'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div
            ref={resultRef}
            className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:bg-blue-950/20"
          >
            <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
              💡 {ui.suggestionsTitle || 'Suggestions'}
            </h4>
            {suggestions.map((suggestion, index) => {
              const toolLink = getToolLinkFromSuggestion(suggestion);
              return (
                <div
                  key={index}
                  className="mb-2 text-sm text-blue-800 last:mb-0 dark:text-blue-200"
                >
                  • {suggestion}
                  {toolLink && (
                    <Link
                      href={toolLink}
                      className="ml-2 inline-flex items-center gap-1 font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {ui.linkOpenTool || 'Open tool'} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Output Section */}
        {output && (
          <div
            ref={suggestions.length === 0 ? resultRef : undefined}
            className="animate-slideIn space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.labelOutput || 'Output'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {output.length} characters
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">{ui.btnCopied || 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">{ui.btnCopy || 'Copy'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm">{ui.btnDownload || 'Download'}</span>
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              className="h-32 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 dark:bg-gray-900 dark:text-white"
              style={{ borderColor: `${categoryColor}30` }}
            />

            {/* Image Preview for decoded images */}
            {getEffectiveOperation() === 'decode' &&
              mimeType?.startsWith('image/') && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ui.imagePreviewLabel || 'Image Preview'}
                  </label>
                  <div className="mt-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="flex min-h-[200px] items-center justify-center">
                      <img
                        src={`data:${mimeType};base64,${input.includes('base64,') ? input.split('base64,')[1] : input}`}
                        alt="Decoded image from Base64 string"
                        className="max-h-64 max-w-full rounded border object-contain"
                        style={{ aspectRatio: '16/9' }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.aspectRatio = 'auto';
                        }}
                        onError={() =>
                          setError('Could not display the decoded image')
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {ui.infoBoxText || "Base64 encoding converts binary data into ASCII text format. It's commonly used for embedding images in HTML/CSS, encoding data for APIs, and handling binary data in text-based protocols."}
          </p>
        </div>
      </div>
    </div>
  );
}
