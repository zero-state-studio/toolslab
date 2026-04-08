'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Download,
  Copy,
  Check,
  AlertCircle,
  Info,
  Zap,
  RotateCw,
  Palette,
  Ruler,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = {
  bw:          { barColor: '#000000', backgroundColor: '#ffffff', textColor: '#000000' },
  wb:          { barColor: '#ffffff', backgroundColor: '#000000', textColor: '#ffffff' },
  transparent: { barColor: '#000000', backgroundColor: 'transparent', textColor: '#000000' },
} as const;

import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  generateBarcode,
  generateBarcodeSVG,
  validateBarcodeInput,
  getFormatsByCategory,
  getFormatMetadata,
  calculateChecksum,
  downloadBarcode,
  downloadSVG,
  getOptimalDimensions,
  getCharacterLimit,
  type BarcodeFormat,
  type BarcodeOptions,
  type FormatMetadata,
  type CharacterLimit,
} from '@/lib/tools/barcode-generator';

export default function BarcodeGenerator() {
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // State
  const [format, setFormat] = useState<BarcodeFormat>('code128');
  const [value, setValue] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'bw' | 'wb' | 'transparent' | null>(null);

  // Customization options
  const [includeText, setIncludeText] = useState(true);
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(15);
  const [scale, setScale] = useState(3);
  const [textSize, setTextSize] = useState(16); // Increased from 10 to 16 for readability
  const [paddingWidth, setPaddingWidth] = useState(10);
  const [paddingHeight, setPaddingHeight] = useState(10);
  const [rotation, setRotation] = useState<'N' | 'R' | 'L' | 'I'>('N');
  const [barColor, setBarColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [useColors, setUseColors] = useState(false);

  // Error correction level for QR codes
  const [eclevel, setEclevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  // Active tab for customization options
  const [activeTab, setActiveTab] = useState('appearance');

  // Get formats grouped by category
  const formatsByCategory = useMemo(() => getFormatsByCategory(), []);

  // Get current format metadata
  const currentMetadata = useMemo(() => getFormatMetadata(format), [format]);

  // Validate input in real-time
  const validation = useMemo(() => {
    if (!value) return { valid: true };
    return validateBarcodeInput(format, value);
  }, [format, value]);

  // Update dimensions when format changes
  useEffect(() => {
    const optimalDims = getOptimalDimensions(format);
    setBarWidth(optimalDims.width);
    setBarHeight(optimalDims.height);
    setScale(optimalDims.scale);
  }, [format]);

  // Generate barcode
  const handleGenerate = async () => {
    if (!value) {
      setError('Please enter a value to encode');
      return;
    }

    if (!validation.valid) {
      setError(validation.error || 'Invalid input');
      return;
    }

    setGenerating(true);
    setError(null);

    const startTime = Date.now();

    const options: BarcodeOptions = {
      format,
      value,
      width: barWidth,
      height: barHeight,
      scale,
      includetext: includeText,
      textsize: textSize,
      paddingwidth: paddingWidth,
      paddingheight: paddingHeight,
      rotate: rotation,
      monochrome: !useColors,
    };

    // Add color options if enabled
    if (useColors) {
      options.barcolor = barColor.replace('#', '');
      options.backgroundcolor = backgroundColor.replace('#', '');
      options.textcolor = textColor.replace('#', '');
    }

    // Add QR code specific options
    if (format === 'qrcode') {
      options.eclevel = eclevel;
    }

    const result = await generateBarcode(options);

    setGenerating(false);

    if (result.success && result.dataUrl) {
      setBarcodeDataUrl(result.dataUrl);

      // Generate SVG in parallel (non-blocking)
      generateBarcodeSVG(options).then((svgResult) => {
        if (svgResult.success && svgResult.svgString) {
          setSvgString(svgResult.svgString);
        }
      });

      if (isHydrated) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'barcode-generator',
          input: value,
          output: result.dataUrl.substring(0, 100) + '...',
          timestamp: startTime,
        });
      }
      setTimeout(() => scrollToResult(), 100);
    } else {
      setError(result.error || 'Failed to generate barcode');
      setBarcodeDataUrl(null);
      setSvgString(null);
    }
  };

  // Auto-update barcode using ref pattern to avoid stale closures
  const handleGenerateRef = useRef(handleGenerate);
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  }, [handleGenerate]);

  useEffect(() => {
    if (!value || !validation.valid) {
      setBarcodeDataUrl(null);
      setSvgString(null);
      return;
    }
    const timer = setTimeout(() => {
      handleGenerateRef.current();
    }, 600);
    return () => clearTimeout(timer);
  }, [value, format, validation.valid, includeText, barWidth, barHeight, scale,
      textSize, paddingWidth, paddingHeight, rotation, barColor, backgroundColor,
      textColor, useColors, eclevel]);

  // Download barcode
  const handleDownload = (outputFormat: 'png' | 'jpeg' = 'png') => {
    if (!barcodeDataUrl) return;

    const filename = `barcode-${format}-${Date.now()}`;
    downloadBarcode(barcodeDataUrl, filename, outputFormat);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!barcodeDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(barcodeDataUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePreset = (preset: 'bw' | 'wb' | 'transparent') => {
    const p = COLOR_PRESETS[preset];
    setBarColor(p.barColor);
    setBackgroundColor(p.backgroundColor);
    setTextColor(p.textColor);
    setUseColors(true);
    setActivePreset(preset);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgString) return;
    downloadSVG(svgString, `barcode-${format}-${Date.now()}`);
  };

  // Print barcode
  const handlePrint = () => {
    if (!barcodeDataUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument!.write(
      `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
       <img src="${barcodeDataUrl}" style="max-width:100%;" />
       </body></html>`
    );
    iframe.contentDocument!.close();
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  // Calculate checksum if supported
  const checksum = useMemo(() => {
    if (!value || !currentMetadata?.hasChecksum) return null;
    return calculateChecksum(format, value);
  }, [value, format, currentMetadata]);

  const charLimit = useMemo(() => getCharacterLimit(format), [format]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Format Selection */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="format" className="text-base font-semibold">
                    Barcode Format
                  </Label>
                  <p className="mb-3 text-sm text-gray-500">
                    Select the type of barcode you want to generate
                  </p>
                </div>
                {currentMetadata && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFormatInfo(!showFormatInfo)}
                    className="shrink-0"
                  >
                    <Info className="mr-1 h-4 w-4" />
                    Info
                    {showFormatInfo ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              <Select
                value={format}
                onValueChange={(value) => setFormat(value as BarcodeFormat)}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formatsByCategory).map(([category, formats]) =>
                    formats.length > 0 ? (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          {category} Barcodes
                        </div>
                        {formats.map((fmt: FormatMetadata) => (
                          <SelectItem key={fmt.id} value={fmt.id}>
                            <div className="flex w-full items-center justify-between">
                              <span>{fmt.name}</span>
                              <span className="ml-2 hidden text-xs text-gray-400 sm:inline">
                                {fmt.charSet}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ) : null
                  )}
                </SelectContent>
              </Select>

              {/* Format Info - Collapsible */}
              {showFormatInfo && currentMetadata && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {currentMetadata.name}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentMetadata.description}
                    </p>
                    <div className="space-y-1 border-t border-blue-200 pt-2 text-xs text-blue-700 dark:border-blue-700 dark:text-blue-300">
                      <p>
                        <strong>Character Set:</strong> {currentMetadata.charSet}
                      </p>
                      {currentMetadata.fixedLength && (
                        <p>
                          <strong>Length:</strong> {currentMetadata.fixedLength}{' '}
                          characters (fixed)
                        </p>
                      )}
                      {currentMetadata.minLength && currentMetadata.maxLength && (
                        <p>
                          <strong>Length:</strong> {currentMetadata.minLength}-
                          {currentMetadata.maxLength} characters
                        </p>
                      )}
                      <p>
                        <strong>Checksum:</strong>{' '}
                        {currentMetadata.hasChecksum
                          ? 'Auto-calculated'
                          : 'Not required'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Input */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="value" className="text-base font-semibold">
                  Data to Encode
                </Label>
                <p className="mb-3 text-sm text-gray-500">
                  Enter the data you want to encode in the barcode
                </p>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter ${currentMetadata?.name || 'barcode'} data...`}
                  className={cn(
                    'font-mono',
                    !validation.valid && value && 'border-red-500'
                  )}
                />
                {/* Character counter row */}
                <div className="flex items-center justify-between text-xs mt-2">
                  {!validation.valid && value ? (
                    <span className="text-destructive text-xs">{validation.error}</span>
                  ) : (
                    <span />
                  )}
                  {charLimit ? (
                    charLimit.fixed ? (
                      <span className={cn(
                        'font-mono',
                        value.length === charLimit.fixed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}>
                        {value.length} / {charLimit.fixed}
                      </span>
                    ) : (
                      <span className={cn(
                        'font-mono',
                        value.length > (charLimit.max ?? Infinity) ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {value.length} / {charLimit.max}
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-muted-foreground">
                      {value.length} chars
                    </span>
                  )}
                </div>
              </div>

              {/* Checksum Display */}
              {checksum && validation.valid && checksum !== 'Auto-calculated' && (
                <div className="text-sm">
                  <span className="font-medium">Calculated Checksum:</span>{' '}
                  <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">
                    {checksum}
                  </code>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Customization Options — always visible */}
          <Card className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Customize Barcode</h3>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
                <TabsTrigger value="size">
                  <Ruler className="mr-1 h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Size</span>
                  <span className="sm:hidden">Size</span>
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <Palette className="mr-1 h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Colors</span>
                  <span className="sm:hidden">Color</span>
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="col-span-2 sm:col-span-1"
                >
                  <Zap className="mr-1 h-4 w-4 sm:mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Size Options */}
              <TabsContent value="size" className="mt-4 space-y-4">
                {![
                  'qrcode',
                  'datamatrix',
                  'pdf417',
                  'azteccode',
                  'maxicode',
                ].includes(format) && (
                  <div>
                    <Label>Bar Width: {barWidth}x</Label>
                    <Slider
                      value={[barWidth]}
                      onValueChange={(v) => setBarWidth(v[0])}
                      min={1}
                      max={8}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label>
                    Height: {barHeight} modules (~{barHeight * scale}px)
                  </Label>
                  <Slider
                    value={[barHeight]}
                    onValueChange={(v) => setBarHeight(v[0])}
                    min={10}
                    max={60}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Scale: {scale}x</Label>
                  <Slider
                    value={[scale]}
                    onValueChange={(v) => setScale(v[0])}
                    min={2}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Padding Width: {paddingWidth}px</Label>
                    <Slider
                      value={[paddingWidth]}
                      onValueChange={(v) => setPaddingWidth(v[0])}
                      min={0}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Padding Height: {paddingHeight}px</Label>
                    <Slider
                      value={[paddingHeight]}
                      onValueChange={(v) => setPaddingHeight(v[0])}
                      min={0}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Color Options */}
              <TabsContent value="appearance" className="mt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-colors"
                    checked={useColors}
                    onCheckedChange={setUseColors}
                  />
                  <Label htmlFor="use-colors">Enable custom colors</Label>
                </div>

                {useColors && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bar-color" className="text-xs sm:text-sm">
                        Bar Color
                      </Label>
                      <Input
                        id="bar-color"
                        type="color"
                        value={barColor}
                        onChange={(e) => setBarColor(e.target.value)}
                        className="mt-2 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bg-color" className="text-xs sm:text-sm">
                        Background
                      </Label>
                      <Input
                        id="bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="mt-2 h-10"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="text-color"
                        className="text-xs sm:text-sm"
                      >
                        Text Color
                      </Label>
                      <Input
                        id="text-color"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="mt-2 h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-text"
                    checked={includeText}
                    onCheckedChange={setIncludeText}
                  />
                  <Label htmlFor="include-text">Show text below barcode</Label>
                </div>

                {includeText && (
                  <div>
                    <Label>Text Size: {textSize}pt</Label>
                    <Slider
                      value={[textSize]}
                      onValueChange={(v) => setTextSize(v[0])}
                      min={10}
                      max={28}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Advanced Options */}
              <TabsContent value="advanced" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="rotation">Rotation</Label>
                  <Select
                    value={rotation}
                    onValueChange={(v) =>
                      setRotation(v as 'N' | 'R' | 'L' | 'I')
                    }
                  >
                    <SelectTrigger id="rotation" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">Normal (0°)</SelectItem>
                      <SelectItem value="R">Right (90°)</SelectItem>
                      <SelectItem value="L">Left (270°)</SelectItem>
                      <SelectItem value="I">Inverted (180°)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {format === 'qrcode' && (
                  <div>
                    <Label htmlFor="eclevel">Error Correction Level</Label>
                    <Select
                      value={eclevel}
                      onValueChange={(v) =>
                        setEclevel(v as 'L' | 'M' | 'Q' | 'H')
                      }
                    >
                      <SelectTrigger id="eclevel" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-gray-500">
                      Higher levels allow the code to be read even if partially
                      damaged
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* RIGHT COLUMN — sticky preview */}
        <div className="lg:sticky lg:top-6 lg:self-start" ref={resultRef}>
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Generated Barcode</h3>
                {barcodeDataUrl && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex-1 sm:flex-none"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload('png')}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload('jpeg')}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      JPEG
                    </Button>
                  </div>
                )}
              </div>

              {/* Barcode Preview */}
              <div className="flex items-center justify-center overflow-x-auto rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 sm:p-8 min-h-[160px]">
                {barcodeDataUrl ? (
                  <img
                    src={barcodeDataUrl}
                    alt={`${currentMetadata?.name || 'Barcode'} - ${value}`}
                    className="h-auto max-w-full"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter data to generate a barcode
                  </p>
                )}
              </div>

              {/* Barcode Info */}
              {barcodeDataUrl && (
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Format:</strong> {currentMetadata?.name}
                  </p>
                  <p className="break-all">
                    <strong>Value:</strong>{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                      {value}
                    </code>
                  </p>
                  {checksum && checksum !== 'Auto-calculated' && (
                    <p>
                      <strong>Checksum:</strong>{' '}
                      <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                        {checksum}
                      </code>
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Use Cases — full width below grid */}
      {currentMetadata && currentMetadata.useCases.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20 sm:p-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Common Use Cases for {currentMetadata.name}
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
              {currentMetadata.useCases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
