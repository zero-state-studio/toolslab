'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  parseList,
  compareLists,
  transformList,
  fuzzyMatch,
  exportResults,
  validatePackageVersions,
  normalizeUrls,
  type ComparisonOptions,
  type ComparisonResult,
  type ParseListOptions,
  type TransformOptions,
  type FuzzyMatchOptions,
} from '@/lib/tools/list-compare';
import {
  Download,
  Copy,
  Upload,
  Plus,
  Minus,
  Settings,
  BarChart3,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Filter,
  FileText,
  Shuffle,
  GitCompare,
  Layers,
  Zap,
  Code,
  Globe,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';

interface ListConfig {
  id: string;
  name: string;
  content: string;
  visible: boolean;
}

interface ComparisonVisualization {
  type: 'venn' | 'table' | 'stats' | 'matrix';
  data: any;
}

export default function ListCompare({
  categoryColor,
  initialInput,
  onInputChange,
  onOutputChange,
}: BaseToolProps) {
  const { trackUse, trackError } = useToolTracking('list-compare');
  const [lists, setLists] = useState<ListConfig[]>([
    { id: '1', name: 'List 1', content: initialInput || '', visible: true },
    { id: '2', name: 'List 2', content: '', visible: true },
  ]);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Comparison options
  const [comparisonMode, setComparisonMode] =
    useState<ComparisonOptions['mode']>('set');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [sortBeforeCompare, setSortBeforeCompare] = useState(false);
  const [fuzzyThreshold, setFuzzyThreshold] = useState([80]);

  // Parse options
  const [separator, setSeparator] =
    useState<ParseListOptions['separator']>('auto');
  const [removeEmptyLines, setRemoveEmptyLines] = useState(true);
  const [filterPattern, setFilterPattern] = useState('');

  // Transform options
  const [sortType, setSortType] =
    useState<TransformOptions['sort']>('alphabetical');
  const [caseTransform, setCaseTransform] =
    useState<TransformOptions['case']>('lower');
  const [enableTransforms, setEnableTransforms] = useState(false);

  // Export options
  const [exportFormat, setExportFormat] = useState<
    'javascript' | 'typescript' | 'python' | 'sql' | 'json' | 'csv' | 'markdown'
  >('json');

  // Comparison options collapsed state
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  // Results tab state
  const [resultsTab, setResultsTab] = useState('union');
  const [sortResults, setSortResults] = useState(false);

  // Clear success/error messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Parse all lists when content changes
  const parsedLists = useMemo(() => {
    const parseOptions: ParseListOptions = {
      separator,
      trimLines: trimWhitespace,
      removeEmptyLines,
      filterPattern: filterPattern || undefined,
    };

    const processed: Record<string, string[]> = {};
    const errors: string[] = [];

    lists.forEach((list) => {
      if (list.visible && list.content.trim()) {
        const result = parseList(list.content, parseOptions);
        if (result.success && result.items) {
          // Apply transforms if enabled
          let items = result.items;
          if (enableTransforms) {
            const transformOptions: TransformOptions = {
              sort: sortType,
              case: caseTransform,
              trim: trimWhitespace,
              removeDuplicates,
            };
            items = transformList(items, transformOptions);
          }
          processed[list.id] = items;
        } else {
          errors.push(`${list.name}: ${result.error}`);
        }
      }
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
    } else {
      setError('');
    }

    return processed;
  }, [
    lists,
    separator,
    trimWhitespace,
    removeEmptyLines,
    filterPattern,
    enableTransforms,
    sortType,
    caseTransform,
    removeDuplicates,
  ]);

  // Update results tab when comparison result changes
  useEffect(() => {
    if (comparisonResult?.success) {
      // Set default tab to first available result
      if (comparisonResult.union && comparisonResult.union.length > 0) {
        setResultsTab('union');
      } else if (
        comparisonResult.intersection &&
        comparisonResult.intersection.length > 0
      ) {
        setResultsTab('intersection');
      } else if (
        comparisonResult.unique &&
        Object.keys(comparisonResult.unique).length > 0
      ) {
        setResultsTab('unique');
      } else {
        setResultsTab('export');
      }
    }
  }, [comparisonResult]);

  // Get processed items count for display
  const getProcessedItemsCount = useCallback(
    (listId: string) => {
      return parsedLists[listId]?.length || 0;
    },
    [parsedLists]
  );

  // Get processed items preview for display
  const getProcessedItemsPreview = useCallback(
    (listId: string) => {
      const items = parsedLists[listId];
      if (!items || items.length === 0) return '';

      const preview = items.slice(0, 3).join(', ');
      return items.length > 3
        ? `${preview} ...and ${items.length - 3} more`
        : preview;
    },
    [parsedLists]
  );

  // Perform comparison when lists or options change
  const performComparison = useCallback(() => {
    if (Object.keys(parsedLists).length < 1) {
      setComparisonResult(null);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const options: ComparisonOptions = {
        mode: comparisonMode,
        caseSensitive,
        trimWhitespace,
        removeDuplicates,
        sortBeforeCompare,
        fuzzyThreshold: fuzzyThreshold[0] / 100,
        filterPattern: filterPattern || undefined,
      };

      const result = compareLists(parsedLists, options);
      setComparisonResult(result);

      if (result.success) {
        setSuccess(
          `Comparison completed! Processed ${result.metadata?.totalItems} items across ${result.metadata?.listsProcessed} lists in ${result.metadata?.processingTime}ms`
        );
        onOutputChange?.(JSON.stringify(result, null, 2));
        trackUse(JSON.stringify(parsedLists), JSON.stringify(result, null, 2), {
          success: true,
        });
      } else {
        setError(result.error || 'Comparison failed');
        trackError(
          new Error(result.error || 'Comparison failed'),
          JSON.stringify(parsedLists).length
        );
      }
    } catch (err) {
      setError(
        `Comparison failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setComparisonResult(null);
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        JSON.stringify(parsedLists).length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    parsedLists,
    comparisonMode,
    caseSensitive,
    trimWhitespace,
    removeDuplicates,
    sortBeforeCompare,
    fuzzyThreshold,
    filterPattern,
    onOutputChange,
    trackUse,
    trackError,
  ]);

  // Auto-run comparison when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(parsedLists).length > 0) {
        performComparison();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [performComparison]);

  const addList = () => {
    const newId = String(lists.length + 1);
    setLists((prev) => [
      ...prev,
      {
        id: newId,
        name: `List ${newId}`,
        content: '',
        visible: true,
      },
    ]);
  };

  const removeList = (id: string) => {
    if (lists.length > 2) {
      setLists((prev) => prev.filter((list) => list.id !== id));
    }
  };

  const updateListContent = (id: string, content: string) => {
    setLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, content } : list))
    );
    if (id === '1') {
      onInputChange?.(content);
    }
  };

  const updateListName = (id: string, name: string) => {
    setLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, name } : list))
    );
  };

  const toggleListVisibility = (id: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === id ? { ...list, visible: !list.visible } : list
      )
    );
  };

  const loadSampleData = () => {
    const samples = [
      'apple\nbanana\ncherry\ndate\nelderberry',
      'banana\ncherry\nfig\ngrape\nhoneydew',
      'cherry\ndate\nkiwi\nlemon\nmango',
    ];

    setLists((prev) =>
      prev.map((list, index) => ({
        ...list,
        content: index < samples.length ? samples[index] : '',
      }))
    );
    onInputChange?.(samples[0]);
    setSuccess('Sample data loaded');
  };

  const handleExport = useCallback(async () => {
    if (!comparisonResult?.success) {
      setError('No comparison results to export');
      return;
    }

    try {
      const exported = exportResults(comparisonResult, exportFormat);
      await navigator.clipboard.writeText(exported);
      setSuccess(`Results exported as ${exportFormat} and copied to clipboard`);
    } catch (err) {
      setError(
        `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [comparisonResult, exportFormat]);

  const handleDownload = useCallback(() => {
    if (!comparisonResult?.success) {
      setError('No comparison results to download');
      return;
    }

    try {
      const exported = exportResults(comparisonResult, exportFormat);
      const blob = new Blob([exported], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `list-comparison.${exportFormat === 'javascript' || exportFormat === 'typescript' ? 'js' : exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Results downloaded successfully');
    } catch (err) {
      setError(
        `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [comparisonResult, exportFormat]);

  // Helper function to sort results alphabetically
  const sortResultsAlphabetically = useCallback(
    (items: string[]) => {
      if (!sortResults) return items;
      return [...items].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
    },
    [sortResults]
  );

  // Copy specific result list to clipboard
  const copyResultToClipboard = useCallback(
    async (items: string[], resultType: string) => {
      try {
        const sortedItems = sortResultsAlphabetically(items);
        const text = sortedItems.join('\n');
        await navigator.clipboard.writeText(text);
        setSuccess(
          `${resultType} copied to clipboard (${sortedItems.length} items)`
        );
      } catch (err) {
        setError(
          `Failed to copy ${resultType.toLowerCase()}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    },
    [sortResultsAlphabetically]
  );

  const visibleLists = lists.filter((list) => list.visible);
  const totalItems = Object.values(parsedLists).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="w-full space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Input Lists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Input Lists</h3>
            <Badge variant="outline">{totalItems} total items</Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadSampleData} variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Load Sample
            </Button>
            <Button
              onClick={addList}
              variant="outline"
              size="sm"
              disabled={lists.length >= 10}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add List
            </Button>
          </div>
        </div>

        <div
          className={cn('grid gap-4', {
            'md:grid-cols-2': lists.length === 2 || lists.length >= 4,
            'md:grid-cols-3': lists.length === 3,
          })}
        >
          {lists.map((list, index) => (
            <Card
              key={list.id}
              className={cn('relative', !list.visible && 'opacity-50')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={list.visible}
                        onChange={() => toggleListVisibility(list.id)}
                      />
                      <Input
                        value={list.name}
                        onChange={(e) =>
                          updateListName(list.id, e.target.value)
                        }
                        className="h-8 w-24 text-sm"
                      />
                    </div>
                    {getProcessedItemsCount(list.id) > 0 && (
                      <Badge variant="secondary">
                        {getProcessedItemsCount(list.id)} items
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lists.length > 2 && (
                      <Button
                        onClick={() => removeList(list.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={list.content}
                  onChange={(e) => updateListContent(list.id, e.target.value)}
                  placeholder={`Enter items for ${list.name}, one per line or separated by commas...`}
                  className="min-h-32 font-mono text-sm md:min-h-56"
                  disabled={!list.visible}
                />
                {getProcessedItemsCount(list.id) > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Preview: {getProcessedItemsPreview(list.id)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Options Section */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none py-4"
          onClick={() => setOptionsExpanded((prev) => !prev)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Comparison Options
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                optionsExpanded && 'rotate-180'
              )}
            />
          </CardTitle>
        </CardHeader>
        {optionsExpanded && (
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Main Comparison Mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Comparison Mode</Label>
                <Select
                  value={comparisonMode}
                  onValueChange={(value) =>
                    setComparisonMode(value as ComparisonOptions['mode'])
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Set Operations</SelectItem>
                    <SelectItem value="sequential">Sequential Compare</SelectItem>
                    <SelectItem value="smart">Smart Compare</SelectItem>
                    <SelectItem value="fuzzy">Fuzzy Matching</SelectItem>
                    <SelectItem value="developer">Developer Mode</SelectItem>
                  </SelectContent>
                </Select>
                {comparisonMode === 'fuzzy' && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Similarity: {fuzzyThreshold[0]}%
                    </Label>
                    <Slider
                      value={fuzzyThreshold}
                      onValueChange={setFuzzyThreshold}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Processing Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Processing</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Case Sensitive</Label>
                    <Switch
                      checked={caseSensitive}
                      onCheckedChange={setCaseSensitive}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Remove Duplicates</Label>
                    <Switch
                      checked={removeDuplicates}
                      onCheckedChange={setRemoveDuplicates}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Sort Before Compare</Label>
                    <Switch
                      checked={sortBeforeCompare}
                      onCheckedChange={setSortBeforeCompare}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Trim Whitespace</Label>
                    <Switch
                      checked={trimWhitespace}
                      onCheckedChange={setTrimWhitespace}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Advanced</Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Separator</Label>
                    <Select
                      value={separator}
                      onValueChange={(value) =>
                        setSeparator(value as ParseListOptions['separator'])
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="newline">Newline</SelectItem>
                        <SelectItem value="comma">Comma</SelectItem>
                        <SelectItem value="semicolon">Semicolon</SelectItem>
                        <SelectItem value="tab">Tab</SelectItem>
                        <SelectItem value="pipe">Pipe (|)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Filter Pattern (Regex)</Label>
                    <Input
                      value={filterPattern}
                      onChange={(e) => setFilterPattern(e.target.value)}
                      placeholder="e.g., ^[a-z]"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Section */}
      {isProcessing ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
              <span>Processing comparison...</span>
            </div>
          </CardContent>
        </Card>
      ) : comparisonResult?.success ? (
        <div className="space-y-4">
          {/* Sort Results Option */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Sort Results Alphabetically
                  </Label>
                </div>
                <Switch
                  checked={sortResults}
                  onCheckedChange={setSortResults}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs
            value={resultsTab}
            onValueChange={setResultsTab}
            className="w-full"
          >
            <TabsList
              className={cn('grid w-full', {
                'grid-cols-2':
                  [
                    comparisonResult.union && comparisonResult.union.length > 0,
                    comparisonResult.intersection &&
                      comparisonResult.intersection.length > 0,
                    comparisonResult.unique &&
                      Object.keys(comparisonResult.unique || {}).length > 0,
                  ].filter(Boolean).length <= 1,
                'grid-cols-3':
                  [
                    comparisonResult.union && comparisonResult.union.length > 0,
                    comparisonResult.intersection &&
                      comparisonResult.intersection.length > 0,
                    comparisonResult.unique &&
                      Object.keys(comparisonResult.unique || {}).length > 0,
                  ].filter(Boolean).length === 2,
                'grid-cols-4':
                  [
                    comparisonResult.union && comparisonResult.union.length > 0,
                    comparisonResult.intersection &&
                      comparisonResult.intersection.length > 0,
                    comparisonResult.unique &&
                      Object.keys(comparisonResult.unique || {}).length > 0,
                  ].filter(Boolean).length >= 3,
              })}
            >
              {comparisonResult.union && comparisonResult.union.length > 0 && (
                <TabsTrigger value="union" className="text-xs">
                  Union ({comparisonResult.union.length})
                </TabsTrigger>
              )}
              {comparisonResult.intersection &&
                comparisonResult.intersection.length > 0 && (
                  <TabsTrigger value="intersection" className="text-xs">
                    Intersection ({comparisonResult.intersection.length})
                  </TabsTrigger>
                )}
              {comparisonResult.unique &&
                Object.keys(comparisonResult.unique).length > 0 && (
                  <TabsTrigger value="unique" className="text-xs">
                    Unique per List
                  </TabsTrigger>
                )}
              <TabsTrigger value="export" className="text-xs">
                Export
              </TabsTrigger>
            </TabsList>

            {/* Union Tab Content */}
            {comparisonResult.union && comparisonResult.union.length > 0 && (
              <TabsContent value="union" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-600">
                          Union ({comparisonResult.union.length} items)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Items that appear in any list
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          copyResultToClipboard(
                            comparisonResult.union!,
                            'Union'
                          )
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {sortResultsAlphabetically(comparisonResult.union).map(
                          (item, index) => (
                            <div
                              key={index}
                              className="flex items-center rounded-lg border-2 border-blue-200 bg-blue-100/80 p-3 font-mono text-sm shadow-sm transition-colors hover:bg-blue-200/80 dark:border-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-800/40"
                            >
                              <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                                {item}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Intersection Tab Content */}
            {comparisonResult.intersection &&
              comparisonResult.intersection.length > 0 && (
                <TabsContent value="intersection" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-green-600">
                            Intersection ({comparisonResult.intersection.length}{' '}
                            items)
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Items that appear in ALL lists
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            copyResultToClipboard(
                              comparisonResult.intersection!,
                              'Intersection'
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {sortResultsAlphabetically(
                            comparisonResult.intersection
                          ).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center rounded-lg border-2 border-green-200 bg-green-100/80 p-3 font-mono text-sm shadow-sm transition-colors hover:bg-green-200/80 dark:border-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/40"
                            >
                              <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

            {/* Unique per List Tab Content */}
            {comparisonResult.unique &&
              Object.keys(comparisonResult.unique).length > 0 && (
                <TabsContent value="unique" className="space-y-4">
                  <div className="grid gap-4">
                    {Object.entries(comparisonResult.unique).map(
                      ([listId, items]) => {
                        const listName =
                          lists.find((l) => l.id === listId)?.name ||
                          `List ${listId}`;
                        return (
                          <Card key={listId}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-purple-600">
                                    {listName} ({items.length} unique items)
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    Items only in this list
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    copyResultToClipboard(
                                      items,
                                      `${listName} Unique`
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-32">
                                <div className="space-y-2">
                                  {sortResultsAlphabetically(items).map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center rounded-lg border-2 border-purple-200 bg-purple-100/80 p-3 font-mono text-sm shadow-sm transition-colors hover:bg-purple-200/80 dark:border-purple-800 dark:bg-purple-900/30 dark:hover:bg-purple-800/40"
                                      >
                                        <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                                          {item}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </TabsContent>
              )}

            {/* Export Tab Content */}
            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select
                        value={exportFormat}
                        onValueChange={(value) =>
                          setExportFormat(value as typeof exportFormat)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="javascript">
                            JavaScript Array
                          </SelectItem>
                          <SelectItem value="typescript">
                            TypeScript Array
                          </SelectItem>
                          <SelectItem value="python">Python List</SelectItem>
                          <SelectItem value="sql">SQL IN Clause</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="markdown">
                            Markdown Table
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleExport}
                          disabled={!comparisonResult?.success}
                          size="sm"
                          className="flex-1"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          onClick={handleDownload}
                          disabled={!comparisonResult?.success}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {comparisonResult?.success && (
                    <div className="mt-4 rounded-md bg-muted p-3">
                      <div className="mb-2 text-xs text-muted-foreground">
                        Preview:
                      </div>
                      <ScrollArea className="h-32">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {exportResults(comparisonResult, exportFormat).slice(
                            0,
                            500
                          )}
                          {exportResults(comparisonResult, exportFormat)
                            .length > 500 && '...'}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <GitCompare className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Add lists and configure options to see comparison results</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
