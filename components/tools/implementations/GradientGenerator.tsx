'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Download,
  Plus,
  Minus,
  Shuffle,
  Heart,
  ArrowLeftRight,
  Upload,
  Check,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  generateGradientCSS,
  generateRandomGradient,
  generateCompatibleCSS,
  gradientPresets,
  parseGradientFromCSS,
  type GradientConfig,
  type GradientType,
  type ColorStop,
  type RadialShape,
  type RadialSize,
  type GradientPreset,
} from '@/lib/tools/gradient-generator';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';

interface SavedGradient {
  name: string;
  config: GradientConfig;
}

type OutputFormat = 'css' | 'react' | 'cssvar';

type GradientGeneratorProps = BaseToolProps & { dictionary?: any };

export default function GradientGenerator({
  categoryColor: _categoryColor,
  dictionary,
}: GradientGeneratorProps) {
  const ui = dictionary?.tools?.['gradient-generator']?.ui ?? {};
  // Main gradient configuration
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>({
    type: 'linear',
    angle: 90,
    colorStops: [
      { id: 'stop-1', color: '#667eea', position: 0 },
      { id: 'stop-2', color: '#764ba2', position: 100 },
    ],
  });

  // UI state
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedStop, setSelectedStop] = useState<string | null>('stop-1');
  const [showCompatibleCSS, setShowCompatibleCSS] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('css');
  const [savedGradients, setSavedGradients] = useState<SavedGradient[]>([]);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState('all');
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importCssText, setImportCssText] = useState('');
  const [importError, setImportError] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [pendingSaveName, setPendingSaveName] = useState('');
  const [editingOpacityStopId, setEditingOpacityStopId] = useState<string | null>(null);

  // Refs and hooks
  const gradientBarRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useCopy();
  const { downloadText } = useDownload();
  const { trackError } = useToolTracking('gradient-generator');
  const { addToHistory } = useToolStore();

  // Generate CSS result — pure computation, no side effects
  const gradientResult = useMemo(() => {
    try {
      return generateGradientCSS(gradientConfig);
    } catch (error) {
      trackError(
        error instanceof Error ? error : new Error(String(error)),
        JSON.stringify(gradientConfig).length
      );
      return { success: false, error: 'Failed to generate gradient' };
    }
  }, [gradientConfig, trackError]);

  // Derive output text from selected format
  const outputText = useMemo(() => {
    if (!gradientResult.success || !gradientResult.css) return '';
    if (showCompatibleCSS) return generateCompatibleCSS(gradientConfig);
    switch (outputFormat) {
      case 'react':
        return `style={{ background: '${gradientResult.css}' }}`;
      case 'cssvar':
        return `--my-gradient: ${gradientResult.css};\nbackground: var(--my-gradient);`;
      default:
        return `background: ${gradientResult.css};`;
    }
  }, [gradientResult, outputFormat, showCompatibleCSS, gradientConfig]);

  // Human-readable config summary used as analytics input
  const configSummary = useMemo(() => {
    const { type, angle, colorStops } = gradientConfig;
    const colors = colorStops.map((s) => s.color).join(', ');
    const anglePart =
      type === 'linear' || type === 'conic' ? `, angle ${angle ?? 0}°` : '';
    return `${type} gradient${anglePart}, ${colorStops.length} stops: ${colors}`;
  }, [gradientConfig]);

  // Track gradient generation when the CSS output settles (debounced to
  // avoid firing on every drag/keystroke).
  useEffect(() => {
    if (!gradientResult.success || !gradientResult.css) return;
    const cssString = `background: ${gradientResult.css};`;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'gradient-generator',
        input: configSummary,
        output: cssString,
        timestamp: startTime,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [gradientResult.success, gradientResult.css, configSummary, addToHistory]);

  // Load saved gradients from localStorage with format migration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gradient-generator-saved');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if ('config' in parsed[0]) {
            setSavedGradients(parsed as SavedGradient[]);
          } else {
            // Migrate old GradientConfig[] format
            setSavedGradients(
              (parsed as GradientConfig[]).map((config, i) => ({
                name: `Gradient ${i + 1}`,
                config,
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved gradients:', error);
    }
  }, []);

  // Update gradient configuration
  const updateGradientConfig = useCallback(
    (updates: Partial<GradientConfig>) => {
      setGradientConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Update a single color stop
  const updateColorStop = useCallback(
    (stopId: string, updates: Partial<ColorStop>) => {
      setGradientConfig((prev) => ({
        ...prev,
        colorStops: prev.colorStops.map((stop) =>
          stop.id === stopId ? { ...stop, ...updates } : stop
        ),
      }));
    },
    []
  );

  // Add new color stop
  const addColorStop = useCallback(() => {
    const newPosition =
      gradientConfig.colorStops.length > 0
        ? gradientConfig.colorStops[gradientConfig.colorStops.length - 1]
            .position + 10
        : 50;

    const newStop: ColorStop = {
      id: `stop-${Date.now()}`,
      color: '#ffffff',
      position: Math.min(newPosition, 100),
    };

    setGradientConfig((prev) => ({
      ...prev,
      colorStops: [...prev.colorStops, newStop].sort(
        (a, b) => a.position - b.position
      ),
    }));

    setSelectedStop(newStop.id);
  }, [gradientConfig.colorStops]);

  // Remove color stop (minimum 2)
  const removeColorStop = useCallback(
    (stopId: string) => {
      if (gradientConfig.colorStops.length <= 2) return;

      setGradientConfig((prev) => ({
        ...prev,
        colorStops: prev.colorStops.filter((stop) => stop.id !== stopId),
      }));

      if (selectedStop === stopId) {
        setSelectedStop(gradientConfig.colorStops[0]?.id || null);
      }
    },
    [gradientConfig.colorStops, selectedStop]
  );

  // Generate random gradient
  const generateRandom = useCallback(() => {
    const randomGradient = generateRandomGradient(gradientConfig.type);
    setGradientConfig(randomGradient);
    setSelectedStop(randomGradient.colorStops[0]?.id || null);
  }, [gradientConfig.type]);

  // Reverse gradient — flip all stop positions
  const reverseGradient = useCallback(() => {
    setGradientConfig((prev) => ({
      ...prev,
      colorStops: prev.colorStops
        .map((stop) => ({ ...stop, position: 100 - stop.position }))
        .sort((a, b) => a.position - b.position),
    }));
  }, []);

  // Drag color stop handle on the gradient bar
  const handleStopPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, stopId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const handle = e.currentTarget;
      handle.setPointerCapture(e.pointerId);

      const bar = gradientBarRef.current;
      if (!bar) return;
      const barRect = bar.getBoundingClientRect();

      const onPointerMove = (moveEvent: PointerEvent) => {
        const pos = Math.max(
          0,
          Math.min(
            100,
            ((moveEvent.clientX - barRect.left) / barRect.width) * 100
          )
        );
        updateColorStop(stopId, { position: Math.round(pos * 10) / 10 });
      };

      const onPointerUp = () => {
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', onPointerUp);
      };

      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
    },
    [updateColorStop]
  );

  // Start named save flow
  const handleSaveStart = useCallback(() => {
    setPendingSaveName(`Gradient ${savedGradients.length + 1}`);
    setShowSaveInput(true);
  }, [savedGradients.length]);

  // Confirm save with name
  const handleSaveConfirm = useCallback(() => {
    const name =
      pendingSaveName.trim() || `Gradient ${savedGradients.length + 1}`;
    const newSaved: SavedGradient[] = [
      ...savedGradients,
      { name, config: gradientConfig },
    ];
    setSavedGradients(newSaved);
    try {
      localStorage.setItem(
        'gradient-generator-saved',
        JSON.stringify(newSaved)
      );
      toast.success('Gradient saved!');
    } catch {
      toast.error('Failed to save gradient');
    }
    setShowSaveInput(false);
    setPendingSaveName('');
  }, [pendingSaveName, savedGradients, gradientConfig]);

  const handleSaveCancel = useCallback(() => {
    setShowSaveInput(false);
    setPendingSaveName('');
  }, []);

  // Import gradient from pasted CSS
  const handleImportCSS = useCallback(() => {
    if (!importCssText.trim()) return;
    const parsed = parseGradientFromCSS(importCssText.trim());
    if (parsed) {
      setGradientConfig(parsed);
      setSelectedStop(parsed.colorStops[0]?.id || null);
      setImportCssText('');
      setImportError('');
      setShowImportPanel(false);
      toast.success('Gradient imported!');
    } else {
      setImportError(
        'Could not parse this CSS. Try: linear-gradient(90deg, #f00 0%, #00f 100%)'
      );
    }
  }, [importCssText]);

  // Load preset gradient
  const loadPreset = useCallback((preset: GradientPreset) => {
    setGradientConfig(preset.gradient);
    setSelectedStop(preset.gradient.colorStops[0]?.id || null);
  }, []);

  // Copy output text to clipboard
  const handleCopyCSS = useCallback(async () => {
    if (!outputText) return;
    await copy(outputText);
  }, [outputText, copy]);

  // Download as CSS file
  const handleDownloadCSS = useCallback(() => {
    if (!outputText) return;
    const content =
      outputFormat === 'css' && !showCompatibleCSS
        ? `.gradient {\n  ${outputText}\n}`
        : outputText;
    downloadText(content, { filename: 'gradient.css' });
  }, [outputText, outputFormat, showCompatibleCSS, downloadText]);

  // Get filtered presets
  const filteredPresets = useMemo(() => {
    if (selectedPresetCategory === 'all') return gradientPresets;
    return gradientPresets.filter(
      (preset) => preset.category === selectedPresetCategory
    );
  }, [selectedPresetCategory]);

  // Get unique preset categories
  const presetCategories = useMemo(() => {
    const categories = [
      ...new Set(gradientPresets.map((preset) => preset.category)),
    ];
    return [
      { id: 'all', name: 'All' },
      ...categories.map((cat) => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
      })),
    ];
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            handleCopyCSS();
            break;
          case 'r':
            e.preventDefault();
            generateRandom();
            break;
          case 's':
            e.preventDefault();
            if (!showSaveInput) handleSaveStart();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyCSS, generateRandom, handleSaveStart, showSaveInput]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">{ui.tabEditor || 'Editor'}</TabsTrigger>
          <TabsTrigger value="presets">{ui.tabPresets || 'Presets'}</TabsTrigger>
          <TabsTrigger value="favorites">{ui.tabFavorites || 'Favorites'}</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Main Editor Layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Preview Panel */}
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{ui.previewHeading || 'Preview'}</h3>
                <div className="flex items-center gap-2">
                  {showSaveInput ? (
                    <>
                      <Input
                        autoFocus
                        value={pendingSaveName}
                        onChange={(e) => setPendingSaveName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveConfirm();
                          if (e.key === 'Escape') handleSaveCancel();
                        }}
                        placeholder={ui.gradientNamePlaceholder || 'Name your gradient'}
                        className="h-8 w-36 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveConfirm}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRandom}
                      >
                        <Shuffle className="mr-2 h-4 w-4" />
                        {ui.btnRandom || 'Random'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reverseGradient}
                      >
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        {ui.btnReverse || 'Reverse'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveStart}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        {ui.btnSave || 'Save'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Gradient Preview — responsive 4:3 aspect ratio */}
              <div
                className="w-full rounded-lg border shadow-inner"
                style={{
                  aspectRatio: '4/3',
                  background: gradientResult.success
                    ? gradientResult.css
                    : '#f0f0f0',
                }}
              />

              {/* Interactive Gradient Bar */}
              <div className="mt-4">
                <Label className="mb-2 block text-xs font-medium text-gray-500">
                  {ui.dragHandlesLabel || 'Drag handles to reposition stops'}
                </Label>
                <div className="relative h-8">
                  <div
                    ref={gradientBarRef}
                    className="absolute inset-0 rounded-full border shadow-inner"
                    style={{
                      background: gradientResult.success
                        ? gradientResult.css
                        : '#f0f0f0',
                    }}
                  />
                  {gradientConfig.colorStops.map((stop) => (
                    <div
                      key={stop.id}
                      className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-white shadow-md active:cursor-grabbing ${
                        selectedStop === stop.id
                          ? 'ring-2 ring-blue-500 ring-offset-1'
                          : ''
                      }`}
                      style={{
                        left: `${stop.position}%`,
                        backgroundColor: stop.color,
                      }}
                      onClick={() => setSelectedStop(stop.id)}
                      onPointerDown={(e) => {
                        setSelectedStop(stop.id);
                        handleStopPointerDown(e, stop.id);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Import CSS Panel */}
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500"
                  onClick={() => {
                    setShowImportPanel(!showImportPanel);
                    setImportError('');
                  }}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {showImportPanel ? (ui.btnHideImport || 'Hide import') : (ui.btnImportCSS || 'Import CSS gradient')}
                </Button>

                {showImportPanel && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={importCssText}
                      onChange={(e) => {
                        setImportCssText(e.target.value);
                        setImportError('');
                      }}
                      placeholder="linear-gradient(90deg, #f00 0%, #00f 100%)"
                      className="min-h-[70px] font-mono text-sm"
                    />
                    {importError && (
                      <p className="text-xs text-red-500">{importError}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={handleImportCSS}
                      disabled={!importCssText.trim()}
                    >
                      {ui.btnParseImport || 'Parse & Import'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls Panel */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-semibold">{ui.settingsHeading || 'Settings'}</h3>

              <div className="space-y-4">
                {/* Gradient Type */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    {ui.labelGradientType || 'Gradient Type'}
                  </Label>
                  <Select
                    value={gradientConfig.type}
                    onValueChange={(value) =>
                      updateGradientConfig({ type: value as GradientType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">{ui.optionLinear || 'Linear'}</SelectItem>
                      <SelectItem value="radial">{ui.optionRadial || 'Radial'}</SelectItem>
                      <SelectItem value="conic">{ui.optionConic || 'Conic'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Linear Gradient Controls */}
                {gradientConfig.type === 'linear' && (
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      {ui.labelAngle || 'Angle'}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[gradientConfig.angle ?? 90]}
                        onValueChange={([angle]) =>
                          updateGradientConfig({ angle })
                        }
                        min={0}
                        max={360}
                        step={1}
                        className="flex-1"
                      />
                      <div className="flex shrink-0 items-center gap-1">
                        <Input
                          type="number"
                          value={gradientConfig.angle ?? 90}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) {
                              updateGradientConfig({
                                angle: Math.max(0, Math.min(360, v)),
                              });
                            }
                          }}
                          min={0}
                          max={360}
                          className="h-8 w-16 text-center font-mono text-sm"
                        />
                        <span className="text-sm text-gray-500">°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Radial Gradient Controls */}
                {gradientConfig.type === 'radial' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium">
                          {ui.labelShape || 'Shape'}
                        </Label>
                        <Select
                          value={gradientConfig.shape || 'ellipse'}
                          onValueChange={(value) =>
                            updateGradientConfig({
                              shape: value as RadialShape,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">{ui.optionCircle || 'Circle'}</SelectItem>
                            <SelectItem value="ellipse">{ui.optionEllipse || 'Ellipse'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">
                          {ui.labelSize || 'Size'}
                        </Label>
                        <Select
                          value={gradientConfig.size || 'farthest-corner'}
                          onValueChange={(value) =>
                            updateGradientConfig({ size: value as RadialSize })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="closest-side">
                              {ui.optionClosestSide || 'Closest Side'}
                            </SelectItem>
                            <SelectItem value="closest-corner">
                              {ui.optionClosestCorner || 'Closest Corner'}
                            </SelectItem>
                            <SelectItem value="farthest-side">
                              {ui.optionFarthestSide || 'Farthest Side'}
                            </SelectItem>
                            <SelectItem value="farthest-corner">
                              {ui.optionFarthestCorner || 'Farthest Corner'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1 block text-sm font-medium">
                          {ui.labelCenterX || 'Center X'}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[gradientConfig.position?.x ?? 50]}
                            onValueChange={([x]) =>
                              updateGradientConfig({
                                position: {
                                  x,
                                  y: gradientConfig.position?.y ?? 50,
                                },
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <div className="flex shrink-0 items-center gap-1">
                            <Input
                              type="number"
                              value={gradientConfig.position?.x ?? 50}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) {
                                  updateGradientConfig({
                                    position: {
                                      x: Math.max(0, Math.min(100, v)),
                                      y: gradientConfig.position?.y ?? 50,
                                    },
                                  });
                                }
                              }}
                              min={0}
                              max={100}
                              className="h-8 w-14 text-center font-mono text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm font-medium">
                          {ui.labelCenterY || 'Center Y'}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[gradientConfig.position?.y ?? 50]}
                            onValueChange={([y]) =>
                              updateGradientConfig({
                                position: {
                                  x: gradientConfig.position?.x ?? 50,
                                  y,
                                },
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <div className="flex shrink-0 items-center gap-1">
                            <Input
                              type="number"
                              value={gradientConfig.position?.y ?? 50}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) {
                                  updateGradientConfig({
                                    position: {
                                      x: gradientConfig.position?.x ?? 50,
                                      y: Math.max(0, Math.min(100, v)),
                                    },
                                  });
                                }
                              }}
                              min={0}
                              max={100}
                              className="h-8 w-14 text-center font-mono text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Conic Gradient Controls */}
                {gradientConfig.type === 'conic' && (
                  <>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">
                        {ui.labelStartAngle || 'Start Angle'}
                      </Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[gradientConfig.angle ?? 0]}
                          onValueChange={([angle]) =>
                            updateGradientConfig({ angle })
                          }
                          min={0}
                          max={360}
                          step={1}
                          className="flex-1"
                        />
                        <div className="flex shrink-0 items-center gap-1">
                          <Input
                            type="number"
                            value={gradientConfig.angle ?? 0}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) {
                                updateGradientConfig({
                                  angle: Math.max(0, Math.min(360, v)),
                                });
                              }
                            }}
                            min={0}
                            max={360}
                            className="h-8 w-16 text-center font-mono text-sm"
                          />
                          <span className="text-sm text-gray-500">°</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1 block text-sm font-medium">
                          {ui.labelCenterX || 'Center X'}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[gradientConfig.position?.x ?? 50]}
                            onValueChange={([x]) =>
                              updateGradientConfig({
                                position: {
                                  x,
                                  y: gradientConfig.position?.y ?? 50,
                                },
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <div className="flex shrink-0 items-center gap-1">
                            <Input
                              type="number"
                              value={gradientConfig.position?.x ?? 50}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) {
                                  updateGradientConfig({
                                    position: {
                                      x: Math.max(0, Math.min(100, v)),
                                      y: gradientConfig.position?.y ?? 50,
                                    },
                                  });
                                }
                              }}
                              min={0}
                              max={100}
                              className="h-8 w-14 text-center font-mono text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm font-medium">
                          {ui.labelCenterY || 'Center Y'}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[gradientConfig.position?.y ?? 50]}
                            onValueChange={([y]) =>
                              updateGradientConfig({
                                position: {
                                  x: gradientConfig.position?.x ?? 50,
                                  y,
                                },
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <div className="flex shrink-0 items-center gap-1">
                            <Input
                              type="number"
                              value={gradientConfig.position?.y ?? 50}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) {
                                  updateGradientConfig({
                                    position: {
                                      x: gradientConfig.position?.x ?? 50,
                                      y: Math.max(0, Math.min(100, v)),
                                    },
                                  });
                                }
                              }}
                              min={0}
                              max={100}
                              className="h-8 w-14 text-center font-mono text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Color Stops */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-sm font-medium">{ui.labelColorStops || 'Color Stops'}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addColorStop}
                      disabled={gradientConfig.colorStops.length >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {gradientConfig.colorStops.map((stop, index) => (
                      <div
                        key={stop.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          selectedStop === stop.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : ''
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Color row */}
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 shrink-0 cursor-pointer rounded border"
                              style={{ backgroundColor: stop.color }}
                              onClick={() => setSelectedStop(stop.id)}
                            />
                            <input
                              type="color"
                              value={stop.color}
                              onChange={(e) =>
                                updateColorStop(stop.id, {
                                  color: e.target.value,
                                })
                              }
                              className="h-8 w-14 shrink-0 cursor-pointer border-0"
                              aria-label={`Color stop ${index + 1} picker`}
                            />
                            <div className="flex-1">
                              <Input
                                type="text"
                                value={stop.color}
                                onChange={(e) => {
                                  const hexValue = e.target.value;
                                  if (
                                    /^#[0-9A-Fa-f]{0,6}$/.test(hexValue) ||
                                    hexValue === ''
                                  ) {
                                    updateColorStop(stop.id, {
                                      color: hexValue,
                                    });
                                  }
                                }}
                                onBlur={(e) => {
                                  const hexValue = e.target.value;
                                  if (
                                    hexValue &&
                                    !/^#[0-9A-Fa-f]{6}$/.test(hexValue)
                                  ) {
                                    if (/^#[0-9A-Fa-f]{3}$/.test(hexValue)) {
                                      const expanded =
                                        '#' +
                                        hexValue[1] +
                                        hexValue[1] +
                                        hexValue[2] +
                                        hexValue[2] +
                                        hexValue[3] +
                                        hexValue[3];
                                      updateColorStop(stop.id, {
                                        color: expanded,
                                      });
                                    } else if (
                                      !/^#/.test(hexValue) &&
                                      /^[0-9A-Fa-f]{3,6}$/.test(hexValue)
                                    ) {
                                      if (hexValue.length === 3) {
                                        const expanded =
                                          '#' +
                                          hexValue[0] +
                                          hexValue[0] +
                                          hexValue[1] +
                                          hexValue[1] +
                                          hexValue[2] +
                                          hexValue[2];
                                        updateColorStop(stop.id, {
                                          color: expanded,
                                        });
                                      } else {
                                        updateColorStop(stop.id, {
                                          color: '#' + hexValue,
                                        });
                                      }
                                    }
                                  }
                                }}
                                placeholder="#FF0000"
                                className="h-8 font-mono text-sm"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeColorStop(stop.id)}
                              disabled={gradientConfig.colorStops.length <= 2}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Position Slider + numeric input */}
                          <div>
                            <Label className="mb-1 block text-xs font-medium">
                              {ui.labelPosition || 'Position'}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[stop.position]}
                                onValueChange={([position]) =>
                                  updateColorStop(stop.id, { position })
                                }
                                min={0}
                                max={100}
                                step={0.1}
                                className="flex-1"
                              />
                              <div className="flex shrink-0 items-center gap-1">
                                <Input
                                  type="number"
                                  value={stop.position}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (!isNaN(v)) {
                                      updateColorStop(stop.id, {
                                        position: Math.max(
                                          0,
                                          Math.min(100, Math.round(v * 10) / 10)
                                        ),
                                      });
                                    }
                                  }}
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  className="h-7 w-14 text-center font-mono text-xs"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </div>
                          </div>

                          {/* Opacity Slider — double-click label to type exact value */}
                          <div>
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="text-xs font-medium">
                                {ui.labelOpacity || 'Opacity:'}
                              </span>
                              {editingOpacityStopId === stop.id ? (
                                <Input
                                  autoFocus
                                  type="number"
                                  defaultValue={Math.round(
                                    (stop.alpha ?? 1) * 100
                                  )}
                                  onBlur={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (!isNaN(v)) {
                                      updateColorStop(stop.id, {
                                        alpha:
                                          Math.max(0, Math.min(100, v)) / 100,
                                      });
                                    }
                                    setEditingOpacityStopId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const v = parseInt(
                                        (e.target as HTMLInputElement).value,
                                        10
                                      );
                                      if (!isNaN(v)) {
                                        updateColorStop(stop.id, {
                                          alpha:
                                            Math.max(0, Math.min(100, v)) / 100,
                                        });
                                      }
                                      setEditingOpacityStopId(null);
                                    }
                                    if (e.key === 'Escape')
                                      setEditingOpacityStopId(null);
                                  }}
                                  min={0}
                                  max={100}
                                  className="h-5 w-12 px-1 text-center font-mono text-xs"
                                />
                              ) : (
                                <span
                                  className="cursor-text rounded px-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                  title={ui.titleDoubleClickOpacity || 'Double-click to type exact value'}
                                  onDoubleClick={() =>
                                    setEditingOpacityStopId(stop.id)
                                  }
                                >
                                  {Math.round((stop.alpha ?? 1) * 100)}%
                                </span>
                              )}
                            </div>
                            <Slider
                              value={[(stop.alpha ?? 1) * 100]}
                              onValueChange={([v]) =>
                                updateColorStop(stop.id, { alpha: v / 100 })
                              }
                              min={0}
                              max={100}
                              step={1}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Generated Code Section */}
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{ui.generatedCodeHeading || 'Generated Code'}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={showCompatibleCSS ? 'compatible' : outputFormat}
                  onValueChange={(v) => {
                    if (v === 'compatible') {
                      setShowCompatibleCSS(true);
                    } else {
                      setShowCompatibleCSS(false);
                      setOutputFormat(v as OutputFormat);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="css">{ui.optionCSSProperty || 'CSS property'}</SelectItem>
                    <SelectItem value="react">{ui.optionReactStyle || 'React style'}</SelectItem>
                    <SelectItem value="cssvar">{ui.optionCSSVariable || 'CSS variable'}</SelectItem>
                    <SelectItem value="compatible">{ui.optionWithFallback || 'With fallback'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleCopyCSS}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? (ui.btnCopied || 'Copied!') : (ui.btnCopy || 'Copy')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCSS}>
                  <Download className="mr-2 h-4 w-4" />
                  {ui.btnDownload || 'Download'}
                </Button>
              </div>
            </div>

            {gradientResult.success ? (
              <div className="space-y-4">
                <Textarea
                  value={outputText}
                  readOnly
                  className="min-h-[100px] font-mono text-sm"
                />

                {gradientResult.svg &&
                  !gradientResult.svg.includes('not supported') && (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">
                        {ui.labelSVG || 'SVG'}
                      </Label>
                      <Textarea
                        value={`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
${gradientResult.svg}
</svg>`}
                        readOnly
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </div>
                  )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  {gradientResult.error || 'Failed to generate gradient'}
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{ui.presetsHeading || 'Gradient Presets'}</h3>
              <Select
                value={selectedPresetCategory}
                onValueChange={setSelectedPresetCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
                  onClick={() => {
                    loadPreset(preset);
                    setActiveTab('editor');
                  }}
                >
                  <div
                    className="mb-3 h-20 rounded border"
                    style={{
                      background:
                        generateGradientCSS(preset.gradient).css || '#f0f0f0',
                    }}
                  />
                  <h4 className="font-medium">{preset.name}</h4>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {preset.category}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{ui.savedGradientsHeading || 'Saved Gradients'}</h3>
              <Badge variant="secondary">{savedGradients.length} saved</Badge>
            </div>

            {savedGradients.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedGradients.map((saved, index) => (
                  <div
                    key={index}
                    className="cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
                    onClick={() => {
                      setGradientConfig(saved.config);
                      setSelectedStop(saved.config.colorStops[0]?.id || null);
                      setActiveTab('editor');
                      toast.success('Gradient loaded!');
                    }}
                  >
                    <div
                      className="mb-3 h-20 rounded border"
                      style={{
                        background:
                          generateGradientCSS(saved.config).css || '#f0f0f0',
                      }}
                    />
                    <div className="text-sm font-medium">{saved.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {saved.config.type} •{' '}
                      {saved.config.colorStops.length} stops
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSaved = savedGradients.filter(
                          (_, i) => i !== index
                        );
                        setSavedGradients(newSaved);
                        localStorage.setItem(
                          'gradient-generator-saved',
                          JSON.stringify(newSaved)
                        );
                        toast.success('Gradient removed');
                      }}
                    >
                      {ui.btnRemove || 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                {ui.emptyFavorites || 'No saved gradients yet. Create a gradient and save it to your favorites!'}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Keyboard Shortcuts */}
      <Card className="p-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="shrink-0">{ui.shortcutsLabel || 'Shortcuts:'}</span>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                Ctrl+C
              </kbd>
              <span className="text-xs">{ui.shortcutCopy || 'Copy'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                Ctrl+R
              </kbd>
              <span className="text-xs">{ui.shortcutRandom || 'Random'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                Ctrl+S
              </kbd>
              <span className="text-xs">{ui.shortcutSave || 'Save'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
