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
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  isPdfFile,
  fileToArrayBuffer,
  mergePdfBuffers,
  pdfBytesToBlob,
  downloadPdf,
  formatFileSize,
} from '@/lib/tools/pdf-merger-splitter';

interface MergePdfProps extends BaseToolProps {}

interface MergeItem {
  file: File;
  id: string;
}

export default function MergePdf({ dictionary }: MergePdfProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['merge-pdf'] || {};
  const labels = {
    drop: t.drop || 'Drop PDF files here or click to upload',
    hint: t.hint || 'Add two or more PDFs, reorder them, then merge into one file',
    mergeButton: t.mergeButton || 'Merge PDFs',
    pages: t.pages || 'pages',
    download: t.download || 'Download merged PDF',
    remove: t.remove || 'Remove',
    moveUp: t.moveUp || 'Move up',
    moveDown: t.moveDown || 'Move down',
    result: t.result || 'Result',
    onlyPdf: t.onlyPdf || 'Only PDF files are supported',
    reorderTitle: t.reorderTitle || 'Reorder files before merging',
    reorderHint:
      t.reorderHint ||
      'Use the arrows to set the order — files are merged top to bottom',
  };

  const [items, setItems] = useState<MergeItem[]>([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedPages, setMergedPages] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mergedBlob) scrollToResult();
  }, [mergedBlob, scrollToResult]);

  const resetResult = () => {
    setMergedBlob(null);
    setMergedPages(0);
    setError('');
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const pdfs = Array.from(files).filter(isPdfFile);
      if (pdfs.length === 0) {
        setError(labels.onlyPdf);
        return;
      }
      setError('');
      resetResult();
      setItems((prev) => [
        ...prev,
        ...pdfs.map((file) => ({ file, id: crypto.randomUUID() })),
      ]);
    },
    [labels.onlyPdf]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    resetResult();
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    resetResult();
  };

  const handleMerge = async () => {
    setError('');
    setIsProcessing(true);
    const startTime = Date.now();
    try {
      const buffers = await Promise.all(
        items.map((i) => fileToArrayBuffer(i.file))
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
        tool: 'merge-pdf',
        input: `merge ${items.length} PDFs`,
        output: `${r.metadata?.pageCount ?? 0} pages, ${formatFileSize(blob.size)}`,
        timestamp: startTime,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

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
          multiple
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

      {/* File list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.length > 1 && (
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <ArrowUpDown className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {labels.reorderTitle}
                </p>
                <p className="text-xs text-gray-500">{labels.reorderHint}</p>
              </div>
            </div>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {index + 1}
              </span>
              <FileText className="h-5 w-5 shrink-0 text-violet-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  title={labels.moveUp}
                  aria-label={labels.moveUp}
                  className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-violet-50 hover:text-violet-600 disabled:opacity-25 dark:hover:bg-violet-900/30"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
                <span className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  title={labels.moveDown}
                  aria-label={labels.moveDown}
                  className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-violet-50 hover:text-violet-600 disabled:opacity-25 dark:hover:bg-violet-900/30"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                title={labels.remove}
                aria-label={labels.remove}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
          <Button
            onClick={handleMerge}
            disabled={items.length < 2 || isProcessing}
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

      {/* Result */}
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
      </div>
    </div>
  );
}
