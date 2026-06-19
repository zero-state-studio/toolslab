'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon, Trash2Icon } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { countText, WordCounterStats } from '@/lib/tools/word-counter';

interface WordCounterProps extends BaseToolProps {}

export default function WordCounter({
  dictionary,
  initialInput = '',
}: WordCounterProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const [input, setInput] = useState(initialInput);
  const [copied, setCopied] = useState(false);
  const trackedRef = useRef(false);

  // Translations with fallbacks
  const t = dictionary?.tools?.['word-counter'] || {};
  const labels = {
    inputLabel: t.inputLabel || 'Your text',
    placeholder:
      t.placeholder || 'Type or paste your text here to count words…',
    clear: t.clear || 'Clear',
    copy: t.copy || 'Copy stats',
    copied: t.copied || 'Copied!',
    words: t.words || 'Words',
    characters: t.characters || 'Characters',
    charactersNoSpaces: t.charactersNoSpaces || 'Characters (no spaces)',
    sentences: t.sentences || 'Sentences',
    paragraphs: t.paragraphs || 'Paragraphs',
    lines: t.lines || 'Lines',
    readingTime: t.readingTime || 'Reading time',
    speakingTime: t.speakingTime || 'Speaking time',
  };

  // Real-time stats — recomputed on every keystroke.
  const stats: WordCounterStats | null = useMemo(() => {
    const r = countText(input);
    return r.success ? (r.metadata as WordCounterStats) : null;
  }, [input]);

  // Auto-scroll to results the first time the user produces output.
  useEffect(() => {
    if (input.trim().length > 0) scrollToResult();
  }, [input, scrollToResult]);

  // Analytics: track once per meaningful editing session (debounced).
  useEffect(() => {
    if (!stats || stats.words === 0) {
      trackedRef.current = false;
      return;
    }
    if (trackedRef.current) return;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const r = countText(input);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'word-counter',
        input,
        output: r.result ?? '',
        timestamp: startTime,
      });
      trackedRef.current = true;
    }, 1500);
    return () => clearTimeout(timer);
  }, [input, stats, addToHistory]);

  const handleCopy = async () => {
    if (!stats) return;
    const summary = [
      `${labels.words}: ${stats.words}`,
      `${labels.characters}: ${stats.characters}`,
      `${labels.charactersNoSpaces}: ${stats.charactersNoSpaces}`,
      `${labels.sentences}: ${stats.sentences}`,
      `${labels.paragraphs}: ${stats.paragraphs}`,
      `${labels.lines}: ${stats.lines}`,
      `${labels.readingTime}: ${stats.readingTime}`,
      `${labels.speakingTime}: ${stats.speakingTime}`,
    ].join('\n');
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryStats = [
    { key: 'words', label: labels.words, value: stats?.words ?? 0 },
    {
      key: 'characters',
      label: labels.characters,
      value: stats?.characters ?? 0,
    },
    {
      key: 'sentences',
      label: labels.sentences,
      value: stats?.sentences ?? 0,
    },
    {
      key: 'paragraphs',
      label: labels.paragraphs,
      value: stats?.paragraphs ?? 0,
    },
  ];

  const secondaryStats = [
    {
      key: 'charactersNoSpaces',
      label: labels.charactersNoSpaces,
      value: String(stats?.charactersNoSpaces ?? 0),
    },
    { key: 'lines', label: labels.lines, value: String(stats?.lines ?? 0) },
    {
      key: 'readingTime',
      label: labels.readingTime,
      value: stats?.readingTime ?? '0 sec',
    },
    {
      key: 'speakingTime',
      label: labels.speakingTime,
      value: stats?.speakingTime ?? '0 sec',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="word-counter-input"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {labels.inputLabel}
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInput('')}
          disabled={input.length === 0}
        >
          <Trash2Icon className="mr-1 h-4 w-4" />
          {labels.clear}
        </Button>
      </div>

      <Textarea
        id="word-counter-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={labels.placeholder}
        className="min-h-[220px] font-mono text-sm"
        autoFocus
      />

      <div ref={resultRef} className="space-y-4">
        {/* Primary stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {primaryStats.map((s) => (
            <Card
              key={s.key}
              className="flex flex-col items-center justify-center p-4 text-center"
            >
              <span className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
                {s.value.toLocaleString()}
              </span>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {s.label}
              </span>
            </Card>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {secondaryStats.map((s) => (
            <Card
              key={s.key}
              className="flex flex-col items-center justify-center p-3 text-center"
            >
              <span className="text-lg font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                {s.value}
              </span>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {s.label}
              </span>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!stats || stats.words === 0}
          >
            {copied ? (
              <CheckIcon className="mr-1 h-4 w-4 text-green-600" />
            ) : (
              <CopyIcon className="mr-1 h-4 w-4" />
            )}
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
      </div>
    </div>
  );
}
