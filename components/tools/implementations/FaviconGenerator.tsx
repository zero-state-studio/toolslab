'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Link,
  Type,
  Smile,
  Download,
  Copy,
  Package,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Settings,
  Palette,
  Image as ImageIcon,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import {
  DEFAULT_FAVICON_OPTIONS,
  FAVICON_SIZES,
  type FaviconOptions,
  type GeneratedFavicon,
  type FaviconPackage,
  loadImageFromFile,
  loadImageFromUrl,
  formatFileSize,
  downloadBlob,
  generateWebManifest,
  generateBrowserConfig,
  generateHtmlCode,
} from '@/lib/tools/favicon';
import { BaseToolProps } from '@/lib/types/tools';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';

interface FaviconGeneratorProps extends BaseToolProps {}

export default function FaviconGenerator({
  categoryColor,
  initialInput,
  onInputChange,
  onOutputChange,
}: FaviconGeneratorProps) {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [options, setOptions] = useState<FaviconOptions>(
    DEFAULT_FAVICON_OPTIONS
  );
  const [generatedFavicons, setGeneratedFavicons] = useState<
    GeneratedFavicon[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('TL');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('#6366f1');
  const [selectedEmoji, setSelectedEmoji] = useState('🚀');

  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const { trackError, trackCustom } = useToolTracking('favicon-generator');
  const { addToHistory } = useToolStore();

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/workers/favicon-worker.js');

    workerRef.current.onmessage = (e) => {
      const { type, data, error } = e.data;

      if (error) {
        toast.error(`Processing error: ${error}`);
        setIsGenerating(false);
        trackError(new Error(error), 0);
        return;
      }

      switch (type) {
        case 'PROCESS_COMPLETE':
          handleProcessingComplete(data);
          break;
        case 'TEXT_FAVICON_COMPLETE':
        case 'EMOJI_FAVICON_COMPLETE':
          handleTextEmojiComplete(data);
          break;
        case 'MONOCHROME_COMPLETE':
          // Handle monochrome completion if needed
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const image = await loadImageFromFile(file);
      setSourceImage(image);
      setImagePreview(URL.createObjectURL(file));
      toast.success('Image loaded successfully!');
    } catch (error) {
      toast.error('Failed to load image');
      trackError(
        error instanceof Error ? error : new Error('Failed to load image'),
        file.size
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
    },
    multiple: false,
  });

  // Load image from URL
  const handleLoadFromUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      const image = await loadImageFromUrl(urlInput);
      setSourceImage(image);
      setImagePreview(urlInput);
      toast.success('Image loaded from URL!');
    } catch (error) {
      toast.error('Failed to load image from URL');
      trackError(
        error instanceof Error
          ? error
          : new Error('Failed to load image from URL'),
        urlInput.length
      );
    }
  };

  // Create text favicon
  const handleCreateTextFavicon = async () => {
    if (!workerRef.current) return;

    setIsGenerating(true);

    workerRef.current.postMessage({
      type: 'CREATE_TEXT_FAVICON',
      data: {
        text: textInput,
        size: 512,
        options: {
          textColor,
          backgroundColor: textBgColor,
          fontFamily: 'Arial, sans-serif',
        },
      },
    });
  };

  // Create emoji favicon
  const handleCreateEmojiFavicon = async () => {
    if (!workerRef.current) return;

    setIsGenerating(true);

    workerRef.current.postMessage({
      type: 'CREATE_EMOJI_FAVICON',
      data: {
        emoji: selectedEmoji,
        size: 512,
      },
    });
  };

  // Handle text/emoji favicon completion
  const handleTextEmojiComplete = async (data: {
    blob: Blob;
    size: number;
  }) => {
    try {
      const image = new Image();
      const url = URL.createObjectURL(data.blob);

      image.onload = () => {
        setSourceImage(image);
        setImagePreview(url);
        setIsGenerating(false);
        toast.success('Favicon created successfully!');
      };

      image.src = url;
    } catch (error) {
      toast.error('Failed to create favicon');
      setIsGenerating(false);
      trackError(
        error instanceof Error ? error : new Error('Failed to create favicon'),
        data.size
      );
    }
  };

  // Generate all favicons
  const handleGenerate = async () => {
    if (!sourceImage || !workerRef.current) {
      toast.error('Please select or create an image first');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    try {
      // Create canvas and get image data
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(sourceImage, 0, 0, 512, 512);
      const imageData = canvas.toDataURL();

      workerRef.current.postMessage({
        type: 'PROCESS_IMAGE',
        data: {
          imageData,
          sizes: FAVICON_SIZES,
          options,
        },
      });
    } catch (error) {
      toast.error('Failed to start processing');
      setIsGenerating(false);
      trackError(
        error instanceof Error
          ? error
          : new Error('Failed to start processing'),
        0
      );
    }
  };

  // Handle processing completion
  const handleProcessingComplete = async (results: any[]) => {
    const favicons: GeneratedFavicon[] = [];

    for (const result of results) {
      const dataUrl = URL.createObjectURL(result.blob);
      favicons.push({
        ...result,
        dataUrl,
      });
    }

    setGeneratedFavicons(favicons);
    setIsGenerating(false);
    setProgress(100);
    toast.success(`Generated ${favicons.length} favicon files!`);

    // Track successful generation with custom metadata
    const totalSize = favicons.reduce((sum, f) => sum + f.size, 0);

    // Analytics auto-tracking (no base64 stored)
    const sourceSummary =
      activeTab === 'upload'
        ? 'image upload'
        : activeTab === 'url'
          ? 'image url'
          : activeTab === 'text'
            ? `text: ${textInput}`
            : activeTab === 'emoji'
              ? `emoji: ${selectedEmoji}`
              : activeTab;
    const sizesSummary = favicons.map((f) => f.dimensions).join(',');
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'favicon-generator',
      input: sourceSummary,
      output: `favicons generated: ${sizesSummary}`,
      timestamp: startTimeRef.current ?? Date.now(),
    });

    trackCustom({
      event: 'tool.use',
      tool: 'favicon-generator',
      inputSize: 0,
      outputSize: totalSize,
      success: true,
      metadata: {
        count: favicons.length,
        totalSize,
        sourceType: activeTab,
      },
    });
  };

  // Download individual favicon
  const handleDownloadFavicon = (favicon: GeneratedFavicon) => {
    downloadBlob(favicon.blob, favicon.filename);
    toast.success(`Downloaded ${favicon.filename}`);
  };

  // Download all as ZIP
  const handleDownloadAll = async () => {
    if (generatedFavicons.length === 0) return;

    try {
      const zip = new JSZip();

      // Add all favicon files to ZIP
      for (const favicon of generatedFavicons) {
        zip.file(favicon.filename, favicon.blob);
      }

      // Add manifest files
      const manifest = generateWebManifest(
        options.themeColor,
        options.backgroundColor
      );
      zip.file('site.webmanifest', manifest);

      const browserconfig = generateBrowserConfig(options.themeColor);
      zip.file('browserconfig.xml', browserconfig);

      // Add HTML instructions
      const htmlCode = generateHtmlCode(options.themeColor);
      const instructions = `# Favicon Installation Instructions

## 1. Upload Files
Upload all the favicon files to the root directory of your website.

## 2. Add HTML Code
Add the following code to the <head> section of your HTML:

${htmlCode}

## 3. File List
The following files are included in this package:

${generatedFavicons.map((f) => `- ${f.filename} (${f.dimensions}) - ${f.description}`).join('\n')}
- site.webmanifest - Web app manifest for PWA support
- browserconfig.xml - Windows tile configuration

## 4. Verification
After uploading, you can verify your favicon by:
1. Visiting your website and checking the browser tab
2. Adding your site to home screen on mobile devices
3. Using online favicon checkers

Generated with ❤️ by ToolsLab
`;

      zip.file('README.txt', instructions);

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'favicon-package.zip');

      toast.success('Downloaded complete favicon package!');
    } catch (error) {
      toast.error('Failed to create ZIP file');
    }
  };

  // Copy HTML code
  const handleCopyHtml = () => {
    const htmlCode = generateHtmlCode(options.themeColor);
    navigator.clipboard.writeText(htmlCode);
    toast.success('HTML code copied to clipboard!');
  };

  const totalSize = generatedFavicons.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Source Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="emoji" className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Emoji
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the image here...</p>
                ) : (
                  <div>
                    <p className="mb-2 text-lg">Drag & drop an image here</p>
                    <p className="mb-4 text-gray-500">
                      or click to select files
                    </p>
                    <Button variant="outline">Choose Image</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleLoadFromUrl}>Load</Button>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="text-input">Text/Initials</Label>
                  <Input
                    id="text-input"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value.slice(0, 3))}
                    placeholder="TL"
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text-bg-color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-bg-color"
                      type="color"
                      value={textBgColor}
                      onChange={(e) => setTextBgColor(e.target.value)}
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={textBgColor}
                      onChange={(e) => setTextBgColor(e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateTextFavicon} disabled={isGenerating}>
                {isGenerating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Text Favicon
              </Button>
            </TabsContent>

            <TabsContent value="emoji" className="space-y-4">
              <div className="flex items-end gap-4">
                <div>
                  <Label htmlFor="emoji-input">Emoji</Label>
                  <Input
                    id="emoji-input"
                    value={selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value.slice(-2))}
                    placeholder="🚀"
                    className="w-20 text-center text-2xl"
                  />
                </div>
                <Button
                  onClick={handleCreateEmojiFavicon}
                  disabled={isGenerating}
                >
                  {isGenerating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Emoji Favicon
                </Button>
              </div>

              {/* Popular emojis */}
              <div>
                <Label>Popular Emojis</Label>
                <div className="mt-2 grid grid-cols-8 gap-2">
                  {[
                    '🚀',
                    '⭐',
                    '🎯',
                    '🔥',
                    '💎',
                    '🌟',
                    '⚡',
                    '🎨',
                    '🛠️',
                    '📱',
                    '💻',
                    '🌐',
                    '🔒',
                    '⚙️',
                    '📊',
                    '🎪',
                  ].map((emoji) => (
                    <Button
                      key={emoji}
                      variant={selectedEmoji === emoji ? 'default' : 'outline'}
                      className="h-12 p-2 text-xl"
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview & Options */}
      {sourceImage && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <img
                      src={imagePreview}
                      alt="Favicon preview"
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                </div>

                {/* Device mockups */}
                <div className="space-y-3">
                  <Label>How it appears:</Label>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="mb-2 rounded border bg-white p-2 dark:bg-gray-900">
                        <div className="flex items-center gap-1 text-xs">
                          <img
                            src={imagePreview}
                            className="h-4 w-4"
                            alt=""
                            width="16"
                            height="16"
                          />
                          <span>ToolsLab</span>
                        </div>
                      </div>
                      <span className="text-gray-600">Browser Tab</span>
                    </div>

                    <div className="text-center">
                      <div className="mb-2 rounded-lg bg-black p-2">
                        <img
                          src={imagePreview}
                          className="mx-auto h-8 w-8 rounded-lg"
                          alt=""
                        />
                      </div>
                      <span className="text-gray-600">iOS Home</span>
                    </div>

                    <div className="text-center">
                      <div className="mb-2 rounded bg-blue-500 p-2">
                        <img
                          src={imagePreview}
                          className="mx-auto h-8 w-8 rounded"
                          alt=""
                        />
                      </div>
                      <span className="text-gray-600">Android</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Padding: {options.padding}px</Label>
                <Slider
                  value={[options.padding]}
                  onValueChange={([value]) =>
                    setOptions((prev) => ({ ...prev, padding: value }))
                  }
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Border Radius: {options.borderRadius}px</Label>
                <Slider
                  value={[options.borderRadius]}
                  onValueChange={([value]) =>
                    setOptions((prev) => ({ ...prev, borderRadius: value }))
                  }
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Background</Label>
                <Tabs
                  value={options.backgroundType}
                  onValueChange={(value: any) =>
                    setOptions((prev) => ({ ...prev, backgroundType: value }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="transparent">None</TabsTrigger>
                    <TabsTrigger value="solid">Solid</TabsTrigger>
                    <TabsTrigger value="gradient">Gradient</TabsTrigger>
                  </TabsList>

                  <TabsContent value="solid" className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={options.backgroundColor}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            backgroundColor: e.target.value,
                          }))
                        }
                        className="h-10 w-16 p-1"
                      />
                      <Input
                        value={options.backgroundColor}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            backgroundColor: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="gradient" className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={options.gradientStart}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            gradientStart: e.target.value,
                          }))
                        }
                        className="h-10 w-16 p-1"
                      />
                      <Input
                        value={options.gradientStart || '#6366f1'}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            gradientStart: e.target.value,
                          }))
                        }
                        placeholder="Start color"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={options.gradientEnd}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            gradientEnd: e.target.value,
                          }))
                        }
                        className="h-10 w-16 p-1"
                      />
                      <Input
                        value={options.gradientEnd || '#8b5cf6'}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            gradientEnd: e.target.value,
                          }))
                        }
                        placeholder="End color"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Label>Theme Color</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    type="color"
                    value={options.themeColor}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        themeColor: e.target.value,
                      }))
                    }
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={options.themeColor}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        themeColor: e.target.value,
                      }))
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <Label>Quality: {options.compressionQuality}%</Label>
                <Slider
                  value={[options.compressionQuality]}
                  onValueChange={([value]) =>
                    setOptions((prev) => ({
                      ...prev,
                      compressionQuality: value,
                    }))
                  }
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Button */}
      {sourceImage && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="min-w-48"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-5 w-5" />
                    Generate Favicon Package
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {generatedFavicons.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Generated Files ({generatedFavicons.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleCopyHtml} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
                <Button onClick={handleDownloadAll}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Total size: {formatFileSize(totalSize)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedFavicons.map((favicon, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                      <img
                        src={favicon.dataUrl}
                        alt={favicon.name}
                        className="h-8 w-8"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="truncate text-sm font-medium">
                          {favicon.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {favicon.dimensions}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-gray-600">
                        {favicon.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(favicon.size)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFavicon(favicon)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                    {favicon.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
