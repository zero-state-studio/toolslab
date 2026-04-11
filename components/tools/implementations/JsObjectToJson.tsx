'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Copy,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Settings,
  AlertTriangle,
  Code2,
  GitBranch,
  FileJson,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  jsObjectToJson,
  detectInputType,
  inferTypeScriptInterface,
  extractJsonPaths,
  ConversionOptions,
  type InputTypeResult,
  type JsonPath,
} from '@/lib/tools/js-object-to-json';
import { useToolStore } from '@/lib/store/toolStore';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

// Sample data for demonstration
const sampleData = {
  simple: `{
  name: 'John Doe',
  age: 30,
  isActive: true,
  tags: ['developer', 'javascript'],
}`,
  nested: `{
  user: {
    profile: {
      name: 'Alice',
      email: 'alice@example.com'
    },
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
}`,
  withFunctions: `{
  name: 'Calculator',
  add: function(a, b) { return a + b; },
  multiply: (x, y) => x * y,
  value: undefined,
}`,
  withSpecialValues: `{
  bigNumber: 9007199254740993n,
  pattern: /^test$/gi,
  created: new Date('2024-01-15'),
  empty: null,
  missing: undefined,
  infinity: Infinity,
  notANumber: NaN,
}`,
  devTools: `{name: "API Response", status: 200, data: {users: [{id: 1, name: "John"}, {id: 2, name: "Jane"}], total: 2}}`,
};

