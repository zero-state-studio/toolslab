'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { FileText, Wand2 } from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { ToolFrame } from '@/components/tools/ToolFrame';
import {
  GenerationType,
  OutputFormat,
  TextVariant,
  LoremIpsumOptions,
  LoremIpsumResult,
  generateLoremIpsum,
  getDefaultOptions,
  getVariantNames,
  getTypeNames,
  getFormatNames,
} from '@/lib/tools/lorem-ipsum-generator';

interface LoremIpsumGeneratorProps extends BaseToolProps {}

export default function LoremIpsumGenerator({
  categoryColor,
  dictionary,
}: LoremIpsumGeneratorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const [options, setOptions] =
    useState<LoremIpsumOptions>(getDefaultOptions());
  const [result, setResult] = useState<LoremIpsumResult | null>(null);
  const shouldScrollRef = useRef(false);

  const t = dictionary || {};
  const ui = dictionary?.tools?.['lorem-ipsum-generator']?.ui ?? {};
  const labels = {
    generateType: t.generateType || 'Generate',
    count: t.count || 'Count',
    variant: t.variant || 'Text Style',
    format: t.format || 'Output Format',
    startWithLorem: t.startWithLorem || 'Start with "Lorem ipsum..."',
    generate: t.generate || 'Generate',
    result: t.result || 'Generated Text',
    statistics: t.statistics || 'Statistics',
    words: t.words || 'Words',
    characters: t.characters || 'Characters',
    sentences: t.sentences || 'Sentences',
    paragraphs: t.paragraphs || 'Paragraphs',
    options: t.options || 'Options',
  };

  const generateText = useCallback(
    (overrideOptions?: LoremIpsumOptions) => {
      const opts = overrideOptions ?? options;
      const startTime = Date.now();
      const newSeed = Date.now();
      const generated = generateLoremIpsum(opts, newSeed);
      setResult(generated);

      addToHistory({
        id: crypto.randomUUID(),
        tool: 'lorem-ipsum-generator',
        input: JSON.stringify(opts),
        output: generated.text,
        timestamp: startTime,
      });
    },
    [options, addToHistory]
  );

  const handleGenerate = useCallback(() => {
    shouldScrollRef.current = true;
    generateText();
  }, [generateText]);

  useEffect(() => {
    if (result && shouldScrollRef.current) {
      scrollToResult();
      shouldScrollRef.current = false;
    }
  }, [result, scrollToResult]);

  useEffect(() => {
    generateText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMaxCount = (type: GenerationType): number => {
    switch (type) {
      case 'words':
        return 500;
      case 'sentences':
        return 50;
      case 'paragraphs':
        return 20;
      default:
        return 100;
    }
  };

  const variantNames = getVariantNames();
  const typeNames = getTypeNames();
  const formatNames = getFormatNames();

  const presets: { type: GenerationType; count: number; label: string }[] = [
    { type: 'paragraphs', count: 1, label: '1 Paragraph' },
    { type: 'paragraphs', count: 3, label: '3 Paragraphs' },
    { type: 'paragraphs', count: 5, label: '5 Paragraphs' },
    { type: 'sentences', count: 5, label: '5 Sentences' },
    { type: 'sentences', count: 10, label: '10 Sentences' },
    { type: 'words', count: 50, label: '50 Words' },
    { type: 'words', count: 100, label: '100 Words' },
    { type: 'words', count: 200, label: '200 Words' },
  ];

  const downloadExtension =
    options.format === 'html'
      ? 'html'
      : options.format === 'markdown'
        ? 'md'
        : 'txt';

  return (
    <div ref={resultRef}>
      <ToolFrame
        title={ui.toolTitle || 'Lorem Ipsum Generator'}
        subtitle={ui.toolSubtitle || 'Placeholder text generator'}
        icon={<FileText className="h-5 w-5" />}
        categoryColor={categoryColor}
        primaryAction={{
          label: labels.generate,
          icon: <Wand2 className="h-4 w-4" />,
          onClick: handleGenerate,
        }}
      >
        <ToolFrame.Section title={labels.options}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {labels.generateType}
              </Label>
              <Select
                value={options.type}
                onValueChange={(value) =>
                  setOptions({
                    ...options,
                    type: value as GenerationType,
                    count: Math.min(
                      options.count,
                      getMaxCount(value as GenerationType)
                    ),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(typeNames) as [GenerationType, string][]
                  ).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {labels.variant}
              </Label>
              <Select
                value={options.variant}
                onValueChange={(value) =>
                  setOptions({ ...options, variant: value as TextVariant })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(variantNames) as [TextVariant, string][]
                  ).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {labels.count}: {options.count}{' '}
                {typeNames[options.type].toLowerCase()}
              </Label>
              <Slider
                value={[options.count]}
                onValueChange={([value]) =>
                  setOptions({ ...options, count: value })
                }
                min={1}
                max={getMaxCount(options.type)}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {labels.format}
              </Label>
              <Select
                value={options.format}
                onValueChange={(value) =>
                  setOptions({ ...options, format: value as OutputFormat })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(formatNames) as [OutputFormat, string][]
                  ).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                {labels.startWithLorem}
              </Label>
              <Switch
                checked={options.startWithLoremIpsum}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, startWithLoremIpsum: checked })
                }
              />
            </div>
          </div>
        </ToolFrame.Section>

        <ToolFrame.Section title={ui.quickPresets || 'Quick presets'}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {presets.map((preset) => (
              <Button
                key={`${preset.type}-${preset.count}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  shouldScrollRef.current = true;
                  const next: LoremIpsumOptions = {
                    ...options,
                    type: preset.type,
                    count: preset.count,
                  };
                  setOptions(next);
                  generateText(next);
                }}
                className={
                  options.type === preset.type && options.count === preset.count
                    ? 'border-primary bg-primary/10'
                    : ''
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </ToolFrame.Section>

        <ToolFrame.Output
          title={labels.result}
          copyText={result?.text}
          downloadText={result?.text}
          downloadFilename={`lorem-ipsum.${downloadExtension}`}
          onRegenerate={handleGenerate}
          show={!!result}
        >
          {result ? (
            <>
              <Textarea
                value={result.text}
                readOnly
                className="min-h-[200px] font-mono text-sm"
                rows={10}
              />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: result.wordCount, label: labels.words },
                  { value: result.charCount, label: labels.characters },
                  { value: result.sentenceCount, label: labels.sentences },
                  { value: result.paragraphCount, label: labels.paragraphs },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800"
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: categoryColor || 'var(--pg-accent)' }}
                    >
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </ToolFrame.Output>
      </ToolFrame>
    </div>
  );
}
