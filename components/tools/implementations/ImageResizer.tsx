'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Link2,
  Link2Off,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  ImageFormat,
  ProcessedImage,
  isImageFile,
  resizeImage,
  loadImage,
  computeResizeDimensions,
  buildOutputName,
  downloadBlob,
  formatFileSize,
} from '@/lib/tools/image-tools';

interface ImageResizerProps extends BaseToolProps {}

type Mode = 'pixels' | 'percent';

export default function ImageResizer({ dictionary }: ImageResizerProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['image-resizer'] || {};
  const labels = {
    drop: t.drop || 'Drop an image here or click to upload',
    hint: t.hint || 'Resize by exact pixels or by percentage',
    byPixels: t.byPixels || 'By pixels',
    byPercent: t.byPercent || 'By percentage',
    width: t.width || 'Width',
    height: t.height || 'Height',
    percent: t.percent || 'Scale',
    lockAspect: t.lockAspect || 'Lock aspect ratio',
    format: t.format || 'Output format',
    resizeButton: t.resizeButton || 'Resize image',
    result: t.result || 'Resized image',
    original: t.original || 'Original',
    resized: t.resized || 'Resized',
    download: t.download || 'Download',
    onlyImage: t.onlyImage || 'Only image files are supported',
    processing: t.processing || 'Resizing…',
  };

  const [file, setFile] = useState<File | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('pixels');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [percent, setPercent] = useState(50);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>('png');
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
    setError('');
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isImageFile(f)) {
        setError(labels.onlyImage);
        return;
      }
      resetResult();
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      try {
        const img = await loadImage(f);
        setSrcDims({ w: img.naturalWidth, h: img.naturalHeight });
        setWidth(String(img.naturalWidth));
        setHeight(String(img.naturalHeight));
      } catch {
        setError('Could not read the image');
        setFile(null);
      }
    },
    [labels.onlyImage]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Keep height in sync with width when aspect is locked.
  const onWidthChange = (v: string) => {
    setWidth(v);
    if (lockAspect && srcDims && v) {
      const w = Number(v);
      if (w > 0) setHeight(String(Math.round(w / (srcDims.w / srcDims.h))));
    }
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (lockAspect && srcDims && v) {
      const h = Number(v);
      if (h > 0) setWidth(String(Math.round(h * (srcDims.w / srcDims.h))));
    }
  };

  const targetPreview = (() => {
    if (!srcDims) return null;
    if (mode === 'percent') {
      return computeResizeDimensions(srcDims.w, srcDims.h, {
        scale: percent / 100,
      });
    }
    return computeResizeDimensions(srcDims.w, srcDims.h, {
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      keepAspect: lockAspect,
    });
  })();

  const handleResize = async () => {
    if (!file) return;
    setError('');
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const opts =
        mode === 'percent'
          ? { scale: percent / 100, format }
          : {
              width: width ? Number(width) : undefined,
              height: height ? Number(height) : undefined,
              keepAspect: lockAspect,
              format,
            };
      const out = await resizeImage(file, opts);
      setResult(out);
      setResultUrl(URL.createObjectURL(out.blob));
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'image-resizer',
        input: `${file.name} ${srcDims?.w}×${srcDims?.h}`,
        output: `${out.width}×${out.height}, ${formatFileSize(out.blob.size)}`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resize failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-5 text-center transition hover:border-violet-400 dark:border-gray-600"
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

      {file && srcDims && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={labels.original}
                className="h-16 w-16 rounded object-contain bg-gray-50 dark:bg-gray-900"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {srcDims.w}×{srcDims.h}px · {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              onClick={() => setMode('pixels')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'pixels' ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {labels.byPixels}
            </button>
            <button
              onClick={() => setMode('percent')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'percent' ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {labels.byPercent}
            </button>
          </div>

          {mode === 'pixels' ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{labels.width}</span>
                <input
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => onWidthChange(e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </label>
              <button
                onClick={() => setLockAspect((v) => !v)}
                title={labels.lockAspect}
                className="mb-1 rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-violet-600 dark:border-gray-700"
              >
                {lockAspect ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
              </button>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{labels.height}</span>
                <input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => onHeightChange(e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </label>
            </div>
          ) : (
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-500">
                <span>{labels.percent}</span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm flex items-center gap-2">
              <span className="text-gray-500">{labels.format}</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
            {targetPreview && (
              <span className="text-xs text-gray-500">
                → {targetPreview.width}×{targetPreview.height}px
              </span>
            )}
          </div>

          <Button onClick={handleResize} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{labels.processing}</>
            ) : (
              labels.resizeButton
            )}
          </Button>
        </div>
      )}

      <div ref={resultRef}>
        {result && resultUrl && (
          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="text-sm font-medium">{labels.result}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt={labels.resized}
              className="max-h-56 rounded border border-gray-200 bg-white dark:border-gray-700"
            />
            <p className="text-xs text-gray-500">
              {result.width}×{result.height}px · {formatFileSize(result.blob.size)}
            </p>
            <Button
              variant="outline"
              onClick={() =>
                downloadBlob(result.blob, buildOutputName(file?.name || 'image', 'resized', format))
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
