'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Download,
  FileCode,
  FileText,
  Globe,
  Package,
  Play,
  RefreshCw,
  Settings,
  Sparkles,
  Terminal,
  Upload,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import {
  convertCurlToCode,
  detectAndNormalizeCurl,
  SUPPORTED_LANGUAGES,
  type CodeGenerationOptions,
  type ConversionResult,
} from '@/lib/tools/curl-to-code';

// Example cURL commands
const EXAMPLE_CURLS = {
  'Simple GET': 'curl https://api.github.com/users/octocat',
  'POST with JSON': `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`,
  'Bearer Auth': `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://api.example.com/protected`,
  'Form Upload': `curl -X POST https://api.example.com/upload \\
  -F "file=@/path/to/file.pdf" \\
  -F "description=Important document"`,
  'GraphQL Query': `curl -X POST https://api.example.com/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ user(id: 1) { name email } }"}'`,
  'Complex Request': `curl -X PUT https://api.example.com/items/123 \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -H "X-API-Key: secret-key" \\
  -u username:password \\
  -d '{"status": "active", "priority": 1}' \\
  --compressed \\
  --max-time 30`,
};

// Simple toast function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  // In a real implementation, this would show a toast notification
};

interface CurlToCodeConverterProps {
  /**
   * Tool identifier used for analytics tracking. Defaults to the generic
   * `curl-to-code` tool; language-specific landing pages (curl-to-php,
   * curl-to-go, etc.) pass their own id so Umami segments traffic per
   * landing page.
   */
  toolId?: string;
  /** Pre-select a language (e.g. 'php' for /tools/curl-to-php). */
  defaultLanguage?: string;
  /** Pre-select a framework within the chosen language (e.g. 'guzzle'). */
  defaultFramework?: string;
}

