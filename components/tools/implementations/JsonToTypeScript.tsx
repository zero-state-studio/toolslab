'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy,
  Download,
  Upload,
  RefreshCw,
  Settings,
  FileCode,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Play,
  Loader2,
  Eye,
  Code,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';
import {
  convertJsonToTypeScript,
  validateJsonInput,
  EXAMPLE_JSON_SAMPLES,
  DEFAULT_OPTIONS,
  type JsonToTypeScriptOptions,
  type TypeScriptGenerationResult,
} from '@/lib/tools/json-to-typescript';
import { BaseToolProps } from '@/lib/types/tools';

interface JsonToTypeScriptProps extends BaseToolProps {}

export default function JsonToTypeScript({
  categoryColor,
}: JsonToTypeScriptProps) {
  const { trackError } = useToolTracking('json-to-typescript');
  const { addToHistory } = useToolStore();

  // State management
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<TypeScriptGenerationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] =
    useState<JsonToTypeScriptOptions>(DEFAULT_OPTIONS);
  const [activeTab, setActiveTab] = useState('typescript');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Validation state
  const jsonValidation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { valid: true, error: undefined };
    }
    return validateJsonInput(jsonInput);
  }, [jsonInput]);

  // Auto-convert on input change with debouncing
  useEffect(() => {
    if (!jsonInput.trim() || !jsonValidation.valid) {
      setResult(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleConvert();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [jsonInput, options, jsonValidation.valid]);

  // Convert JSON to TypeScript
  const handleConvert = useCallback(async () => {
    if (!jsonInput.trim() || !jsonValidation.valid) return;

    setIsProcessing(true);
    const startTime = Date.now();
    try {
      // Simulate async processing for better UX
      await new Promise((resolve) => setTimeout(resolve, 100));
      const conversionResult = convertJsonToTypeScript(jsonInput, options);
      setResult(conversionResult);

      // Track successful conversion
      if (conversionResult.success) {
        if (conversionResult.interfaces) {
          addToHistory({
            id: crypto.randomUUID(),
            tool: 'json-to-typescript',
            input: jsonInput,
            output: conversionResult.interfaces,
            timestamp: startTime,
          });
        }
      } else {
        trackError(
          new Error(conversionResult.error || 'Conversion failed'),
          jsonInput.length
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Conversion failed';
      setResult({
        success: false,
        error: errorMsg,
        interfaces: '',
        detectedTypes: [],
        circularReferences: [],
        warnings: [],
        stats: {
          interfaceCount: 0,
          propertyCount: 0,
          depth: 0,
          processingTime: 0,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput, options, jsonValidation.valid, addToHistory, trackError]);

  // Copy to clipboard
  const handleCopy = useCallback(async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Download file
  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Load example
  const loadExample = useCallback((exampleKey: string) => {
    const example =
      EXAMPLE_JSON_SAMPLES[exampleKey as keyof typeof EXAMPLE_JSON_SAMPLES];
    if (example) {
      setJsonInput(example.json);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    },
    []
  );

  // Format JSON
  const formatJson = useCallback(() => {
    if (jsonValidation.valid && jsonValidation.formatted) {
      setJsonInput(jsonValidation.formatted);
    }
  }, [jsonValidation]);

  // Reset options
  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
  }, []);

  // Update option helper
  const updateOption = useCallback(
    <K extends keyof JsonToTypeScriptOptions>(
      key: K,
      value: JsonToTypeScriptOptions[K]
    ) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="w-full space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                JSON Input
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2">
                <Badge
                  variant={jsonValidation.valid ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {jsonValidation.valid ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  )}
                  {jsonValidation.valid ? 'Valid' : 'Invalid'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatJson}
                  disabled={!jsonValidation.valid}
                >
                  <Sparkles className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Format</span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <Upload className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Upload</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here or upload a file..."
                className="min-h-[300px] font-mono text-sm"
                spellCheck={false}
              />
              {!jsonValidation.valid && jsonValidation.error && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {jsonValidation.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Examples */}
            <div>
              <Label className="text-sm font-medium">Quick Examples</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.keys(EXAMPLE_JSON_SAMPLES).map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing JSON...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                TypeScript Output
              </CardTitle>
              <div className="flex items-center gap-2">
                {result?.success && (
                  <Badge variant="secondary" className="text-xs">
                    {result.stats.interfaceCount} interfaces
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvert}
                  disabled={!jsonValidation.valid || !jsonInput.trim()}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="zod" disabled={!options.generateZodSchema}>
                  Zod
                </TabsTrigger>
                <TabsTrigger
                  value="json-schema"
                  disabled={!options.generateJsonSchema}
                >
                  JSON Schema
                </TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="typescript" className="mt-4">
                {result?.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Generated Interfaces
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(result.interfaces, 'typescript')
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copied === 'typescript' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(result.interfaces, 'interfaces.ts')
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <pre className="p-4 text-sm">
                        <code className="language-typescript">
                          {result.interfaces}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                ) : result?.error ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileCode className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Enter valid JSON to generate TypeScript interfaces</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="zod" className="mt-4">
                {result?.success && result.zodSchema ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Zod Schemas</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(result.zodSchema!, 'zod')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copied === 'zod' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(result.zodSchema!, 'schemas.ts')
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <pre className="p-4 text-sm">
                        <code className="language-typescript">
                          {result.zodSchema}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>Enable Zod schema generation in settings</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json-schema" className="mt-4">
                {result?.success && result.jsonSchema ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">JSON Schema</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(result.jsonSchema!, 'json-schema')
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copied === 'json-schema' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(result.jsonSchema!, 'schema.json')
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <pre className="p-4 text-sm">
                        <code className="language-json">
                          {JSON.stringify(
                            JSON.parse(result.jsonSchema),
                            null,
                            2
                          )}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>Enable JSON schema generation in settings</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                {result?.success ? (
                  <ScrollArea className="h-[400px] w-full">
                    <div className="space-y-4">
                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">
                            Processing Time
                          </div>
                          <div className="text-2xl font-bold">
                            {result.stats.processingTime.toFixed(1)}ms
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">Interfaces</div>
                          <div className="text-2xl font-bold">
                            {result.stats.interfaceCount}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">Properties</div>
                          <div className="text-2xl font-bold">
                            {result.stats.propertyCount}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">Max Depth</div>
                          <div className="text-2xl font-bold">
                            {result.stats.depth}
                          </div>
                        </div>
                      </div>

                      {/* Detected Types */}
                      {result.detectedTypes.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-medium">Detected Types</h4>
                          <div className="space-y-2">
                            {result.detectedTypes
                              .slice(0, 10)
                              .map((type, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded border p-2 text-sm"
                                >
                                  <span className="font-mono">{type.name}</span>
                                  <Badge variant="secondary">{type.type}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Circular References */}
                      {result.circularReferences.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-medium text-amber-700">
                            Circular References
                          </h4>
                          <div className="space-y-1">
                            {result.circularReferences.map((ref, index) => (
                              <div
                                key={index}
                                className="rounded bg-amber-50 p-2 text-sm"
                              >
                                {ref}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Eye className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Generate TypeScript to view analysis</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Options
            </CardTitle>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs md:text-sm"
              >
                {showAdvanced ? (
                  <>
                    <span className="md:hidden">Hide</span>
                    <span className="hidden md:inline">Hide Advanced</span>
                  </>
                ) : (
                  <>
                    <span className="md:hidden">Advanced</span>
                    <span className="hidden md:inline">Show Advanced</span>
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={resetOptions}>
                <RefreshCw className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Reset</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Options */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="naming-strategy">Naming Strategy</Label>
              <Select
                value={options.namingStrategy}
                onValueChange={(value: any) =>
                  updateOption('namingStrategy', value)
                }
              >
                <SelectTrigger id="naming-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PascalCase">PascalCase</SelectItem>
                  <SelectItem value="camelCase">camelCase</SelectItem>
                  <SelectItem value="snake_case">snake_case</SelectItem>
                  <SelectItem value="preserve">Preserve Original</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="root-interface">Root Interface Name</Label>
              <Input
                id="root-interface"
                value={options.rootInterfaceName}
                onChange={(e) =>
                  updateOption('rootInterfaceName', e.target.value)
                }
                placeholder="RootInterface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="array-notation">Array Notation</Label>
              <Select
                value={options.arrayNotation}
                onValueChange={(value: any) =>
                  updateOption('arrayNotation', value)
                }
              >
                <SelectTrigger id="array-notation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="array">T[]</SelectItem>
                  <SelectItem value="generic">Array&lt;T&gt;</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-interfaces" className="text-sm">
                Use Interfaces
              </Label>
              <Switch
                id="use-interfaces"
                checked={options.useInterfaces}
                onCheckedChange={(checked) =>
                  updateOption('useInterfaces', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="extract-nested" className="text-sm">
                Extract Nested Types
              </Label>
              <Switch
                id="extract-nested"
                checked={options.extractNestedTypes}
                onCheckedChange={(checked) =>
                  updateOption('extractNestedTypes', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="infer-dates" className="text-sm">
                Infer Dates
              </Label>
              <Switch
                id="infer-dates"
                checked={options.inferDates}
                onCheckedChange={(checked) =>
                  updateOption('inferDates', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-exports" className="text-sm">
                Include Exports
              </Label>
              <Switch
                id="include-exports"
                checked={options.includeExports}
                onCheckedChange={(checked) =>
                  updateOption('includeExports', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-comments" className="text-sm">
                Include Comments
              </Label>
              <Switch
                id="include-comments"
                checked={options.includeComments}
                onCheckedChange={(checked) =>
                  updateOption('includeComments', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sort-properties" className="text-sm">
                Sort Properties
              </Label>
              <Switch
                id="sort-properties"
                checked={options.sortProperties}
                onCheckedChange={(checked) =>
                  updateOption('sortProperties', checked)
                }
              />
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Advanced Options</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="readonly" className="text-sm">
                    Readonly Properties
                  </Label>
                  <Switch
                    id="readonly"
                    checked={options.enableReadonly}
                    onCheckedChange={(checked) =>
                      updateOption('enableReadonly', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="detect-enums" className="text-sm">
                    Detect Enums
                  </Label>
                  <Switch
                    id="detect-enums"
                    checked={options.detectEnums}
                    onCheckedChange={(checked) =>
                      updateOption('detectEnums', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="string-literals" className="text-sm">
                    String Literals
                  </Label>
                  <Switch
                    id="string-literals"
                    checked={options.enableStringLiterals}
                    onCheckedChange={(checked) =>
                      updateOption('enableStringLiterals', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generate-zod" className="text-sm">
                    Generate Zod Schema
                  </Label>
                  <Switch
                    id="generate-zod"
                    checked={options.generateZodSchema}
                    onCheckedChange={(checked) =>
                      updateOption('generateZodSchema', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generate-json-schema" className="text-sm">
                    Generate JSON Schema
                  </Label>
                  <Switch
                    id="generate-json-schema"
                    checked={options.generateJsonSchema}
                    onCheckedChange={(checked) =>
                      updateOption('generateJsonSchema', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="generate-validation" className="text-sm">
                    Generate Validation
                  </Label>
                  <Switch
                    id="generate-validation"
                    checked={options.generateValidationCode}
                    onCheckedChange={(checked) =>
                      updateOption('generateValidationCode', checked)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="optional-handling">Optional Handling</Label>
                  <Select
                    value={options.optionalHandling}
                    onValueChange={(value: any) =>
                      updateOption('optionalHandling', value)
                    }
                  >
                    <SelectTrigger id="optional-handling">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loose">
                        Loose (null | undefined)
                      </SelectItem>
                      <SelectItem value="strict">Strict (null only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-depth">
                    Max Depth: {options.maxDepth}
                  </Label>
                  <input
                    type="range"
                    id="max-depth"
                    min={1}
                    max={50}
                    value={options.maxDepth}
                    onChange={(e) =>
                      updateOption('maxDepth', Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Keyboard shortcuts:</span>
            <div className="flex gap-4">
              <kbd className="rounded bg-muted px-2 py-1 text-xs">
                Ctrl+Enter
              </kbd>
              <span className="text-xs">Generate</span>
              <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl+C</kbd>
              <span className="text-xs">Copy TypeScript</span>
              <kbd className="rounded bg-muted px-2 py-1 text-xs">
                Ctrl+Shift+F
              </kbd>
              <span className="text-xs">Format JSON</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
