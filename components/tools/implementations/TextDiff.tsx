'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileText,
  GitBranch,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  Share2,
  FileCode,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  DiffOptions,
  DiffResult,
  computeDiff,
  generateUnifiedDiff,
  generateSideBySideHTML,
  detectFileType,
} from '@/lib/tools/textDiff';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';

interface TextDiffProps {
  initialText1?: string;
  initialText2?: string;
  dictionary?: any;
}

export default function TextDiff({
  initialText1 = '',
  initialText2 = '',
  dictionary,
}: TextDiffProps) {
  const ui = dictionary?.tools?.['text-diff']?.ui ?? {};
  // State management
  const [text1, setText1] = useState(initialText1);
  const [text2, setText2] = useState(initialText2);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [workerReady, setWorkerReady] = useState(false);
  const { trackUse, trackCustom, trackError } = useToolTracking('text-diff');

  // Options state
  const [options, setOptions] = useState<DiffOptions>({
    mode: 'side-by-side',
    granularity: 'line',
    ignoreCase: false,
    ignoreWhitespace: false,
    ignoreLeadingWhitespace: false,
    ignoreTrailingWhitespace: false,
    ignoreBlankLines: false,
    showInvisibles: false,
    contextLines: 3,
    syntaxHighlighting: true,
    fileType: 'auto',
  });

  // Refs
  const workerRef = useRef<Worker | null>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Debounced values for performance - 1 second delay to allow user typing
  const debouncedText1 = useDebounce(text1, 1000);
  const debouncedText2 = useDebounce(text2, 1000);

  // Initialize Web Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      workerRef.current = new Worker(
        new URL('/lib/workers/diffWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event) => {
        const { type, result, error } = event.data;

        if (type === 'result') {
          setDiffResult(result);
          setIsProcessing(false);
          setError(null);

          // Track successful diff
          if (result) {
            trackCustom({
              inputSize: text1.length + text2.length,
              outputSize: JSON.stringify(result.statistics).length,
              success: true,
              mode: options.mode,
              changes: result.changes.length,
            });
          }
        } else if (type === 'error') {
          setError(error);
          setIsProcessing(false);

          // Track error
          trackError(new Error(error), text1.length + text2.length);
        } else if (type === 'progress') {
          // Handle progress updates if needed
        }
      };

      setWorkerReady(true);

      return () => {
        workerRef.current?.terminate();
      };
    }
  }, []);

  // Compute diff when texts or options change
  useEffect(() => {
    if (debouncedText1 || debouncedText2) {
      computeDiffAsync();
    }
  }, [debouncedText1, debouncedText2, options]);

  // Compute diff using Web Worker or fallback
  const computeDiffAsync = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (workerReady && workerRef.current) {
        // Use Web Worker for large texts
        const messageId = Date.now().toString();
        workerRef.current.postMessage({
          type: 'compute',
          id: messageId,
          payload: {
            text1: debouncedText1,
            text2: debouncedText2,
            options,
          },
        });
      } else {
        // Fallback to main thread
        const result = computeDiff(debouncedText1, debouncedText2, options);
        setDiffResult(result);
        setIsProcessing(false);

        // Track successful diff (fallback)
        if (result) {
          trackCustom({
            inputSize: debouncedText1.length + debouncedText2.length,
            outputSize: JSON.stringify(result.statistics).length,
            success: true,
            mode: options.mode,
            changes: result.changes.length,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute diff');
      setIsProcessing(false);

      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        debouncedText1.length + debouncedText2.length
      );
    }
  }, [
    debouncedText1,
    debouncedText2,
    options,
    workerReady,
    trackUse,
    trackError,
  ]);

  // File handling
  const handleFileUpload = useCallback((file: File, side: 'left' | 'right') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (side === 'left') {
        setText1(content);
      } else {
        setText2(content);
      }

      // Auto-detect file type
      const detectedType = detectFileType(content);
      setOptions((prev) => ({ ...prev, fileType: detectedType as any }));
    };
    reader.onerror = () => {
      setError(`Failed to read file: ${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, side: 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0], side);
      }
    },
    [handleFileUpload]
  );

  // Navigation functions
  const navigateToChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (!diffResult) return;

      const changes = diffResult.changes.filter((c) => c.type !== 'equal');
      if (changes.length === 0) return;

      let newIndex = currentChangeIndex;
      if (direction === 'next') {
        newIndex = (currentChangeIndex + 1) % changes.length;
      } else {
        newIndex =
          currentChangeIndex === 0
            ? changes.length - 1
            : currentChangeIndex - 1;
      }

      setCurrentChangeIndex(newIndex);

      // Scroll to the change
      const change = changes[newIndex];
      const lineNumber = change.lineNumber.left || change.lineNumber.right || 0;
      const element = document.getElementById(`line-${lineNumber}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [diffResult, currentChangeIndex]
  );

  // Export functions
  const exportAsHTML = useCallback(() => {
    if (!diffResult) return;

    const html = generateSideBySideHTML(diffResult.changes);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const exportAsPatch = useCallback(() => {
    const patch = generateUnifiedDiff('file.txt', text1, text2, options);
    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'changes.patch';
    a.click();
    URL.revokeObjectURL(url);
  }, [text1, text2, options]);

  const copyToClipboard = useCallback(async () => {
    if (!diffResult) return;

    const patch = generateUnifiedDiff('file.txt', text1, text2, options);
    await navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diffResult, text1, text2, options]);

  // Synchronized scrolling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>, source: 'left' | 'right') => {
      if (!e.currentTarget) return;

      const scrollTop = e.currentTarget.scrollTop;
      const scrollLeft = e.currentTarget.scrollLeft;

      if (source === 'left' && rightPaneRef.current) {
        rightPaneRef.current.scrollTop = scrollTop;
        rightPaneRef.current.scrollLeft = scrollLeft;
      } else if (source === 'right' && leftPaneRef.current) {
        leftPaneRef.current.scrollTop = scrollTop;
        leftPaneRef.current.scrollLeft = scrollLeft;
      }
    },
    []
  );

  // Render diff visualization
  const renderDiffView = useMemo(() => {
    if (!diffResult) return null;

    const { changes, statistics } = diffResult;

    if (options.mode === 'side-by-side') {
      return (
        <div className="grid h-[600px] grid-cols-2 gap-4">
          {/* Left pane */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-red-50 px-4 py-2 dark:bg-red-950/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {ui.original || 'Original'}
                </span>
                <Badge variant="destructive">
                  {statistics.deletions} {ui.deletions || 'deletions'}
                </Badge>
              </div>
            </CardHeader>
            <ScrollArea
              ref={leftPaneRef}
              className="h-full"
              onScroll={(e) => handleScroll(e, 'left')}
            >
              <div className="p-4 font-mono text-sm">
                {changes.map((change, idx) => {
                  if (change.type === 'add') {
                    return <div key={idx} className="h-6" />;
                  }

                  const bgColor =
                    change.type === 'remove'
                      ? 'bg-red-100 dark:bg-red-950/30'
                      : change.type === 'modify'
                        ? 'bg-yellow-100 dark:bg-yellow-950/30'
                        : '';

                  return (
                    <div
                      key={idx}
                      id={`line-${change.lineNumber.left}`}
                      className={`flex ${bgColor} min-h-[24px]`}
                    >
                      {showLineNumbers && (
                        <span className="w-12 select-none pr-2 text-right text-gray-500">
                          {change.lineNumber.left}
                        </span>
                      )}
                      <span className="flex-1 whitespace-pre-wrap break-all px-2">
                        {change.subChanges
                          ? change.subChanges.map((sub, subIdx) => {
                              if (sub.type === 'remove') {
                                return (
                                  <span
                                    key={subIdx}
                                    className="bg-red-200 dark:bg-red-800"
                                  >
                                    {sub.value}
                                  </span>
                                );
                              }
                              return sub.type === 'equal' ? sub.value : null;
                            })
                          : change.content.left}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Right pane */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-green-50 px-4 py-2 dark:bg-green-950/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {ui.modified || 'Modified'}
                </span>
                <Badge variant="default" className="bg-green-600">
                  {statistics.additions} {ui.additions || 'additions'}
                </Badge>
              </div>
            </CardHeader>
            <ScrollArea
              ref={rightPaneRef}
              className="h-full"
              onScroll={(e) => handleScroll(e, 'right')}
            >
              <div className="p-4 font-mono text-sm">
                {changes.map((change, idx) => {
                  if (change.type === 'remove') {
                    return <div key={idx} className="h-6" />;
                  }

                  const bgColor =
                    change.type === 'add'
                      ? 'bg-green-100 dark:bg-green-950/30'
                      : change.type === 'modify'
                        ? 'bg-yellow-100 dark:bg-yellow-950/30'
                        : '';

                  return (
                    <div
                      key={idx}
                      id={`line-${change.lineNumber.right}`}
                      className={`flex ${bgColor} min-h-[24px]`}
                    >
                      {showLineNumbers && (
                        <span className="w-12 select-none pr-2 text-right text-gray-500">
                          {change.lineNumber.right}
                        </span>
                      )}
                      <span className="flex-1 whitespace-pre-wrap break-all px-2">
                        {change.subChanges
                          ? change.subChanges.map((sub, subIdx) => {
                              if (sub.type === 'add') {
                                return (
                                  <span
                                    key={subIdx}
                                    className="bg-green-200 dark:bg-green-800"
                                  >
                                    {sub.value}
                                  </span>
                                );
                              }
                              return sub.type === 'equal' ? sub.value : null;
                            })
                          : change.content.right}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      );
    } else if (options.mode === 'unified') {
      return (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {ui.unifiedDiff || 'Unified Diff'}
              </span>
              <div className="flex gap-2">
                <Badge variant="destructive">
                  {statistics.deletions} {ui.deletions || 'deletions'}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  {statistics.additions} {ui.additions || 'additions'}
                </Badge>
                <Badge variant="secondary">
                  {statistics.modifications} {ui.modifications || 'modifications'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="h-[600px]">
            <div className="p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap break-all">
                {diffResult.patch ||
                  generateUnifiedDiff('file.txt', text1, text2, options)}
              </pre>
            </div>
          </ScrollArea>
        </Card>
      );
    } else {
      // Inline mode
      return (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {ui.inlineDiff || 'Inline Diff'}
              </span>
              <div className="flex gap-2">
                <Badge variant="destructive">
                  {statistics.deletions} {ui.deletions || 'deletions'}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  {statistics.additions} {ui.additions || 'additions'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="h-[600px]">
            <div className="p-4 font-mono text-sm">
              {changes.map((change, idx) => {
                let bgColor = '';
                let symbol = ' ';

                if (change.type === 'add') {
                  bgColor = 'bg-green-100 dark:bg-green-950/30';
                  symbol = '+';
                } else if (change.type === 'remove') {
                  bgColor = 'bg-red-100 dark:bg-red-950/30';
                  symbol = '-';
                } else if (change.type === 'modify') {
                  return (
                    <React.Fragment key={idx}>
                      <div className="flex min-h-[24px] bg-red-100 dark:bg-red-950/30">
                        <span className="w-6 select-none text-center text-red-600">
                          -
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all px-2">
                          {change.content.left}
                        </span>
                      </div>
                      <div className="flex min-h-[24px] bg-green-100 dark:bg-green-950/30">
                        <span className="w-6 select-none text-center text-green-600">
                          +
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all px-2">
                          {change.content.right}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                }

                return (
                  <div key={idx} className={`flex ${bgColor} min-h-[24px]`}>
                    <span
                      className={`w-6 select-none text-center ${
                        change.type === 'add'
                          ? 'text-green-600'
                          : change.type === 'remove'
                            ? 'text-red-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {symbol}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all px-2">
                      {change.content.left || change.content.right}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      );
    }
  }, [
    diffResult,
    options.mode,
    showLineNumbers,
    text1,
    text2,
    options,
    handleScroll,
  ]);

  return (
    <div
      className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto bg-background p-4' : ''}`}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {ui.heading || 'Text Diff Checker'}
          </h2>
          {diffResult && (
            <div className="flex gap-2">
              <Badge variant="outline">
                {diffResult.statistics.similarity}% {ui.similar || 'similar'}
              </Badge>
              <Badge variant="outline">
                {diffResult.changes.filter((c) => c.type !== 'equal').length}{' '}
                {ui.changes || 'changes'}
              </Badge>
            </div>
          )}
        </div>

        {diffResult && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => navigateToChange('prev')}
              disabled={
                !diffResult ||
                diffResult.changes.filter((c) => c.type !== 'equal').length ===
                  0
              }
              title={ui.previousChangeTitle || 'Previous change (Shift+F3)'}
              aria-label={ui.previousChange || 'Previous change'}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => navigateToChange('next')}
              disabled={
                !diffResult ||
                diffResult.changes.filter((c) => c.type !== 'equal').length ===
                  0
              }
              title={ui.nextChangeTitle || 'Next change (F3)'}
              aria-label={ui.nextChange || 'Next change'}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-9" />
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={copyToClipboard}
              disabled={!diffResult}
              aria-label={ui.copyDiffToClipboard || 'Copy diff to clipboard'}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={exportAsPatch}
              disabled={!diffResult}
              title={ui.downloadAsPatchFile || 'Download as patch file'}
              aria-label={ui.downloadAsPatchFile || 'Download as patch file'}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={exportAsHTML}
              disabled={!diffResult}
              title={ui.exportAsHtml || 'Export as HTML'}
              aria-label={ui.exportAsHtml || 'Export as HTML'}
            >
              <FileCode className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={
                isFullscreen
                  ? ui.exitFullscreen || 'Exit fullscreen'
                  : ui.enterFullscreen || 'Enter fullscreen'
              }
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Options panel */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-4 w-4" />
            {ui.diffOptions || 'Diff Options'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{ui.viewMode || 'View Mode'}</Label>
              <Select
                value={options.mode}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, mode: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">
                    {ui.sideBySide || 'Side by Side'}
                  </SelectItem>
                  <SelectItem value="inline">{ui.inline || 'Inline'}</SelectItem>
                  <SelectItem value="unified">
                    {ui.unified || 'Unified'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{ui.granularity || 'Granularity'}</Label>
              <Select
                value={options.granularity}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, granularity: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">{ui.line || 'Line'}</SelectItem>
                  <SelectItem value="word">{ui.word || 'Word'}</SelectItem>
                  <SelectItem value="character">
                    {ui.character || 'Character'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{ui.fileType || 'File Type'}</Label>
              <Select
                value={options.fileType}
                onValueChange={(value) =>
                  setOptions((prev) => ({ ...prev, fileType: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    {ui.autoDetect || 'Auto Detect'}
                  </SelectItem>
                  <SelectItem value="text">
                    {ui.plainText || 'Plain Text'}
                  </SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {options.mode === 'unified' && (
              <div className="space-y-2">
                <Label>{ui.contextLines || 'Context Lines'}</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[options.contextLines || 3]}
                    onValueChange={([value]) =>
                      setOptions((prev) => ({ ...prev, contextLines: value }))
                    }
                    min={0}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-sm">
                    {options.contextLines}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-case"
                checked={options.ignoreCase}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, ignoreCase: checked }))
                }
              />
              <Label htmlFor="ignore-case">
                {ui.ignoreCase || 'Ignore Case'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-whitespace"
                checked={options.ignoreWhitespace}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, ignoreWhitespace: checked }))
                }
              />
              <Label htmlFor="ignore-whitespace">
                {ui.ignoreAllWhitespace || 'Ignore All Whitespace'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-blank"
                checked={options.ignoreBlankLines}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, ignoreBlankLines: checked }))
                }
              />
              <Label htmlFor="ignore-blank">
                {ui.ignoreBlankLines || 'Ignore Blank Lines'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-line-numbers"
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
              />
              <Label htmlFor="show-line-numbers">
                {ui.showLineNumbers || 'Show Line Numbers'}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input areas - Always visible */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {ui.originalText || 'Original Text'}
              </CardTitle>
              <div className="flex gap-2">
                <input
                  ref={fileInput1Ref}
                  type="file"
                  className="hidden"
                  accept=".txt,.json,.xml,.yaml,.yml,.sql,.js,.ts,.py,.java,.cs,.cpp,.go,.rs,.php,.rb,.swift"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'left');
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput1Ref.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {ui.upload || 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setText1('')}
                  disabled={!text1}
                >
                  {ui.clear || 'Clear'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'left')}
              className="relative"
            >
              <Textarea
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder={
                  ui.originalPlaceholder ||
                  'Paste or type your original text here, or drag and drop a file...'
                }
                className="min-h-[200px] font-mono text-sm"
              />
              {text1.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p className="text-sm">
                      {ui.dropFileHere || 'Drop a file here'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {text1.length} {ui.characters || 'characters'} •{' '}
              {text1.split('\n').length} {ui.lines || 'lines'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {ui.modifiedText || 'Modified Text'}
              </CardTitle>
              <div className="flex gap-2">
                <input
                  ref={fileInput2Ref}
                  type="file"
                  className="hidden"
                  accept=".txt,.json,.xml,.yaml,.yml,.sql,.js,.ts,.py,.java,.cs,.cpp,.go,.rs,.php,.rb,.swift"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'right');
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput2Ref.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {ui.upload || 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setText2('')}
                  disabled={!text2}
                >
                  {ui.clear || 'Clear'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'right')}
              className="relative"
            >
              <Textarea
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder={
                  ui.modifiedPlaceholder ||
                  'Paste or type your modified text here, or drag and drop a file...'
                }
                className="min-h-[200px] font-mono text-sm"
              />
              {text2.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p className="text-sm">
                      {ui.dropFileHere || 'Drop a file here'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {text2.length} {ui.characters || 'characters'} •{' '}
              {text2.split('\n').length} {ui.lines || 'lines'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state when no content */}
      {!text1 && !text2 && !isProcessing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">
              {ui.readyToCompare || 'Ready to Compare'}
            </h3>
            <p className="max-w-md text-center text-muted-foreground">
              {ui.emptyStateDescription ||
                'Enter or upload text in both areas above to see the differences highlighted with real-time comparison'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isProcessing && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
            <span className="text-lg">
              {ui.computingDifferences || 'Computing differences...'}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-600">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Diff visualization */}
      {diffResult && !isProcessing && (
        <>
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <GitBranch className="h-5 w-5" />
              {ui.diffResults || 'Diff Results'}
            </h3>
            {renderDiffView}
          </div>
        </>
      )}

      {/* Statistics summary */}
      {diffResult && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-4 w-4" />
              {ui.diffStatistics || 'Diff Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{diffResult.statistics.additions}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ui.statAdditions || 'Additions'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  -{diffResult.statistics.deletions}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ui.statDeletions || 'Deletions'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  ~{diffResult.statistics.modifications}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ui.statModifications || 'Modifications'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  ={diffResult.statistics.unchanged}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ui.statUnchanged || 'Unchanged'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {diffResult.statistics.similarity}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {ui.statSimilarity || 'Similarity'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts help */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg">
            {ui.keyboardShortcuts || 'Keyboard Shortcuts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div>
              <kbd className="rounded bg-muted px-2 py-1">F3</kbd>{' '}
              {ui.nextChange || 'Next change'}
            </div>
            <div>
              <kbd className="rounded bg-muted px-2 py-1">Shift+F3</kbd>{' '}
              {ui.previousChange || 'Previous change'}
            </div>
            <div>
              <kbd className="rounded bg-muted px-2 py-1">Ctrl+S</kbd>{' '}
              {ui.downloadDiff || 'Download diff'}
            </div>
            <div>
              <kbd className="rounded bg-muted px-2 py-1">Ctrl+C</kbd>{' '}
              {ui.copyDiff || 'Copy diff'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
