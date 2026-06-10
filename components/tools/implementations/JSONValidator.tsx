'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Copy,
  FileText,
  Shield,
  Clock,
  Zap,
  Upload,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import {
  validateJSON,
  formatJSON,
  minifyJSON,
  exportValidationResults,
  ValidationResult,
  ValidationLevel,
  ValidationOptions,
  ValidationError,
  SecurityIssue,
} from '@/lib/tools/json-validator';

interface JSONValidatorProps {
  defaultValue?: string;
  dictionary?: any;
}

export default function JSONValidator({
  defaultValue = '',
  dictionary,
}: JSONValidatorProps) {
  const ui = dictionary?.tools?.['json-validator']?.ui ?? {};
  const [jsonInput, setJsonInput] = useState(defaultValue);
  const [schemaInput, setSchemaInput] = useState('');
  const [validationLevel, setValidationLevel] =
    useState<ValidationLevel>('basic');
  const [enableSecurity, setEnableSecurity] = useState(false);
  const [allowComments, setAllowComments] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('validator');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trackUse, trackCustom, trackError } =
    useToolTracking('json-validator');

  // Advanced options
  const [maxDepth, setMaxDepth] = useState(50);
  const [maxKeys, setMaxKeys] = useState(10000);
  const [maxFileSize, setMaxFileSize] = useState(50 * 1024 * 1024); // 50MB

  const options: ValidationOptions = useMemo(
    () => ({
      level: validationLevel,
      schema: schemaInput
        ? (() => {
            try {
              return JSON.parse(schemaInput);
            } catch {
              return undefined;
            }
          })()
        : undefined,
      enableSecurity,
      allowComments,
      strictMode,
      maxDepth,
      maxKeys,
      maxFileSize,
    }),
    [
      validationLevel,
      schemaInput,
      enableSecurity,
      allowComments,
      strictMode,
      maxDepth,
      maxKeys,
      maxFileSize,
    ]
  );

  const validateInput = useCallback(async () => {
    if (!jsonInput.trim()) {
      setResult(null);
      return;
    }

    setIsValidating(true);

    try {
      // Use setTimeout to allow UI to update
      setTimeout(() => {
        const validationResult = validateJSON(jsonInput, options);
        setResult(validationResult);
        setIsValidating(false);

        // Track validation
        if (validationResult.isValid) {
          trackCustom({
            inputSize: jsonInput.length,
            outputSize: JSON.stringify(validationResult, null, 2).length,
            success: true,
            level: validationLevel,
          });
        } else {
          trackError(
            new Error(
              `Validation failed: ${validationResult.summary.errorCount} errors`
            ),
            jsonInput.length
          );
        }
      }, 50);
    } catch (error) {
      console.error('Validation error:', error);
      trackError(
        error instanceof Error ? error : new Error(String(error)),
        jsonInput.length
      );
      setIsValidating(false);
    }
  }, [jsonInput, options, validationLevel, trackUse, trackError]);

  // Auto-validate on input change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (jsonInput.trim()) {
        validateInput();
      } else {
        setResult(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [jsonInput, validateInput]);

  const handleFormat = () => {
    const formatted = formatJSON(jsonInput, 2);
    if (formatted.success && formatted.result) {
      setJsonInput(formatted.result);
    }
  };

  const handleMinify = () => {
    const minified = minifyJSON(jsonInput);
    if (minified.success && minified.result) {
      setJsonInput(minified.result);
    }
  };

  const handleCopyResult = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // You could add a toast notification here
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > maxFileSize) {
      alert(`File too large. Maximum size is ${formatBytes(maxFileSize)}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
        // Clear the input so the same file can be uploaded again
        event.target.value = '';
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleExport = (format: 'json' | 'html' | 'csv' | 'text') => {
    if (!result) return;

    const exported = exportValidationResults(result, format);
    const blob = new Blob([exported], {
      type:
        format === 'html'
          ? 'text/html'
          : format === 'csv'
            ? 'text/csv'
            : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSecuritySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validator">
            {ui.tabValidator || 'Validator'}
          </TabsTrigger>
          <TabsTrigger value="schema">{ui.tabSchema || 'Schema'}</TabsTrigger>
          <TabsTrigger value="settings">
            {ui.tabSettings || 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validator" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {ui.jsonInput || 'JSON Input'}
                </h3>
                <div className="flex gap-1 md:gap-2">
                  <Button variant="outline" size="sm" onClick={handleFormat}>
                    <FileText className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">
                      {ui.format || 'Format'}
                    </span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMinify}>
                    <Zap className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">
                      {ui.minify || 'Minify'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">
                      {ui.uploadFile || 'Upload File'}
                    </span>
                  </Button>
                </div>
              </div>

              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={
                  ui.jsonInputPlaceholder || 'Enter your JSON data here...'
                }
                className="min-h-[300px] font-mono text-sm"
              />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="validation-level">
                    {ui.validationLevel || 'Validation Level:'}
                  </Label>
                  <Select
                    value={validationLevel}
                    onValueChange={(value) =>
                      setValidationLevel(value as ValidationLevel)
                    }
                  >
                    <SelectTrigger id="validation-level" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        {ui.levelBasic || 'Basic'}
                      </SelectItem>
                      <SelectItem value="structural">
                        {ui.levelStructural || 'Structural'}
                      </SelectItem>
                      <SelectItem value="schema">
                        {ui.levelSchema || 'Schema'}
                      </SelectItem>
                      <SelectItem value="security">
                        {ui.levelSecurity || 'Security'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-security"
                    checked={enableSecurity}
                    onChange={(e) => setEnableSecurity(e.target.checked)}
                  />
                  <Label htmlFor="enable-security">
                    {ui.securityScan || 'Security Scan'}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow-comments"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                  />
                  <Label htmlFor="allow-comments">
                    {ui.allowComments || 'Allow Comments'}
                  </Label>
                </div>
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                  <Progress value={undefined} className="flex-1" />
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {ui.validatingJson || 'Validating JSON...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Validation Complete Status */}
              {!isValidating && result && jsonInput.trim() && (
                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    result.isValid
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        result.isValid
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {result.isValid
                        ? `${ui.statusValid || '✓ JSON is valid'}${result.summary.warningCount > 0 ? ` (${result.summary.warningCount} ${ui.warningsLower || 'warnings'})` : ''}`
                        : `${ui.statusInvalid || '✗ JSON is invalid'} (${result.summary.errorCount} ${ui.errorsLower || 'errors'}${result.summary.warningCount > 0 ? `, ${result.summary.warningCount} ${ui.warningsLower || 'warnings'}` : ''})`}
                    </span>
                  </div>

                  <div className="ml-auto flex items-center gap-4 text-xs">
                    <span
                      className={`${result.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {result.metrics.validationTime.toFixed(1)}ms
                    </span>
                    <span
                      className={`${result.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {formatBytes(result.metrics.fileSize)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Results Section - Now in the same tab */}
          {result && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {ui.validationResults || 'Validation Results'}
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Summary Card */}
              <Card
                className="border-2 p-6"
                style={{
                  borderColor: result.isValid ? '#10b981' : '#ef4444',
                  backgroundColor: result.isValid
                    ? 'rgba(16, 185, 129, 0.03)'
                    : 'rgba(239, 68, 68, 0.03)',
                }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.isValid ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                            {ui.jsonValid || 'JSON Valid ✓'}
                          </h3>
                          {result.summary.warningCount > 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              {result.summary.warningCount}{' '}
                              {ui.qualityWarningsDetected ||
                                'quality warnings detected'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                            {ui.jsonInvalid || 'JSON Invalid ✗'}
                          </h3>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {result.summary.errorCount}{' '}
                            {ui.errorsFound || 'errors found'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={result.isValid ? 'default' : 'destructive'}
                      className={
                        result.isValid ? 'bg-green-500 hover:bg-green-600' : ''
                      }
                    >
                      <span className="font-medium">
                        {ui.levelLabel || 'Level:'}{' '}
                        {result.summary.validationLevel}
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.summary.errorCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {ui.errors || 'Errors'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.summary.warningCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {ui.warnings || 'Warnings'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.summary.securityIssueCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {ui.security || 'Security'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.metrics.validationTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">
                      {ui.time || 'Time'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {ui.export || 'Export'} JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('html')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {ui.export || 'Export'} HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {ui.export || 'Export'} CSV
                  </Button>
                </div>
              </Card>

              {/* Errors */}
              {result.errors.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-red-600">
                    {ui.errors || 'Errors'} ({result.errors.length})
                  </h3>
                  <div className="space-y-3">
                    {result.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">
                            {ui.line || 'Line'} {error.line},{' '}
                            {ui.column || 'Column'} {error.column} (
                            {error.type})
                          </div>
                          <div>{error.message}</div>
                          {error.suggestion && (
                            <div className="mt-1 text-sm italic">
                              💡 {error.suggestion}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </Card>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-yellow-600">
                    {ui.warnings || 'Warnings'} ({result.warnings.length})
                  </h3>
                  <div className="space-y-3">
                    {result.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">
                            {ui.line || 'Line'} {warning.line},{' '}
                            {ui.column || 'Column'} {warning.column} (
                            {warning.type})
                          </div>
                          <div>{warning.message}</div>
                          {warning.suggestion && (
                            <div className="mt-1 text-sm italic">
                              💡 {warning.suggestion}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </Card>
              )}

              {/* Security Issues */}
              {result.securityIssues.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-purple-600">
                    <Shield className="mr-2 h-5 w-5" />
                    {ui.securityIssues || 'Security Issues'} (
                    {result.securityIssues.length})
                  </h3>
                  <div className="space-y-3">
                    {result.securityIssues.map((issue, index) => (
                      <Alert key={index}>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center gap-2 font-medium">
                            <span>{issue.type.replace(/_/g, ' ')}</span>
                            <Badge
                              variant={
                                issue.severity === 'critical'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <div>{issue.message}</div>
                          <div className="mt-1 text-sm italic">
                            🔧 {issue.recommendation}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </Card>
              )}

              {/* Metrics */}
              <Card className="p-6">
                <h3 className="mb-4 flex items-center text-lg font-semibold">
                  <Clock className="mr-2 h-5 w-5" />
                  {ui.performanceMetrics || 'Performance Metrics'}
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-gray-600">
                      {ui.fileSize || 'File Size'}
                    </div>
                    <div className="font-semibold">
                      {formatBytes(result.metrics.fileSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {ui.objectDepth || 'Object Depth'}
                    </div>
                    <div className="font-semibold">
                      {result.metrics.objectDepth}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {ui.keyCount || 'Key Count'}
                    </div>
                    <div className="font-semibold">
                      {result.metrics.keyCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {ui.arrayLength || 'Array Length'}
                    </div>
                    <div className="font-semibold">
                      {result.metrics.arrayLength}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {ui.validationTime || 'Validation Time'}
                    </div>
                    <div className="font-semibold">
                      {result.metrics.validationTime.toFixed(2)}ms
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {!result && (
            <Card className="p-6">
              <div className="text-center text-gray-500">
                {ui.emptyState ||
                  'Enter JSON data above to see validation results here.'}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {ui.jsonSchemaOptional || 'JSON Schema (Optional)'}
                </h3>
                <Badge variant="outline">Draft 7 / 2019-09 / 2020-12</Badge>
              </div>

              <Textarea
                value={schemaInput}
                onChange={(e) => setSchemaInput(e.target.value)}
                placeholder={
                  ui.schemaPlaceholder || 'Enter your JSON Schema here...'
                }
                className="min-h-[200px] font-mono text-sm"
              />

              <div className="text-sm text-gray-600">
                {ui.schemaDescription ||
                  'Provide a JSON Schema to validate your data structure, required fields, and data types. Supports $ref, allOf, oneOf, and conditional schemas.'}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {ui.advancedSettings || 'Advanced Settings'}
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-depth">
                    {ui.maxObjectDepth || 'Maximum Object Depth'}
                  </Label>
                  <Select
                    value={maxDepth.toString()}
                    onValueChange={(value) => setMaxDepth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">
                        10 {ui.levelsSuffix || 'levels'}
                      </SelectItem>
                      <SelectItem value="25">
                        25 {ui.levelsSuffix || 'levels'}
                      </SelectItem>
                      <SelectItem value="50">
                        50 {ui.levelsSuffix || 'levels'}
                      </SelectItem>
                      <SelectItem value="100">
                        100 {ui.levelsSuffix || 'levels'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-keys">
                    {ui.maxKeyCount || 'Maximum Key Count'}
                  </Label>
                  <Select
                    value={maxKeys.toString()}
                    onValueChange={(value) => setMaxKeys(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">
                        1,000 {ui.keysSuffix || 'keys'}
                      </SelectItem>
                      <SelectItem value="5000">
                        5,000 {ui.keysSuffix || 'keys'}
                      </SelectItem>
                      <SelectItem value="10000">
                        10,000 {ui.keysSuffix || 'keys'}
                      </SelectItem>
                      <SelectItem value="50000">
                        50,000 {ui.keysSuffix || 'keys'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="strict-mode"
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                  />
                  <Label htmlFor="strict-mode">
                    {ui.strictMode || 'Strict Mode'}
                  </Label>
                  <span className="text-sm text-gray-600">
                    {ui.strictModeHint || '- More rigorous validation rules'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-security-settings"
                    checked={enableSecurity}
                    onChange={(e) => setEnableSecurity(e.target.checked)}
                  />
                  <Label htmlFor="enable-security-settings">
                    {ui.securityValidation || 'Security Validation'}
                  </Label>
                  <span className="text-sm text-gray-600">
                    {ui.securityValidationHint ||
                      '- Detect potential vulnerabilities'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow-comments-settings"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                  />
                  <Label htmlFor="allow-comments-settings">
                    {ui.json5Support || 'JSON5 Support'}
                  </Label>
                  <span className="text-sm text-gray-600">
                    {ui.json5SupportHint ||
                      '- Allow comments and trailing commas'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {ui.quickActions || 'Quick Actions:'}
            </span>
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              Ctrl+Enter
            </kbd>
            <span className="text-xs text-gray-600">
              {ui.validate || 'Validate'}
            </span>
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              Ctrl+Shift+F
            </kbd>
            <span className="text-xs text-gray-600">
              {ui.format || 'Format'}
            </span>
          </div>

          {result && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyResult(JSON.stringify(result, null, 2))}
            >
              <Copy className="mr-2 h-4 w-4" />
              {ui.copyResult || 'Copy Result'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
