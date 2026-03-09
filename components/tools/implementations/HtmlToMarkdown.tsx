'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  X,
  ArrowRightLeft,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  Upload,
} from 'lucide-react';
import {
  htmlToMarkdown,
  markdownToHtml,
  HtmlToMarkdownOptions,
} from '@/lib/tools/html-to-markdown';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
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

interface HtmlToMarkdownProps {
  categoryColor: string;
}

type ConversionMode = 'html-to-md' | 'md-to-html';

const HTML_EXAMPLE = `<h1>Hello, World!</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
<h2>Features</h2>
<ul>
  <li>Convert HTML to Markdown</li>
  <li>Convert Markdown to HTML</li>
  <li>Supports <a href="https://github.com">GFM tables</a></li>
</ul>
<table>
  <thead>
    <tr><th>Name</th><th>Value</th></tr>
  </thead>
  <tbody>
    <tr><td>Alpha</td><td>1</td></tr>
    <tr><td>Beta</td><td>2</td></tr>
  </tbody>
</table>
<pre><code>const greeting = "Hello!";</code></pre>`;

const FENCE = '```';

const MARKDOWN_EXAMPLE = [
  '# Hello, World!',
  '',
  'This is a **bold** and *italic* paragraph.',
  '',
  '## Features',
  '',
  '- Convert HTML to Markdown',
  '- Convert Markdown to HTML',
  '- Supports [GFM tables](https://github.com)',
  '',
  '| Name  | Value |',
  '|-------|-------|',
  '| Alpha | 1     |',
  '| Beta  | 2     |',
  '',
  `${FENCE}javascript`,
  'const greeting = "Hello!";',
  FENCE,
].join('\n');

