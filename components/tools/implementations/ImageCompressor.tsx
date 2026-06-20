'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  ImageFormat,
  ProcessedImage,
  isImageFile,
  compressImage,
  buildOutputName,
  downloadBlob,
  formatFileSize,
} from '@/lib/tools/image-tools';

interface ImageCompressorProps extends BaseToolProps {}

export default function ImageCompressor({ dictionary }: ImageCompressorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['image-compressor'] || {};
  const labels = {
    drop: t.drop || 'Drop an image here or click to upload',
    hint: t.hint || 'Reduce image file size with adjustable quality',
    quality: t.quality || 'Quality',
    format: t.format || 'Output format',
    keepFormat: t.keepFormat || 'Keep original',
    compressButton: t.compressButton || 'Compress image',
    result: t.result || 'Compressed image',
    download: t.download || 'Download',
    onlyImage: t.onlyImage || 'Only image files are supported',
    processing: t.processing || 'Compressing…',
    saved: t.saved || 'smaller',
    larger: t.larger || 'larger (try lower quality)',
    alreadyOptimized:
      t.alreadyOptimized ||
      'Already optimized — kept your original (try WebP for smaller size)',
    pngNote:
      t.pngNote ||
      'PNG is lossless — the quality slider has little effect. Use WebP or JPG to actually shrink photos.',
  };

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.7);
  // Default to WebP — it actually compresses (PNG re-encode often grows the file).
  const [format, setFormat] = useState<ImageFormat | 'keep'>('webp');
  const [keptOriginal, setKeptOriginal] = useState(false);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  useEffect(() => {
    if (result) scrollToResult();
  }, [result, scrollToResult]);

  const resetResult = () => {
    setResult(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setKeptOriginal(false);
    setError('');
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isImageFile(f)) {
        setError(labels.onlyImage);
        return;
      }
      resetResult();
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [labels.onlyImage]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const resolvedFormat = (): ImageFormat => {
    if (format !== 'keep') return format;
    if (file?.type === 'image/png') return 'png';
    if (file?.type === 'image/webp') return 'webp';
    return 'jpeg';
  };

  const handleCompress = async () => {
    if (!file) return;
    setError('');
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const out = await compressImage(file, {
        quality,
        format: resolvedFormat(),
      });
      // Never hand back a file bigger than the original — keep the original instead.
      const grewBigger = out.blob.size >= file.size;
      const finalBlob = grewBigger ? file : out.blob;
      setKeptOriginal(grewBigger);
      setResult({ blob: finalBlob, width: out.width, height: out.height });
      setResultUrl(URL.createObjectURL(finalBlob));
      const pct = Math.round((1 - finalBlob.size / file.size) * 100);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'image-compressor',
        input: `${file.name} ${formatFileSize(file.size)}`,
        output: grewBigger
          ? `kept original ${formatFileSize(file.size)}`
          : `${formatFileSize(finalBlob.size)} (${pct}% ${labels.saved})`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const savedPct = result && file ? Math.round((1 - result.blob.size / file.size) * 100) : 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-violet-400 dark:border-gray-600"
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{labels.drop}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={file.name}
                className="h-16 w-16 rounded object-contain bg-gray-50 dark:bg-gray-900"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm text-gray-500">
              <span>{labels.quality}</span>
              <span className="tabular-nums">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm flex items-center gap-2">
              <span className="text-gray-500">{labels.format}</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat | 'keep')}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="webp">WebP ★</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="keep">{labels.keepFormat}</option>
              </select>
            </label>
            {resolvedFormat() === 'png' && (
              <p className="text-xs text-amber-600">{labels.pngNote}</p>
            )}
          </div>

          <Button onClick={handleCompress} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{labels.processing}</>
            ) : (
              labels.compressButton
            )}
          </Button>
        </div>
      )}

      <div ref={resultRef}>
        {result && resultUrl && file && (
          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="text-sm font-medium">{labels.result}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt={labels.result}
              className="max-h-72 rounded border border-gray-200 bg-white dark:border-gray-700"
            />
            {keptOriginal ? (
              <p className="text-sm text-amber-600">{labels.alreadyOptimized}</p>
            ) : (
              <p className="text-sm">
                <span className="text-gray-500">{formatFileSize(file.size)} → </span>
                <span className="font-semibold">{formatFileSize(result.blob.size)}</span>{' '}
                <span className="text-green-600">
                  ({savedPct}% {labels.saved})
                </span>
              </p>
            )}
            <Button
              variant="outline"
              onClick={() =>
                downloadBlob(
                  result.blob,
                  keptOriginal
                    ? file.name
                    : buildOutputName(file.name, 'compressed', resolvedFormat())
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              {labels.download}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
