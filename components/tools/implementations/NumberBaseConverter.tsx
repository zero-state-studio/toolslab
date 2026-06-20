'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  BitWidth,
  convertBases,
  isValidBase,
  MIN_BASE,
  MAX_BASE,
} from '@/lib/tools/number-base-converter';

interface NumberBaseConverterProps extends BaseToolProps {}

const COMMON_BASES = [
  { base: 2, key: 'binary' as const },
  { base: 8, key: 'octal' as const },
  { base: 10, key: 'decimal' as const },
  { base: 16, key: 'hexadecimal' as const },
];

const BIT_WIDTHS: BitWidth[] = [null, 8, 16, 32, 64];

export default function NumberBaseConverter({
  dictionary,
}: NumberBaseConverterProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['number-base-converter'] || {};
  const labels = {
    inputLabel: t.inputLabel || 'Number to convert',
    placeholder: t.placeholder || 'Enter a number…',
    fromBase: t.fromBase || 'Input base',
    customBase: t.customBase || 'Custom base',
    bitWidth: t.bitWidth || 'Bit width',
    signed: t.signed || 'Signed (two’s complement)',
    binary: t.binary || 'Binary',
    octal: t.octal || 'Octal',
    decimal: t.decimal || 'Decimal',
    hexadecimal: t.hexadecimal || 'Hexadecimal',
    base: t.base || 'Base',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    none: t.none || 'Unbounded',
    bits: t.bits || 'bits',
  };

  const [input, setInput] = useState('255');
  const [fromBase, setFromBase] = useState(10);
  const [bitWidth, setBitWidth] = useState<BitWidth>(null);
  const [signed, setSigned] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const tracked = useRef(false);

  const result = useMemo(
    () => convertBases(input, fromBase, { bitWidth, signed }),
    [input, fromBase, bitWidth, signed]
  );

  useEffect(() => {
    if (input.trim()) scrollToResult();
  }, [input, scrollToResult]);

  // Analytics: track once per editing session (debounced).
  useEffect(() => {
    if (tracked.current || !result.success) return;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'number-base-converter',
        input: `${input} (base ${fromBase})`,
        output: `dec ${result.decimal}, hex ${result.hexadecimal}`,
        timestamp: startTime,
      });
      tracked.current = true;
    }, 1500);
    return () => clearTimeout(timer);
  }, [input, fromBase, result, addToHistory]);

  const copyValue = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
  };

  const rows = [
    { id: 'decimal', label: labels.decimal, value: result.decimal },
    { id: 'hexadecimal', label: labels.hexadecimal, value: result.hexadecimal },
    { id: 'octal', label: labels.octal, value: result.octal },
    { id: 'binary', label: labels.binary, value: result.binary },
  ];
  if (result.custom) {
    rows.push({
      id: 'custom',
      label: `${labels.base} ${result.custom.base}`,
      value: result.custom.value,
    });
  }

  return (
    <div className="space-y-5">
      {/* Input + base */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {labels.inputLabel}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={labels.placeholder}
            spellCheck={false}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {labels.fromBase}
          </label>
          <div className="flex items-center gap-2">
            <select
              value={fromBase}
              onChange={(e) => setFromBase(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              {COMMON_BASES.map((b) => (
                <option key={b.base} value={b.base}>
                  {labels[b.key]} ({b.base})
                </option>
              ))}
              {![2, 8, 10, 16].includes(fromBase) && (
                <option value={fromBase}>
                  {labels.base} {fromBase}
                </option>
              )}
            </select>
            <input
              type="number"
              min={MIN_BASE}
              max={MAX_BASE}
              value={fromBase}
              onChange={(e) => {
                const b = Number(e.target.value);
                if (isValidBase(b)) setFromBase(b);
              }}
              title={labels.customBase}
              className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {labels.bitWidth}
          </label>
          <select
            value={bitWidth ?? 'none'}
            onChange={(e) =>
              setBitWidth(
                e.target.value === 'none' ? null : (Number(e.target.value) as BitWidth)
              )
            }
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {BIT_WIDTHS.map((w) => (
              <option key={String(w)} value={w ?? 'none'}>
                {w === null ? labels.none : `${w} ${labels.bits}`}
              </option>
            ))}
          </select>
        </div>
        <label
          className={`flex items-center gap-2 text-sm ${
            bitWidth === null ? 'opacity-40' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={signed}
            disabled={bitWidth === null}
            onChange={(e) => setSigned(e.target.checked)}
          />
          {labels.signed}
        </label>
      </div>

      {/* Output */}
      <div ref={resultRef}>
        {!result.success && input.trim() ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {result.error}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <span className="w-28 shrink-0 text-sm font-medium text-gray-500">
                  {row.label}
                </span>
                <code className="min-w-0 flex-1 break-all font-mono text-sm">
                  {row.value}
                </code>
                <button
                  onClick={() => copyValue(row.id, row.value ?? '')}
                  title={labels.copy}
                  className="shrink-0 rounded p-1 text-gray-400 hover:text-violet-600"
                >
                  {copied === row.id ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
