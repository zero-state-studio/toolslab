'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Download, AlertCircle, Check, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { formatFileSize, downloadBlob } from '@/lib/tools/image-tools';
import { optimizeSvg, SvgOptimizeResult } from '@/lib/tools/svg-optimizer';

interface SvgOptimizerProps extends BaseToolProps {}

export default function SvgOptimizer({ dictionary }: SvgOptimizerProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['svg-optimizer'] || {};
  const labels = {
    hint:
      t.hint ||
      'Paste SVG markup or drop an .svg file to strip comments, metadata and editor cruft and shrink the file — all in your browser.',
    placeholder: t.placeholder || 'Paste your SVG markup here…',
    drop: t.drop || 'Drop an .svg file or click to upload',
    prettify: t.prettify || 'Pretty-print output',
    optimize: t.optimize || 'Optimize SVG',
    result: t.result || 'Optimized SVG',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    download: t.download || 'Download',
    saved: t.saved || 'smaller',
    onlySvg: t.onlySvg || 'Only SVG files are supported',
    preview: t.preview || 'Preview',
  };

  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('optimized.svg');
  const [prettify, setPrettify] = useState(false);
  const [result, setResult] = useState<SvgOptimizeResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result?.success) scrollToResult();
  }, [result, scrollToResult]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!/\.svg$/i.test(f.name) && f.type !== 'image/svg+xml') {
        setError(labels.onlySvg);
        return;
      }
      setError('');
      setFileName(f.name.replace(/\.svg$/i, '') + '.min.svg');
      f.text().then(setInput);
    },
    [labels.onlySvg]
  );

  const handleOptimize = useCallback(async () => {
    const startTime = Date.now();
    const r = await optimizeSvg(input, { prettify });
    setResult(r);
    if (r.success) {
      setError('');
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'svg-optimizer',
        input: `${formatFileSize(r.originalSize ?? 0)}`,
        output: `${formatFileSize(r.optimizedSize ?? 0)} (${r.savedPercent}% ${labels.saved})`,
        timestamp: startTime,
      });
    } else {
      setError(r.error ?? 'Could not optimize SVG');
    }
  }, [input, prettify, addToHistory, labels.saved]);

  const handleCopy = async () => {
    if (!result?.data) return;
    await navigator.clipboard.writeText(result.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const previewSrc = result?.data
    ? `data:image/svg+xml;utf8,${encodeURIComponent(result.data)}`
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 transition hover:border-violet-400 dark:border-gray-600"
      >
        <Upload className="mx-auto mb-1 h-5 w-5 text-gray-400" />
        {labels.drop}
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={labels.placeholder}
        spellCheck={false}
        className="h-40 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={prettify}
            onChange={(e) => setPrettify(e.target.checked)}
          />
          {labels.prettify}
        </label>
        <Button onClick={handleOptimize} disabled={!input.trim()}>
          <Sparkles className="mr-2 h-4 w-4" />
          {labels.optimize}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div ref={resultRef}>
        {result?.success && result.data && (
          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="text-gray-500">
                  {formatFileSize(result.originalSize ?? 0)} →{' '}
                </span>
                <span className="font-semibold">
                  {formatFileSize(result.optimizedSize ?? 0)}
                </span>{' '}
                <span className="text-green-600">
                  ({result.savedPercent}% {labels.saved})
                </span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-green-600" />
                      {labels.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      {labels.copy}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      new Blob([result.data!], { type: 'image/svg+xml' }),
                      fileName
                    )
                  }
                >
                  <Download className="mr-1 h-3 w-3" />
                  {labels.download}
                </Button>
              </div>
            </div>

            {previewSrc && (
              <div className="flex items-center justify-center rounded border border-gray-200 bg-white p-4 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt={labels.preview} className="max-h-48" />
              </div>
            )}

            <pre className="max-h-56 overflow-auto rounded bg-white p-3 font-mono text-xs dark:bg-gray-900">
              {result.data}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
