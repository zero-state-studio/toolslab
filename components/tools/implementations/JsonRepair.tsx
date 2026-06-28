'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { repairJson } from '@/lib/tools/json-repair';

interface JsonRepairProps extends BaseToolProps {}

type Indent = '2' | '4' | 'tab' | '0';

const SAMPLE = `{
  name: 'Ada',
  roles: ['dev', 'admin',],
  active: True,
  meta: None
}`;

export default function JsonRepair({ dictionary }: JsonRepairProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['json-repair'] || {};
  const labels = {
    hint:
      t.hint ||
      'Paste broken JSON — trailing commas, single quotes, unquoted keys, Python None/True/False, even truncated or markdown-wrapped output from ChatGPT. Get valid JSON back.',
    placeholder: t.placeholder || 'Paste broken or malformed JSON here…',
    indent: t.indent || 'Indent',
    repair: t.repair || 'Repair JSON',
    sample: t.sample || 'Load sample',
    result: t.result || 'Repaired JSON',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    noChange: t.noChange || 'Already valid — formatted only',
    tab: t.tab || 'Tab',
    minified: t.minified || 'Minified',
  };

  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<Indent>('2');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [noChange, setNoChange] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  const handleRepair = useCallback(() => {
    const startTime = Date.now();
    const r = repairJson(input, {
      indent: indent === 'tab' ? 'tab' : Number(indent),
    });
    if (r.success) {
      setOutput(r.result ?? '');
      setError('');
      setNoChange(!r.changed);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'json-repair',
        input,
        output: r.result ?? '',
        timestamp: startTime,
      });
    } else {
      setOutput('');
      setError(r.error ?? 'Could not repair JSON');
    }
  }, [input, indent, addToHistory]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{labels.indent}</span>
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as Indent)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="tab">{labels.tab}</option>
            <option value="0">{labels.minified}</option>
          </select>
        </label>

        <Button onClick={handleRepair} disabled={!input.trim()}>
          <Wand2 className="mr-2 h-4 w-4" />
          {labels.repair}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {labels.result}
                {noChange && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({labels.noChange})
                  </span>
                )}
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
