'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  Check,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Info,
  FileCheck,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Upload,
} from 'lucide-react';
import {
  base64ToGif,
  Base64ToGifResult,
  formatFileSize,
  estimateDecodedSize,
  isValidBase64,
  downloadBlob,
  sanitizeBase64Input,
} from '@/lib/tools/base64-to-gif';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import AdBanner from '@/components/ads/AdBanner';

interface Base64ToGifToolProps {
  categoryColor: string;
  dictionary?: any;
}

const FALLBACK_USAGE_TIPS = [
  'Valid GIF Base64 data starts with "R0lGOD" when encoded',
  'Data URL prefixes like "data:image/gif;base64," are removed automatically',
  'Both GIF87a and GIF89a formats are supported, including animated GIFs',
  'GIF headers are validated to confirm you have genuine GIF data',
  'Use the preview to verify your GIF plays correctly before downloading',
];

const RELATED_TOOLS = [
  { label: 'WebP', href: '/tools/base64-to-webp' },
  { label: 'PNG', href: '/tools/base64-to-png' },
  { label: 'JPEG', href: '/tools/base64-to-jpg' },
];

export default function Base64ToGifTool({
  categoryColor,
  dictionary,
}: Base64ToGifToolProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Base64ToGifResult | null>(null);
  const [fileName, setFileName] = useState('image.gif');
  const [validationInfo, setValidationInfo] = useState<{
    isValid: boolean;
    estimatedSize: number;
    hasDataUrlPrefix: boolean;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  const { copied, copy } = useCopy();
  const { trackCustom, trackError } = useToolTracking('base64-to-gif');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });
  const ui = dictionary?.tools?.['base64-to-gif']?.ui ?? {};

  // Detect format mismatch (data URL prefix says a different format)
  const formatMismatch = useMemo(() => {
    if (!input.startsWith('data:')) return null;
    const match = input.match(/^data:([^;]+);/);
    if (!match) return null;
    const inputMime = match[1];
    if (inputMime !== 'image/gif' && inputMime.startsWith('image/')) {
      return inputMime.replace('image/', '').toUpperCase();
    }
    return null;
  }, [input]);

  // Scroll to result when image finishes loading
  useEffect(() => {
    if (result?.success && !imageLoading && !imageError) {
      scrollToResult();
    }
  }, [result, imageLoading, imageError, scrollToResult]);

  // Core conversion — accepts input as parameter, no dependency on previewUrl state
  const processInput = useCallback(
    async (inputValue: string) => {
      setIsProcessing(true);
      setError(null);
      setImageLoading(false);
      setImageError(null);
      setImageDimensions(null);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        setPreviewUrl(null);
      }

      try {
        const conversionResult = await base64ToGif(inputValue, {
          fileName: 'image.gif',
          validateGifHeader: true,
        });
        setResult(conversionResult);

        if (conversionResult.success && conversionResult.gifBlob) {
          const url = URL.createObjectURL(conversionResult.gifBlob);
          previewUrlRef.current = url;
          setPreviewUrl(url);
          setImageLoading(true);

          trackCustom({
            event: 'tool.use',
            tool: 'base64-to-gif',
            inputSize: inputValue.length,
            outputSize: conversionResult.fileSize || 0,
            success: true,
            metadata: {
              fileSize: conversionResult.fileSize,
              isGif: conversionResult.metadata?.isGif,
              gifVersion: conversionResult.metadata?.version,
              width: conversionResult.metadata?.width,
              height: conversionResult.metadata?.height,
              frameCount: conversionResult.metadata?.frameCount,
            },
          });
        } else {
          const msg = conversionResult.error || 'Conversion failed';
          setError(msg);
          trackError(new Error(msg), inputValue.length);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(msg);
        setResult(null);
        trackError(
          err instanceof Error ? err : new Error(String(err)),
          inputValue.length
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [trackCustom, trackError]
  );

  // Debounced validate + auto-convert on input change
  useEffect(() => {
    if (!input.trim()) {
      setValidationInfo(null);
      setResult(null);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const hasDataUrlPrefix = input.startsWith('data:');
      const { cleaned } = sanitizeBase64Input(input);
      const isValid = isValidBase64(cleaned);
      const estimatedSize = isValid ? estimateDecodedSize(cleaned) : 0;
      setValidationInfo({ isValid, estimatedSize, hasDataUrlPrefix });

      if (isValid) {
        await processInput(input);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input, processInput]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleDownload = useCallback(() => {
    if (result?.gifBlob) {
      downloadBlob(result.gifBlob, fileName);
    }
  }, [result, fileName]);

  const handleCopyDataUrl = useCallback(async () => {
    const { cleaned } = sanitizeBase64Input(input);
    await copy(`data:image/gif;base64,${cleaned}`);
  }, [input, copy]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError(null);
    setFileName('image.gif');
    setValidationInfo(null);
    setImageDimensions(null);
    setImageError(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = (ev) => setInput((ev.target?.result as string) ?? '');
      reader.readAsDataURL(file);
    } else if (
      file.name.match(/\.(txt|b64|base64)$/i) ||
      file.type === 'text/plain'
    ) {
      reader.onload = (ev) =>
        setInput(((ev.target?.result as string) ?? '').trim());
      reader.readAsText(file);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Cross-tool navigation */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {ui.alsoConvertTo || 'Also convert to:'}
        </span>
        {RELATED_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          >
            {tool.label}
          </Link>
        ))}
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="base64-input"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              {ui.inputLabel || 'Base64 String'}
            </label>
            {input && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {input.length.toLocaleString()} chars
              </span>
            )}
          </div>

          <div
            className={`relative rounded-lg transition-colors ${
              isDragging
                ? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-900/20'
                : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              id="base64-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.inputPlaceholder || 'Paste Base64 string here, or drag & drop an image / .txt file...'}
              rows={4}
              className="w-full rounded-lg border border-gray-200 p-4 font-mono text-sm leading-relaxed [word-break:break-all] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              spellCheck={false}
            />
            {isDragging && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                  <Upload className="h-5 w-5" />
                  {ui.dropFileHere || 'Drop file here'}
                </div>
              </div>
            )}
          </div>

          {validationInfo && (
            <div className="mt-2 space-y-1">
              {validationInfo.isValid ? (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">
                    {ui.validBase64 || 'Valid Base64'}
                    {validationInfo.estimatedSize > 0 && (
                      <span className="ml-2 text-gray-500">
                        (~{formatFileSize(validationInfo.estimatedSize)})
                      </span>
                    )}
                  </span>
                  {isProcessing && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    {ui.invalidBase64Format || 'Invalid Base64 format'}
                  </span>
                </div>
              )}
              {formatMismatch && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    Input appears to be {formatMismatch} — you are on the GIF
                    converter
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {input && (
          <button
            onClick={handleClear}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {ui.clearButton || 'Clear'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">{ui.errorHeading || 'Error'}</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result?.success && (
        <div
          ref={resultRef}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Check className="h-5 w-5 text-green-500" />
              {ui.gifReadyHeading || 'GIF Ready'}
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  {ui.hidePreview || 'Hide Preview'}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  {ui.showPreview || 'Show Preview'}
                </>
              )}
            </button>
          </div>

          {/* File Info */}
          <div className="grid gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">{ui.sizeLabel || 'Size:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFileSize(result.fileSize || 0)}
              </span>
            </div>
            {result.metadata?.width && result.metadata?.height && (
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {ui.dimensionsLabel || 'Dimensions:'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.width} × {result.metadata.height}
                </span>
              </div>
            )}
            {result.metadata?.version && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {ui.formatLabel || 'Format:'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.version}
                </span>
              </div>
            )}
            {result.metadata?.frameCount !== undefined &&
              result.metadata.frameCount > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {ui.framesLabel || 'Frames:'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.metadata.frameCount} {ui.animatedLabel || '(animated)'}
                  </span>
                </div>
              )}
          </div>

          {/* Preview */}
          {showPreview && previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {ui.previewHeading || 'Preview'}
                </h4>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {ui.openInNewTab || 'Open in new tab'}
                </a>
              </div>
              <div
                className="flex justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-600"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px',
                }}
              >
                {imageLoading && !imageError && (
                  <div className="flex items-center gap-2 py-5 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{ui.loadingPreview || 'Loading preview...'}</span>
                  </div>
                )}
                {imageError && (
                  <div className="flex items-center gap-2 py-5 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>{ui.failedToLoadPreview || 'Failed to load preview'}</span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt={ui.gifPreviewAlt || 'GIF Preview'}
                  className="max-h-[400px] max-w-full border border-gray-300 dark:border-gray-600"
                  style={{
                    display: imageLoading ? 'none' : 'block',
                    imageRendering: 'pixelated',
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageDimensions({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                    setImageLoading(false);
                  }}
                  onError={() => {
                    setImageError('Failed to load image');
                    setImageLoading(false);
                  }}
                />
              </div>
              {imageDimensions && (
                <p className="text-center text-xs text-gray-500">
                  {imageDimensions.width} × {imageDimensions.height} px
                </p>
              )}
            </div>
          )}

          {/* Filename + Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.filenameLabel || 'Filename:'}
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: categoryColor }}
              >
                <Download className="h-4 w-4" />
                {ui.downloadButton || 'Download GIF'}
              </button>
              <button
                onClick={handleCopyDataUrl}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    {ui.copiedButton || 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {ui.copyDataUrlButton || 'Copy Data URL'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad: mobile — above usage tips */}
      <AdBanner
        className="lg:hidden"
        minHeight={100}
        maxHeight={280}
        slot="5833147302"
      />
      {/* Ad: desktop leaderboard — above usage tips so it sits right below
          the input on laptop viewports (replaces the page-level one) */}
      <AdBanner
        className="hidden text-center lg:block"
        fixedWidth={728}
        fixedHeight={90}
        minHeight={90}
        maxHeight={90}
        slot="3320031589"
      />

      {/* Usage Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4" />
          {dictionary?.tools?.['base64-to-gif']?.usageTips?.title ||
            'Usage Tips'}
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          {(
            dictionary?.tools?.['base64-to-gif']?.usageTips?.tips ||
            FALLBACK_USAGE_TIPS
          ).map((tip: string, index: number) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
