'use client';

import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, X, ArrowRightLeft, Info, Play } from 'lucide-react';
import {
  binaryToText,
  textToBinary,
  hexToBinary,
  binaryToHex,
  hexToText,
  textToHex,
  detectInputFormat,
  isValidBinary,
  isValidHex,
} from '@/lib/tools/binary-to-text';
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
import { Switch } from '@/components/ui/switch';

interface BinaryToTextProps {
  categoryColor: string;
  dictionary?: any;
}

type ConversionType =
  | 'text-to-binary'
  | 'binary-to-text'
  | 'text-to-hex'
  | 'hex-to-text'
  | 'binary-to-hex'
  | 'hex-to-binary';

const EXAMPLES = [
  {
    labelKey: 'exampleHelloWorldBinary',
    label: 'Hello World (Binary)',
    input: '01001000 01100101 01101100 01101100 01101111',
    conversionType: 'binary-to-text' as ConversionType,
  },
  {
    labelKey: 'exampleHelloText',
    label: 'Hello (Text)',
    input: 'Hello',
    conversionType: 'text-to-binary' as ConversionType,
  },
  {
    labelKey: 'exampleHelloHex',
    label: 'Hello (Hex)',
    input: '48 65 6C 6C 6F',
    conversionType: 'hex-to-text' as ConversionType,
  },
  {
    labelKey: 'exampleAsciiArt',
    label: 'ASCII Art',
    input: '42 49 4E 41 52 59',
    conversionType: 'hex-to-binary' as ConversionType,
  },
];

