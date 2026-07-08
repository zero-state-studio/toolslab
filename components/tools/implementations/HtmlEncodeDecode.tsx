'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  X,
  ArrowRightLeft,
  Info,
  Settings,
} from 'lucide-react';
import {
  htmlEncode,
  htmlDecode,
  containsHtmlEntities,
  getEntityStats,
  EncodingType,
} from '@/lib/tools/html-encode-decode';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HtmlEncodeDecodeProps {
  categoryColor: string;
  dictionary?: any;
}

const EXAMPLES = [
  {
    labelKey: 'exampleHtmlTags',
    label: 'HTML Tags',
    input: '<div class="example">Hello World</div>',
    mode: 'encode' as const,
  },
  {
    labelKey: 'exampleSpecialChars',
    label: 'Special Characters',
    input: '"Hello" & \'World\'',
    mode: 'encode' as const,
  },
  {
    labelKey: 'exampleDecodeEntities',
    label: 'Decode Entities',
    input: '&lt;p&gt;Text&lt;/p&gt;',
    mode: 'decode' as const,
  },
  {
    labelKey: 'exampleCopyright',
    label: 'Copyright Symbol',
    input: 'Copyright © 2024',
    mode: 'encode' as const,
  },
];

export default function HtmlEncodeDecode({
  categoryColor,
  dictionary,
}: HtmlEncodeDecodeProps) {
  const ui = dictionary?.tools?.['html-encode-decode']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodingType, setEncodingType] =
    useState<EncodingType>('special-only');
  const [showOptions, setShowOptions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { copied, copy } = useCopy();
  const { trackUse, trackError } = useToolTracking('html-encode-decode');

  // Character counters
  const inputLength = input.length;
  const outputLength = output.length;

  // Entity statistics (only for decode mode)
  const entityStats = mode === 'decode' ? getEntityStats(input) : null;

  // Auto-process on input or mode change
  useEffect(() => {
    handleProcess();
  }, [input, mode, encodingType]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setShowSuccess(false);
      return;
    }

    try {
      if (mode === 'encode') {
        const result = htmlEncode(input, { encodingType });
        if (result.success) {
          setOutput(result.result);
          setShowSuccess(true);
          trackUse(input, result.result, {
            success: true,
          });
        }
      } else {
        const result = htmlDecode(input);
        if (result.success) {
          setOutput(result.result);
          setShowSuccess(true);
          trackUse(input, result.result, {
            success: true,
          });
        }
      }
    } catch (error) {
      setShowSuccess(false);
      trackError(
        error instanceof Error ? error : new Error('Processing failed'),
        input.length
      );
    }
  }, [input, mode, encodingType, trackUse, trackError]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setShowSuccess(false);
  };

  const handleSwap = () => {
    setInput(output);
    setOutput('');
    setShowSuccess(false);
    // Auto-switch mode
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const handleExample = (example: (typeof EXAMPLES)[0]) => {
    setInput(example.input);
    setMode(example.mode);
  };

  const handleCopy = async () => {
    if (output) {
      await copy(output);
    }
  };

  // Auto-detect if input contains entities and suggest decode mode
  const hasEntities = containsHtmlEntities(input);
  const shouldSuggestDecode =
    mode === 'encode' && hasEntities && input.length > 0;

  return (
    <div className="space-y-4">
      {/* Mode Toggle & Encoding Type Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={mode === 'encode' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('encode')}
            className="min-w-[100px]"
          >
            {ui.encodeBtn || 'Encode'}
          </Button>
          <Button
            variant={mode === 'decode' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('decode')}
            className="min-w-[100px]"
          >
            {ui.decodeBtn || 'Decode'}
          </Button>
        </div>

        {mode === 'encode' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              <Settings className="mr-1 h-4 w-4" />
              {ui.optionsBtn || 'Options'}
            </Button>
          </div>
        )}
      </div>

      {/* Encoding Options (only for encode mode) */}
      {mode === 'encode' && showOptions && (
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <Label>{ui.encodingTypeLabel || 'Encoding Type'}</Label>
          <Select
            value={encodingType}
            onValueChange={(v) => setEncodingType(v as EncodingType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="special-only">
                {ui.encodingTypeSpecialOnly || 'Special Characters Only (Recommended)'}
              </SelectItem>
              <SelectItem value="named">
                {ui.encodingTypeNamed || 'Named Entities'} (&lt; &gt; &amp;)
              </SelectItem>
              <SelectItem value="decimal">
                {ui.encodingTypeDecimal || 'Decimal Entities'} (&#60; &#62;)
              </SelectItem>
              <SelectItem value="hexadecimal">
                {ui.encodingTypeHexadecimal || 'Hexadecimal Entities'} (&#x3C; &#x3E;)
              </SelectItem>
              <SelectItem value="all">{ui.encodingTypeAll || 'Encode All Characters'}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {encodingType === 'special-only' &&
              (ui.encodingDescSpecialOnly || "Encodes only HTML special characters like < > & \" '")}
            {encodingType === 'named' &&
              (ui.encodingDescNamed || 'Uses named entities for common characters')}
            {encodingType === 'decimal' &&
              (ui.encodingDescDecimal || 'Uses decimal numeric character references')}
            {encodingType === 'hexadecimal' &&
              (ui.encodingDescHexadecimal || 'Uses hexadecimal numeric character references')}
            {encodingType === 'all' &&
              (ui.encodingDescAll || 'Encodes every character including letters and numbers')}
          </p>
        </div>
      )}

      {/* Success indicator */}
      {showSuccess && output && (
        <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            {mode === 'encode'
              ? (ui.encodingSuccess || 'Encoding completed successfully!')
              : (ui.decodingSuccess || 'Decoding completed successfully!')}
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-detect suggestion */}
      {shouldSuggestDecode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {ui.suggestDecodeText || 'Your input contains HTML entities. Did you mean to'}{' '}
            <button
              onClick={() => setMode('decode')}
              className="font-semibold underline hover:no-underline"
            >
              {ui.suggestDecodeLink || 'decode'}
            </button>
            ?
          </AlertDescription>
        </Alert>
      )}

      {/* Entity Statistics (for decode mode) */}
      {mode === 'decode' && entityStats && entityStats.totalEntities > 0 && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="font-medium">
            {(ui.entitiesFoundLabel || 'Found {count} HTML entities:').replace('{count}', String(entityStats.totalEntities))}
          </div>
          <ul className="ml-4 space-y-0.5 text-muted-foreground">
            {entityStats.namedEntities > 0 && (
              <li>
                • {entityStats.namedEntities} {ui.namedEntitiesLabel || 'named entities'} (&lt; &amp; etc.)
              </li>
            )}
            {entityStats.decimalEntities > 0 && (
              <li>
                • {entityStats.decimalEntities} {ui.decimalEntitiesLabel || 'decimal entities'} (&#60; etc.)
              </li>
            )}
            {entityStats.hexEntities > 0 && (
              <li>
                • {entityStats.hexEntities} {ui.hexEntitiesLabel || 'hexadecimal entities'} (&#x3C; etc.)
              </li>
            )}
            {entityStats.malformedEntities > 0 && (
              <li className="text-yellow-600 dark:text-yellow-500">
                ⚠ {entityStats.malformedEntities} {ui.malformedEntitiesLabel || 'possibly malformed entities'}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="input">{ui.inputLabel || 'Input'}</Label>
          <span className="text-sm text-muted-foreground">
            {inputLength} {ui.charactersLabel || 'characters'}
          </span>
        </div>
        <Textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'encode'
              ? (ui.encodePlaceholder || 'Enter text to encode (e.g., <div>Hello & "World"</div>)')
              : (ui.decodePlaceholder || 'Enter HTML entities to decode (e.g., &lt;div&gt;Hello&lt;/div&gt;)')
          }
          className="min-h-[200px] font-mono text-sm"
        />
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="output">{ui.outputLabel || 'Output'}</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {outputLength} {ui.charactersLabel || 'characters'}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSwap}
                disabled={!output}
                title={ui.swapTitle || 'Swap input/output'}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                disabled={!output}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                disabled={!input && !output}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Textarea
          id="output"
          value={output}
          readOnly
          placeholder={ui.outputPlaceholder || 'Processed output will appear here...'}
          className="min-h-[200px] bg-muted/50 font-mono text-sm"
        />
      </div>

      {/* Quick Examples */}
      <div className="space-y-3">
        <Label>{ui.quickExamplesLabel || 'Quick Examples'}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EXAMPLES.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExample(example)}
              className="h-auto justify-start py-3 text-left"
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold">{ui[example.labelKey] || example.label}</div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {example.input}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
