'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  Info,
  RefreshCw,
  FileCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  base64ToPdf,
  Base64ToPdfResult,
  formatFileSize,
  estimateDecodedSize,
  isValidBase64,
  normalizeBase64,
  downloadBlob,
} from '@/lib/tools/base64-to-pdf';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import AdBanner from '@/components/ads/AdBanner';

interface Base64ToPdfToolProps {
  categoryColor: string;
}

export default function Base64ToPdfTool({
  categoryColor,
}: Base64ToPdfToolProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Base64ToPdfResult | null>(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [validationInfo, setValidationInfo] = useState<{
    isValid: boolean;
    estimatedSize: number;
    hasDataUrlPrefix: boolean;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { copied, copy } = useCopy();
  const { trackUse, trackError, trackCustom } =
    useToolTracking('base64-to-pdf');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // Effect per scroll automatico quando c'è un risultato di successo
  useEffect(() => {
    if (result && result.success) {
      scrollToResult();
    }
  }, [result, scrollToResult]);

  const validateInput = useCallback((base64String: string) => {
    if (!base64String.trim()) {
      setValidationInfo(null);
      return;
    }

    const hasDataUrlPrefix = base64String.startsWith('data:');
    let cleanBase64 = base64String.trim();

    // Remove data URL prefix if present
    if (hasDataUrlPrefix) {
      const commaIndex = cleanBase64.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64 = cleanBase64.substring(commaIndex + 1);
      }
    }

    // Normalize Base64url before validation
    cleanBase64 = normalizeBase64(cleanBase64.replace(/\s+/g, ''));

    const isValid = isValidBase64(cleanBase64);
    const estimatedSize = isValid ? estimateDecodedSize(cleanBase64) : 0;

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

    try {
      const conversionResult = base64ToPdf(input, {
        fileName,
        validatePdfHeader: true,
      });

      setResult(conversionResult);

      if (conversionResult.success && conversionResult.pdfBlob) {
        // Create preview URL for the PDF
        const url = URL.createObjectURL(conversionResult.pdfBlob);
        setPreviewUrl(url);

        // Track successful conversion with custom metadata
        trackCustom({
          event: 'tool.use',
          tool: 'base64-to-pdf',
          inputSize: input.length,
          outputSize: conversionResult.fileSize || 0,
          success: true,
          metadata: {
            fileSize: conversionResult.fileSize,
            isPdf: conversionResult.metadata?.isPdf,
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
  }, [input, fileName]);

  const handleDownload = useCallback(() => {
    if (result?.pdfBlob && result.fileName) {
      downloadBlob(result.pdfBlob, result.fileName);
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
  }, [previewUrl]);

  // Validate input on change (debounced to reduce INP)
  useEffect(() => {
    const timeoutId = setTimeout(() => validateInput(input), 300);
    return () => clearTimeout(timeoutId);
  }, [input, validateInput]);

  // Auto-generate filename with timestamp
  useEffect(() => {
    if (!fileName || fileName === 'document.pdf') {
      const timestamp = new Date().toISOString().split('T')[0];
      setFileName(`document_${timestamp}.pdf`);
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
          placeholder="Paste your Base64 encoded PDF data here..."
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
            placeholder="document.pdf"
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
              <FileText className="h-4 w-4" />
            )}
            {isProcessing ? 'Converting...' : 'Convert to PDF'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              {result?.detectedFileType && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Tip: If you need to convert this {result.detectedFileType} to
                  PDF, use a dedicated conversion tool first.
                </p>
              )}
              {!result?.detectedFileType && error.includes('valid PDF') && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Tip: Valid PDF Base64 data should start with
                  &quot;JVBERi0&quot;. Make sure you&apos;re encoding the PDF
                  file itself, not a different format.
                </p>
              )}
            </div>
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
              PDF Ready for Download
            </h2>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Conversion successful</span>
            </div>
          </div>

          {/* PDF Information */}
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
                    PDF validation:
                  </span>
                  {result.metadata.isPdf ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3" />
                      Valid PDF header
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <AlertCircle className="h-3 w-3" />
                      No PDF header found
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
              Download PDF
            </button>

            {/* Copy filename button for convenience */}
            <button
              onClick={() => copy(result.fileName || '')}
              className="ml-3 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy filename'}
            </button>
          </div>

          {/* PDF Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PDF Preview
                </h3>
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
                <div className="overflow-hidden rounded-md border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                  <embed
                    src={previewUrl}
                    type="application/pdf"
                    className="h-[600px] w-full"
                    title="PDF Preview"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ad: mobile only — above usage tips */}
      <AdBanner
        className="lg:hidden"
        minHeight={100}
        maxHeight={280}
        slot="5833147302"
      />

      {/* Usage Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4" />
          Usage Tips
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            • Valid PDF Base64 data should start with &quot;JVBERi0&quot; when
            decoded
          </li>
          <li>
            • Remove any data URL prefixes like
            &quot;data:application/pdf;base64,&quot; before pasting
          </li>
          <li>
            • Large files may take longer to process - be patient with big PDFs
          </li>
          <li>
            • The tool validates PDF headers to ensure you have valid PDF data
          </li>
        </ul>
      </div>
    </div>
  );
}
