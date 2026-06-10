'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Palette,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  Pipette,
  Sliders,
  Grid3x3,
  Contrast,
  Code,
  Upload,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { trackToolUse, trackEngagement } from '@/lib/analytics';
import { useToolStore } from '@/lib/store/toolStore';
import { useCopy } from '@/lib/hooks/useCopy';
import { BaseToolProps } from '@/lib/types/tools';
import {
  getColorValue,
  generateHarmony,
  checkWCAGCompliance,
  simulateColorBlindness,
  generateTints,
  generateShades,
  mixColors,
  adjustTemperature,
  exportAsCSS,
  exportPalette,
  getTailwindColor,
  getMaterialColor,
  getClosestNamedColor,
  generateGradient,
  isValidColor,
  getColorDescription,
  hslToRgb,
  type ColorValue,
  type HarmonyType,
  type ColorBlindnessType,
  type ContrastResult,
} from '@/lib/tools/color-picker';

interface ColorPickerProps extends BaseToolProps {}

type ExportFormat = 'hex' | 'rgb' | 'hsl' | 'css-variable' | 'scss';
type PaletteExportFormat =
  | 'json'
  | 'css'
  | 'scss'
  | 'tailwind'
  | 'js'
  | 'android'
  | 'ios';
type ViewMode = 'palette' | 'contrast' | 'export';

