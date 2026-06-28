'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ArrowRightLeft, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { envToJson, jsonToEnv } from '@/lib/tools/env-to-json';

interface EnvToJsonProps extends BaseToolProps {}

type Direction = 'env2json' | 'json2env';

const SAMPLE_ENV = `# Database
export DATABASE_URL=postgres://user:pass@localhost:5432/db
API_KEY=sk_live_abc123
DEBUG=true
APP_NAME="My App"`;

export default function EnvToJson({ dictionary }: EnvToJsonProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['env-to-json'] || {};
  const labels = {
    hint:
      t.hint ||
      'Convert a .env file to JSON or JSON back to .env. Handles quotes, comments and the export prefix — all in your browser.',
    env2json: t.env2json || '.env → JSON',
    json2env: t.json2env || 'JSON → .env',
    swap: t.swap || 'Swap direction',
    placeholderEnv: t.placeholderEnv || 'Paste your .env file here…',
    placeholderJson: t.placeholderJson || 'Paste your JSON object here…',
    result: t.result || 'Result',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    sample: t.sample || 'Load sample',
    vars: t.vars || 'variables',
  };

  const [direction, setDirection] = useState<Direction>('env2json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  const convert = useCallback(
    (text: string, dir: Direction) => {
      if (!text.trim()) {
        setOutput('');
        setError('');
        setCount(0);
        return;
      }
      const startTime = Date.now();
      const r = dir === 'env2json' ? envToJson(text) : jsonToEnv(text);
      if (r.success) {
        setOutput(r.result ?? '');
        setError('');
        setCount(r.count ?? 0);
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'env-to-json',
          input: text,
          output: r.result ?? '',
          timestamp: startTime,
        });
      } else {
        setOutput('');
        setError(r.error ?? 'Conversion failed');
        setCount(0);
      }
    },
    [addToHistory]
  );

  useEffect(() => {
    convert(input, direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, direction]);

  const swap = () => {
    // Feed the current output back as input in the opposite direction.
    const next: Direction = direction === 'env2json' ? 'json2env' : 'env2json';
    setInput(output || '');
    setDirection(next);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-600">
          <button
            onClick={() => setDirection('env2json')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              direction === 'env2json'
                ? 'bg-violet-500 text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {labels.env2json}
          </button>
          <button
            onClick={() => setDirection('json2env')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              direction === 'json2env'
                ? 'bg-violet-500 text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {labels.json2env}
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={swap} title={labels.swap}>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDirection('env2json');
            setInput(SAMPLE_ENV);
          }}
        >
          {labels.sample}
        </Button>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={direction === 'env2json' ? labels.placeholderEnv : labels.placeholderJson}
        spellCheck={false}
        className="h-44 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div ref={resultRef}>
        {output && (
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {labels.result}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({count} {labels.vars})
                </span>
              </p>
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
            </div>
            <pre className="max-h-96 overflow-auto rounded bg-white p-3 font-mono text-sm dark:bg-gray-900">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