export default function HtmlToMarkdown({ categoryColor }: HtmlToMarkdownProps) {
  const [mode, setMode] = useState<ConversionMode>('html-to-md');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [options, setOptions] = useState<HtmlToMarkdownOptions>({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    hr: '---',
  });
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();
  const { trackUse, trackError } = useToolTracking('html-to-markdown');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // Auto-scroll when output changes
  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  // Auto-process on input, mode or options change
  useEffect(() => {
    handleProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, options]);

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const startTime = Date.now();
    setError(null);

    try {
      if (mode === 'html-to-md') {
        const result = htmlToMarkdown(input, options);
        if (result.success && result.result !== undefined) {
          setOutput(result.result);
          trackUse(input, result.result, { success: true });
        } else if (result.error) {
          setError(result.error);
          setOutput('');
          trackError(new Error(result.error), input.length);
        }
      } else {
        const result = markdownToHtml(input);
        if (result.success && result.result !== undefined) {
          setOutput(result.result);
          trackUse(input, result.result, { success: true });
        } else if (result.error) {
          setError(result.error);
          setOutput('');
          trackError(new Error(result.error), input.length);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMsg);
      setOutput('');
      trackError(
        err instanceof Error ? err : new Error(errorMsg),
        input.length
      );
    }
  }, [input, mode, options, trackUse, trackError]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.html?$/i)) {
      setError('Please select a valid .html or .htm file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setInput(content);
      setFileName(file.name);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file, 'UTF-8');

    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setFileName(null);
    setShowPreview(false);
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput('');
    setError(null);
    setMode(mode === 'html-to-md' ? 'md-to-html' : 'html-to-md');
    setShowPreview(false);
  };

  const handleCopy = async () => {
    if (output) await copy(output);
  };

  const handleLoadExample = () => {
    setInput(mode === 'html-to-md' ? HTML_EXAMPLE : MARKDOWN_EXAMPLE);
    setError(null);
  };

  const handleModeChange = (newMode: ConversionMode) => {
    setMode(newMode);
    setInput('');
    setOutput('');
    setError(null);
    setShowPreview(false);
  };

  const inputLines = input.split('\n').length;
  const outputLines = output.split('\n').length;
  const inputChars = input.length;
  const outputChars = output.length;

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <Button
            variant={mode === 'html-to-md' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('html-to-md')}
            className="min-w-[140px]"
          >
            HTML → Markdown
          </Button>
          <Button
            variant={mode === 'md-to-html' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('md-to-html')}
            className="min-w-[140px]"
          >
            Markdown → HTML
          </Button>
        </div>

        {mode === 'html-to-md' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
          >
            <Settings className="mr-1 h-4 w-4" />
            Options
            {showOptions ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        )}

        {mode === 'html-to-md' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1 h-4 w-4" />
              Upload HTML
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </>
        )}

        <Button variant="ghost" size="sm" onClick={handleLoadExample}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Load Example
        </Button>
      </div>

      {/* Options Panel (HTML → MD only) */}
      {mode === 'html-to-md' && showOptions && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="heading-style">Heading Style</Label>
            <Select
              value={options.headingStyle}
              onValueChange={(v) =>
                setOptions((o) => ({
                  ...o,
                  headingStyle: v as 'atx' | 'setext',
                }))
              }
            >
              <SelectTrigger id="heading-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atx">ATX (# Heading)</SelectItem>
                <SelectItem value="setext">Setext (underline)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bullet-marker">Bullet Marker</Label>
            <Select
              value={options.bulletListMarker}
              onValueChange={(v) =>
                setOptions((o) => ({
                  ...o,
                  bulletListMarker: v as '-' | '*' | '+',
                }))
              }
            >
              <SelectTrigger id="bullet-marker">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Dash (-)</SelectItem>
                <SelectItem value="*">Asterisk (*)</SelectItem>
                <SelectItem value="+">Plus (+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code-style">Code Block Style</Label>
            <Select
              value={options.codeBlockStyle}
              onValueChange={(v) =>
                setOptions((o) => ({
                  ...o,
                  codeBlockStyle: v as 'fenced' | 'indented',
                }))
              }
            >
              <SelectTrigger id="code-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fenced">Fenced (```)</SelectItem>
                <SelectItem value="indented">Indented (4 spaces)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hr-style">Horizontal Rule</Label>
            <Select
              value={options.hr}
              onValueChange={(v) => setOptions((o) => ({ ...o, hr: v }))}
            >
              <SelectTrigger id="hr-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="---">--- (dashes)</SelectItem>
                <SelectItem value="***">*** (asterisks)</SelectItem>
                <SelectItem value="___">___ (underscores)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input / Output Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="input-area">
                {mode === 'html-to-md' ? 'HTML Input' : 'Markdown Input'}
              </Label>
              {fileName && (
                <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  {fileName}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {inputChars} chars · {inputLines} lines
            </span>
          </div>
          <Textarea
            id="input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'html-to-md'
                ? '<h1>Paste your HTML here...</h1>'
                : '# Paste your Markdown here...'
            }
            className="h-72 resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div className="space-y-2" ref={resultRef}>
          <div className="flex items-center justify-between">
            <Label htmlFor="output-area">
              {mode === 'html-to-md' ? 'Markdown Output' : 'HTML Output'}
            </Label>
            <div className="flex items-center gap-2">
              {mode === 'md-to-html' && output && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 px-2 text-xs"
                >
                  {showPreview ? (
                    <>
                      <Code className="mr-1 h-3 w-3" />
                      Code
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </>
                  )}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {outputChars} chars · {outputLines} lines
              </span>
            </div>
          </div>

          {mode === 'md-to-html' && showPreview && output ? (
            <div
              className="prose prose-sm dark:prose-invert h-72 max-w-none overflow-auto rounded-md border bg-background px-3 py-2 text-sm"
              dangerouslySetInnerHTML={{ __html: output }}
            />
          ) : (
            <Textarea
              id="output-area"
              value={output}
              readOnly
              placeholder={
                mode === 'html-to-md'
                  ? '# Markdown output will appear here...'
                  : '<p>HTML output will appear here...</p>'
              }
              className="h-72 resize-none font-mono text-sm"
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleCopy}
          disabled={!output}
          variant="outline"
          size="sm"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Output'}
        </Button>

        <Button
          onClick={handleSwap}
          disabled={!output}
          variant="outline"
          size="sm"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Swap
        </Button>

        <Button
          onClick={handleClear}
          disabled={!input && !output}
          variant="outline"
          size="sm"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
