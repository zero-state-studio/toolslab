'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Copy, Download, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  generateJsonSchema,
  JsonSchemaResult,
  RequiredMode,
  SchemaDraft,
} from '@/lib/tools/json-schema-generator';

interface JsonSchemaGeneratorProps extends BaseToolProps {}

const SAMPLE = `[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "ada@toolslab.dev",
    "createdAt": "2026-08-14T09:30:00Z",
    "score": 9.5,
    "tags": ["dev", "admin"],
    "profile": { "city": "Turin", "verified": true }
  },
  {
    "id": "9f1c1f16-1d3e-42c8-9f2e-7f0f8b0a2d11",
    "email": "linus@toolslab.dev",
    "createdAt": "2026-08-13T18:05:00Z",
    "score": 8,
    "tags": [],
    "profile": { "city": "Helsinki", "verified": false, "plan": "pro" }
  }
]`;

export default function JsonSchemaGenerator({
  dictionary,
}: JsonSchemaGeneratorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['json-schema-generator'] || {};
  const labels = {
    hint:
      t.hint ||
      'Paste a JSON sample — object, array or API response. Array items are merged, so keys missing from some elements stay optional in the schema.',
    placeholder: t.placeholder || 'Paste your JSON sample here…',
    draft: t.draft || 'Draft',
    required: t.required || 'Required keys',
    requiredAll: t.requiredAll || 'All present keys',
    requiredNone: t.requiredNone || 'None',
    detectFormats: t.detectFormats || 'Detect formats',
    includeExamples: t.includeExamples || 'Include examples',
    strictObjects: t.strictObjects || 'No extra properties',
    titleLabel: t.titleLabel || 'Schema title',
    titlePlaceholder: t.titlePlaceholder || 'optional, e.g. User',
    generate: t.generate || 'Generate schema',
    sample: t.sample || 'Load sample',
    result: t.result || 'JSON Schema',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    download: t.download || 'Download',
    objects: t.objects || 'objects',
    properties: t.properties || 'properties',
    depth: t.depth || 'depth',
    formatsFound: t.formatsFound || 'Formats detected',
  };

  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<SchemaDraft>('draft-07');
  const [requiredMode, setRequiredMode] = useState<RequiredMode>('all');
  const [detectFormats, setDetectFormats] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [strictObjects, setStrictObjects] = useState(false);
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<JsonSchemaResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const output = result?.result ?? '';
  const stats = result?.metadata;

  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  const handleGenerate = useCallback(() => {
    const startTime = Date.now();
    const generated = generateJsonSchema(input, {
      draft,
      requiredMode,
      detectFormats,
      includeExamples,
      strictObjects,
      title,
    });

    if (generated.success) {
      setResult(generated);
      setError('');
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'json-schema-generator',
        input,
        output: generated.result ?? '',
        timestamp: startTime,
      });
    } else {
      setResult(null);
      setError(generated.error ?? 'Could not generate schema');
    }
  }, [
    input,
    draft,
    requiredMode,
    detectFormats,
    includeExamples,
    strictObjects,
    title,
    addToHistory,
  ]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title.trim() || 'schema').toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={labels.placeholder}
        spellCheck={false}
        className="h-48 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">{labels.draft}</span>
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value as SchemaDraft)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="draft-07">Draft-07</option>
            <option value="2020-12">2020-12</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">{labels.required}</span>
          <select
            value={requiredMode}
            onChange={(e) => setRequiredMode(e.target.value as RequiredMode)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="all">{labels.requiredAll}</option>
            <option value="none">{labels.requiredNone}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">{labels.titleLabel}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={labels.titlePlaceholder}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={detectFormats}
            onChange={(e) => setDetectFormats(e.target.checked)}
          />
          {labels.detectFormats}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeExamples}
            onChange={(e) => setIncludeExamples(e.target.checked)}
          />
          {labels.includeExamples}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={strictObjects}
            onChange={(e) => setStrictObjects(e.target.checked)}
          />
          {labels.strictObjects}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleGenerate} disabled={!input.trim()}>
          <Braces className="mr-2 h-4 w-4" />
          {labels.generate}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
          {labels.sample}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div ref={resultRef}>
        {output && (
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{labels.result}</p>
              <div className="flex items-center gap-2">
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
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-1 h-3 w-3" />
                  {labels.download}
                </Button>
              </div>
            </div>

            {stats && (
              <p className="text-xs text-gray-500">
                {stats.objectCount} {labels.objects} · {stats.propertyCount}{' '}
                {labels.properties} · {labels.depth} {stats.maxDepth}
                {stats.detectedFormats.length > 0 && (
                  <>
                    {' · '}
                    {labels.formatsFound}: {stats.detectedFormats.join(', ')}
                  </>
                )}
              </p>
            )}

            <pre className="max-h-80 overflow-auto rounded bg-white p-3 font-mono text-sm dark:bg-gray-900">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
