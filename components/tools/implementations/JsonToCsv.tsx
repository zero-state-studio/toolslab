'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  convertJsonToCsv,
  generateSampleJson,
  downloadCsv,
  copyCsvToClipboard,
  detectColumns,
  parseJsonInput,
  flattenObject,
  safeStringify,
  type JsonToCsvOptions,
  type ColumnMapping,
} from '@/lib/tools/json-to-csv';
import {
  Download,
  Copy,
  Upload,
  Wand2,
  Table,
  Settings,
  FileJson,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Filter,
  BarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BaseToolProps } from '@/lib/types/tools';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

interface ColumnConfig {
  name: string;
  visible: boolean;
  mappedName?: string;
}

export default function JsonToCsv({
  categoryColor,
  initialInput,
  onInputChange,
  onOutputChange,
  dictionary,
}: BaseToolProps) {
  const ui = dictionary?.tools?.['json-to-csv']?.ui ?? {};
  const { trackUse, trackError, trackCustom } = useToolTracking('json-to-csv');
  const { resultRef, scrollToResult } = useScrollToResult();
  const [input, setInput] = useState(initialInput || '');
  const [output, setCsvOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{
    rows: number;
    columns: number;
    empty: number;
  } | null>(null);

  // Conversion options
  const [delimiter, setDelimiter] = useState(',');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [qualifier, setQualifier] = useState('"');
  const [lineEnding, setLineEnding] = useState('\n');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [flattenNested, setFlattenNested] = useState(true);
  const [flattenSeparator, setFlattenSeparator] = useState('.');
  const [nullValue, setNullValue] = useState('');
  const [arrayDelimiter, setArrayDelimiter] = useState(',');
  const [includeBOM, setIncludeBOM] = useState(false);

  // Column management
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedTab, setSelectedTab] = useState('input');

  // Preview data
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  // Detect columns when input changes
  useEffect(() => {
    if (!input.trim()) {
      setColumns([]);
      setPreviewData([]);
      setPreviewColumns([]);
      return;
    }

    const parseResult = parseJsonInput(input);
    if (parseResult.success && parseResult.data) {
      const data = parseResult.data;
      const processedData = flattenNested
        ? data.map((row) => flattenObject(row, flattenSeparator))
        : data;

      const detectedCols = detectColumns(processedData);
      setColumns(detectedCols.map((col) => ({ name: col, visible: true })));
      setPreviewColumns(detectedCols);
      setPreviewData(processedData.slice(0, 10)); // Preview first 10 rows
    }
  }, [input, flattenNested, flattenSeparator]);

  // Scroll to result when output changes
  useEffect(() => {
    if (output) {
      scrollToResult();
    }
  }, [output, scrollToResult]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
        onInputChange?.(content);
        setError('');
        setSelectedTab('input');
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    []
  );

  const handleConvert = useCallback(async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const selectedColumns = columns
        .filter((col) => col.visible)
        .map((col) => col.name);

      const options: JsonToCsvOptions = {
        delimiter: delimiter === 'custom' ? customDelimiter : delimiter,
        qualifier,
        lineEnding: lineEnding === '\\r\\n' ? '\r\n' : '\n',
        includeHeaders,
        selectedColumns:
          selectedColumns.length > 0 ? selectedColumns : undefined,
        columnMapping,
        flattenNested,
        flattenSeparator,
        nullValue,
        arrayDelimiter,
        includeBOM,
      };

      const result = convertJsonToCsv(input, options);

      if (result.success && result.csv) {
        setCsvOutput(result.csv);
        onOutputChange?.(result.csv);
        if (result.stats) {
          setStats({
            rows: result.stats.rowCount,
            columns: result.stats.columnCount,
            empty: result.stats.emptyFields,
          });
        }
        setSuccess('JSON successfully converted to CSV');
        setSelectedTab('output');
        // Track successful conversion
        trackUse(input, result.csv, { success: true });
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      trackError(
        err instanceof Error ? err : new Error(errorMessage),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    input,
    delimiter,
    customDelimiter,
    qualifier,
    lineEnding,
    includeHeaders,
    columns,
    columnMapping,
    flattenNested,
    flattenSeparator,
    nullValue,
    arrayDelimiter,
    includeBOM,
    trackUse,
    trackError,
  ]);

  const handleDownload = useCallback(() => {
    if (output) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      downloadCsv(output, `export-${timestamp}.csv`);
      setSuccess('CSV file downloaded successfully');
    }
  }, [output]);

  const handleCopy = useCallback(async () => {
    if (output) {
      const copied = await copyCsvToClipboard(output);
      if (copied) {
        setSuccess('CSV copied to clipboard');
      } else {
        setError('Failed to copy to clipboard');
      }
    }
  }, [output]);

  const loadSample = useCallback(() => {
    const sample = generateSampleJson();
    setInput(sample);
    onInputChange?.(sample);
    setError('');
    setSuccess('Sample JSON loaded');
  }, [onInputChange]);

  const toggleColumnVisibility = (columnName: string) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.name === columnName ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const updateColumnMapping = (columnName: string, mappedName: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [columnName]: mappedName || columnName,
    }));
  };

  const handleColumnReorder = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumns(items);
  };

  const visibleColumnCount = columns.filter((col) => col.visible).length;
  const totalColumnCount = columns.length;

  const previewTable = useMemo(() => {
    if (previewData.length === 0) return null;

    const visibleCols = columns
      .filter((col) => col.visible)
      .map((col) => col.name);
    if (visibleCols.length === 0) return null;

    return (
      <div className="w-full overflow-x-auto">
        <table
          className="divide-y divide-border"
          style={{ minWidth: `${Math.max(800, visibleCols.length * 150)}px` }}
        >
          <thead className="bg-muted/50">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  style={{ minWidth: '120px' }}
                >
                  {columnMapping[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {previewData.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                {visibleCols.map((col) => {
                  let value = row[col];
                  if (Array.isArray(value)) {
                    value = value.join(arrayDelimiter);
                  }
                  if (value === null || value === undefined) {
                    value = (
                      <span className="italic text-muted-foreground">
                        {nullValue || '(null)'}
                      </span>
                    );
                  }
                  if (typeof value === 'object') {
                    value = safeStringify(value);
                  }
                  return (
                    <td
                      key={col}
                      className="whitespace-nowrap px-3 py-2 text-sm text-foreground"
                      style={{ minWidth: '120px', maxWidth: '200px' }}
                    >
                      <div className="truncate" title={String(value)}>
                        {String(value).substring(0, 50)}
                        {String(value).length > 50 && '...'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [previewData, columns, columnMapping, arrayDelimiter, nullValue]);

  return (
    <div className="w-full space-y-4">
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            {ui.tabInput || 'Input'}
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {ui.tabOptions || 'Options'}
          </TabsTrigger>
          <TabsTrigger value="columns" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            {ui.tabColumns || 'Columns'}
          </TabsTrigger>
          <TabsTrigger value="output" className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {ui.tabOutput || 'Output'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="json-input">{ui.jsonInputLabel || 'JSON Input'}</Label>
            <div className="flex gap-1 md:gap-2">
              <Button
                onClick={loadSample}
                variant="outline"
                size="sm"
                className="gap-1 md:gap-2"
              >
                <Wand2 className="h-4 w-4" />
                <span className="hidden md:inline">{ui.loadSample || 'Load Sample'}</span>
              </Button>
              <div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1 md:gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline">{ui.uploadFile || 'Upload File'}</span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          <Textarea
            id="json-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onInputChange?.(e.target.value);
            }}
            placeholder={ui.jsonInputPlaceholder || 'Enter JSON data...\n\nExample:\n[\n  {"name": "John", "age": 30},\n  {"name": "Jane", "age": 25}\n]'}
            className="min-h-[400px] font-mono text-sm"
          />

          {previewTable && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {ui.previewLabel || 'Preview (First 5 rows)'}
                  </Label>
                  <Badge variant="secondary">
                    {previewData.length} rows × {visibleColumnCount} columns
                  </Badge>
                </div>
                {previewTable}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="delimiter">{ui.delimiterLabel || 'Delimiter'}</Label>
                  <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger id="delimiter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">{ui.delimiterComma || 'Comma (,)'}</SelectItem>
                      <SelectItem value=";">{ui.delimiterSemicolon || 'Semicolon (;)'}</SelectItem>
                      <SelectItem value="\t">{ui.delimiterTab || 'Tab (\\t)'}</SelectItem>
                      <SelectItem value="|">{ui.delimiterPipe || 'Pipe (|)'}</SelectItem>
                      <SelectItem value="custom">{ui.delimiterCustom || 'Custom'}</SelectItem>
                    </SelectContent>
                  </Select>
                  {delimiter === 'custom' && (
                    <Input
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      placeholder={ui.customDelimiterPlaceholder || 'Enter custom delimiter'}
                      maxLength={5}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifier">{ui.qualifierLabel || 'Text Qualifier'}</Label>
                  <Select value={qualifier} onValueChange={setQualifier}>
                    <SelectTrigger id="qualifier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='"'>{ui.qualifierDoubleQuote || 'Double Quote (")'}</SelectItem>
                      <SelectItem value="'">{ui.qualifierSingleQuote || "Single Quote (')"}</SelectItem>
                      <SelectItem value="">{ui.qualifierNone || 'None'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-ending">{ui.lineEndingLabel || 'Line Ending'}</Label>
                  <Select value={lineEnding} onValueChange={setLineEnding}>
                    <SelectTrigger id="line-ending">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="\n">{ui.lineEndingLf || 'LF (Unix/Mac)'}</SelectItem>
                      <SelectItem value="\\r\\n">{ui.lineEndingCrlf || 'CRLF (Windows)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-headers">{ui.includeHeadersLabel || 'Include Headers'}</Label>
                  <Switch
                    id="include-headers"
                    checked={includeHeaders}
                    onCheckedChange={setIncludeHeaders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="flatten-nested">{ui.flattenNestedLabel || 'Flatten Nested Objects'}</Label>
                  <Switch
                    id="flatten-nested"
                    checked={flattenNested}
                    onCheckedChange={setFlattenNested}
                  />
                </div>

                {flattenNested && (
                  <div className="space-y-2">
                    <Label htmlFor="flatten-separator">{ui.flattenSeparatorLabel || 'Flatten Separator'}</Label>
                    <Input
                      id="flatten-separator"
                      value={flattenSeparator}
                      onChange={(e) => setFlattenSeparator(e.target.value)}
                      placeholder={ui.flattenSeparatorPlaceholder || '.'}
                      maxLength={5}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-bom">{ui.includeBomLabel || 'Include BOM (Excel UTF-8)'}</Label>
                  <Switch
                    id="include-bom"
                    checked={includeBOM}
                    onCheckedChange={setIncludeBOM}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="null-value">{ui.nullValueLabel || 'Null/Undefined Value'}</Label>
                  <Input
                    id="null-value"
                    value={nullValue}
                    onChange={(e) => setNullValue(e.target.value)}
                    placeholder={ui.nullValuePlaceholder || 'Leave empty for blank'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="array-delimiter">{ui.arrayDelimiterLabel || 'Array Delimiter'}</Label>
                  <Input
                    id="array-delimiter"
                    value={arrayDelimiter}
                    onChange={(e) => setArrayDelimiter(e.target.value)}
                    placeholder=","
                    maxLength={5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          {columns.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <Label>{ui.columnManagementLabel || 'Column Management'}</Label>
                <Badge variant="secondary">
                  {visibleColumnCount} / {totalColumnCount} {ui.columnsSelectedSuffix || 'columns selected'}
                </Badge>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <DragDropContext onDragEnd={handleColumnReorder}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {columns.map((column, index) => (
                            <Draggable
                              key={column.name}
                              draggableId={column.name}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    'flex items-center gap-3 rounded-lg border bg-background p-3',
                                    snapshot.isDragging && 'shadow-lg'
                                  )}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-move text-muted-foreground hover:text-foreground"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  <Checkbox
                                    checked={column.visible}
                                    onChange={() =>
                                      toggleColumnVisibility(column.name)
                                    }
                                  />

                                  <div className="grid flex-1 grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                      <Label className="font-mono text-sm">
                                        {column.name}
                                      </Label>
                                    </div>

                                    <Input
                                      value={columnMapping[column.name] || ''}
                                      onChange={(e) =>
                                        updateColumnMapping(
                                          column.name,
                                          e.target.value
                                        )
                                      }
                                      placeholder={column.name}
                                      className="h-8 text-sm"
                                    />
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleColumnVisibility(column.name)
                                    }
                                  >
                                    {column.visible ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {ui.noJsonForColumns || 'Enter valid JSON data to manage columns'}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <div ref={resultRef}>
            {output && (
              <>
                <div className="flex items-center justify-between">
                  <Label>{ui.csvOutputLabel || 'CSV Output'}</Label>
                  <div className="flex gap-1 md:gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="gap-1 md:gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="hidden md:inline">{ui.copyButton || 'Copy'}</span>
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="gap-1 md:gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden md:inline">{ui.downloadButton || 'Download'}</span>
                    </Button>
                  </div>
                </div>

                {stats && (
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="gap-1">
                      <BarChart className="h-3 w-3" />
                      {stats.rows} {ui.statRows || 'rows'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Table className="h-3 w-3" />
                      {stats.columns} {ui.statColumns || 'columns'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Filter className="h-3 w-3" />
                      {stats.empty} {ui.statEmptyFields || 'empty fields'}
                    </Badge>
                  </div>
                )}

                <Textarea
                  value={output}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
              </>
            )}

            {!output && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {ui.noOutputAlert || 'No CSV output yet. Configure options and click Convert to generate CSV.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={handleConvert}
          disabled={!input.trim() || isProcessing}
          size="lg"
          className="ml-4 gap-2"
        >
          <ChevronRight className="h-5 w-5" />
          {isProcessing ? (ui.convertingButton || 'Converting...') : (ui.convertButton || 'Convert to CSV')}
        </Button>
      </div>
    </div>
  );
}
