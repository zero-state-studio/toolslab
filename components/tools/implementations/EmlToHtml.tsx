'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  Download,
  Copy,
  FileText,
  Eye,
  Code,
  Table,
  Mail,
  AlertCircle,
  Shield,
  ImageIcon,
  Paperclip,
  ExternalLink,
  Link2,
  Monitor,
  Tablet,
  Smartphone,
  Check,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import {
  convertEmlToHtml,
  exportHeadersAsJson,
  getEmailSummary,
  type ConversionResult,
  type ExtractedLink,
} from '@/lib/tools/eml-to-html';

interface EmlToHtmlProps {
  defaultValue?: string;
  categoryColor?: string;
  locale?: string;
  dictionary?: any;
}

type ViewMode = 'rendered' | 'source' | 'headers' | 'links' | 'raw';
type PreviewSize = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_WIDTHS: Record<PreviewSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function EmlToHtml({ defaultValue = '' }: EmlToHtmlProps) {
  const { trackUse, trackError } = useToolTracking('eml-to-html');
  const [emlInput, setEmlInput] = useState(defaultValue);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');
  const [sanitizeHtml, setSanitizeHtml] = useState(true); // BUG FIX: default ON
  const [convertCid, setConvertCid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification (replaces alert())
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Process EML content
  const processEml = useCallback(() => {
    if (!emlInput.trim()) {
      setResult(null);
      return;
    }

    setIsProcessing(true);

    try {
      const conversionResult = convertEmlToHtml(emlInput, {
        sanitizeHtml,
        removeScripts: true,
        convertCidToDataUri: convertCid,
        maxAttachmentSize: 10 * 1024 * 1024,
      });

      setResult(conversionResult);

      if (conversionResult.success) {
        trackUse(emlInput, conversionResult.html || '', { success: true });
      } else {
        trackError(
          new Error(conversionResult.error || 'Conversion failed'),
          emlInput.length
        );
      }
    } catch (error) {
      const errorResult: ConversionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
      };
      setResult(errorResult);
      trackError(
        error instanceof Error ? error : new Error(String(error)),
        emlInput.length
      );
    } finally {
      setIsProcessing(false);
    }
  }, [emlInput, sanitizeHtml, convertCid, trackUse, trackError]);

  // Auto-process on input change (debounced)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (emlInput.trim()) {
        processEml();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [emlInput, processEml]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEmlInput(content);
    };
    reader.readAsText(file);
  };

  // Handle file from drop or input
  const loadFile = (file: File) => {
    if (!file.name.match(/\.(eml|txt)$/i)) {
      showToast('Only .eml and .txt files are supported');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setEmlInput(e.target?.result as string);
    reader.readAsText(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  // Copy to clipboard with toast
  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast(`${label} copied to clipboard`);
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  // Download file helper
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download binary attachment
  const downloadAttachment = (content: string, filename: string, contentType: string, encoding: string) => {
    try {
      let blob: Blob;
      if (encoding.toLowerCase() === 'base64') {
        const cleaned = content.replace(/\s/g, '');
        const binary = atob(cleaned);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: contentType });
      } else {
        blob = new Blob([content], { type: contentType });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    } catch {
      showToast(`Failed to download ${filename}`);
    }
  };

  const exportHeaders = () => {
    if (!result?.parsedEmail) return;
    const json = exportHeadersAsJson(result.parsedEmail);
    downloadFile(json, 'email-headers.json', 'application/json');
  };

  const downloadHtml = () => {
    if (!result?.html) return;
    downloadFile(result.html, 'email.html', 'text/html');
  };

  const emailSummary = useMemo(() => {
    if (!result?.parsedEmail) return null;
    return getEmailSummary(result.parsedEmail);
  }, [result?.parsedEmail]);

  // Render current view
  const renderView = () => {
    if (!result) return null;

    switch (viewMode) {
      case 'raw':
        return (
          <div className="relative">
            <Textarea
              value={result.rawView || ''}
              readOnly
              className="min-h-[500px] resize-none font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute right-2 top-2"
              onClick={() => copyToClipboard(result.rawView || '', 'Raw EML')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        );

      case 'rendered':
        return (
          <div>
            {/* Responsive preview toggle */}
            <div className="mb-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
              {([
                { size: 'desktop' as PreviewSize, icon: Monitor, label: 'Desktop' },
                { size: 'tablet' as PreviewSize, icon: Tablet, label: 'Tablet' },
                { size: 'mobile' as PreviewSize, icon: Smartphone, label: 'Mobile' },
              ]).map(({ size, icon: Icon, label }) => (
                <button
                  key={size}
                  onClick={() => setPreviewSize(size)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewSize === size
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div
              className="mx-auto overflow-auto rounded-lg border bg-white transition-all duration-300"
              style={{ maxWidth: PREVIEW_WIDTHS[previewSize] }}
            >
              <div
                className="prose prose-sm max-w-none p-4"
                dangerouslySetInnerHTML={{ __html: result.html || '' }}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(result.html || '', 'HTML')}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy HTML
              </Button>
              <Button size="sm" variant="outline" onClick={downloadHtml}>
                <Download className="mr-2 h-4 w-4" />
                Download HTML
              </Button>
            </div>
          </div>
        );

      case 'headers':
        return (
          <div>
            <div className="min-h-[300px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2 text-left font-medium w-48">Header</th>
                    <th className="px-4 py-2 text-left font-medium">Value</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {result.parsedEmail?.headers.map((header, i) => {
                    const isAuth = ['dkim-signature', 'received-spf', 'authentication-results'].includes(header.name.toLowerCase());
                    return (
                      <tr key={i} className={`border-b ${isAuth ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-2 font-medium text-gray-700 align-top">{header.name}</td>
                        <td className="px-4 py-2 break-all text-gray-600">{header.value}</td>
                        <td className="px-2 py-2 align-top">
                          <button
                            onClick={() => copyToClipboard(header.value, header.name)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title={`Copy ${header.name} value`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={exportHeaders}>
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
            </div>
          </div>
        );

      case 'links':
        return (
          <div>
            {result.links && result.links.length > 0 ? (
              <div className="overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-2 text-left font-medium">Text</th>
                      <th className="px-4 py-2 text-left font-medium">URL</th>
                      <th className="px-4 py-2 text-left font-medium w-24">Type</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.links.map((link, i) => (
                      <tr key={i} className={`border-b ${link.isTracking ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-2 max-w-[200px] truncate">{link.text}</td>
                        <td className="px-4 py-2 max-w-[400px] truncate text-blue-600 font-mono text-xs">
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {link.url}
                          </a>
                        </td>
                        <td className="px-4 py-2">
                          {link.isTracking ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 text-xs">
                              <Eye className="mr-1 h-3 w-3" />
                              Tracking
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">Normal</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => copyToClipboard(link.url, 'URL')}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Copy URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">No links found in this email</div>
            )}
            {result.links && result.links.length > 0 && (
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>Total: {result.links.length}</span>
                <span>Tracking: {result.links.filter(l => l.isTracking).length}</span>
                <span>Normal: {result.links.filter(l => !l.isTracking).length}</span>
              </div>
            )}
          </div>
        );

      case 'source':
        return (
          <div className="relative">
            <Textarea
              value={result.sourceView || ''}
              readOnly
              className="min-h-[500px] resize-none font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute right-2 top-2"
              onClick={() => copyToClipboard(result.sourceView || '', 'HTML Source')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Input Section with Drag & Drop */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="eml-input">EML Content</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".eml,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload EML
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEmlInput(''); setResult(null); }}
              >
                Clear
              </Button>
            </div>
          </div>

          <div
            className={`relative rounded-lg transition-colors ${
              isDragging ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-blue-50/90 border-2 border-dashed border-blue-400">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-blue-700">Drop .eml file here</p>
                </div>
              </div>
            )}
            <Textarea
              id="eml-input"
              placeholder="Paste EML content here, upload a file, or drag & drop an .eml file..."
              value={emlInput}
              onChange={(e) => setEmlInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Options - removed Include Headers (was non-functional) */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sanitize"
                checked={sanitizeHtml}
                onChange={(e) => setSanitizeHtml(e.target.checked)}
              />
              <Label htmlFor="sanitize" className="cursor-pointer text-sm">
                Sanitize HTML (Remove scripts)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="convert-cid"
                checked={convertCid}
                onChange={(e) => setConvertCid(e.target.checked)}
              />
              <Label htmlFor="convert-cid" className="cursor-pointer text-sm">
                Convert inline images
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Summary */}
      {emailSummary && result?.success && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950 dark:to-indigo-950">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Mail className="h-5 w-5" />
                Email Summary
              </h3>
              <div className="flex gap-2">
                {emailSummary.hasAuthentication && (
                  <Badge variant="outline" className="bg-green-100">
                    <Shield className="mr-1 h-3 w-3" />
                    Authenticated
                  </Badge>
                )}
                {emailSummary.hasTracking && (
                  <Badge variant="outline" className="bg-yellow-100">
                    <Eye className="mr-1 h-3 w-3" />
                    Tracking
                  </Badge>
                )}
                {emailSummary.hasAttachments && (
                  <Badge variant="outline">
                    <Paperclip className="mr-1 h-3 w-3" />
                    {emailSummary.attachmentCount} Attachment
                    {emailSummary.attachmentCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="font-semibold">From:</span> {emailSummary.from}
              </div>
              <div>
                <span className="font-semibold">To:</span>{' '}
                {emailSummary.to.join(', ')}
              </div>
              <div>
                <span className="font-semibold">Subject:</span>{' '}
                {emailSummary.subject}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {emailSummary.date}
              </div>
              {emailSummary.client && (
                <div>
                  <span className="font-semibold">Client:</span>{' '}
                  {emailSummary.client}
                </div>
              )}
              {emailSummary.template && (
                <div>
                  <span className="font-semibold">Template:</span>{' '}
                  {emailSummary.template}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Warnings */}
      {result?.warnings && result.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {result?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {/* Attachments with download */}
      {result?.parsedEmail?.attachments &&
        result.parsedEmail.attachments.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Paperclip className="h-5 w-5" />
              Attachments ({result.parsedEmail.attachments.length})
            </h3>
            <div className="space-y-2">
              {result.parsedEmail.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{attachment.filename}</div>
                      <div className="text-sm text-gray-500">
                        {attachment.contentType} •{' '}
                        {attachment.size >= 1024 * 1024
                          ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(attachment.size / 1024).toFixed(1)} KB`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{attachment.encoding}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadAttachment(
                          attachment.content,
                          attachment.filename,
                          attachment.contentType,
                          attachment.encoding
                        )
                      }
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Inline Images */}
      {result?.parsedEmail?.inlineImages &&
        result.parsedEmail.inlineImages.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ImageIcon className="h-5 w-5" />
              Inline Images ({result.parsedEmail.inlineImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {result.parsedEmail.inlineImages.map((image, index) => (
                <div key={index} className="rounded-lg border p-2">
                  <div className="mb-1 truncate text-xs text-gray-500">
                    {image.filename}
                  </div>
                  <div className="text-xs text-gray-400">
                    {image.contentType}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* View Tabs - now 5 tabs including Links */}
      {result?.success && (
        <Card className="p-6">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="rendered">
                <Eye className="mr-2 h-4 w-4" />
                Rendered
              </TabsTrigger>
              <TabsTrigger value="source">
                <Code className="mr-2 h-4 w-4" />
                Source
              </TabsTrigger>
              <TabsTrigger value="headers">
                <Table className="mr-2 h-4 w-4" />
                Headers
              </TabsTrigger>
              <TabsTrigger value="links">
                <Link2 className="mr-2 h-4 w-4" />
                Links
                {result.links && result.links.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {result.links.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="raw">
                <FileText className="mr-2 h-4 w-4" />
                Raw
              </TabsTrigger>
            </TabsList>

            <TabsContent value={viewMode} className="mt-4">
              {renderView()}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Help Text */}
      {!emlInput && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Upload an EML file, paste email content, or drag & drop a file to get started.
            Supports RFC822/2822 format from Outlook, Thunderbird, Apple Mail, and other email clients.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
