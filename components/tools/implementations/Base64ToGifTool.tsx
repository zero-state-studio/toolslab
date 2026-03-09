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

interface Base64ToGifToolProps {
  categoryColor: string;
}

export default function Base64ToGifTool({
  categoryColor,
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
  const { copied, copy } = useCopy();
  const { trackUse, trackError, trackCustom } =
    useToolTracking('base64-to-gif');
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

  const handleProcess = useCallback(async () => {
    if (!input.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Pulisci la preview precedente PRIMA di creare la nuova
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Reset stati della preview
    setImageLoading(false);
    setImageError(null);
    setImageDimensions(null);

    try {
      const conversionResult = base64ToGif(input, {
        fileName,
        validateGifHeader: true,
      });

      setResult(conversionResult);

      if (conversionResult.success && conversionResult.gifBlob) {
        // Create preview URL for the GIF
        const url = URL.createObjectURL(conversionResult.gifBlob);
        setPreviewUrl(url);
        setImageLoading(true);
        setImageError(null);

        // Track successful conversion with custom metadata
        trackCustom({
          event: 'tool.use',
          tool: 'base64-to-gif',
          inputSize: input.length,
          outputSize: conversionResult.fileSize || 0,
          success: true,
          metadata: {
            fileSize: conversionResult.fileSize,
            isGif: conversionResult.metadata?.isGif,
            gifVersion: conversionResult.metadata?.version,
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
    if (result?.gifBlob && result.fileName) {
      downloadBlob(result.gifBlob, result.fileName);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    // Clean up preview URL to avoid memory leak
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setInput('');
    setResult(null);
    setError(null);
    setValidationInfo(null);
    setPreviewUrl(null);
    setImageLoading(false);
    setImageError(null);
    setImageDimensions(null);
  }, [previewUrl]);

  // Validate input on change (debounced to reduce INP)
  useEffect(() => {
    const timeoutId = setTimeout(() => validateInput(input), 300);
    return () => clearTimeout(timeoutId);
  }, [input, validateInput]);

  // Auto-generate filename with timestamp
  useEffect(() => {
    if (!fileName || fileName === 'image.gif') {
      const timestamp = new Date().toISOString().split('T')[0];
      setFileName(`image_${timestamp}.gif`);
    }
  }, [fileName]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Base64 Input
          </h2>
          <button
            onClick={handleClear}
            className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            title="Clear input"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your Base64 encoded GIF data here..."
          className="min-h-[200px] w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          spellCheck={false}
        />

        {/* Validation Info */}
        {validationInfo && (
          <div className="mt-4 space-y-2">
            {validationInfo.hasDataUrlPrefix && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Info className="h-4 w-4" />
                <span>
                  Data URL prefix detected - will be automatically removed
                </span>
              </div>
            )}

            {validationInfo.isValid ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <FileCheck className="h-4 w-4" />
                <span>
                  Valid Base64 format • Estimated size:{' '}
                  {formatFileSize(validationInfo.estimatedSize)}
                </span>
              </div>
            ) : (
              input.trim() && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Invalid Base64 format</span>
                </div>
              )
            )}
          </div>
        )}

        {/* Filename Input */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Output filename:
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="image.gif"
            className="w-full max-w-sm rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Process Button */}
        <div className="mt-4">
          <button
            onClick={handleProcess}
            disabled={!input.trim() || !validationInfo?.isValid || isProcessing}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
              !input.trim() || !validationInfo?.isValid || isProcessing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {isProcessing ? 'Converting...' : 'Convert to GIF'}
          </button>
        </div>
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

      {/* Result Section */}
      {result && result.success && (
        <div
          ref={resultRef}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              GIF Ready for Download
            </h2>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Conversion successful</span>
            </div>
          </div>

          {/* GIF Information */}
          <div className="mb-4 space-y-2 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  File size:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {result.fileSize
                    ? formatFileSize(result.fileSize)
                    : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  File name:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {result.fileName}
                </span>
              </div>
            </div>

            {result.metadata && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    GIF validation:
                  </span>
                  {result.metadata.isGif ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3" />
                      Valid {result.metadata.version} format
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <AlertCircle className="h-3 w-3" />
                      No GIF header found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Download Buttons */}
          <div className="mb-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download GIF
            </button>

            {/* Copy filename button for convenience */}
            <button
              onClick={() => copy(result.fileName || '')}
              className="ml-3 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy filename'}
            </button>
          </div>

          {/* GIF Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    GIF Preview
                  </h3>
                  {!imageLoading && !imageError && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✓ Ready
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Show Preview
                    </>
                  )}
                </button>
              </div>

              {showPreview && (
                <div className="overflow-hidden rounded-md border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                  {imageLoading && !imageError && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Loading preview...
                      </span>
                    </div>
                  )}

                  {imageError && (
                    <div className="flex items-center justify-center gap-2 py-8 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">{imageError}</span>
                    </div>
                  )}

                  <div className={imageLoading ? 'hidden' : 'block'}>
                    {/* Mostra dimensioni immagine */}
                    {imageDimensions && (
                      <p className="mb-2 text-center text-xs text-gray-600 dark:text-gray-400">
                        Image size: {imageDimensions.width} ×{' '}
                        {imageDimensions.height} pixels
                      </p>
                    )}

                    {/* Container con sfondo a scacchiera per trasparenze */}
                    <div
                      className="flex justify-center p-4"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition:
                          '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={previewUrl}
                        src={previewUrl}
                        alt="GIF Preview"
                        className="border-2 border-gray-300 shadow-lg dark:border-gray-600"
                        style={{
                          maxHeight: '500px',
                          maxWidth: '100%',
                          minWidth: '50px',
                          minHeight: '50px',
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
                          setImageLoading(false);
                          setImageError('Failed to load GIF preview');
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Usage Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4" />
          Usage Tips
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            • Valid GIF Base64 data should start with &quot;R0lGOD&quot; when
            encoded
          </li>
          <li>
            • Remove any data URL prefixes like
            &quot;data:image/gif;base64,&quot; before pasting
          </li>
          <li>
            • Both GIF87a and GIF89a formats are supported (including animated
            GIFs)
          </li>
          <li>
            • The tool validates GIF headers to ensure you have valid GIF data
          </li>
          <li>• Use the preview to verify your GIF before downloading</li>
        </ul>
      </div>
    </div>
  );
}
