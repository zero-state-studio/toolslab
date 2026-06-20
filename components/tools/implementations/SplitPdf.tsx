'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  isPdfFile,
  fileToArrayBuffer,
  parsePageRanges,
  splitPdfBuffer,
  getPdfPageCount,
  cutPointsToRanges,
  renderPdfThumbnails,
  PdfThumbnail,
  pdfBytesToBlob,
  downloadPdf,
  formatFileSize,
  SplitPart,
} from '@/lib/tools/pdf-merger-splitter';

interface SplitPdfProps extends BaseToolProps {}

export default function SplitPdf({ dictionary }: SplitPdfProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['split-pdf'] || {};
  const labels = {
    drop: t.drop || 'Drop a PDF file here or click to upload',
    hint: t.hint || 'Upload a PDF, then click between pages to split it',
    splitButton: t.splitButton || 'Split PDF',
    pages: t.pages || 'pages',
    download: t.download || 'Download',
    downloadAll: t.downloadAll || 'Download all',
    result: t.result || 'Result',
    onlyPdf: t.onlyPdf || 'Only PDF files are supported',
    visualHint:
      t.visualHint ||
      'Click the scissors after a page to split there. The file is cut into the parts shown below.',
    splitEveryPage: t.splitEveryPage || 'Split every page',
    resetCuts: t.resetCuts || 'Reset',
    cutAfter: t.cutAfter || 'Split after this page',
    outputFiles: t.outputFiles || 'Output files',
    rendering: t.rendering || 'Rendering pages…',
    page: t.page || 'Page',
    advanced: t.advanced || 'Advanced: custom page ranges',
    rangeLabel: t.rangeLabel || 'Page ranges',
    rangePlaceholder: t.rangePlaceholder || 'e.g. 1-3, 5, 8-10',
  };

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<PdfThumbnail[]>([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [cutPoints, setCutPoints] = useState<number[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [ranges, setRanges] = useState('');
  const [parts, setParts] = useState<SplitPart[]>([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const segments = useMemo(
    () => cutPointsToRanges(pageCount, cutPoints),
    [pageCount, cutPoints]
  );

  useEffect(() => {
    if (parts.length > 0) scrollToResult();
  }, [parts, scrollToResult]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isPdfFile(f)) {
        setError(labels.onlyPdf);
        return;
      }
      setError('');
      setParts([]);
      setCutPoints([]);
      setThumbnails([]);
      setFile(f);
      setThumbsLoading(true);
      try {
        const buf = await fileToArrayBuffer(f);
        setPageCount(await getPdfPageCount(buf));
        setThumbnails(await renderPdfThumbnails(buf));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[split-pdf] failed to read PDF', e);
        setError(
          `Could not read the PDF${e instanceof Error ? `: ${e.message}` : ''}`
        );
        setFile(null);
      } finally {
        setThumbsLoading(false);
      }
    },
    [labels.onlyPdf]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const toggleCut = (afterPage: number) => {
    setCutPoints((prev) =>
      prev.includes(afterPage)
        ? prev.filter((p) => p !== afterPage)
        : [...prev, afterPage]
    );
    setParts([]);
  };

  const splitEveryPage = () => {
    setCutPoints(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => i + 1)
    );
    setParts([]);
  };

  const resetCuts = () => {
    setCutPoints([]);
    setParts([]);
  };

  const handleSplit = async () => {
    if (!file) return;
    setError('');

    let splitRanges: [number, number][];
    if (advanced) {
      const parsed = parsePageRanges(ranges, pageCount);
      if (!parsed.success || !parsed.ranges) {
        setError(parsed.error || 'Invalid ranges');
        return;
      }
      splitRanges = parsed.ranges;
    } else {
      splitRanges = segments;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const buf = await fileToArrayBuffer(file);
      const r = await splitPdfBuffer(buf, splitRanges);
      if (!r.success || !r.parts) {
        setError(r.error || 'Split failed');
        return;
      }
      setParts(r.parts);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'split-pdf',
        input: `split ${file.name} (${advanced ? ranges : `${segments.length} parts`})`,
        output: `${r.parts.length} files`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Split failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = (file?.name || 'document').replace(/\.pdf$/i, '');
  const splitDisabled =
    isProcessing || (advanced ? !ranges.trim() : segments.length === 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

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

          {thumbsLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-10 text-sm text-gray-500 dark:border-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {labels.rendering}
            </div>
          ) : (
            !advanced && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex-1 text-xs text-gray-500">
                    {labels.visualHint}
                  </p>
                  <button
                    onClick={splitEveryPage}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs hover:border-violet-400 dark:border-gray-700"
                  >
                    {labels.splitEveryPage}
                  </button>
                  <button
                    onClick={resetCuts}
                    disabled={cutPoints.length === 0}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs hover:border-violet-400 disabled:opacity-40 dark:border-gray-700"
                  >
                    {labels.resetCuts}
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-1 gap-y-3">
                  {thumbnails.map((thumb) => {
                    const isCut = cutPoints.includes(thumb.pageNumber);
                    const isLast = thumb.pageNumber === pageCount;
                    return (
                      <div key={thumb.pageNumber} className="flex items-stretch">
                        <div className="flex w-24 flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb.dataUrl}
                            alt={`${labels.page} ${thumb.pageNumber}`}
                            className="w-full rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700"
                            loading="lazy"
                          />
                          <span className="mt-1 text-xs text-gray-500">
                            {thumb.pageNumber}
                          </span>
                        </div>
                        {!isLast && (
                          <button
                            onClick={() => toggleCut(thumb.pageNumber)}
                            title={labels.cutAfter}
                            className={`mx-0.5 flex w-6 items-center justify-center self-stretch rounded transition ${
                              isCut
                                ? 'bg-violet-600 text-white'
                                : 'text-gray-300 hover:bg-violet-50 hover:text-violet-500 dark:text-gray-600'
                            }`}
                          >
                            <Scissors className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg bg-violet-50 p-3 text-sm dark:bg-violet-950/20">
                  <span className="font-medium">
                    {labels.outputFiles}: {segments.length}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {segments
                      .map((s) => (s[0] === s[1] ? `${s[0]}` : `${s[0]}–${s[1]}`))
                      .join(' · ')}
                  </span>
                </div>
              </>
            )
          )}

          {!thumbsLoading && (
            <div>
              <button
                onClick={() => setAdvanced((a) => !a)}
                className="text-xs font-medium text-violet-600 hover:underline"
              >
                {advanced ? '← ' : ''}
                {labels.advanced}
              </button>
              {advanced && (
                <div className="mt-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {labels.rangeLabel}
                  </label>
                  <input
                    type="text"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder={labels.rangePlaceholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          {!thumbsLoading && (
            <Button
              onClick={handleSplit}
              disabled={splitDisabled}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Scissors className="mr-2 h-4 w-4" />
              )}
              {labels.splitButton}
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      <div ref={resultRef}>
        {parts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {labels.result}: {parts.length}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  parts.forEach((p) =>
                    downloadPdf(
                      pdfBytesToBlob(p.bytes),
                      `${baseName}_${p.label}.pdf`
                    )
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {labels.downloadAll}
              </Button>
            </div>
            {parts.map((part) => (
              <div
                key={part.label}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <FileText className="h-5 w-5 shrink-0 text-violet-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {baseName}_{part.label}.pdf
                  </p>
                  <p className="text-xs text-gray-500">
                    {part.pageCount} {labels.pages} ·{' '}
                    {formatFileSize(part.bytes.byteLength)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    downloadPdf(
                      pdfBytesToBlob(part.bytes),
                      `${baseName}_${part.label}.pdf`
                    )
                  }
                  title={labels.download}
                  className="rounded p-1 text-gray-400 hover:text-violet-600"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
