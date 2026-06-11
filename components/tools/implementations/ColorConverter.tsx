'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Eye,
  Sun,
  Moon,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useHydration } from '@/lib/hooks/useHydration';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import {
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  hslToRgb,
  generateHarmony,
  generateTints,
  generateShades,
  checkWCAGCompliance,
  getClosestNamedColor,
  isValidColor,
  getColorValue,
  type ColorValue,
  type HarmonyType,
  type RGBColor,
} from '@/lib/tools/color-picker';

interface ColorConverterProps extends BaseToolProps {}

type PaletteType = 'harmony' | 'tints' | 'shades';

export default function ColorConverter({ categoryColor, dictionary }: ColorConverterProps) {
  const ui = dictionary?.tools?.['color-format-converter']?.ui ?? {};
  const { copy: copyToClipboard } = useCopy();
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();

  // Main state
  const [inputValue, setInputValue] = useState('');
  const [currentColor, setCurrentColor] = useState<ColorValue | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Color history
  const [colorHistory, setColorHistory] = useState<ColorValue[]>([]);

  // Palette state
  const [showPalette, setShowPalette] = useState(false);
  const [paletteType, setPaletteType] = useState<PaletteType>('harmony');
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary');
  const [palette, setPalette] = useState<ColorValue[]>([]);

  // Contrast state
  const [showContrast, setShowContrast] = useState(false);
  const [contrastBackground, setContrastBackground] = useState('#FFFFFF');

  // UI state
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const saved = localStorage.getItem('color-converter-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setColorHistory(parsed.slice(0, 15)); // Keep last 15
      }
    } catch (e) {
      console.error('Failed to load color history:', e);
    }
  }, [isHydrated]);

  // Save history to localStorage
  useEffect(() => {
    if (!isHydrated || colorHistory.length === 0) return;

    try {
      localStorage.setItem(
        'color-converter-history',
        JSON.stringify(colorHistory)
      );
    } catch (e) {
      console.error('Failed to save color history:', e);
    }
  }, [colorHistory, isHydrated]);

  // Process color on input change
  useEffect(() => {
    const processColor = () => {
      if (!inputValue.trim()) {
        setCurrentColor(null);
        setError('');
        return;
      }

      try {
        const rgb = parseColor(inputValue);
        if (!rgb) {
          setError('Invalid color format');
          setCurrentColor(null);
          return;
        }

        const colorValue = getColorValue(rgb);

        if (!colorValue) {
          setError('Failed to process color');
          setCurrentColor(null);
          return;
        }

        setCurrentColor(colorValue);
        setError('');

        // Add to history (avoid duplicates)
        setColorHistory((prev) => {
          const filtered = prev.filter((c) => c.hex !== colorValue.hex);
          return [colorValue, ...filtered].slice(0, 15);
        });

        // Track usage in analytics
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'color-format-converter',
          input: inputValue,
          output: JSON.stringify({
            hex: colorValue.hex,
            rgb: colorValue.rgb,
            hsl: colorValue.hsl,
          }),
          timestamp: Date.now(),
        });
      } catch (e) {
        setError('Failed to parse color');
        setCurrentColor(null);
      }
    };

    const timer = setTimeout(processColor, 300);
    return () => clearTimeout(timer);
  }, [inputValue, addToHistory]);

  // Generate palette
  useEffect(() => {
    if (!currentColor || !showPalette) return;

    try {
      let newPalette: ColorValue[] = [];

      if (paletteType === 'harmony') {
        newPalette = generateHarmony(currentColor, harmonyType);
      } else if (paletteType === 'tints') {
        newPalette = generateTints(currentColor, 5);
      } else if (paletteType === 'shades') {
        newPalette = generateShades(currentColor, 5);
      }

      setPalette(newPalette);
    } catch (e) {
      console.error('Failed to generate palette:', e);
    }
  }, [currentColor, showPalette, paletteType, harmonyType]);

  const handleCopy = useCallback(
    (text: string, format: string) => {
      copyToClipboard(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    },
    [copyToClipboard]
  );

  const handleClearHistory = useCallback(() => {
    setColorHistory([]);
    localStorage.removeItem('color-converter-history');
  }, []);

  const handleExport = useCallback(() => {
    if (!currentColor) return;

    const data = {
      color: currentColor,
      formats: {
        hex: currentColor.hex,
        rgb: `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`,
        rgba: `rgba(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b}, ${currentColor.rgb.a || 1})`,
        hsl: `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`,
        hsla: `hsla(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%, ${currentColor.hsl.a || 1})`,
        hsv: `hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`,
        cmyk: `cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`,
      },
      cssVariables: {
        '--primary-color': currentColor.hex,
      },
      scssVariables: {
        '$primary-color': currentColor.hex,
      },
      palette: palette.map((c) => c.hex),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-${currentColor.hex.replace('#', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentColor, palette]);

  const formatRgb = (rgb: RGBColor) =>
    rgb.a !== undefined && rgb.a < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a.toFixed(2)})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const formatHsl = (color: ColorValue) =>
    color.hsl.a !== undefined && color.hsl.a < 1
      ? `hsla(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%, ${color.hsl.a.toFixed(2)})`
      : `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;

  const contrastResult =
    currentColor && parseColor(contrastBackground)
      ? checkWCAGCompliance(currentColor.rgb, parseColor(contrastBackground)!)
      : null;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {ui.colorInputLabel || 'Color Input'}
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={ui.inputPlaceholder || 'Enter color (HEX, RGB, HSL, HSV, CMYK, or name)'}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          <input
            type="color"
            value={currentColor?.hex || '#3B82F6'}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-12 w-16 cursor-pointer rounded-lg border-2 border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Color Preview */}
      {currentColor && (
        <div className="rounded-lg border-2 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div
              className="h-24 w-24 rounded-lg shadow-lg ring-2 ring-gray-200 dark:ring-gray-700"
              style={{ backgroundColor: currentColor.hex }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentColor.name || ui.customColorName || 'Custom Color'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentColor.hex}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formats Output */}
      {currentColor && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ui.colorFormatsHeading || 'Color Formats'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* HEX */}
            <FormatCard
              label="HEX"
              value={currentColor.hex}
              onCopy={() => handleCopy(currentColor.hex, 'hex')}
              isCopied={copiedFormat === 'hex'}
              copyTitle={ui.copyToClipboard}
            />

            {/* RGB */}
            <FormatCard
              label="RGB"
              value={formatRgb(currentColor.rgb)}
              onCopy={() => handleCopy(formatRgb(currentColor.rgb), 'rgb')}
              isCopied={copiedFormat === 'rgb'}
              copyTitle={ui.copyToClipboard}
            />

            {/* HSL */}
            <FormatCard
              label="HSL"
              value={formatHsl(currentColor)}
              onCopy={() => handleCopy(formatHsl(currentColor), 'hsl')}
              isCopied={copiedFormat === 'hsl'}
              copyTitle={ui.copyToClipboard}
            />

            {/* HSV */}
            <FormatCard
              label="HSV/HSB"
              value={`hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`}
              onCopy={() =>
                handleCopy(
                  `hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`,
                  'hsv'
                )
              }
              isCopied={copiedFormat === 'hsv'}
              copyTitle={ui.copyToClipboard}
            />

            {/* CMYK */}
            <FormatCard
              label="CMYK"
              value={`cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`}
              onCopy={() =>
                handleCopy(
                  `cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`,
                  'cmyk'
                )
              }
              isCopied={copiedFormat === 'cmyk'}
              copyTitle={ui.copyToClipboard}
            />

            {/* CSS Variable */}
            <FormatCard
              label="CSS Variable"
              value={`--color: ${currentColor.hex}`}
              onCopy={() =>
                handleCopy(`--color: ${currentColor.hex}`, 'css-var')
              }
              isCopied={copiedFormat === 'css-var'}
              copyTitle={ui.copyToClipboard}
            />

            {/* SCSS Variable */}
            <FormatCard
              label="SCSS Variable"
              value={`$color: ${currentColor.hex}`}
              onCopy={() =>
                handleCopy(`$color: ${currentColor.hex}`, 'scss-var')
              }
              isCopied={copiedFormat === 'scss-var'}
              copyTitle={ui.copyToClipboard}
            />

            {/* Named Color */}
            {currentColor.name && (
              <FormatCard
                label="CSS Name"
                value={currentColor.name}
                onCopy={() => handleCopy(currentColor.name!, 'name')}
                isCopied={copiedFormat === 'name'}
                copyTitle={ui.copyToClipboard}
              />
            )}
          </div>
        </div>
      )}

      {/* Palette Generator */}
      {currentColor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ui.paletteGeneratorHeading || 'Palette Generator'}
            </h3>
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Palette className="h-4 w-4" />
              {showPalette ? (ui.hideButton || 'Hide') : (ui.generateButton || 'Generate')}
            </button>
          </div>

          {showPalette && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <select
                  value={paletteType}
                  onChange={(e) =>
                    setPaletteType(e.target.value as PaletteType)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="harmony">{ui.harmonyOption || 'Harmony'}</option>
                  <option value="tints">{ui.tintsOption || 'Tints (Lighter)'}</option>
                  <option value="shades">{ui.shadesOption || 'Shades (Darker)'}</option>
                </select>

                {paletteType === 'harmony' && (
                  <select
                    value={harmonyType}
                    onChange={(e) =>
                      setHarmonyType(e.target.value as HarmonyType)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="complementary">{ui.complementaryOption || 'Complementary'}</option>
                    <option value="analogous">{ui.analogousOption || 'Analogous'}</option>
                    <option value="triadic">{ui.triadicOption || 'Triadic'}</option>
                    <option value="tetradic">{ui.tetradicOption || 'Tetradic'}</option>
                    <option value="monochromatic">{ui.monochromaticOption || 'Monochromatic'}</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {palette.map((color, idx) => (
                  <div key={idx} className="space-y-2">
                    <div
                      className="h-16 w-full cursor-pointer rounded-lg shadow-md ring-2 ring-gray-200 transition-transform hover:scale-105 dark:ring-gray-700"
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setInputValue(color.hex)}
                      title={ui.clickToUseColor || 'Click to use this color'}
                    />
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {color.hex}
                      </p>
                      <button
                        onClick={() => handleCopy(color.hex, `palette-${idx}`)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label={`Copy color ${color.hex}`}
                      >
                        {copiedFormat === `palette-${idx}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contrast Checker */}
      {currentColor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ui.contrastCheckerHeading || 'Contrast Checker'}
            </h3>
            <button
              onClick={() => setShowContrast(!showContrast)}
              className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              {showContrast ? (ui.hideButton || 'Hide') : (ui.checkButton || 'Check')}
            </button>
          </div>

          {showContrast && contrastResult && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setContrastBackground('#FFFFFF')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2 ${
                    contrastBackground === '#FFFFFF'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Sun className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-xs">{ui.whiteBackground || 'White'}</p>
                </button>
                <button
                  onClick={() => setContrastBackground('#000000')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2 ${
                    contrastBackground === '#000000'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Moon className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-xs">{ui.blackBackground || 'Black'}</p>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="mb-2 text-sm font-medium">
                  {ui.contrastRatioLabel || 'Contrast Ratio:'} {contrastResult.ratio.toFixed(2)}:1
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{ui.aaComplianceHeading || 'AA Compliance'}</p>
                    <p
                      className={
                        contrastResult.AA.normal
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {ui.normalTextLabel || 'Normal Text:'}{' '}
                      {contrastResult.AA.normal ? '✓ Pass' : '✗ Fail'}
                    </p>
                    <p
                      className={
                        contrastResult.AA.large
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {ui.largeTextLabel || 'Large Text:'}{' '}
                      {contrastResult.AA.large ? '✓ Pass' : '✗ Fail'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{ui.aaaComplianceHeading || 'AAA Compliance'}</p>
                    <p
                      className={
                        contrastResult.AAA.normal
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {ui.normalTextLabel || 'Normal Text:'}{' '}
                      {contrastResult.AAA.normal ? '✓ Pass' : '✗ Fail'}
                    </p>
                    <p
                      className={
                        contrastResult.AAA.large
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {ui.largeTextLabel || 'Large Text:'}{' '}
                      {contrastResult.AAA.large ? '✓ Pass' : '✗ Fail'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color History */}
      {isHydrated && colorHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ui.recentColorsHeading || 'Recent Colors'}
            </h3>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              {ui.clearButton || 'Clear'}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {colorHistory.map((color, idx) => (
              <div
                key={idx}
                className="aspect-square cursor-pointer rounded-lg shadow ring-2 ring-gray-200 transition-transform hover:scale-110 dark:ring-gray-700"
                style={{ backgroundColor: color.hex }}
                onClick={() => setInputValue(color.hex)}
                title={color.hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {currentColor && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            {ui.exportJsonButton || 'Export JSON'}
          </button>
        </div>
      )}
    </div>
  );
}

interface FormatCardProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  copyTitle?: string;
}

function FormatCard({ label, value, onCopy, isCopied, copyTitle }: FormatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="truncate font-mono text-sm text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title={copyTitle || 'Copy to clipboard'}
        aria-label={`Copy ${label} value to clipboard`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
