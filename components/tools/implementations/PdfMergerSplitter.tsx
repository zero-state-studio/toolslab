'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Combine,
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
  mergePdfBuffers,
  splitPdfBuffer,
  getPdfPageCount,
  pdfBytesToBlob,
  downloadPdf,
  formatFileSize,
  SplitPart,
} from '@/lib/tools/pdf-merger-splitter';

interface PdfMergerSplitterProps extends BaseToolProps {}

type Mode = 'merge' | 'split';

interface MergeItem {
  file: File;
  id: string;
}

export default function PdfMergerSplitter({
  dictionary,
}: PdfMergerSplitterProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['pdf-merger-splitter'] || {};
  const labels = {
    merge: t.merge || 'Merge PDFs',
    split: t.split || 'Split PDF',
    dropMerge: t.dropMerge || 'Drop PDF files here or click to upload',
    dropSplit: t.dropSplit || 'Drop a PDF file here or click to upload',
    mergeHint: t.mergeHint || 'Add two or more PDFs, reorder, then merge',
    splitHint: t.splitHint || 'Upload a PDF, then choose page ranges to extract',
    mergeButton: t.mergeButton || 'Merge PDFs',
    splitButton: t.splitButton || 'Split PDF',
    rangeLabel: t.rangeLabel || 'Page ranges',
    rangePlaceholder: t.rangePlaceholder || 'e.g. 1-3, 5, 8-10',
    pages: t.pages || 'pages',
    download: t.download || 'Download',
    downloadAll: t.downloadAll || 'Download all',
    remove: t.remove || 'Remove',
    moveUp: t.moveUp || 'Move up',
    moveDown: t.moveDown || 'Move down',
    result: t.result || 'Result',
    onlyPdf: t.onlyPdf || 'Only PDF files are supported',
  };

  const [mode, setMode] = useState<Mode>('merge');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Merge state
  const [mergeItems, setMergeItems] = useState<MergeItem[]>([]);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedPages, setMergedPages] = useState(0);

  // Split state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageCount, setSplitPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [splitParts, setSplitParts] = useState<SplitPart[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasResult = mergedBlob !== null || splitParts.length > 0;

  useEffect(() => {
    if (hasResult) scrollToResult();
  }, [hasResult, scrollToResult]);

  const resetResults = () => {
    setMergedBlob(null);
    setMergedPages(0);
    setSplitParts([]);
    setError('');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetResults();
  };

  // ---- File intake ----
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const pdfs = Array.from(files).filter(isPdfFile);
      if (pdfs.length === 0) {
        setError(labels.onlyPdf);
        return;
      }
      setError('');
      resetResults();

      if (mode === 'merge') {
        setMergeItems((prev) => [
          ...prev,
          ...pdfs.map((file) => ({ file, id: crypto.randomUUID() })),
        ]);
      } else {
        const file = pdfs[0];
        setSplitFile(file);
        try {
          const buf = await fileToArrayBuffer(file);
          setSplitPageCount(await getPdfPageCount(buf));
        } catch {
          setError('Could not read the PDF');
          setSplitFile(null);
        }
      }
    },
    [mode, labels.onlyPdf]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // ---- Merge actions ----
  const moveItem = (index: number, dir: -1 | 1) => {
    setMergeItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    resetResults();
  };

  const removeItem = (id: string) => {
    setMergeItems((prev) => prev.filter((i) => i.id !== id));
    resetResults();
  };

  const handleMerge = async () => {
    setError('');
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const buffers = await Promise.all(
        mergeItems.map((i) => fileToArrayBuffer(i.file))
      );
      const r = await mergePdfBuffers(buffers);
      if (!r.success || !r.bytes) {
        setError(r.error || 'Merge failed');
        return;
      }
      const blob = pdfBytesToBlob(r.bytes);
      setMergedBlob(blob);
      setMergedPages(r.metadata?.pageCount ?? 0);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-merger-splitter',
        input: `merge ${mergeItems.length} PDFs`,
        output: `${r.metadata?.pageCount ?? 0} pages, ${formatFileSize(blob.size)}`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // ---- Split actions ----
  const handleSplit = async () => {
    if (!splitFile) return;
    setError('');
    const parsed = parsePageRanges(ranges, splitPageCount);
    if (!parsed.success || !parsed.ranges) {
      setError(parsed.error || 'Invalid ranges');
      return;
    }
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const buf = await fileToArrayBuffer(splitFile);
      const r = await splitPdfBuffer(buf, parsed.ranges);
      if (!r.success || !r.parts) {
        setError(r.error || 'Split failed');
        return;
      }
      setSplitParts(r.parts);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'pdf-merger-splitter',
        input: `split ${splitFile.name} (${ranges})`,
        output: `${r.parts.length} files`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Split failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const baseName = (splitFile?.name || 'document').replace(/\.pdf$/i, '');

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        <button
          onClick={() => switchMode('merge')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === 'merge'
              ? 'bg-violet-600 text-white'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          <Combine className="h-4 w-4" />
          {labels.merge}
        </button>
        <button
          onClick={() => switchMode('split')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === 'split'
              ? 'bg-violet-600 text-white'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          <Scissors className="h-4 w-4" />
          {labels.split}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {mode === 'merge' ? labels.mergeHint : labels.splitHint}
      </p>

      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-violet-400 dark:border-gray-600"
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {mode === 'merge' ? labels.dropMerge : labels.dropSplit}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple={mode === 'merge'}
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

      {/* Merge: file list */}
      {mode === 'merge' && mergeItems.length > 0 && (
        <div className="space-y-2">
          {mergeItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <FileText className="h-5 w-5 shrink-0 text-violet-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                </p>
              </div>
              <button
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                title={labels.moveUp}
                className="rounded p-1 text-gray-400 hover:text-violet-600 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveItem(index, 1)}
                disabled={index === mergeItems.length - 1}
                title={labels.moveDown}
                className="rounded p-1 text-gray-400 hover:text-violet-600 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                title={labels.remove}
                className="rounded p-1 text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            onClick={handleMerge}
            disabled={mergeItems.length < 2 || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Combine className="mr-2 h-4 w-4" />
            )}
            {labels.mergeButton}
          </Button>
        </div>
      )}

      {/* Split: controls */}
      {mode === 'split' && splitFile && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <FileText className="h-5 w-5 shrink-0 text-violet-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{splitFile.name}</p>
              <p className="text-xs text-gray-500">
                {splitPageCount} {labels.pages} · {formatFileSize(splitFile.size)}
              </p>
            </div>
          </div>
          <div>
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
          <Button
            onClick={handleSplit}
            disabled={!ranges.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Scissors className="mr-2 h-4 w-4" />
            )}
            {labels.splitButton}
          </Button>
        </div>
      )}

      {/* Results */}
      <div ref={resultRef}>
        {mergedBlob && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="mb-3 text-sm font-medium">
              {labels.result}: {mergedPages} {labels.pages} ·{' '}
              {formatFileSize(mergedBlob.size)}
            </p>
            <Button
              onClick={() => downloadPdf(mergedBlob, 'merged.pdf')}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {labels.download}
            </Button>
          </div>
        )}

        {splitParts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {labels.result}: {splitParts.length}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  splitParts.forEach((p) =>
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
            {splitParts.map((part) => (
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