export default function JsObjectToJson() {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feature 2: input type detection
  const [inputType, setInputType] = useState<InputTypeResult>({ type: 'empty', label: '', description: '' });

  // Feature 3 & 4: output view mode
  const [outputMode, setOutputMode] = useState<'json' | 'typescript' | 'paths'>('json');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [warningsExpanded, setWarningsExpanded] = useState(false);

  // Conversion options
  const [options, setOptions] = useState<ConversionOptions>({
    indent: 2,
    compact: false,
    handleUndefined: 'remove',
    handleFunctions: 'remove',
    handleBigInt: 'string',
    sortKeys: false,
  });

  // Auto-scroll when output changes
  useEffect(() => {
    if (output) {
      scrollToResult();
    }
  }, [output, scrollToResult]);

  // Convert function
  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter a JavaScript object to convert');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setWarnings([]);

    const startTime = Date.now();

    try {
      const result = jsObjectToJson(input, options);

      if (result.success) {
        setOutput(result.output || '');
        setWarnings(result.warnings || []);

        // Track usage
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'js-object-to-json',
          input,
          output: result.output || '',
          timestamp: startTime,
        });
      } else {
        setError(result.error || 'Conversion failed');
        setOutput('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  }, [input, options, addToHistory]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [output]);

  // Download file
  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setWarnings([]);
  }, []);

  // Feature 4: TypeScript interface derived from output
  const tsInterface = useMemo(() => {
    if (!output) return '';
    try {
      const parsed = JSON.parse(output);
      return inferTypeScriptInterface(parsed, 'Root');
    } catch {
      return '';
    }
  }, [output]);

  // Feature 3: Paths derived from output
  const jsonPaths = useMemo<JsonPath[]>(() => {
    if (!output) return [];
    try {
      const parsed = JSON.parse(output);
      return extractJsonPaths(parsed);
    } catch {
      return [];
    }
  }, [output]);

  const handleCopyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1500);
    } catch {}
  }, []);

  // Copy active output mode content
  const handleCopyActive = useCallback(async () => {
    const text = outputMode === 'typescript' ? tsInterface : output;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [outputMode, tsInterface, output]);

  // Load sample
  const handleLoadSample = useCallback((key: keyof typeof sampleData) => {
    setInput(sampleData[key]);
    setError(null);
    setOutput('');
    setWarnings([]);
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConvert();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConvert]);

  // Auto-convert with debounce
  const handleConvertRef = useRef(handleConvert);
  useEffect(() => {
    handleConvertRef.current = handleConvert;
  }, [handleConvert]);

  useEffect(() => {
    setInputType(detectInputType(input));
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setWarnings([]);
      return;
    }
    const timer = setTimeout(() => {
      handleConvertRef.current();
    }, 400);
    return () => clearTimeout(timer);
  }, [input, options]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle>JavaScript Object to JSON</CardTitle>
          <CardDescription>
            Convert JavaScript object literals to valid JSON with smart handling
            of special values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sample Data Selector */}
            <div className="flex items-center space-x-2">
              <Label>Load Sample:</Label>
              <Select
                onValueChange={(v) =>
                  handleLoadSample(v as keyof typeof sampleData)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choose example..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Object</SelectItem>
                  <SelectItem value="nested">Nested Object</SelectItem>
                  <SelectItem value="withFunctions">With Functions</SelectItem>
                  <SelectItem value="withSpecialValues">
                    Special Values
                  </SelectItem>
                  <SelectItem value="devTools">DevTools Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!input && !output}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          {/* Options Panel */}
          <div className="rounded-lg border">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Conversion Options</span>
              </div>
              <div
                className={`transform transition-transform ${showOptions ? 'rotate-180' : ''}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {showOptions && (
              <div className="space-y-4 border-t p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Indentation */}
                  <div className="space-y-2">
                    <Label>Indentation</Label>
                    <div
                      className={
                        options.compact ? 'pointer-events-none opacity-50' : ''
                      }
                    >
                      <Select
                        value={options.indent?.toString()}
                        onValueChange={(v) =>
                          setOptions((prev) => ({
                            ...prev,
                            indent: parseInt(v) as 2 | 4,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 spaces</SelectItem>
                          <SelectItem value="4">4 spaces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Handle Undefined */}
                  <div className="space-y-2">
                    <Label>Handle Undefined</Label>
                    <Select
                      value={options.handleUndefined}
                      onValueChange={(v) =>
                        setOptions((prev) => ({
                          ...prev,
                          handleUndefined: v as 'remove' | 'null',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remove">Remove property</SelectItem>
                        <SelectItem value="null">Convert to null</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Handle Functions */}
                  <div className="space-y-2">
                    <Label>Handle Functions</Label>
                    <Select
                      value={options.handleFunctions}
                      onValueChange={(v) =>
                        setOptions((prev) => ({
                          ...prev,
                          handleFunctions: v as 'remove' | 'string',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remove">Remove property</SelectItem>
                        <SelectItem value="string">
                          Convert to &quot;[Function]&quot;
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Handle BigInt */}
                  <div className="space-y-2">
                    <Label>Handle BigInt</Label>
                    <Select
                      value={options.handleBigInt}
                      onValueChange={(v) =>
                        setOptions((prev) => ({
                          ...prev,
                          handleBigInt: v as 'string' | 'number' | 'error',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">
                          Convert to string
                        </SelectItem>
                        <SelectItem value="number">
                          Convert to number
                        </SelectItem>
                        <SelectItem value="error">Throw error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compact Output */}
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="compact"
                      checked={options.compact}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, compact: checked }))
                      }
                    />
                    <Label htmlFor="compact">Compact output</Label>
                  </div>

                  {/* Sort Keys */}
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="sortKeys"
                      checked={options.sortKeys}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, sortKeys: checked }))
                      }
                    />
                    <Label htmlFor="sortKeys">Sort keys alphabetically</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">JavaScript Object</CardTitle>
                <CardDescription>
                  Paste your JS object with unquoted keys, single quotes,
                  trailing commas, etc.
                </CardDescription>
              </div>
              {inputType.label && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    inputType.type === 'valid-json' &&
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                    inputType.type === 'js-object' &&
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    inputType.type === 'console-log' &&
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                    inputType.type === 'unknown' &&
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  )}
                  title={inputType.description}
                >
                  {inputType.label}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste your JavaScript object here...

Example:
{
  name: 'John',
  age: 30,
  isActive: true,
  tags: ['developer', 'javascript'],
}`}
              className="min-h-[400px] font-mono text-sm"
              rows={20}
            />
          </CardContent>
        </Card>

        {/* Output Editor */}
        <div ref={resultRef}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Output</CardTitle>
                  <CardDescription>
                    {isProcessing
                      ? 'Converting...'
                      : output
                        ? 'Valid JSON ready to use'
                        : 'Auto-converts as you type'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyActive}
                    disabled={!output || outputMode === 'paths'}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden md:inline">
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!output || outputMode !== 'json'}
                  >
                    <Download className="h-4 w-4" />
                    <span className="ml-1 hidden md:inline">Download</span>
                  </Button>
                </div>
              </div>

              {/* Output mode tabs */}
              {output && (
                <div className="mt-3 flex items-center gap-1 rounded-lg border p-1">
                  <button
                    onClick={() => setOutputMode('json')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      outputMode === 'json'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    JSON
                  </button>
                  <button
                    onClick={() => setOutputMode('typescript')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      outputMode === 'typescript'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    TypeScript
                  </button>
                  <button
                    onClick={() => setOutputMode('paths')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      outputMode === 'paths'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    Paths
                    {jsonPaths.length > 0 && (
                      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {jsonPaths.length}
                      </span>
                    )}
                  </button>

                  {/* Warnings badge — inline, non-invasive */}
                  {warnings.length > 0 && (
                    <button
                      onClick={() => setWarningsExpanded((p) => !p)}
                      className="ml-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                      title="Show conversion warnings"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {warnings.length}
                    </button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {warnings.length > 0 && warningsExpanded && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/10">
                  <ul className="space-y-0.5">
                    {warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="text-xs text-amber-700 dark:text-amber-400"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* JSON output */}
              {outputMode === 'json' && (
                <Textarea
                  value={output}
                  readOnly
                  placeholder="JSON output will appear here..."
                  className="min-h-[400px] font-mono text-sm"
                  rows={20}
                />
              )}

              {/* TypeScript interface */}
              {outputMode === 'typescript' && (
                <Textarea
                  value={tsInterface}
                  readOnly
                  placeholder="TypeScript interface will appear here..."
                  className="min-h-[400px] font-mono text-sm"
                  rows={20}
                />
              )}

              {/* Path explorer */}
              {outputMode === 'paths' && (
                <div className="min-h-[400px] overflow-auto rounded-md border font-mono text-sm">
                  <div className="sticky top-0 border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                    Click any path to copy it to clipboard
                  </div>
                  <div className="divide-y">
                    {jsonPaths.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleCopyPath(item.path)}
                        className="group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <span
                          className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                            item.type === 'string' &&
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            item.type === 'number' &&
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            item.type === 'boolean' &&
                              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                            item.type === 'object' &&
                              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                            item.type === 'array' &&
                              'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                            (item.type === 'null' ||
                              item.value === null) &&
                              'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          )}
                        >
                          {item.type}
                        </span>
                        <span className="flex-1 text-foreground">
                          {item.path}
                        </span>
                        <span className="max-w-[120px] truncate text-xs text-muted-foreground">
                          {item.type !== 'object' && item.type !== 'array'
                            ? JSON.stringify(item.value)
                            : item.value}
                        </span>
                        <span className="shrink-0 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          {copiedPath === item.path ? '✓ copied' : 'copy'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
