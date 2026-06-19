'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  BoxShadowLayer,
  defaultLayer,
  generateBoxShadowCSS,
  shadowLayerToCSS,
  BOX_SHADOW_PRESETS,
} from '@/lib/tools/css-box-shadow-generator';

interface CssBoxShadowGeneratorProps extends BaseToolProps {}

export default function CssBoxShadowGenerator({
  dictionary,
}: CssBoxShadowGeneratorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const t = dictionary?.tools?.['css-box-shadow-generator'] || {};
  const labels = {
    preview: t.preview || 'Preview',
    inset: t.inset || 'Inset',
    offsetX: t.offsetX || 'Offset X',
    offsetY: t.offsetY || 'Offset Y',
    blur: t.blur || 'Blur',
    spread: t.spread || 'Spread',
    color: t.color || 'Color',
    opacity: t.opacity || 'Opacity',
    addLayer: t.addLayer || 'Add layer',
    layer: t.layer || 'Layer',
    presets: t.presets || 'Presets',
    copy: t.copy || 'Copy CSS',
    copied: t.copied || 'Copied!',
    cssOutput: t.cssOutput || 'CSS',
    shadowColor: t.shadowColor || 'Shadow color',
    boxColor: t.boxColor || 'Box color',
  };

  const [layers, setLayers] = useState<BoxShadowLayer[]>([defaultLayer()]);
  const [active, setActive] = useState(0);
  const [boxColor, setBoxColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const tracked = useRef(false);

  const result = useMemo(() => generateBoxShadowCSS(layers), [layers]);
  const current = layers[active] ?? layers[0];

  // Analytics: track once per editing session (debounced).
  useEffect(() => {
    if (tracked.current) return;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      if (result.success) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'css-box-shadow-generator',
          input: `${layers.length} layer(s)`,
          output: result.value ?? '',
          timestamp: startTime,
        });
        tracked.current = true;
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [layers, result, addToHistory]);

  useEffect(() => {
    scrollToResult();
  }, [scrollToResult]);

  const updateLayer = (patch: Partial<BoxShadowLayer>) => {
    setLayers((prev) =>
      prev.map((l, i) => (i === active ? { ...l, ...patch } : l))
    );
  };

  const addLayer = () => {
    setLayers((prev) => [...prev, defaultLayer()]);
    setActive(layers.length);
  };

  const removeLayer = (index: number) => {
    if (layers.length === 1) return;
    setLayers((prev) => prev.filter((_, i) => i !== index));
    setActive((a) => Math.max(0, a >= index ? a - 1 : a));
  };

  const applyPreset = (presetLayers: BoxShadowLayer[]) => {
    setLayers(presetLayers.map((l) => ({ ...l })));
    setActive(0);
  };

  const handleCopy = async () => {
    if (!result.declaration) return;
    await navigator.clipboard.writeText(result.declaration);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sliders: {
    key: keyof BoxShadowLayer;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'offsetX', label: labels.offsetX, min: -100, max: 100, step: 1 },
    { key: 'offsetY', label: labels.offsetY, min: -100, max: 100, step: 1 },
    { key: 'blur', label: labels.blur, min: 0, max: 200, step: 1 },
    { key: 'spread', label: labels.spread, min: -100, max: 100, step: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-sm font-medium text-gray-500">
          {labels.presets}:
        </span>
        {BOX_SHADOW_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p.layers)}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:border-violet-400 dark:border-gray-700"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Preview */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-500">
            {labels.preview}
          </span>
          <div
            className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0_25%,transparent_0_50%)] bg-[length:24px_24px] dark:border-gray-700"
          >
            <div
              className="h-32 w-44 rounded-xl transition-all"
              style={{ backgroundColor: boxColor, boxShadow: result.value }}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">{labels.boxColor}</label>
            <input
              type="color"
              value={boxColor}
              onChange={(e) => setBoxColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Layer tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {layers.map((_, i) => (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => setActive(i)}
                  className={`rounded-l-md px-3 py-1 text-xs font-medium ${
                    i === active
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {labels.layer} {i + 1}
                </button>
                <button
                  onClick={() => removeLayer(i)}
                  disabled={layers.length === 1}
                  className={`rounded-r-md px-1 py-1 ${
                    i === active
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  } disabled:opacity-30`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={addLayer}
              className="flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 hover:border-violet-400 dark:border-gray-600"
            >
              <Plus className="h-3 w-3" />
              {labels.addLayer}
            </button>
          </div>

          {/* Inset toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current.inset}
              onChange={(e) => updateLayer({ inset: e.target.checked })}
            />
            {labels.inset}
          </label>

          {/* Sliders */}
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{s.label}</span>
                <span className="tabular-nums">
                  {current[s.key] as number}px
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={current[s.key] as number}
                onChange={(e) =>
                  updateLayer({ [s.key]: Number(e.target.value) } as Partial<BoxShadowLayer>)
                }
                className="w-full"
              />
            </div>
          ))}

          {/* Color + opacity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">
                {labels.shadowColor}
              </label>
              <input
                type="color"
                value={current.color}
                onChange={(e) => updateLayer({ color: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{labels.opacity}</span>
                <span className="tabular-nums">
                  {Math.round(current.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={current.opacity}
                onChange={(e) => updateLayer({ opacity: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CSS output */}
      <div ref={resultRef} className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            {labels.cssOutput}
          </span>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-1 h-4 w-4 text-green-600" />
            ) : (
              <Copy className="mr-1 h-4 w-4" />
            )}
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
          <code>{result.declaration}</code>
        </pre>
      </div>
    </div>
  );
}