export default function BinaryToText({ categoryColor, dictionary }: BinaryToTextProps) {
  const ui = dictionary?.tools?.['binary-to-text']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversionType, setConversionType] =
    useState<ConversionType>('binary-to-text');
  const [spaceSeparated, setSpaceSeparated] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytesProcessed, setBytesProcessed] = useState(0);
  const { copied, copy } = useCopy();
  const { trackUse, trackError } = useToolTracking('binary-to-text');

  // Character counters
  const inputLength = input.length;
  const outputLength = output.length;

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
      setError(null);
      setBytesProcessed(0);
      return;
    }

    setError(null);

    try {
      let result;
      const options = { spaceSeparated };

      switch (conversionType) {
        case 'binary-to-text':
          result = binaryToText(input);
          break;
        case 'text-to-binary':
          result = textToBinary(input, options);
          break;
        case 'hex-to-text':
          result = hexToText(input);
          break;
        case 'text-to-hex':
          result = textToHex(input, options);
          break;
        case 'binary-to-hex':
          result = binaryToHex(input, options);
          break;
        case 'hex-to-binary':
          result = hexToBinary(input, options);
          break;
        default:
          result = binaryToText(input);
      }

      if (result.success) {
        setOutput(result.result);
        setBytesProcessed(result.bytesProcessed || 0);
        setShowSuccess(true);
        trackUse(input, result.result, { success: true });
      } else {
        setError(result.error || 'Conversion failed');
        setOutput('');
        setShowSuccess(false);
        setBytesProcessed(0);
        trackError(
          new Error(result.error || 'Conversion failed'),
          input.length
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMsg);
      setOutput('');
      setShowSuccess(false);
      setBytesProcessed(0);
      trackError(
        err instanceof Error ? err : new Error(errorMsg),
        input.length
      );
    }
  }, [input, conversionType, spaceSeparated, trackUse, trackError]);

  // Handle convert button click
  const handleConvert = useCallback(() => {
    handleProcess();
  }, [handleProcess]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setShowSuccess(false);
    setError(null);
    setBytesProcessed(0);
  };

  const handleSwap = () => {
    const currentOutput = output;
    setInput(currentOutput);
    setOutput('');
    setShowSuccess(false);
    setError(null);
    setBytesProcessed(0);
    // Auto-switch conversion type for bidirectional conversions
    const swapMap: Record<ConversionType, ConversionType> = {
      'binary-to-text': 'text-to-binary',
      'text-to-binary': 'binary-to-text',
      'hex-to-text': 'text-to-hex',
      'text-to-hex': 'hex-to-text',
      'binary-to-hex': 'hex-to-binary',
      'hex-to-binary': 'binary-to-hex',
    };
    setConversionType(swapMap[conversionType]);
  };

  const handleExample = (example: (typeof EXAMPLES)[0]) => {
    setInput(example.input);
    setConversionType(example.conversionType);
    // Clear previous output when loading example
    setOutput('');
    setShowSuccess(false);
    setError(null);
    setBytesProcessed(0);
  };

  const handleCopy = async () => {
    if (output) {
      await copy(output);
    }
  };

  // Auto-detect input format and suggest conversion
  const detectedFormat = input.trim() ? detectInputFormat(input) : null;
  const shouldSuggestChange =
    detectedFormat &&
    ((detectedFormat === 'binary' && !conversionType.startsWith('binary')) ||
      (detectedFormat === 'hex' && !conversionType.startsWith('hex')) ||
      (detectedFormat === 'text' && !conversionType.startsWith('text')));

  const getConversionLabel = (type: ConversionType): string => {
    const labels: Record<ConversionType, string> = {
      'binary-to-text': 'Binary to Text',
      'text-to-binary': 'Text to Binary',
      'hex-to-text': 'Hex to Text',
      'text-to-hex': 'Text to Hex',
      'binary-to-hex': 'Binary to Hex',
      'hex-to-binary': 'Hex to Binary',
    };
    return labels[type];
  };

  return (
    <div className="space-y-4">
      {/* Conversion Type Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="conversion-type" className="mb-2 block">
            {ui.conversionType || 'Conversion Type'}
          </Label>
          <Select
            value={conversionType}
            onValueChange={(v) => setConversionType(v as ConversionType)}
          >
            <SelectTrigger id="conversion-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binary-to-text">{ui.binaryToText || 'Binary to Text'}</SelectItem>
              <SelectItem value="text-to-binary">{ui.textToBinary || 'Text to Binary'}</SelectItem>
              <SelectItem value="hex-to-text">{ui.hexToText || 'Hex to Text'}</SelectItem>
              <SelectItem value="text-to-hex">{ui.textToHex || 'Text to Hex'}</SelectItem>
              <SelectItem value="binary-to-hex">{ui.binaryToHex || 'Binary to Hex'}</SelectItem>
              <SelectItem value="hex-to-binary">{ui.hexToBinary || 'Hex to Binary'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(conversionType.includes('binary') &&
          conversionType.startsWith('text')) ||
        conversionType.includes('to-hex') ||
        conversionType.includes('to-binary') ? (
          <div className="flex items-center gap-2">
            <Switch
              id="space-separated"
              checked={spaceSeparated}
              onCheckedChange={setSpaceSeparated}
            />
            <Label htmlFor="space-separated" className="cursor-pointer">
              {ui.spaceSeparatedOutput || 'Space-separated output'}
            </Label>
          </div>
        ) : null}
      </div>

      {/* Success indicator */}
      {showSuccess && output && (
        <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            Conversion completed! Processed {bytesProcessed} bytes.
          </AlertDescription>
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert className="border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100">
          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Auto-detect suggestion */}
      {shouldSuggestChange && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your input looks like {detectedFormat}. Consider switching to a{' '}
            <button
              onClick={() => {
                if (detectedFormat === 'binary') {
                  setConversionType('binary-to-text');
                } else if (detectedFormat === 'hex') {
                  setConversionType('hex-to-text');
                } else {
                  setConversionType('text-to-binary');
                }
              }}
              className="font-semibold underline hover:no-underline"
            >
              {detectedFormat}-based conversion
            </button>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="input">{ui.inputLabel || 'Input'}</Label>
          <span className="text-sm text-muted-foreground">
            {inputLength} characters
          </span>
        </div>
        <Textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            conversionType.startsWith('binary')
              ? (ui.placeholderBinary || 'Enter binary (e.g., 01001000 01100101 01101100 01101100 01101111)')
              : conversionType.startsWith('hex')
                ? (ui.placeholderHex || 'Enter hexadecimal (e.g., 48 65 6C 6C 6F or 0x48656C6C6F)')
                : (ui.placeholderText || 'Enter text to convert...')
          }
          className="min-h-[150px] font-mono text-sm"
        />
      </div>

      {/* Convert Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleConvert}
          disabled={!input.trim()}
          className="flex-1 sm:flex-none"
        >
          <Play className="mr-2 h-4 w-4" />
          {ui.convertButton || 'Convert'}
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={!input && !output}
        >
          <X className="mr-2 h-4 w-4" />
          {ui.clearButton || 'Clear'}
        </Button>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="output">{ui.outputLabel || 'Output'}</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {outputLength} characters
              {bytesProcessed > 0 && ` (${bytesProcessed} bytes)`}
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
                title={ui.copyTitle || 'Copy to clipboard'}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <Textarea
          id="output"
          value={output}
          readOnly
          placeholder={ui.outputPlaceholder || 'Converted output will appear here...'}
          className="min-h-[150px] bg-muted/50 font-mono text-sm"
        />
      </div>

      {/* Quick Examples */}
      <div className="space-y-3">
        <Label>{ui.quickExamples || 'Quick Examples'}</Label>
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
                  {example.input.length > 30
                    ? example.input.substring(0, 30) + '...'
                    : example.input}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold">{ui.infoTitle || 'About Binary, Hex & Text'}</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Binary:</strong> {ui.infoBinary || 'Base-2 number system using only 0 and 1. Each character is represented by 8 bits (1 byte).'}
          </li>
          <li>
            <strong>Hexadecimal:</strong> {ui.infoHex || 'Base-16 number system using 0-9 and A-F. Each pair represents 1 byte (e.g., 48 = "H").'}
          </li>
          <li>
            <strong>ASCII:</strong> {ui.infoAscii || 'Standard encoding where each character maps to a number 0-127.'}
          </li>
          <li>
            <strong>UTF-8:</strong> {ui.infoUtf8 || 'Variable-width encoding supporting all Unicode characters (1-4 bytes per character).'}
          </li>
        </ul>
      </div>
    </div>
  );
}
