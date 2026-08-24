'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Minimize2,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { getPdfPageCount } from '@/lib/tools/pdf-merger-splitter';
import {
  CompressionLevel,
  CompressResult,
  compressPdf,
  compressionPresets,
  buildCompressedFileName,
  clampDpi,
  clampQuality,
  fileToArrayBuffer,
  formatFileSize,
  isPdfFile,
  pdfBytesToBlob,
  downloadPdf,
} from '@/lib/tools/pdf-compressor';

interface PdfCompressorProps extends BaseToolProps {}

/** Selectable presets: one structural, three raster levels. */
type Preset = 'lossless' | Exclude<CompressionLevel, 'custom'> | 'custom';

export default function PdfCompressor({ dictionary }: PdfCompressorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['pdf-compressor'] || {};
  const labels = {
    drop: t.drop || 'Drop a PDF file here or click to upload',
    level: t.level || 'Compression level',
    lossless: t.lossless || 'Lossless',
    losslessHint: t.losslessHint || 'Keeps text selectable · small savings',
    light: t.light || 'Light',
    lightHint: t.lightHint || 'Best quality · 150 DPI',
    balanced: t.balanced || 'Balanced',
    balancedHint: t.balancedHint || 'Recommended · 120 DPI',
    strong: t.strong || 'Strong',
    strongHint: t.strongHint || 'Smallest file · 96 DPI',
    advanced: t.advanced || 'Advanced settings',
    dpi: t.dpi || 'Resolution (DPI)',
    quality: t.quality || 'JPEG quality',
    grayscale: t.grayscale || 'Convert to grayscale',
    compress: t.compress || 'Compress PDF',
    compressing: t.compressing || 'Compressing…',
    pages: t.pages || 'pages',
    download: t.download || 'Download compressed PDF',
    result: t.result || 'Result',
    before: t.before || 'Original',
    after: t.after || 'Compressed',
    saved: t.saved || 'saved',
    onlyPdf: t.onlyPdf || 'Only PDF files are supported',
    readError: t.readError || 'Could not read the PDF',
    noGain:
      t.noGain ||
      'This PDF is already well optimised — try a stronger level or grayscale.',
    rasterNote:
      t.rasterNote ||
      'Pages are re-rendered as images, so text is no longer selectable.',
  };

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [preset, setPreset] = useState<Preset>('balanced');
  const [dpi, setDpi] = useState(compressionPresets.balanced.dpi);
  const [quality, setQuality] = useState(compressionPresets.balanced.quality);
  const [grayscale, setGrayscale] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<CompressResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result?.success) scrollToResult();
  }, [result, scrollToResult]);

  const resetResult = () => {
    setResult(null);
    setError('');
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isPdfFile(f)) {
        setError(labels.onlyPdf);
        return;
      }
      resetResult();
      setFile(f);
      try {
        const buf = await fileToArrayBuffer(f);
        setPageCount(await getPdfPageCount(buf));
      } catch {
        setError(labels.readError);
        setFile(null);
        setPageCount(0);
      }
    },
    [labels.onlyPdf, labels.readError]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  /** Picking a named level also syncs the advanced sliders to its values. */
  const selectPreset = (next: Preset) => {
    setPreset(next);
    resetResult();
    if (next !== 'lossless' && next !== 'custom') {
      setDpi(compressionPresets[next].dpi);
      setQuality(compressionPresets[next].quality);
      setGrayscale(compressionPresets[next].grayscale);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setError('');
    setIsProcessing(true);
    setProgress({ done: 0, total: pageCount });
    const startTime = Date.now();
    try {
      const buf = await fileToArrayBuffer(file);
      const res = await compressPdf(
        buf,
        preset === 'lossless'
          ? { mode: 'lossless' }
          : {
              mode: 'raster',
              level: preset === 'custom' ? 'custom' : preset,
              custom: { dpi, quality, grayscale },
            },
        (done, total) => setProgress({ done, total })
      );

      if (!res.success) {
        setError(res.error || 'Compression failed');
        return;
      }

      setResult(res);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-compressor',
        input: `${file.name} (${formatFileSize(file.size)}, ${pageCount} ${labels.pages})`,
        output: `${formatFileSize(res.stats!.compressedSize)} · -${res.stats!.savedPercent}% · ${preset}`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.bytes || !file) return;
    downloadPdf(
      pdfBytesToBlob(result.bytes),
      buildCompressedFileName(file.name)
    );
  };

  const presetOptions: { id: Preset; label: string; hint: string }[] = [
    { id: 'lossless', label: labels.lossless, hint: labels.losslessHint },
    { id: 'light', label: labels.light, hint: labels.lightHint },
    { id: 'balanced', label: labels.balanced, hint: labels.balancedHint },
    { id: 'strong', label: labels.strong, hint: labels.strongHint },
  ];

  const stats = result?.stats;
  const improved = Boolean(result?.metadata?.improved);
  // Width of the "after" bar relative to the original file.
  const afterRatio = stats
    ? Math.max(
        2,
        Math.min(100, (stats.compressedSize / stats.originalSize) * 100)
      )
    : 0;
  // A tiny lossless win rounds to 0.0% — show the bytes instead of "−0%".
  const savingsLabel = stats
    ? stats.savedPercent >= 0.1
      ? `−${stats.savedPercent}% ${labels.saved}`
      : `−${formatFileSize(stats.savedBytes)} ${labels.saved}`
    : '';

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-5 text-center transition hover:border-violet-400 dark:border-gray-600"
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {labels.drop}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <FileText className="h-5 w-5 shrink-0 text-violet-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {pageCount} {labels.pages} · {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {/* Compression level */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {labels.level}
            </label>
            <div className="grid gap-2 sm:grid-cols-4">
              {presetOptions.map((option) => {
                const active = preset === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectPreset(option.id)}
                    aria-pressed={active}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-gray-300 hover:border-violet-400 dark:border-gray-600'
                    }`}
                  >
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            {preset !== 'lossless' && (
              <p className="mt-2 text-xs text-gray-500">{labels.rasterNote}</p>
            )}
          </div>

          {/* Advanced settings — raster only */}
          {preset !== 'lossless' && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex w-full items-center gap-2 p-3 text-sm font-medium"
              >
                <Settings2 className="h-4 w-4 text-gray-400" />
                {labels.advanced}
              </button>
              {showAdvanced && (
                <div className="grid gap-4 border-t border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                      {labels.dpi}: {dpi}
                    </label>
                    <input
                      type="range"
                      min={36}
                      max={300}
                      step={6}
                      value={dpi}
                      onChange={(e) => {
                        setDpi(clampDpi(Number(e.target.value)));
                        setPreset('custom');
                        resetResult();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                      {labels.quality}: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.01}
                      value={quality}
                      onChange={(e) => {
                        setQuality(clampQuality(Number(e.target.value)));
                        setPreset('custom');
                        resetResult();
                      }}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => {
                        setGrayscale(e.target.checked);
                        setPreset('custom');
                        resetResult();
                      }}
                    />
                    {labels.grayscale}
                  </label>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.compressing}
                {progress.total > 0 && ` ${progress.done}/${progress.total}`}
              </>
            ) : (
              <>
                <Minimize2 className="mr-2 h-4 w-4" />
                {labels.compress}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Result */}
      <div ref={resultRef}>
        {result?.success && stats && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{labels.result}</p>
              <p
                className={`text-sm font-semibold ${
                  improved ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                {improved ? savingsLabel : '0%'}
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{labels.before}</span>
                  <span>{formatFileSize(stats.originalSize)}</span>
                </div>
                <div className="h-2 w-full rounded bg-gray-300 dark:bg-gray-600" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{labels.after}</span>
                  <span>{formatFileSize(stats.compressedSize)}</span>
                </div>
                <div className="h-2 w-full rounded bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded bg-emerald-500"
                    style={{ width: `${afterRatio}%` }}
                  />
                </div>
              </div>
            </div>

            {!improved && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {labels.noGain}
              </div>
            )}

            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {labels.download}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