export default function ColorPicker({
  categoryColor,
  dictionary,
}: ColorPickerProps) {
  const ui = dictionary?.tools?.['color-picker']?.ui ?? {};

  // Localized labels for data-driven harmony options (EN falls back to slug)
  const harmonyTypeLabels: Record<string, string | undefined> = {
    complementary: ui.harmonyComplementary,
    triadic: ui.harmonyTriadic,
    analogous: ui.harmonyAnalogous,
    'split-complementary': ui.harmonySplitComplementary,
    tetradic: ui.harmonyTetradic,
    monochromatic: ui.harmonyMonochromatic,
  };

  const { copy: copyToClipboard } = useCopy();
  const { addToHistory } = useToolStore();

  // Main state
  const [currentColor, setCurrentColor] = useState<ColorValue | null>(null);
  const [inputValue, setInputValue] = useState('#3B82F6');
  const [viewMode, setViewMode] = useState<ViewMode>('palette');
  const [isProcessing, setIsProcessing] = useState(false);

  // Palette state
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary');
  const [palette, setPalette] = useState<ColorValue[]>([]);
  const [customAngles, setCustomAngles] = useState<number[]>([60, 120, 180]);

  // Contrast state
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(
    null
  );

  // Color blindness state
  const [colorBlindnessType, setColorBlindnessType] =
    useState<ColorBlindnessType>('normal');
  const [simulatedColors, setSimulatedColors] = useState<ColorValue[]>([]);

  // History and favorites
  const [recentColors, setRecentColors] = useState<ColorValue[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<ColorValue[]>([]);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('hex');
  const [paletteExportFormat, setPaletteExportFormat] =
    useState<PaletteExportFormat>('json');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorWheelRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);

  // Initialize with default color
  useEffect(() => {
    const color = getColorValue(inputValue);
    if (color) {
      setCurrentColor(color);
      generatePalette(color, harmonyType);
    }
  }, []);

  // Handle color input change
  const handleColorChange = useCallback(
    (value: string) => {
      setInputValue(value);

      if (isValidColor(value)) {
        const startTime = Date.now();
        const color = getColorValue(value);
        if (color) {
          setCurrentColor(color);
          generatePalette(color, harmonyType);
          addToRecent(color);

          // Analytics auto-tracking: input color -> converted formats
          addToHistory({
            id: crypto.randomUUID(),
            tool: 'color-picker',
            input: value,
            output: JSON.stringify({
              hex: color.hex,
              rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
              hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
            }),
            timestamp: startTime,
          });

          // Track color change
          trackToolUse('color-picker', 'color-change', {
            format: value.startsWith('#')
              ? 'hex'
              : value.startsWith('rgb')
                ? 'rgb'
                : value.startsWith('hsl')
                  ? 'hsl'
                  : 'named',
            value: color.hex,
          });
        }
      }
    },
    [harmonyType, trackToolUse, addToHistory]
  );

  // Generate color palette
  const generatePalette = useCallback(
    (baseColor: ColorValue, type: HarmonyType) => {
      const harmony = generateHarmony(
        baseColor,
        type,
        type === 'custom' ? customAngles : undefined
      );
      setPalette(harmony);

      // Simulate color blindness for palette
      if (colorBlindnessType !== 'normal') {
        const simulated = harmony.map((color) => {
          const simRgb = simulateColorBlindness(color.rgb, colorBlindnessType);
          return getColorValue(simRgb)!;
        });
        setSimulatedColors(simulated);
      }

      // Track palette generation
      trackEngagement('color-picker-palette');
    },
    [customAngles, colorBlindnessType, trackEngagement]
  );

  // Check contrast
  const checkContrast = useCallback(() => {
    if (!currentColor) return;

    const bgColor = getColorValue(backgroundColor);
    if (!bgColor) return;

    const result = checkWCAGCompliance(currentColor.rgb, bgColor.rgb);
    setContrastResult(result);

    // Track contrast check
    trackToolUse('color-picker', 'contrast-check', {
      ratio: result.ratio,
      aa_pass: result.AA.normal,
      aaa_pass: result.AAA.normal,
    });
  }, [currentColor, backgroundColor, trackToolUse]);

  // Add to recent colors
  const addToRecent = useCallback((color: ColorValue) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.hex !== color.hex);
      return [color, ...filtered].slice(0, 10);
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((color: ColorValue) => {
    setFavoriteColors((prev) => {
      const exists = prev.some((c) => c.hex === color.hex);
      if (exists) {
        return prev.filter((c) => c.hex !== color.hex);
      } else {
        return [...prev, color].slice(0, 20);
      }
    });
  }, []);

  // Copy color to clipboard
  const handleCopy = useCallback(
    async (value: string, format: string) => {
      const success = await copyToClipboard(value);
      if (success) {
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
        trackEngagement('color-picker-copy');
      }
    },
    [copyToClipboard, trackEngagement]
  );

  // Export functions
  const handleExportColor = useCallback(() => {
    if (!currentColor) return;

    const exported = exportAsCSS(currentColor, exportFormat);
    handleCopy(exported, exportFormat);
  }, [currentColor, exportFormat, handleCopy]);

  const handleExportPalette = useCallback(() => {
    const exported = exportPalette(palette, paletteExportFormat);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette.${paletteExportFormat === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    trackEngagement('color-picker-export');
  }, [palette, paletteExportFormat, trackEngagement]);

  // Color wheel interaction handlers
  const getColorFromWheelPosition = useCallback(
    (x: number, y: number, size: number) => {
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Clamp to wheel radius
      const clampedDistance = Math.min(distance, radius);
      const saturation = (clampedDistance / radius) * 100;

      // Calculate angle (hue)
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      const hue = (angle * 180) / Math.PI;

      // Keep current lightness
      const lightness = currentColor?.hsl.l || 50;

      return { h: Math.round(hue), s: Math.round(saturation), l: lightness };
    },
    [currentColor]
  );

  const handleWheelMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();
      isDraggingRef.current = true;

      const svg = colorWheelRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hsl = getColorFromWheelPosition(x, y, 200);
      const rgb = hslToRgb(hsl);
      const color = getColorValue(rgb);

      if (color) {
        setCurrentColor(color);
        setInputValue(color.hex);
        generatePalette(color, harmonyType);
        addToRecent(color);

        // Track interaction
        trackEngagement('color-picker-wheel-click');
      }
    },
    [
      getColorFromWheelPosition,
      generatePalette,
      harmonyType,
      addToRecent,
      trackEngagement,
    ]
  );

  const handleWheelMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDraggingRef.current) return;

      e.preventDefault();
      const svg = colorWheelRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hsl = getColorFromWheelPosition(x, y, 200);
      const rgb = hslToRgb(hsl);
      const color = getColorValue(rgb);

      if (color) {
        setCurrentColor(color);
        setInputValue(color.hex);
        generatePalette(color, harmonyType);
      }
    },
    [getColorFromWheelPosition, generatePalette, harmonyType]
  );

  const handleWheelMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    if (currentColor) {
      addToRecent(currentColor);
      trackEngagement('color-picker-wheel-drag');
    }
  }, [currentColor, addToRecent, trackEngagement]);

  // Touch event handlers for mobile
  const handleWheelTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      isDraggingRef.current = true;

      const touch = e.touches[0];
      const svg = colorWheelRef.current;
      if (!svg || !touch) return;

      const rect = svg.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const hsl = getColorFromWheelPosition(x, y, 200);
      const rgb = hslToRgb(hsl);
      const color = getColorValue(rgb);

      if (color) {
        setCurrentColor(color);
        setInputValue(color.hex);
        generatePalette(color, harmonyType);
        addToRecent(color);
        trackEngagement('color-picker-wheel-touch');
      }
    },
    [
      getColorFromWheelPosition,
      generatePalette,
      harmonyType,
      addToRecent,
      trackEngagement,
    ]
  );

  const handleWheelTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!isDraggingRef.current) return;

      e.preventDefault();
      const touch = e.touches[0];
      const svg = colorWheelRef.current;
      if (!svg || !touch) return;

      const rect = svg.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const hsl = getColorFromWheelPosition(x, y, 200);
      const rgb = hslToRgb(hsl);
      const color = getColorValue(rgb);

      if (color) {
        setCurrentColor(color);
        setInputValue(color.hex);
        generatePalette(color, harmonyType);
      }
    },
    [getColorFromWheelPosition, generatePalette, harmonyType]
  );

  const handleWheelTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (currentColor) {
      addToRecent(currentColor);
    }
  }, [currentColor, addToRecent]);

  // Add global mouse events for dragging outside the wheel
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const svg = colorWheelRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hsl = getColorFromWheelPosition(x, y, 200);
      const rgb = hslToRgb(hsl);
      const color = getColorValue(rgb);

      if (color) {
        setCurrentColor(color);
        setInputValue(color.hex);
        generatePalette(color, harmonyType);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (currentColor) {
          addToRecent(currentColor);
        }
      }
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    getColorFromWheelPosition,
    generatePalette,
    harmonyType,
    currentColor,
    addToRecent,
  ]);

  // Use eyedropper API
  const useEyedropper = useCallback(async () => {
    // SSR guard: ensure we're in browser environment
    if (typeof window === 'undefined') return;

    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(result.sRGBHex);
        trackEngagement('color-picker-eyedropper');
      } catch (err) {
        console.error('Eyedropper failed:', err);
      }
    } else {
      alert('Eyedropper API is not supported in your browser');
    }
  }, [handleColorChange, trackEngagement]);

  // Extract colors from image
  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Sample colors from image
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          const colorMap = new Map<string, number>();

          // Sample every 100th pixel
          for (let i = 0; i < pixels.length; i += 400) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a > 128) {
              const key = `${r},${g},${b}`;
              colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }
          }

          // Get top 5 colors
          const sorted = Array.from(colorMap.entries()).sort(
            (a, b) => b[1] - a[1]
          );
          const extractedColors = sorted.slice(0, 5).map((entry) => {
            const [r, g, b] = entry[0].split(',').map(Number);
            return getColorValue({ r, g, b })!;
          });

          setPalette(extractedColors);
          if (extractedColors.length > 0) {
            setCurrentColor(extractedColors[0]);
            setInputValue(extractedColors[0].hex);
          }

          trackEngagement('color-picker-image-extract');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [trackEngagement]
  );

  // Render color wheel (interactive SVG version)
  const renderColorWheel = () => {
    if (!currentColor) return null;

    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Current color position on wheel
    const hue = currentColor.hsl.h;
    const saturation = currentColor.hsl.s / 100;
    const angle = (hue * Math.PI) / 180;
    const distance = radius * saturation;
    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);

    return (
      <div className="relative select-none">
        <svg
          ref={colorWheelRef}
          width={size}
          height={size}
          className="cursor-crosshair touch-none"
          onMouseDown={handleWheelMouseDown}
          onMouseMove={handleWheelMouseMove}
          onMouseUp={handleWheelMouseUp}
          onTouchStart={handleWheelTouchStart}
          onTouchMove={handleWheelTouchMove}
          onTouchEnd={handleWheelTouchEnd}
          style={{ userSelect: 'none' }}
        >
          {/* Generate color wheel sectors */}
          {Array.from({ length: 360 }, (_, i) => {
            const startAngle = (i * Math.PI) / 180;
            const endAngle = ((i + 1) * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const color = `hsl(${i}, 100%, 50%)`;

            return (
              <path
                key={i}
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                fill={color}
                opacity={0.9}
                style={{ pointerEvents: 'auto' }}
              />
            );
          })}

          {/* Radial gradient definitions */}
          <defs>
            <radialGradient id="saturation-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Saturation overlay */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="url(#saturation-gradient)"
            style={{ pointerEvents: 'auto' }}
          />

          {/* Current color indicator */}
          <circle
            cx={x}
            cy={y}
            r="8"
            fill={currentColor.hex}
            stroke="white"
            strokeWidth="3"
            style={{
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />

          {/* Inner dot for contrast */}
          <circle
            cx={x}
            cy={y}
            r="3"
            fill="white"
            style={{ pointerEvents: 'none' }}
          />
        </svg>

        {/* Instructions */}
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {ui.clickOrDragToSelect || 'Click or drag to select color'}
        </div>
      </div>
    );
  };

  // Render color input fields
  const renderColorInputs = () => {
    if (!currentColor) return null;

    return (
      <div className="space-y-3">
        {/* HEX */}
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm font-medium">HEX</label>
          <input
            type="text"
            value={currentColor.hex}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm dark:border-gray-600 dark:bg-gray-700"
            placeholder="#FF5733"
          />
          <button
            onClick={() => handleCopy(currentColor.hex, 'hex')}
            className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {copiedFormat === 'hex' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* RGB */}
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm font-medium">RGB</label>
          <div className="flex flex-1 gap-1">
            <input
              type="number"
              value={currentColor.rgb.r}
              onChange={(e) =>
                handleColorChange(
                  `rgb(${e.target.value}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`
                )
              }
              min="0"
              max="255"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="number"
              value={currentColor.rgb.g}
              onChange={(e) =>
                handleColorChange(
                  `rgb(${currentColor.rgb.r}, ${e.target.value}, ${currentColor.rgb.b})`
                )
              }
              min="0"
              max="255"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="number"
              value={currentColor.rgb.b}
              onChange={(e) =>
                handleColorChange(
                  `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${e.target.value})`
                )
              }
              min="0"
              max="255"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <button
            onClick={() =>
              handleCopy(
                `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`,
                'rgb'
              )
            }
            className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {copiedFormat === 'rgb' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* HSL */}
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm font-medium">HSL</label>
          <div className="flex flex-1 gap-1">
            <input
              type="number"
              value={currentColor.hsl.h}
              onChange={(e) =>
                handleColorChange(
                  `hsl(${e.target.value}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`
                )
              }
              min="0"
              max="360"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="number"
              value={currentColor.hsl.s}
              onChange={(e) =>
                handleColorChange(
                  `hsl(${currentColor.hsl.h}, ${e.target.value}%, ${currentColor.hsl.l}%)`
                )
              }
              min="0"
              max="100"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <input
              type="number"
              value={currentColor.hsl.l}
              onChange={(e) =>
                handleColorChange(
                  `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${e.target.value}%)`
                )
              }
              min="0"
              max="100"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <button
            onClick={() =>
              handleCopy(
                `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`,
                'hsl'
              )
            }
            className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {copiedFormat === 'hsl' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render palette view
  const renderPaletteView = () => {
    if (!currentColor) return null;

    const colors = colorBlindnessType === 'normal' ? palette : simulatedColors;

    return (
      <div className="space-y-4">
        {/* Harmony Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.harmonyType || 'Harmony Type'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                'complementary',
                'triadic',
                'analogous',
                'split-complementary',
                'tetradic',
                'monochromatic',
              ] as HarmonyType[]
            ).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setHarmonyType(type);
                  generatePalette(currentColor, type);
                }}
                className={`rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                  harmonyType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                {harmonyTypeLabels[type] || type.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Palette Colors */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.generatedPalette || 'Generated Palette'}
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {colors.map((color, index) => (
              <div
                key={index}
                className="group relative cursor-pointer rounded-lg border border-gray-200 p-2 transition-all hover:shadow-lg dark:border-gray-700"
                onClick={() => {
                  setCurrentColor(color);
                  setInputValue(color.hex);
                }}
              >
                <div
                  className="mb-2 h-16 rounded-md"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{color.hex}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(color.hex, `palette-${index}`);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {copiedFormat === `palette-${index}` ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  {color.name && (
                    <div className="text-xs text-gray-500">{color.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tints and Shades */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.tintsAndShades || 'Tints & Shades'}
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              {generateTints(currentColor, 5).map((tint, index) => (
                <div
                  key={index}
                  className="flex-1 cursor-pointer rounded-md border border-gray-200 p-2 transition-all hover:shadow dark:border-gray-700"
                  onClick={() => {
                    setCurrentColor(tint);
                    setInputValue(tint.hex);
                  }}
                >
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: tint.hex }}
                  />
                  <span className="mt-1 block text-center font-mono text-xs">
                    {tint.hex.substring(0, 7)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {generateShades(currentColor, 5).map((shade, index) => (
                <div
                  key={index}
                  className="flex-1 cursor-pointer rounded-md border border-gray-200 p-2 transition-all hover:shadow dark:border-gray-700"
                  onClick={() => {
                    setCurrentColor(shade);
                    setInputValue(shade.hex);
                  }}
                >
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: shade.hex }}
                  />
                  <span className="mt-1 block text-center font-mono text-xs">
                    {shade.hex.substring(0, 7)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Color Blindness Simulator */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.colorBlindnessSimulator || 'Color Blindness Simulator'}
          </label>
          <select
            value={colorBlindnessType}
            onChange={(e) => {
              setColorBlindnessType(e.target.value as ColorBlindnessType);
              if (e.target.value !== 'normal') {
                const simulated = palette.map((color) => {
                  const simRgb = simulateColorBlindness(
                    color.rgb,
                    e.target.value as ColorBlindnessType
                  );
                  return getColorValue(simRgb)!;
                });
                setSimulatedColors(simulated);
              }
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="normal">{ui.visionNormal || 'Normal Vision'}</option>
            <option value="protanopia">
              {ui.visionProtanopia || 'Protanopia (Red-Blind)'}
            </option>
            <option value="protanomaly">
              {ui.visionProtanomaly || 'Protanomaly (Red-Weak)'}
            </option>
            <option value="deuteranopia">
              {ui.visionDeuteranopia || 'Deuteranopia (Green-Blind)'}
            </option>
            <option value="deuteranomaly">
              {ui.visionDeuteranomaly || 'Deuteranomaly (Green-Weak)'}
            </option>
            <option value="tritanopia">
              {ui.visionTritanopia || 'Tritanopia (Blue-Blind)'}
            </option>
            <option value="tritanomaly">
              {ui.visionTritanomaly || 'Tritanomaly (Blue-Weak)'}
            </option>
            <option value="achromatopsia">
              {ui.visionAchromatopsia || 'Achromatopsia (Color-Blind)'}
            </option>
            <option value="achromatomaly">
              {ui.visionAchromatomaly || 'Achromatomaly (Color-Weak)'}
            </option>
          </select>
        </div>
      </div>
    );
  };

  // Render contrast view
  const renderContrastView = () => {
    if (!currentColor) return null;

    return (
      <div className="space-y-4">
        {/* Background Color Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.backgroundColor || 'Background Color'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 font-mono dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              onClick={checkContrast}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              {ui.checkContrast || 'Check Contrast'}
            </button>
          </div>
        </div>

        {/* Contrast Results */}
        {contrastResult && (
          <div className="space-y-4">
            {/* Ratio Display */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 text-center">
                <div className="text-3xl font-bold">
                  {contrastResult.ratio}:1
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {ui.contrastRatio || 'Contrast Ratio'}
                </div>
              </div>

              {/* WCAG Levels */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-medium">WCAG AA</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ui.normalText || 'Normal Text'}</span>
                      <span
                        className={
                          contrastResult.AA.normal
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {contrastResult.AA.normal ? ui.passLabel || '✓ Pass' : ui.failLabel || '✗ Fail'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{ui.largeText || 'Large Text'}</span>
                      <span
                        className={
                          contrastResult.AA.large
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {contrastResult.AA.large ? ui.passLabel || '✓ Pass' : ui.failLabel || '✗ Fail'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{ui.graphics || 'Graphics'}</span>
                      <span
                        className={
                          contrastResult.AA.graphics
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {contrastResult.AA.graphics ? ui.passLabel || '✓ Pass' : ui.failLabel || '✗ Fail'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">WCAG AAA</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ui.normalText || 'Normal Text'}</span>
                      <span
                        className={
                          contrastResult.AAA.normal
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {contrastResult.AAA.normal ? ui.passLabel || '✓ Pass' : ui.failLabel || '✗ Fail'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{ui.largeText || 'Large Text'}</span>
                      <span
                        className={
                          contrastResult.AAA.large
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {contrastResult.AAA.large ? ui.passLabel || '✓ Pass' : ui.failLabel || '✗ Fail'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {ui.preview || 'Preview'}
              </label>
              <div
                className="rounded-lg p-6"
                style={{
                  backgroundColor: backgroundColor,
                  color: currentColor.hex,
                }}
              >
                <h3 className="mb-2 text-2xl font-bold">
                  {ui.largeTextSample || 'Large Text (18pt+)'}
                </h3>
                <p className="mb-4">
                  {ui.normalTextSample ||
                    'This is normal text (14pt). The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
                </p>
                <button
                  className="rounded px-4 py-2"
                  style={{
                    backgroundColor: currentColor.hex,
                    color: backgroundColor,
                  }}
                >
                  {ui.buttonExample || 'Button Example'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render export view
  const renderExportView = () => {
    if (!currentColor) return null;

    const tailwindColor = getTailwindColor(currentColor);
    const materialColor = getMaterialColor(currentColor);
    const closestNamed = getClosestNamedColor(currentColor);

    return (
      <div className="space-y-4">
        {/* Single Color Export */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.exportColor || 'Export Color'}
          </label>
          <div className="flex gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
              <option value="css-variable">
                {ui.cssVariable || 'CSS Variable'}
              </option>
              <option value="scss">{ui.scssVariable || 'SCSS Variable'}</option>
            </select>
            <button
              onClick={handleExportColor}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-md bg-gray-100 p-3 font-mono text-sm dark:bg-gray-700">
            {exportAsCSS(currentColor, exportFormat)}
          </div>
        </div>

        {/* Palette Export */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.exportPalette || 'Export Palette'}
          </label>
          <div className="flex gap-2">
            <select
              value={paletteExportFormat}
              onChange={(e) =>
                setPaletteExportFormat(e.target.value as PaletteExportFormat)
              }
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="json">JSON</option>
              <option value="css">{ui.cssVariables || 'CSS Variables'}</option>
              <option value="scss">
                {ui.scssVariables || 'SCSS Variables'}
              </option>
              <option value="tailwind">Tailwind Config</option>
              <option value="js">JavaScript</option>
              <option value="android">Android XML</option>
              <option value="ios">iOS Swift</option>
            </select>
            <button
              onClick={handleExportPalette}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Framework Colors */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.frameworkEquivalents || 'Framework Equivalents'}
          </label>
          <div className="space-y-2">
            {tailwindColor && (
              <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <span className="text-sm">Tailwind CSS</span>
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                  {tailwindColor}
                </code>
              </div>
            )}
            {materialColor && (
              <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <span className="text-sm">Material Design</span>
                <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                  {materialColor}
                </code>
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <span className="text-sm">
                {ui.closestNamedColor || 'Closest Named Color'}
              </span>
              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                {closestNamed}
              </code>
            </div>
          </div>
        </div>

        {/* Color Information */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {ui.colorInformation || 'Color Information'}
          </label>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {ui.descriptionLabel || 'Description:'}
                </span>
                <div className="font-medium capitalize">
                  {getColorDescription(currentColor)}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">CMYK:</span>
                <div className="font-mono">
                  {currentColor.cmyk.c}%, {currentColor.cmyk.m}%,{' '}
                  {currentColor.cmyk.y}%, {currentColor.cmyk.k}%
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">HSV:</span>
                <div className="font-mono">
                  {currentColor.hsv.h}°, {currentColor.hsv.s}%,{' '}
                  {currentColor.hsv.v}%
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">LAB:</span>
                <div className="font-mono">
                  {currentColor.lab.l}, {currentColor.lab.a},{' '}
                  {currentColor.lab.b}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Color Display */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Color Preview and Wheel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {ui.colorPickerHeading || 'Color Picker'}
              </h3>
              <div className="flex gap-2">
                {/* Eyedropper button */}
                {typeof window !== 'undefined' && 'EyeDropper' in window && (
                  <button
                    onClick={useEyedropper}
                    className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={ui.pickColorFromScreen || 'Pick color from screen'}
                    aria-label={
                      ui.pickColorFromScreen || 'Pick color from screen'
                    }
                  >
                    <Pipette className="h-4 w-4" />
                  </button>
                )}
                {/* Image upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={ui.extractColorsFromImage || 'Extract colors from image'}
                  aria-label={
                    ui.extractColorsFromImage || 'Extract colors from image'
                  }
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Color Preview */}
            <div
              className="h-32 rounded-lg border-2 border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: currentColor?.hex || '#FFFFFF' }}
            />

            {/* Color Wheel */}
            <div className="flex justify-center">{renderColorWheel()}</div>

            {/* Quick Color Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder={
                ui.enterColorPlaceholder ||
                'Enter color (HEX, RGB, HSL, or name)'
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          {/* Color Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {ui.colorValues || 'Color Values'}
            </h3>
            {renderColorInputs()}

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {ui.recentColors || 'Recent Colors'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentColor(color);
                        setInputValue(color.hex);
                      }}
                      className="h-8 w-8 rounded border-2 border-gray-300 transition-all hover:scale-110 dark:border-gray-600"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Colors */}
            {favoriteColors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {ui.favoriteColors || 'Favorite Colors'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {favoriteColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentColor(color);
                        setInputValue(color.hex);
                      }}
                      className="h-8 w-8 rounded border-2 border-yellow-400 transition-all hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode('palette')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === 'palette'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
            {ui.tabPalette || 'Palette'}
          </button>
          <button
            onClick={() => setViewMode('contrast')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === 'contrast'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Contrast className="h-4 w-4" />
            {ui.tabContrast || 'Contrast'}
          </button>
          <button
            onClick={() => setViewMode('export')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Code className="h-4 w-4" />
            {ui.tabExport || 'Export'}
          </button>
        </div>

        <div className="p-6">
          {viewMode === 'palette' && renderPaletteView()}
          {viewMode === 'contrast' && renderContrastView()}
          {viewMode === 'export' && renderExportView()}
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 dark:bg-gray-800">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2">{ui.processing || 'Processing...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
