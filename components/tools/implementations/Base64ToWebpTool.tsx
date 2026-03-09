'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Check,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Info,
  RefreshCw,
  FileCheck,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import {
  base64ToWebp,
  Base64ToWebpResult,
  formatFileSize,
  estimateDecodedSize,
  isValidBase64,
  downloadBlob,
  sanitizeBase64Input,
} from '@/lib/tools/base64-to-webp';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

interface Base64ToWebpToolProps {
  categoryColor: string;
}

export default function Base64ToWebpTool({
  categoryColor,
}: Base64ToWebpToolProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Base64ToWebpResult | null>(null);
  const [fileName, setFileName] = useState('image.webp');
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
  const { copied, copy } = useCopy();
  const { trackUse, trackError, trackCustom } =
    useToolTracking('base64-to-webp');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // Effect per scroll automatico quando l'immagine è caricata
  useEffect(() => {
    if (result && result.success && !imageLoading && !imageError) {
      scrollToResult();
    }
  }, [result, imageLoading, imageError, scrollToResult]);

  const validateInput = useCallback((base64String: string) => {
    if (!base64String.trim()) {
      setValidationInfo(null);
      return;
    }

    const hasDataUrlPrefix = base64String.startsWith('data:');
    const { cleaned } = sanitizeBase64Input(base64String);

    const isValid = isValidBase64(cleaned);
    const estimatedSize = isValid ? estimateDecodedSize(cleaned) : 0;

    setValidationInfo({
      isValid,
      estimatedSize,
      hasDataUrlPrefix,
    });
  }, []);

  // Debounced validation to reduce INP
  useEffect(() => {
    const timeoutId = setTimeout(() => validateInput(input), 300);
    return () => clearTimeout(timeoutId);
  }, [input, validateInput]);

  const handleProcess = useCallback(async () => {
    if (!input.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Clean up old preview BEFORE creating new one
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Reset preview states
    setImageLoading(false);
    setImageError(null);
    setImageDimensions(null);

    try {
      const conversionResult = base64ToWebp(input, {
        fileName: fileName || 'image.webp',
      });

      setResult(conversionResult);

      if (conversionResult.success && conversionResult.webpBlob) {
        // Create preview URL
        const url = URL.createObjectURL(conversionResult.webpBlob);
        setPreviewUrl(url);
        setImageLoading(true);
        setImageError(null);

        // Track successful conversion with custom metadata
        trackCustom({
          event: 'tool.use',
          tool: 'base64-to-webp',
          inputSize: input.length,
          outputSize: conversionResult.fileSize || 0,
          success: true,
          metadata: {
            fileSize: conversionResult.fileSize,
            width: conversionResult.metadata?.width,
            height: conversionResult.metadata?.height,
            hasAlpha: conversionResult.metadata?.hasAlpha,
            isAnimated: conversionResult.metadata?.isAnimated,
            compressionType: conversionResult.metadata?.compressionType,
            fileName: fileName,
          },
        });
      } else {
        const errorMessage = conversionResult.error || 'Conversion failed';
        setError(errorMessage);
        trackError(new Error(errorMessage), input.length);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setResult(null);
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input, fileName, trackCustom, trackError, previewUrl]);

  const handleDownload = useCallback(() => {
    if (result?.webpBlob && result.fileName) {
      downloadBlob(result.webpBlob, result.fileName);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError(null);
    setFileName('image.webp');
    setValidationInfo(null);
    setImageDimensions(null);
    setImageError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="base64-input"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Base64 String
          </label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your Base64 encoded WebP data here..."
            className="h-48 w-full resize-y rounded-lg border border-gray-200 p-4 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            spellCheck={false}
          />
          {validationInfo && (
            <div className="mt-2 flex items-start gap-2 text-sm">
              {validationInfo.isValid ? (
                <>
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <div className="text-green-600 dark:text-green-400">
                    Valid Base64
                    {validationInfo.estimatedSize > 0 && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        (~{formatFileSize(validationInfo.estimatedSize)})
                      </span>
                    )}
                    {validationInfo.hasDataUrlPrefix && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        Data URL prefix detected
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">
                    Invalid Base64 format
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="filename-input"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Output Filename (optional)
          </label>
          <input
            id="filename-input"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="image.webp"
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleProcess}
            disabled={isProcessing || !input.trim()}
            className="flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: isProcessing ? '#9CA3AF' : categoryColor,
            }}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isProcessing ? 'Converting...' : 'Convert to WebP'}
          </button>

          {input && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">Error</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && result.success && (
        <div
          ref={resultRef}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Check className="h-5 w-5 text-green-500" />
              WebP Created Successfully
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </button>
          </div>

          {/* File Info */}
          <div className="grid gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Filename:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {result.fileName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFileSize(result.fileSize || 0)}
              </span>
            </div>
            {result.metadata?.width && result.metadata?.height && (
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Dimensions:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.width} × {result.metadata.height}
                </span>
              </div>
            )}
            {result.metadata?.compressionType && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Compression:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.compressionType}
                </span>
              </div>
            )}
            {result.metadata?.hasAlpha !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Alpha Channel:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.hasAlpha ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {result.metadata?.isAnimated !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Animated:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.metadata.isAnimated ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>

          {/* Preview */}
          {showPreview && previewUrl && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Preview:
              </h4>
              <div
                className="flex justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-600"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              >
                {imageLoading && !imageError && (
                  <div className="flex items-center gap-2 py-8 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading preview...</span>
                  </div>
                )}
                {imageError && (
                  <div className="flex items-center gap-2 py-8 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>Failed to load preview</span>
                  </div>
                )}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="WebP Preview"
                  className="max-h-[400px] max-w-full border border-gray-300 dark:border-gray-600"
                  style={{ display: imageLoading ? 'none' : 'block' }}
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
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Displayed size: {imageDimensions.width} ×{' '}
                  {imageDimensions.height} pixels
                </p>
              )}
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: categoryColor }}
          >
            <Download className="h-4 w-4" />
            Download WebP
          </button>
        </div>
      )}
    </div>
  );
}
