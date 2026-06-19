'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CopyIcon, CheckIcon, ArrowRightIcon } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  CaseType,
  ConversionResult,
  StringCaseResult,
  convertString,
  getCaseTypes,
  detectCase,
  batchConvert,
} from '@/lib/tools/string-case-converter';

interface StringCaseConverterProps extends BaseToolProps {}

export default function StringCaseConverter({
  dictionary,
}: StringCaseConverterProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const [input, setInput] = useState('');
  const [result, setResult] = useState<StringCaseResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [detectedCase, setDetectedCase] = useState<CaseType | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [targetCase, setTargetCase] = useState<CaseType>('camelCase');
  const [batchResult, setBatchResult] = useState<
    { original: string; converted: string }[] | null
  >(null);
  const shouldScrollRef = useRef(false);

  // Get translations with fallbacks
  const t = dictionary?.tools?.['string-case-converter'] || {};
  const labels = {
    title: t.title || 'String Case Converter',
    inputLabel: t.inputLabel || 'Enter your text',
    inputPlaceholder:
      t.inputPlaceholder || 'Enter text to convert (e.g., myVariableName)',
    convert: t.convert || 'Convert',
    results: t.results || 'Conversions',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    detectedCase: t.detectedCase || 'Detected case',
    words: t.words || 'Words',
    batchMode: t.batchMode || 'Batch Mode',
    batchPlaceholder:
      t.batchPlaceholder || 'Enter multiple strings (one per line)',
    targetCase: t.targetCase || 'Target Case',
    batchConvert: t.batchConvert || 'Convert All',
    batchResults: t.batchResults || 'Batch Results',
    original: t.original || 'Original',
    converted: t.converted || 'Converted',
    singleMode: t.singleMode || 'Single Mode',
    copyAll: t.copyAll || 'Copy All',
  };

  const caseTypes = getCaseTypes();

  // Convert input
  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setResult(null);
      setDetectedCase(null);
      return;
    }

    shouldScrollRef.current = true;
    const startTime = Date.now();
    const converted = convertString(input);
    const detected = detectCase(input);

    setResult(converted);
    setDetectedCase(detected);

    // Track usage
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'string-case-converter',
      input: input,
      output: JSON.stringify(converted.conversions.map((c) => c.value)),
      timestamp: startTime,
    });
  }, [input, addToHistory]);

  // Handle batch conversion
  const handleBatchConvert = useCallback(() => {
    if (!batchInput.trim()) {
      setBatchResult(null);
      return;
    }

    shouldScrollRef.current = true;
    const lines = batchInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const converted = batchConvert(lines, targetCase);
    setBatchResult(converted);

    // Track usage
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'string-case-converter',
      input: `Batch: ${lines.length} strings to ${targetCase}`,
      output: converted.map((c) => c.converted).join('\n'),
      timestamp: Date.now(),
    });
  }, [batchInput, targetCase, addToHistory]);

  // Auto-scroll when result changes
  useEffect(() => {
    if ((result || batchResult) && shouldScrollRef.current) {
      scrollToResult();
      shouldScrollRef.current = false;
    }
  }, [result, batchResult, scrollToResult]);

  // Auto-convert on input change (debounced)
  useEffect(() => {
    if (!batchMode && input.trim()) {
      const timer = setTimeout(() => {
        const converted = convertString(input);
        const detected = detectCase(input);
        setResult(converted);
        setDetectedCase(detected);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [input, batchMode]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, []);

  // Copy all batch results
  const copyAllBatchResults = useCallback(async () => {
    if (!batchResult) return;
    const text = batchResult.map((r) => r.converted).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [batchResult]);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!batchMode ? 'default' : 'outline'}
          onClick={() => setBatchMode(false)}
          size="sm"
        >
          {labels.singleMode}
        </Button>
        <Button
          variant={batchMode ? 'default' : 'outline'}
          onClick={() => setBatchMode(true)}
          size="sm"
        >
          {labels.batchMode}
        </Button>
      </div>

      {/* Single Mode */}
      {!batchMode && (
        <>
          {/* Input Card */}
          <Card className="p-6">
            <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
              {labels.inputLabel}
            </Label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={labels.inputPlaceholder}
              className="font-mono"
            />

            {/* Detected case & words info */}
            {result && result.words.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {detectedCase && (
                  <span>
                    {labels.detectedCase}:{' '}
                    <span className="font-medium text-primary">
                      {detectedCase}
                    </span>
                  </span>
                )}
                <span>
                  {labels.words}:{' '}
                  <span className="font-medium">{result.words.join(', ')}</span>
                </span>
              </div>
            )}
          </Card>

          {/* Results */}
          {result && result.words.length > 0 && (
            <div ref={resultRef}>
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {labels.results}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.conversions.map((conversion, index) => (
                    <div
                      key={conversion.caseType}
                      className="group relative rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {conversion.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() =>
                            copyToClipboard(conversion.value, index)
                          }
                        >
                          {copiedIndex === index ? (
                            <CheckIcon className="h-3 w-3 text-green-500" />
                          ) : (
                            <CopyIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code className="block break-all font-mono text-sm text-gray-900 dark:text-white">
                        {conversion.value}
                      </code>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Batch Mode */}
      {batchMode && (
        <>
          {/* Batch Input */}
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <div className="flex-1">
                <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                  {labels.targetCase}
                </Label>
                <Select
                  value={targetCase}
                  onValueChange={(value) => setTargetCase(value as CaseType)}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((ct) => (
                      <SelectItem key={ct.type} value={ct.type}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleBatchConvert}>
                {labels.batchConvert}
              </Button>
            </div>

            <Textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={labels.batchPlaceholder}
              className="min-h-[150px] font-mono"
              rows={6}
            />
          </Card>

          {/* Batch Results */}
          {batchResult && batchResult.length > 0 && (
            <div ref={resultRef}>
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {labels.batchResults}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllBatchResults}
                  >
                    {copiedIndex === -1 ? (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                        {labels.copied}
                      </>
                    ) : (
                      <>
                        <CopyIcon className="mr-2 h-4 w-4" />
                        {labels.copyAll}
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {batchResult.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                    >
                      <code className="flex-1 truncate font-mono text-sm text-gray-500">
                        {item.original}
                      </code>
                      <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <code className="flex-1 truncate font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {item.converted}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() =>
                          copyToClipboard(item.converted, index + 100)
                        }
                      >
                        {copiedIndex === index + 100 ? (
                          <CheckIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <CopyIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Quick Examples */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t.examples || 'Examples'}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'myVariableName',
            'UserAccountService',
            'api_response_data',
            'css-class-name',
            'MAX_RETRY_COUNT',
            'Hello World Example',
          ].map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(example);
                setBatchMode(false);
              }}
              className="justify-start font-mono text-xs"
            >
              {example}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
