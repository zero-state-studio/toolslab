'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { formatFileSize, downloadBlob } from '@/lib/tools/image-tools';
import {
  HeicTarget,
  isHeicFile,
  convertHeic,
  buildHeicOutputName,
} from '@/lib/tools/heic-to-jpg';

interface HeicToJpgProps extends BaseToolProps {}

interface Job {
  id: string;
  file: File;
  status: 'pending' | 'done' | 'error';
  blob?: Blob;
  url?: string;
  outName?: string;
  error?: string;
}

export default function HeicToJpg({ dictionary }: HeicToJpgProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['heic-to-jpg'] || {};
  const labels = {
    drop: t.drop || 'Drop HEIC photos here or click to upload',
    hint:
      t.hint ||
      'Convert iPhone HEIC/HEIF photos to JPG or PNG — 100% in your browser, nothing is uploaded',
    format: t.format || 'Output format',
    quality: t.quality || 'Quality',
    convertButton: t.convertButton || 'Convert',
    download: t.download || 'Download',
    downloadAll: t.downloadAll || 'Download all',
    onlyHeic:
      t.onlyHeic || 'Only HEIC/HEIF files are supported (try .heic photos from iPhone)',
    processing: t.processing || 'Converting…',
    result: t.result || 'Converted photos',
    failed: t.failed || 'Conversion failed',
  };

  const [jobs, setJobs] = useState<Job[]>([]);
  const [target, setTarget] = useState<HeicTarget>('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasResults = jobs.some((j) => j.status === 'done');

  useEffect(() => {
    if (hasResults) scrollToResult();
  }, [hasResults, scrollToResult]);

  useEffect(() => {
    return () => {
      jobs.forEach((j) => j.url && URL.revokeObjectURL(j.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const list = Array.from(files ?? []);
      if (list.length === 0) return;
      const heic = list.filter((f) => isHeicFile(f));
      if (heic.length === 0) {
        setError(labels.onlyHeic);
        return;
      }
      setError('');
      setJobs((prev) => {
        prev.forEach((j) => j.url && URL.revokeObjectURL(j.url));
        return heic.map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'pending' as const,
        }));
      });
    },
    [labels.onlyHeic]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (jobs.length === 0) return;
    setError('');
    setIsProcessing(true);
    const startTime = Date.now();
    const results: Job[] = [];
    for (const job of jobs) {
      try {
        const { blob, fileName } = await convertHeic(job.file, target, quality);
        results.push({
          ...job,
          status: 'done',
          blob,
          url: URL.createObjectURL(blob),
          outName: fileName,
        });
      } catch (e) {
        results.push({
          ...job,
          status: 'error',
          error: e instanceof Error ? e.message : labels.failed,
        });
      }
    }
    setJobs(results);
    setIsProcessing(false);

    const ok = results.filter((r) => r.status === 'done');
    if (ok.length > 0) {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'heic-to-jpg',
        input: `${jobs.length} HEIC file${jobs.length > 1 ? 's' : ''}`,
        output: `${ok.length} → ${target.toUpperCase()}`,
        timestamp: startTime,
      });
    }
  };

  const downloadAll = () => {
    jobs
      .filter((j) => j.status === 'done' && j.blob)
      .forEach((j) =>
        downloadBlob(j.blob!, j.outName || buildHeicOutputName(j.file.name, target))
      );
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
          accept=".heic,.heif,image/heic,image/heif"
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

      {jobs.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center gap-2 text-sm">
                {j.status === 'done' && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                )}
                {j.status === 'error' && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <span className="min-w-0 flex-1 truncate">{j.file.name}</span>
                <span className="shrink-0 text-xs text-gray-500">
                  {formatFileSize(j.file.size)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{labels.format}</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as HeicTarget)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
              </select>
            </label>

            {target === 'jpeg' && (
              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{labels.quality}</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
                <span className="tabular-nums text-xs text-gray-500">
                  {Math.round(quality * 100)}%
                </span>
              </label>
            )}
          </div>

          <Button onClick={handleConvert} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.processing}
              </>
            ) : (
              labels.convertButton
            )}
          </Button>
        </div>
      )}

      <div ref={resultRef}>
        {hasResults && (
          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{labels.result}</p>
              {jobs.filter((j) => j.status === 'done').length > 1 && (
                <Button variant="outline" size="sm" onClick={downloadAll}>
                  <Download className="mr-2 h-4 w-4" />
                  {labels.downloadAll}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {jobs
                .filter((j) => j.status === 'done' && j.url)
                .map((j) => (
                  <div key={j.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={j.url}
                      alt={j.outName}
                      className="aspect-square w-full rounded border border-gray-200 bg-white object-contain dark:border-gray-700"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        j.blob &&
                        downloadBlob(
                          j.blob,
                          j.outName || buildHeicOutputName(j.file.name, target)
                        )
                      }
                    >
                      <Download className="mr-1 h-3 w-3" />
                      {j.outName}
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
