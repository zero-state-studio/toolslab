'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  ImageFormat,
  PdfToImageOptions,
  RenderedImage,
  fileToArrayBuffer,
  formatFileSize,
  scaleForDpi,
  getPdfPageCount,
  convertPdfToImages,
  zipImages,
  buildImageFileName,
  downloadBlob,
  isPdfFileName,
} from '@/lib/tools/pdf-to-jpg';

interface PdfToJpgProps extends BaseToolProps {}

interface Preview {
  image: RenderedImage;
  url: string;
}

const DPI_OPTIONS = [
  { label: '72 DPI (screen)', value: 72 },
  { label: '150 DPI (good)', value: 150 },
  { label: '300 DPI (print)', value: 300 },
];

export default function PdfToJpg({ dictionary }: PdfToJpgProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['pdf-to-jpg'] || {};
  const labels = {
    drop: t.drop || 'Drop a PDF file here or click to upload',
    format: t.format || 'Image format',
    quality: t.quality || 'Quality',
    resolution: t.resolution || 'Resolution',
    convert: t.convert || 'Convert to images',
    converting: t.converting || 'Converting…',
    pages: t.pages || 'pages',
    download: t.download || 'Download',
    downloadAll: t.downloadAll || 'Download all (ZIP)',
    result: t.result || 'Images',
    onlyPdf: t.onlyPdf || 'Only PDF files are supported',
    page: t.page || 'Page',
  };

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [dpi, setDpi] = useState(150);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [previews, setPreviews] = useState<Preview[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on change/unmount to avoid leaks.
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  useEffect(() => {
    if (previews.length > 0) scrollToResult();
  }, [previews, scrollToResult]);

  const resetResult = () => {
    setPreviews([]);
    setError('');
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isPdfFileName(f)) {
        setError(labels.onlyPdf);
        return;
      }
      resetResult();
      setFile(f);
      try {
        const buf = await fileToArrayBuffer(f);
        setPageCount(await getPdfPageCount(buf));
      } catch {
        setError('Could not read the PDF');
        setFile(null);
        setPageCount(0);
      }
    },
    [labels.onlyPdf]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const baseName = (file?.name || 'document').replace(/\.pdf$/i, '');

  const handleConvert = async () => {
    if (!file) return;
    setError('');
    setIsProcessing(true);
    setProgress({ done: 0, total: pageCount });
    const startTime = Date.now();
    try {
      const buf = await fileToArrayBuffer(file);
      const options: PdfToImageOptions = {
        format,
        quality,
        scale: scaleForDpi(dpi),
      };
      const images = await convertPdfToImages(buf, options, (done, total) =>
        setProgress({ done, total })
      );
      const next = images.map((image) => ({
        image,
        url: URL.createObjectURL(image.blob),
      }));
      setPreviews(next);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-to-jpg',
        input: `${file.name} (${pageCount} ${labels.pages})`,
        output: `${images.length} ${format.toUpperCase()} images`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (previews.length === 0) return;
    const blob = await zipImages(
      baseName,
      previews.map((p) => p.image)
    );
    downloadBlob(blob, `${baseName}_images.zip`);
  };

  const isLossy = format !== 'png';

  return (
    <div className="space-y-5">
      {/* Dropzone */}
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

      {/* File + options */}
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {labels.format}
              </label>
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as ImageFormat);
                  resetResult();
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {labels.resolution}
              </label>
              <select
                value={dpi}
                onChange={(e) => {
                  setDpi(Number(e.target.value));
                  resetResult();
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {DPI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {isLossy && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {labels.quality}: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.converting} {progress.done}/{progress.total}
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                {labels.convert}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      <div ref={resultRef}>
        {previews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {labels.result}: {previews.length}
              </p>
              <Button size="sm" variant="outline" onClick={handleDownloadAll}>
                <Download className="mr-2 h-4 w-4" />
                {labels.downloadAll}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {previews.map(({ image, url }) => {
                const name = buildImageFileName(
                  baseName,
                  image.pageNumber,
                  previews.length,
                  format
                );
                return (
                  <div
                    key={image.pageNumber}
                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={url}
                      alt={`${labels.page} ${image.pageNumber}`}
                      className="aspect-[3/4] w-full bg-gray-50 object-contain dark:bg-gray-900"
                      loading="lazy"
                    />
                    <div className="flex items-center justify-between gap-2 p-2">
                      <span className="truncate text-xs text-gray-500">
                        {labels.page} {image.pageNumber} ·{' '}
                        {formatFileSize(image.blob.size)}
                      </span>
                      <button
                        onClick={() => downloadBlob(image.blob, name)}
                        title={labels.download}
                        className="rounded p-1 text-gray-400 hover:text-violet-600"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