export default function CurlToCodeConverter({
  toolId = 'curl-to-code',
  defaultLanguage = 'javascript',
  defaultFramework = 'fetch',
}: CurlToCodeConverterProps = {}) {
  const { theme } = useTheme();
  const { trackUse, trackError } = useToolTracking(toolId);

  // State
  const [curlCommand, setCurlCommand] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [selectedFramework, setSelectedFramework] = useState(defaultFramework);
  const [generatedCode, setGeneratedCode] = useState<ConversionResult | null>(
    null
  );
  const [isConverting, setIsConverting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [copiedCode, setCopiedCode] = useState(false);

  // Generation options
  const [options, setOptions] = useState<CodeGenerationOptions>({
    language: defaultLanguage,
    framework: defaultFramework,
    errorHandling: 'basic',
    async: true,
    extractEnvVars: true,
    includeTypes: true,
    retryLogic: false,
    retryAttempts: 3,
    includeLogging: false,
    includeComments: true,
    indentSize: 2,
    indentType: 'spaces',
    timeout: 30000,
    validateSSL: true,
    includeTests: false,
  });

  // Get available frameworks for selected language (all, with implemented flag)
  const availableFrameworks = useMemo(() => {
    return SUPPORTED_LANGUAGES[selectedLanguage]?.frameworks || [];
  }, [selectedLanguage]);

  // Update framework when language changes — prefer an implemented one
  useEffect(() => {
    if (availableFrameworks.length === 0) return;
    const stillValid = availableFrameworks.some(
      (f) => f.id === selectedFramework && f.implemented
    );
    if (!stillValid) {
      const firstImplemented = availableFrameworks.find((f) => f.implemented);
      setSelectedFramework(
        firstImplemented ? firstImplemented.id : availableFrameworks[0].id
      );
    }
  }, [availableFrameworks, selectedFramework]);

  // Check if any framework of the currently selected language is implemented
  const languageHasImplementation = useMemo(() => {
    return availableFrameworks.some((f) => f.implemented);
  }, [availableFrameworks]);

  // Update options when language/framework changes
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      language: selectedLanguage,
      framework: selectedFramework,
    }));
  }, [selectedLanguage, selectedFramework]);

  // Convert cURL to code
  const handleConvert = useCallback(async () => {
    if (!curlCommand.trim()) {
      showToast('Please enter a cURL command', 'error');
      return;
    }

    setIsConverting(true);

    try {
      // Try to detect and normalize the input
      const normalizedCurl = detectAndNormalizeCurl(curlCommand) || curlCommand;

      // Convert to code
      const result = convertCurlToCode(normalizedCurl, options);

      if (result.success) {
        setGeneratedCode(result);
        setActiveTab('code');
        showToast('cURL command converted successfully');

        // Track successful conversion
        trackUse(curlCommand, result.generatedCode?.code || '', {
          success: true,
        });
      } else {
        showToast(result.error || 'Failed to convert cURL command', 'error');

        // Track error
        trackError(
          new Error(result.error || 'Conversion failed'),
          curlCommand.length
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to convert cURL command',
        'error'
      );

      // Track error
      trackError(
        error instanceof Error ? error : new Error('Conversion failed'),
        curlCommand.length
      );
    } finally {
      setIsConverting(false);
    }
  }, [curlCommand, options]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!generatedCode?.generatedCode?.code) return;

    try {
      await navigator.clipboard.writeText(generatedCode.generatedCode.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast('Code copied to clipboard');
    } catch (error) {
      showToast('Failed to copy code', 'error');
    }
  }, [generatedCode]);

  // Download code as file
  const handleDownload = useCallback(() => {
    if (!generatedCode?.generatedCode) return;

    const { code, fileName, fileExtension } = generatedCode.generatedCode;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`File saved as ${fileName}.${fileExtension}`);
  }, [generatedCode]);

  // Load example
  const loadExample = useCallback((example: string) => {
    setCurlCommand(EXAMPLE_CURLS[example as keyof typeof EXAMPLE_CURLS]);
  }, []);

  // Import from file
  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCurlCommand(content);
        showToast('File content imported successfully');
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <div className="w-full space-y-6">
      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">cURL Command</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurlCommand('')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                  <input
                    id="file-import"
                    type="file"
                    accept=".txt,.sh,.curl"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById('file-import')?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={curlCommand}
                onChange={(e) => setCurlCommand(e.target.value)}
                placeholder="Paste your cURL command here..."
                className="min-h-[200px] font-mono text-sm"
                spellCheck={false}
              />

              {/* Examples */}
              <div className="space-y-2">
                <Label>Quick Examples</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(EXAMPLE_CURLS).map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Language & Framework Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_LANGUAGES).map(
                        ([key, lang]) => {
                          const anyImplemented = lang.frameworks.some(
                            (f) => f.implemented
                          );
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {lang.name}
                                {!anyImplemented && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    Coming soon
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework">Framework</Label>
                  <Select
                    value={selectedFramework}
                    onValueChange={setSelectedFramework}
                  >
                    <SelectTrigger id="framework">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFrameworks.map((framework) => {
                        const label =
                          framework.id.charAt(0).toUpperCase() +
                          framework.id.slice(1).replace(/-/g, ' ');
                        return (
                          <SelectItem
                            key={framework.id}
                            value={framework.id}
                            disabled={!framework.implemented}
                          >
                            <span className="flex items-center gap-2">
                              {label}
                              {!framework.implemented && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Coming soon
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!languageHasImplementation && (
                <Alert>
                  <AlertDescription>
                    Generator for <strong>{SUPPORTED_LANGUAGES[selectedLanguage]?.name}</strong>{' '}
                    is coming soon. Pick a language with an available framework
                    (e.g., JavaScript + fetch, Python + requests) to generate
                    code now.
                  </AlertDescription>
                </Alert>
              )}

              {/* Options */}
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowOptions(!showOptions)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Advanced Options
                  {showOptions ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Button>

                {showOptions && (
                  <div className="space-y-4 rounded-lg border p-4">
                    {/* Error Handling */}
                    <div className="space-y-2">
                      <Label htmlFor="error-handling">Error Handling</Label>
                      <Select
                        value={options.errorHandling}
                        onValueChange={(value) =>
                          setOptions((prev) => ({
                            ...prev,
                            errorHandling: value as any,
                          }))
                        }
                      >
                        <SelectTrigger id="error-handling">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic Try-Catch</SelectItem>
                          <SelectItem value="comprehensive">
                            Comprehensive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Switches */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="async">Async/Await</Label>
                        <Switch
                          id="async"
                          checked={options.async}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({ ...prev, async: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="env-vars">
                          Extract Environment Variables
                        </Label>
                        <Switch
                          id="env-vars"
                          checked={options.extractEnvVars}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              extractEnvVars: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="types">Include Types</Label>
                        <Switch
                          id="types"
                          checked={options.includeTypes}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeTypes: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="retry">Retry Logic</Label>
                        <Switch
                          id="retry"
                          checked={options.retryLogic}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              retryLogic: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="logging">Include Logging</Label>
                        <Switch
                          id="logging"
                          checked={options.includeLogging}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeLogging: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="comments">Include Comments</Label>
                        <Switch
                          id="comments"
                          checked={options.includeComments}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeComments: checked,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Indentation */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="indent-type">Indentation</Label>
                        <Select
                          value={options.indentType}
                          onValueChange={(value) =>
                            setOptions((prev) => ({
                              ...prev,
                              indentType: value as any,
                            }))
                          }
                        >
                          <SelectTrigger id="indent-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spaces">Spaces</SelectItem>
                            <SelectItem value="tabs">Tabs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indent-size">Indent Size</Label>
                        <Select
                          value={String(options.indentSize)}
                          onValueChange={(value) =>
                            setOptions((prev) => ({
                              ...prev,
                              indentSize: Number(value),
                            }))
                          }
                        >
                          <SelectTrigger id="indent-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={isConverting || !curlCommand.trim()}
                className="w-full"
                size="lg"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Convert to Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Generated Code</CardTitle>
                {generatedCode?.generatedCode && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copiedCode ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedCode?.generatedCode ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="code">
                      <Code className="mr-2 h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="env">
                      <Globe className="mr-2 h-4 w-4" />
                      Env Vars
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <FileText className="mr-2 h-4 w-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>

                  {/* Code Tab */}
                  <TabsContent value="code" className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <pre className="overflow-x-auto p-4 text-sm">
                        <code>{generatedCode.generatedCode.code}</code>
                      </pre>
                    </ScrollArea>
                  </TabsContent>

                  {/* Environment Variables Tab */}
                  <TabsContent value="env" className="mt-4">
                    {generatedCode.generatedCode.envVars &&
                    Object.keys(generatedCode.generatedCode.envVars).length >
                      0 ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Add these environment variables to your .env file
                          </AlertDescription>
                        </Alert>
                        <ScrollArea className="h-[320px] w-full rounded-md border">
                          <div className="p-4 font-mono text-sm">
                            {Object.entries(
                              generatedCode.generatedCode.envVars
                            ).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-blue-600 dark:text-blue-400">
                                  {key}
                                </span>
                                <span className="mx-2">=</span>
                                <span className="text-green-600 dark:text-green-400">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No environment variables extracted.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  {/* Info Tab */}
                  <TabsContent value="info" className="mt-4">
                    <div className="space-y-4">
                      {/* Parsed cURL Info */}
                      {generatedCode.parsedCurl && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">
                            Parsed cURL Details
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-medium">Method:</span>
                              <Badge variant="outline">
                                {generatedCode.parsedCurl.method}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-medium">URL:</span>
                              <span className="truncate font-mono">
                                {generatedCode.parsedCurl.url}
                              </span>
                            </div>
                            {generatedCode.parsedCurl.auth && (
                              <div className="grid grid-cols-2 gap-2">
                                <span className="font-medium">Auth Type:</span>
                                <Badge variant="secondary">
                                  {generatedCode.parsedCurl.auth.type}
                                </Badge>
                              </div>
                            )}
                            {generatedCode.parsedCurl.dataType && (
                              <div className="grid grid-cols-2 gap-2">
                                <span className="font-medium">Data Type:</span>
                                <Badge variant="secondary">
                                  {generatedCode.parsedCurl.dataType}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Headers */}
                          {Object.keys(generatedCode.parsedCurl.headers)
                            .length > 0 && (
                            <div className="mt-4">
                              <h4 className="mb-2 text-sm font-medium">
                                Headers
                              </h4>
                              <div className="space-y-1 rounded-md border p-2">
                                {Object.entries(
                                  generatedCode.parsedCurl.headers
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex font-mono text-xs"
                                  >
                                    <span className="font-medium">{key}:</span>
                                    <span className="ml-2 text-muted-foreground">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dependencies */}
                          {generatedCode.generatedCode.dependencies?.length && (
                            <div className="mt-4">
                              <h4 className="mb-2 text-sm font-medium">
                                Dependencies
                              </h4>
                              <p className="mb-2 text-sm text-muted-foreground">
                                Install these packages to use the generated
                                code:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {generatedCode.generatedCode.dependencies.map(
                                  (dep) => (
                                    <Badge key={dep} variant="outline">
                                      <Package className="mr-1 h-3 w-3" />
                                      {dep}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <Code className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Generated code will appear here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-950">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">All HTTP Methods</div>
                <div className="text-sm text-muted-foreground">
                  GET, POST, PUT, DELETE, PATCH, etc.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-md bg-green-100 p-2 dark:bg-green-950">
                <FileCode className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Type Inference</div>
                <div className="text-sm text-muted-foreground">
                  Auto-generate types from JSON
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-950">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">Error Handling</div>
                <div className="text-sm text-muted-foreground">
                  Try-catch, retry logic, timeouts
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-md bg-orange-100 p-2 dark:bg-orange-950">
                <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="font-medium">15+ Languages</div>
                <div className="text-sm text-muted-foreground">
                  JS, Python, Go, Java, PHP, Ruby...
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
