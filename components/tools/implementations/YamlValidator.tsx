'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  FileText,
  Upload,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  validateYaml,
  formatYaml,
  getYamlSamples,
  YamlValidationResult,
} from '@/lib/tools/yaml-validator';

interface YamlValidatorProps {
  defaultValue?: string;
  dictionary?: any;
}

export default function YamlValidator({
  defaultValue = '',
  dictionary,
}: YamlValidatorProps) {
  const [yamlInput, setYamlInput] = useState(defaultValue);
  const [allowDuplicateKeys, setAllowDuplicateKeys] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  const [result, setResult] = useState<YamlValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showSamples, setShowSamples] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trackUse, trackError } = useToolTracking('yaml-validator');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const ui = dictionary?.tools?.['yaml-validator']?.ui ?? {};

  const samples = getYamlSamples();

  const validateInput = useCallback(() => {
    if (!yamlInput.trim()) {
      setResult(null);
      return;
    }

    setIsValidating(true);
    const startTime = Date.now();

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const validationResult = validateYaml(yamlInput, {
        allowDuplicateKeys,
        strict: strictMode,
      });
      setResult(validationResult);
      setIsValidating(false);

      // Track validation
      if (validationResult.isValid) {
        trackUse(yamlInput, validationResult.prettyYaml || '', {
          success: true,
        });
      } else {
        trackError(
          new Error(
            `YAML validation failed: ${validationResult.error?.message}`
          ),
          yamlInput.length
        );
      }
    }, 50);
  }, [yamlInput, allowDuplicateKeys, strictMode, trackUse, trackError]);

  // Scroll to result when validation completes
  useEffect(() => {
    if (result && !isValidating) {
      scrollToResult();
    }
  }, [result, isValidating, scrollToResult]);

  // Handle Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        validateInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validateInput]);

  const handleFormat = () => {
    const formatted = formatYaml(yamlInput);
    if (formatted.isValid && formatted.prettyYaml) {
      setYamlInput(formatted.prettyYaml);
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setYamlInput('');
    setResult(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlInput(content);
      event.target.value = '';
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleSampleSelect = (content: string) => {
    setYamlInput(content);
    setShowSamples(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">{ui.yamlInputHeading || 'YAML Input'}</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleFormat}>
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{ui.formatBtn || 'Format'}</span>
              </Button>
              <input
                type="file"
                accept=".yaml,.yml,.txt"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{ui.uploadBtn || 'Upload'}</span>
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSamples(!showSamples)}
                >
                  <ChevronDown className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{ui.samplesBtn || 'Samples'}</span>
                </Button>
                {showSamples && (
                  <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border bg-white shadow-lg dark:bg-gray-800">
                    <div className="p-2">
                      {samples.map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => handleSampleSelect(sample.content)}
                          className="w-full rounded px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="font-medium">{sample.name}</div>
                          <div className="text-xs text-gray-500">
                            {sample.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{ui.clearBtn || 'Clear'}</span>
              </Button>
            </div>
          </div>

          <Textarea
            value={yamlInput}
            onChange={(e) => setYamlInput(e.target.value)}
            placeholder={dictionary?.tools?.['yaml-validator']?.placeholder || 'Paste your YAML here to validate...'}
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-duplicates"
                  checked={allowDuplicateKeys}
                  onChange={(e) => setAllowDuplicateKeys(e.target.checked)}
                />
                <Label htmlFor="allow-duplicates" className="text-sm">
                  {ui.allowDuplicateKeys || 'Allow duplicate keys'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="strict-mode"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                />
                <Label htmlFor="strict-mode" className="text-sm">
                  {ui.strictMode || 'Strict mode'}
                </Label>
              </div>
            </div>

            <Button
              onClick={validateInput}
              disabled={isValidating || !yamlInput.trim()}
            >
              {isValidating ? (ui.validatingBtn || 'Validating...') : (ui.validateBtn || 'Validate YAML')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <div ref={resultRef}>
        {isValidating && (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {ui.validatingSpinner || 'Validating YAML...'}
              </span>
            </div>
          </Card>
        )}

        {!isValidating && result && (
          <>
            {/* Status Card */}
            <Card
              className="mb-6 border-2 p-6"
              style={{
                borderColor: result.isValid ? '#10b981' : '#ef4444',
                backgroundColor: result.isValid
                  ? 'rgba(16, 185, 129, 0.03)'
                  : 'rgba(239, 68, 68, 0.03)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.isValid ? (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          {ui.yamlValidTitle || 'YAML is Valid ✓'}
                        </h3>
                        {result.metadata && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {result.metadata.documentCount} document(s) • Root
                            type: {result.metadata.rootType}
                            {result.metadata.keyCount !== undefined &&
                              ` • ${result.metadata.keyCount} keys`}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                          {ui.yamlInvalidTitle || 'YAML is Invalid ✗'}
                        </h3>
                        {result.error && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {result.error.line
                              ? `Error at line ${result.error.line}${result.error.column ? `, column ${result.error.column}` : ''}`
                              : 'Syntax error detected'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {result.isValid && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    {ui.validBadge || 'Valid'}
                  </Badge>
                )}
              </div>
            </Card>

            {/* Error Details */}
            {!result.isValid && result.error && (
              <Card className="mb-6 p-6">
                <h3 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">
                  {ui.errorDetailsHeading || 'Error Details'}
                </h3>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{result.error.message}</div>
                    {result.error.line && (
                      <div className="mt-1 text-sm">
                        Line {result.error.line}
                        {result.error.column &&
                          `, Column ${result.error.column}`}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {result.error.snippet && (
                  <div className="mt-4">
                    <Label className="mb-2 block text-sm font-medium">
                      {ui.codeContextLabel || 'Code Context:'}
                    </Label>
                    <pre className="overflow-x-auto rounded-md bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800">
                      {result.error.snippet}
                    </pre>
                  </div>
                )}
              </Card>
            )}

            {/* Output Tabs */}
            {result.isValid && (
              <Card className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="output">{ui.formattedYamlTab || 'Formatted YAML'}</TabsTrigger>
                    <TabsTrigger value="structure">{ui.structureTab || 'Structure'}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="output">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>{ui.prettyPrintedLabel || 'Pretty Printed YAML'}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(result.prettyYaml || '')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copied ? (ui.copiedBtn || 'Copied!') : (ui.copyBtn || 'Copy')}
                        </Button>
                      </div>
                      <pre className="max-h-[400px] overflow-auto rounded-md bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800">
                        {result.prettyYaml}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="structure">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>{ui.parsedStructureLabel || 'Parsed Structure (JSON)'}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(result.parsedData, null, 2)
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copied ? (ui.copiedBtn || 'Copied!') : (ui.copyJsonBtn || 'Copy JSON')}
                        </Button>
                      </div>
                      <pre className="max-h-[400px] overflow-auto rounded-md bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800">
                        {JSON.stringify(result.parsedData, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </>
        )}

        {!result && !isValidating && (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              {ui.emptyState || 'Enter YAML content above and click "Validate YAML" to see results.'}
            </div>
          </Card>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{ui.keyboardShortcutsLabel || 'Keyboard Shortcuts:'}</span>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              Ctrl+Enter
            </kbd>
            <span className="text-xs text-gray-600">{ui.shortcutValidate || 'Validate'}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              Ctrl+V
            </kbd>
            <span className="text-xs text-gray-600">{ui.shortcutPaste || 'Paste'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
