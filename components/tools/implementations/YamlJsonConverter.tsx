'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
// Removed tabs import as not used
// Remove dropdown menu import since component doesn't exist
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
  Upload,
  AlertCircle,
  CheckCircle2,
  Settings,
  FileJson,
  FileCode,
  ArrowRightLeft,
  Trash2,
  FileUp,
  Wand2,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  detectFormat,
  yamlToJson,
  jsonToYaml,
  validateYaml,
  validateJson,
  generateTypeScriptInterface,
  generateJsonSchema,
  ConversionOptions,
} from '@/lib/tools/yaml-json';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';

// Sample data
const sampleData = {
  kubernetes: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80`,
  docker: `version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - .:/code
    environment:
      FLASK_ENV: development
  redis:
    image: "redis:alpine"
    ports:
      - "6379:6379"`,
  githubActions: `name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Run tests
      run: npm test`,
  simple: `name: John Doe
age: 30
email: john@example.com
active: true
tags:
  - developer
  - javascript
  - react
address:
  street: 123 Main St
  city: New York
  zip: 10001`,
};

export default function YamlJsonConverter({ dictionary }: { dictionary?: any }) {
  const ui = dictionary?.tools?.['yaml-json-converter']?.ui ?? {};
  const { trackUse, trackError, trackCustom } = useToolTracking(
    'yaml-json-converter'
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversionDirection, setConversionDirection] = useState<
    'yaml-to-json' | 'json-to-yaml'
  >('yaml-to-json');
  const [autoDetect, setAutoDetect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [outputMode, setOutputMode] = useState<
    'json' | 'typescript' | 'schema'
  >('json');
  const [originalJsonOutput, setOriginalJsonOutput] = useState('');

  // Conversion options
  const [options, setOptions] = useState<ConversionOptions>({
    // YAML to JSON
    dateFormat: 'iso',
    expandReferences: true,
    preserveComments: false,
    preserveKeyOrder: true,
    handleNaN: 'null',
    handleInfinity: 'null',

    // JSON to YAML
    indent: 2,
    quoteStyle: 'single',
    flowLevel: -1,
    lineWidth: 80,
    noRefs: false,
    nullStr: 'null',

    // Common
    prettyPrint: true,
    sortKeys: 'original',
  });

  // Auto-detect format
  useEffect(() => {
    if (autoDetect && input) {
      const format = detectFormat(input);
      if (format === 'json') {
        setConversionDirection('json-to-yaml');
      } else if (format === 'yaml') {
        setConversionDirection('yaml-to-json');
      }
    }
  }, [input, autoDetect]);

  // Convert function
  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter some data to convert');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setWarnings([]);
    setValidationErrors([]);

    try {
      let result;
      if (conversionDirection === 'yaml-to-json') {
        // Validate YAML first
        const validation = validateYaml(input);
        if (!validation.valid && validation.errors) {
          setValidationErrors(validation.errors);
          setError('Invalid YAML syntax');
          setIsProcessing(false);
          return;
        }

        result = yamlToJson(input, options);
      } else {
        // Validate JSON first
        const validation = validateJson(input);
        if (!validation.valid && validation.errors) {
          setValidationErrors(validation.errors);
          setError('Invalid JSON syntax');
          setIsProcessing(false);
          return;
        }

        result = jsonToYaml(input, options);
      }

      if (result.success) {
        setOutput(result.output || '');
        setOutputMode('json'); // Reset to JSON view
        setOriginalJsonOutput(''); // Clear any stored output
        if (result.warnings) {
          setWarnings(result.warnings);
        }
        // Track successful conversion
        trackUse(input, result.output || '', { success: true });
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      trackError(
        err instanceof Error ? err : new Error(errorMessage),
        input.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input, conversionDirection, options, trackUse, trackError]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
  }, [output]);

  // Download file
  const handleDownload = useCallback(() => {
    const extension = conversionDirection === 'yaml-to-json' ? 'json' : 'yaml';
    const mimeType =
      conversionDirection === 'yaml-to-json'
        ? 'application/json'
        : 'application/x-yaml';

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, conversionDirection]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setInput(e.target?.result as string);
        };
        reader.readAsText(file);
      }
    },
    []
  );

  // Generate TypeScript interface
  const handleGenerateTypeScript = useCallback(() => {
    if (
      conversionDirection === 'yaml-to-json' &&
      output &&
      outputMode === 'json'
    ) {
      setOriginalJsonOutput(output);
      const ts = generateTypeScriptInterface(output, 'GeneratedInterface');
      setOutput(ts);
      setOutputMode('typescript');
    }
  }, [output, conversionDirection, outputMode]);

  // Generate JSON Schema
  const handleGenerateJsonSchema = useCallback(() => {
    if (
      conversionDirection === 'yaml-to-json' &&
      output &&
      outputMode === 'json'
    ) {
      setOriginalJsonOutput(output);
      const schema = generateJsonSchema(output);
      setOutput(JSON.stringify(schema, null, 2));
      setOutputMode('schema');
    }
  }, [output, conversionDirection, outputMode]);

  // Return to JSON view
  const handleReturnToJson = useCallback(() => {
    if (originalJsonOutput) {
      setOutput(originalJsonOutput);
      setOutputMode('json');
    }
  }, [originalJsonOutput]);

  // Swap input/output
  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput(input);
    setConversionDirection((prev) =>
      prev === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json'
    );
  }, [input, output]);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setWarnings([]);
    setValidationErrors([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.cardTitle || 'YAML ↔ JSON Converter'}</CardTitle>
          <CardDescription>
            {ui.cardDescription || 'Convert between YAML and JSON formats with advanced options and validation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Direction Toggle */}
            <div className="flex items-center space-x-2">
              <Label>{ui.labelDirection || 'Direction:'}</Label>
              <div
                className={autoDetect ? 'pointer-events-none opacity-50' : ''}
              >
                <Select
                  value={conversionDirection}
                  onValueChange={(value: any) => setConversionDirection(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yaml-to-json">{ui.directionYamlToJson || 'YAML → JSON'}</SelectItem>
                    <SelectItem value="json-to-yaml">{ui.directionJsonToYaml || 'JSON → YAML'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-detect Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-detect"
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
              />
              <Label htmlFor="auto-detect">{ui.labelAutoDetect || 'Auto-detect format'}</Label>
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                disabled={!input || !output}
              >
                <ArrowRightLeft className="mr-1 h-4 w-4" />
                {ui.btnSwap || 'Swap'}
              </Button>

              <Select
                onValueChange={(value) =>
                  setInput(sampleData[value as keyof typeof sampleData])
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={ui.sampleDataPlaceholder || 'Sample Data'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">{ui.sampleSimple || 'Simple YAML'}</SelectItem>
                  <SelectItem value="kubernetes">{ui.sampleKubernetes || 'Kubernetes Config'}</SelectItem>
                  <SelectItem value="docker">{ui.sampleDocker || 'Docker Compose'}</SelectItem>
                  <SelectItem value="githubActions">{ui.sampleGithubActions || 'GitHub Actions'}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!input && !output}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {ui.btnClear || 'Clear'}
              </Button>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-lg border">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">{ui.conversionOptions || 'Conversion Options'}</span>
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
              <div className="space-y-4 border-t p-4 pt-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {conversionDirection === 'yaml-to-json' ? (
                    <>
                      <div className="space-y-2">
                        <Label>{ui.labelDateFormat || 'Date Format'}</Label>
                        <Select
                          value={options.dateFormat}
                          onValueChange={(value: any) =>
                            setOptions((prev) => ({
                              ...prev,
                              dateFormat: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iso">ISO 8601</SelectItem>
                            <SelectItem value="unix">Unix Timestamp</SelectItem>
                            <SelectItem value="string">String</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{ui.labelSpecialNumbers || 'Special Numbers'}</Label>
                        <Select
                          value={options.handleNaN}
                          onValueChange={(value: any) =>
                            setOptions((prev) => ({
                              ...prev,
                              handleNaN: value,
                              handleInfinity: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">
                              {ui.convertToNull || 'Convert to null'}
                            </SelectItem>
                            <SelectItem value="string">
                              {ui.convertToString || 'Convert to string'}
                            </SelectItem>
                            <SelectItem value="keep">{ui.keepAsIs || 'Keep as-is'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="expand-refs"
                          checked={options.expandReferences}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              expandReferences: checked,
                            }))
                          }
                        />
                        <Label htmlFor="expand-refs">{ui.labelExpandRefs || 'Expand references'}</Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>{ui.labelIndentation || 'Indentation'}</Label>
                        <Select
                          value={options.indent?.toString()}
                          onValueChange={(value) =>
                            setOptions((prev) => ({
                              ...prev,
                              indent: parseInt(value) as 2 | 4,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">{ui.spacesTwo || '2 spaces'}</SelectItem>
                            <SelectItem value="4">{ui.spacesFour || '4 spaces'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{ui.labelNullRepresentation || 'Null Representation'}</Label>
                        <Select
                          value={options.nullStr}
                          onValueChange={(value: any) =>
                            setOptions((prev) => ({ ...prev, nullStr: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">null</SelectItem>
                            <SelectItem value="~">~</SelectItem>
                            <SelectItem value="">{ui.nullEmpty || 'Empty'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{ui.labelQuoteStyle || 'Quote Style'}</Label>
                        <Select
                          value={options.quoteStyle}
                          onValueChange={(value: any) =>
                            setOptions((prev) => ({
                              ...prev,
                              quoteStyle: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">{ui.quoteStyleSingle || 'Single'}</SelectItem>
                            <SelectItem value="double">{ui.quoteStyleDouble || 'Double'}</SelectItem>
                            <SelectItem value="none">
                              {ui.quoteStyleNone || 'None (when safe)'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>{ui.labelSortKeys || 'Sort Keys'}</Label>
                    <Select
                      value={options.sortKeys}
                      onValueChange={(value: any) =>
                        setOptions((prev) => ({ ...prev, sortKeys: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">{ui.sortOriginalOrder || 'Original Order'}</SelectItem>
                        <SelectItem value="alphabetical">
                          {ui.sortAlphabetical || 'Alphabetical'}
                        </SelectItem>
                        <SelectItem value="none">{ui.sortNone || 'None'}</SelectItem>
                      </SelectContent>
                    </Select>
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
          <CardHeader>
            <CardTitle className="text-lg">
              {ui.cardInputTitle || 'Input'} ({conversionDirection === 'yaml-to-json' ? 'YAML' : 'JSON'})
            </CardTitle>
            <div className="flex gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">{ui.btnUploadFile || 'Upload File'}</span>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".yaml,.yml,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter ${conversionDirection === 'yaml-to-json' ? 'YAML' : 'JSON'} here...`}
              className="min-h-[400px] font-mono text-sm"
              rows={20}
            />
          </CardContent>
        </Card>

        {/* Output Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {ui.cardOutputTitle || 'Output'} (
              {conversionDirection === 'yaml-to-json'
                ? outputMode === 'typescript'
                  ? (ui.outputTypeScriptInterface || 'TypeScript Interface')
                  : outputMode === 'schema'
                    ? (ui.outputJsonSchema || 'JSON Schema')
                    : 'JSON'
                : 'YAML'}
              )
            </CardTitle>
            <div className="flex gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!output}
              >
                <Copy className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">{ui.btnCopy || 'Copy'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!output}
              >
                <Download className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">{ui.btnDownload || 'Download'}</span>
              </Button>
              {conversionDirection === 'yaml-to-json' &&
                output &&
                outputMode === 'json' && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTypeScript}
                      disabled={!output}
                    >
                      <FileCode className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">{ui.btnTypeScript || 'TypeScript'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateJsonSchema}
                      disabled={!output}
                    >
                      <FileJson className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">{ui.btnSchema || 'Schema'}</span>
                    </Button>
                  </div>
                )}
              {conversionDirection === 'yaml-to-json' &&
                output &&
                outputMode !== 'json' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReturnToJson}
                  >
                    <ArrowRightLeft className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">{ui.btnBackToJson || 'Back to JSON'}</span>
                  </Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              onChange={() => {}}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              rows={20}
            />
          </CardContent>
        </Card>
      </div>

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleConvert}
          disabled={!input || isProcessing}
          className="min-w-[200px]"
        >
          {isProcessing ? (ui.btnConverting || 'Converting...') : (ui.btnConvert || 'Convert')}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((err, index) => (
                <div key={index}>
                  {err.line && err.column && (
                    <span className="mr-2 font-mono text-xs">
                      Line {err.line}, Col {err.column}:
                    </span>
                  )}
                  {err.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {output && !error && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/10 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            {ui.conversionSuccessful || 'Conversion successful! Your'}{' '}
            {conversionDirection === 'yaml-to-json'
              ? outputMode === 'typescript'
                ? (ui.outputTypeScriptInterface || 'TypeScript Interface')
                : outputMode === 'schema'
                  ? (ui.outputJsonSchema || 'JSON Schema')
                  : 'JSON'
              : 'YAML'}{' '}
            {ui.conversionReady || 'is ready.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
