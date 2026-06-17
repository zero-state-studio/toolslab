'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Clock,
  Calendar,
  Code,
  Download,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import {
  convertTimestamp,
  batchConvert,
  generateCodeExamples,
  getCurrentTimestamp,
  validateTimezone,
  DATE_FORMATS,
  COMMON_TIMEZONES,
  type TimestampConversionOptions,
  type ConversionResult,
} from '@/lib/tools/unix-timestamp';

const UnixTimestampConverter = ({ dictionary }: { dictionary?: any }) => {
  const ui = dictionary?.tools?.['unix-timestamp-converter']?.ui ?? {};
  const { trackUse, trackError } = useToolTracking('unix-timestamp-converter');
  const [input, setInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [unit, setUnit] = useState<'seconds' | 'milliseconds' | 'auto'>('auto');
  const [outputFormat, setOutputFormat] = useState('iso');
  const [customFormat, setCustomFormat] = useState('');
  const [includeRelative, setIncludeRelative] = useState(true);
  const [includeCode, setIncludeCode] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [batchResult, setBatchResult] = useState<ConversionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveConversion, setLiveConversion] = useState(true);

  const options: TimestampConversionOptions = useMemo(
    () => ({
      timezone,
      unit: unit === 'auto' ? undefined : unit,
      customFormat: customFormat || undefined,
      includeRelative,
    }),
    [timezone, unit, customFormat, includeRelative]
  );

  // Live conversion effect for single mode
  useEffect(() => {
    if (!liveConversion || mode !== 'single' || !input.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const conversionResult = convertTimestamp(input.trim(), options);
        setResult(conversionResult);
      } catch (error) {
        // Don't show errors during live conversion, just clear results
        setResult(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [input, options, liveConversion, mode]);

  const handleConvert = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please enter a timestamp or date');
      return;
    }

    setIsProcessing(true);
    try {
      const conversionResult = convertTimestamp(input.trim(), options);
      setResult(conversionResult);

      if (conversionResult.success) {
        toast.success('Conversion completed successfully');
        trackUse(input, conversionResult.result || '', { success: true });
      } else {
        toast.error(conversionResult.error || 'Conversion failed');
        trackError(
          new Error(conversionResult.error || 'Conversion failed'),
          input.length
        );
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Conversion error:', error);
      trackError(
        error instanceof Error ? error : new Error(String(error)),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input, options, trackUse, trackError]);

  const handleBatchConvert = useCallback(async () => {
    if (!batchInput.trim()) {
      toast.error('Please enter timestamps or dates to process');
      return;
    }

    setIsProcessing(true);
    try {
      const inputs = batchInput.split('\n').filter((line) => line.trim());
      const conversionResult = batchConvert(inputs, options);
      setBatchResult(conversionResult);

      if (conversionResult.success) {
        const successCount =
          conversionResult.metadata?.batch?.filter((r) => r.success).length ||
          0;
        const totalCount = conversionResult.metadata?.batch?.length || 0;
        toast.success(
          `Batch processing completed: ${successCount}/${totalCount} successful`
        );
        trackUse(batchInput, conversionResult.result || '', { success: true });
      } else {
        toast.error('Batch processing failed');
        trackError(new Error('Batch processing failed'), batchInput.length);
      }
    } catch (error) {
      toast.error('An unexpected error occurred during batch processing');
      console.error('Batch conversion error:', error);
      trackError(
        error instanceof Error ? error : new Error(String(error)),
        batchInput.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [batchInput, options, trackUse, trackError]);

  const handleInsertCurrentTimestamp = useCallback(() => {
    const current = getCurrentTimestamp(unit === 'auto' ? 'seconds' : unit);
    setInput(current);
    toast.success('Current timestamp inserted');
  }, [unit]);

  const handleCopy = useCallback(
    (text: string, description: string = 'Result') => {
      navigator.clipboard.writeText(text);
      toast.success(`${description} copied to clipboard`);
    },
    []
  );

  const handleReset = useCallback(() => {
    setInput('');
    setBatchInput('');
    setResult(null);
    setBatchResult(null);
    setCustomFormat('');
    toast.success('All fields reset');
  }, []);

  // Clear results when input is empty and live conversion is enabled
  useEffect(() => {
    if (liveConversion && mode === 'single' && !input.trim()) {
      setResult(null);
    }
  }, [input, liveConversion, mode]);

  const handleTimezoneChange = useCallback((newTimezone: string) => {
    if (validateTimezone(newTimezone)) {
      setTimezone(newTimezone);
    } else {
      toast.error('Invalid timezone selected');
    }
  }, []);

  const exportBatchResults = useCallback(
    (format: 'json' | 'csv') => {
      if (!batchResult?.metadata?.batch) {
        toast.error('No batch results to export');
        return;
      }

      const data = batchResult.metadata.batch;
      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = 'batch-conversion-results.json';
        mimeType = 'application/json';
      } else {
        // CSV format
        const headers = ['Input', 'Success', 'Result', 'Error'];
        const rows = data.map((item) => [
          item.input,
          item.success ? 'Yes' : 'No',
          item.success && item.result ? JSON.stringify(item.result) : '',
          item.error || '',
        ]);

        content = [headers, ...rows]
          .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
          .join('\n');
        filename = 'batch-conversion-results.csv';
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Batch results exported as ${format.toUpperCase()}`);
    },
    [batchResult]
  );

  const codeExamples = useMemo(() => {
    if (!result?.success || !result.metadata?.formats) return null;

    try {
      const date = new Date(result.metadata.formats.iso);
      return generateCodeExamples(input, date, timezone);
    } catch {
      return null;
    }
  }, [result, input, timezone]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as 'single' | 'batch')}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{ui.tabSingle || 'Single Conversion'}</TabsTrigger>
            <TabsTrigger value="batch">{ui.tabBatch || 'Batch Processing'}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Options Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              {ui.cardConversionOptions || 'Conversion Options'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOptionsVisible(!optionsVisible)}
            >
              {optionsVisible ? (ui.btnHide || 'Hide') : (ui.btnShow || 'Show')} {ui.btnOptions || 'Options'}
            </Button>
          </div>
        </CardHeader>
        {optionsVisible && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">{ui.labelTimezone || 'Timezone'}</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={ui.placeholderSelectTimezone || 'Select timezone'} />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{ui.labelTimestampUnit || 'Timestamp Unit'}</Label>
                <Select
                  value={unit}
                  onValueChange={(value) =>
                    setUnit(value as 'seconds' | 'milliseconds' | 'auto')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{ui.optionAutoDetect || 'Auto-detect'}</SelectItem>
                    <SelectItem value="seconds">{ui.optionSeconds || 'Seconds'}</SelectItem>
                    <SelectItem value="milliseconds">{ui.optionMilliseconds || 'Milliseconds'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-format">{ui.labelOutputFormat || 'Output Format'}</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_FORMATS).map(([key, format]) => (
                      <SelectItem key={key} value={key}>
                        {key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-format">{ui.labelCustomFormat || 'Custom Format'}</Label>
                <Input
                  id="custom-format"
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="yyyy-MM-dd HH:mm:ss"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-relative"
                  checked={includeRelative}
                  onCheckedChange={setIncludeRelative}
                />
                <Label htmlFor="include-relative">{ui.labelIncludeRelative || 'Include relative times'}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-code"
                  checked={includeCode}
                  onCheckedChange={setIncludeCode}
                />
                <Label htmlFor="include-code">{ui.labelShowCode || 'Show code examples'}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="live-conversion"
                  checked={liveConversion}
                  onCheckedChange={setLiveConversion}
                />
                <Label htmlFor="live-conversion">{ui.labelLiveConversion || 'Live conversion'}</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as 'single' | 'batch')}
        className="w-full"
      >
        <TabsContent value="single" className="space-y-6">
          {/* Single Conversion Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {ui.cardInput || 'Input'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">{ui.labelEnterInput || 'Enter Unix timestamp or date'}</Label>
                <Input
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="1640995200 or 2022-01-01T00:00:00Z"
                  onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleConvert}
                  disabled={isProcessing || (liveConversion && !!input.trim())}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {ui.btnConverting || 'Converting...'}
                    </>
                  ) : liveConversion && input.trim() ? (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      {ui.btnLiveMode || 'Live Mode'}
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      {ui.btnConvert || 'Convert'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleInsertCurrentTimestamp}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {ui.btnCurrentTimestamp || 'Current Timestamp'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {ui.btnReset || 'Reset'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Single Conversion Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {ui.cardConversionResult || 'Conversion Result'}
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? (ui.badgeSuccess || 'Success') : (ui.badgeError || 'Error')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div className="space-y-4">
                    {/* Primary Result */}
                    <div className="space-y-2">
                      <Label>{ui.labelPrimaryResult || 'Primary Result'}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={result.result || ''}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(result.result || '', 'Primary result')
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* All Formats */}
                    {result.metadata?.formats && (
                      <div className="space-y-2">
                        <Label>{ui.labelAllFormats || 'All Formats'}</Label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {Object.entries(result.metadata.formats).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2"
                              >
                                <div className="w-24 flex-shrink-0 text-sm text-muted-foreground">
                                  {key.replace(/_/g, ' ')}:
                                </div>
                                <Input
                                  value={value}
                                  readOnly
                                  className="font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={() =>
                                    handleCopy(value, `${key} format`)
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Relative Times */}
                    {includeRelative && result.metadata?.relative && (
                      <div className="space-y-2">
                        <Label>{ui.labelRelativeTimes || 'Relative Times'}</Label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {Object.entries(result.metadata.relative).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2"
                              >
                                <div className="w-24 flex-shrink-0 text-sm text-muted-foreground">
                                  {key.replace(/_/g, ' ')}:
                                </div>
                                <Input
                                  value={value}
                                  readOnly
                                  className="text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={() =>
                                    handleCopy(value, `${key} relative time`)
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Code Examples */}
                    {includeCode && codeExamples && (
                      <div className="space-y-2">
                        <Label>{ui.labelCodeExamples || 'Code Examples'}</Label>
                        <Tabs
                          value="javascript"
                          onValueChange={() => {}}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                            {Object.keys(codeExamples).map((lang) => (
                              <TabsTrigger
                                key={lang}
                                value={lang}
                                className="text-xs"
                              >
                                {lang}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {Object.entries(codeExamples).map(([lang, code]) => (
                            <TabsContent key={lang} value={lang}>
                              <div className="relative">
                                <Textarea
                                  value={code}
                                  readOnly
                                  className="min-h-[200px] font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute right-2 top-2"
                                  onClick={() =>
                                    handleCopy(code, `${lang} code`)
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-destructive">
                    <p>{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          {/* Batch Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {ui.cardBatchInput || 'Batch Input'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-input">
                  {ui.labelBatchInput || 'Enter timestamps or dates (one per line)'}
                </Label>
                <Textarea
                  id="batch-input"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="1640995200&#10;2022-01-02T00:00:00Z&#10;1641081600"
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleBatchConvert} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {ui.btnProcessing || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Code className="mr-2 h-4 w-4" />
                      {ui.btnProcessBatch || 'Process Batch'}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setBatchInput('')}>
                  {ui.btnClear || 'Clear'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Batch Results */}
          {batchResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {ui.cardBatchResults || 'Batch Results'}
                  <Badge
                    variant={batchResult.success ? 'default' : 'destructive'}
                  >
                    {batchResult.success ? (ui.badgeCompleted || 'Completed') : (ui.badgeFailed || 'Failed')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {batchResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p>{batchResult.result}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportBatchResults('json')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {ui.btnExportJson || 'Export JSON'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportBatchResults('csv')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {ui.btnExportCsv || 'Export CSV'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {batchResult.metadata?.batch?.map((item, index) => (
                        <div
                          key={index}
                          className={`rounded border p-3 ${
                            item.success
                              ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                              : 'border-red-200 bg-red-50 dark:bg-red-950/20'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-sm">
                              {item.input}
                            </span>
                            <Badge
                              variant={item.success ? 'default' : 'destructive'}
                            >
                              {item.success ? (ui.badgeSuccess || 'Success') : (ui.badgeError || 'Error')}
                            </Badge>
                          </div>
                          {item.success && item.result ? (
                            <div className="space-y-1 text-sm">
                              {Object.entries(item.result).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-20 text-muted-foreground">
                                      {key}:
                                    </span>
                                    <span className="flex-1 font-mono">
                                      {value}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        handleCopy(
                                          String(value),
                                          `${key} for ${item.input}`
                                        )
                                      }
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-destructive">
                              {item.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-destructive">
                    <p>{batchResult.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnixTimestampConverter;
