'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Download,
  Check,
  Loader2,
  FileCode,
  Minimize2,
  Maximize2,
  Upload,
  File,
  AlertCircle,
  Settings,
  ChevronDown,
  BarChart3,
  Zap,
  Code2,
  Palette,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolProcessor } from '@/lib/hooks/useToolProcessor';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import {
  minifyCSS,
  beautifyCSS,
  processCSS,
  analyzeCSS,
  CSSMinifyOptions,
  CSSBeautifyOptions,
  CSSStats,
} from '@/lib/tools/css-minifier';

interface CSSMinifierProps extends BaseToolProps {}

export default function CSSMinifier({ categoryColor, dictionary }: CSSMinifierProps) {
  const ui = dictionary?.tools?.['css-minifier']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'minify' | 'beautify'>('minify');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<CSSStats | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [activePreset, setActivePreset] = useState<
    'maximum' | 'safe' | 'pretty' | null
  >(null);

  // Minify options
  const [minifyOptions, setMinifyOptions] = useState<CSSMinifyOptions>({
    removeComments: true,
    removeWhitespace: true,
    optimizeColors: true,
    optimizeUnits: true,
    mergeShorthand: true,
    removeDuplicateRules: true,
    mergeAdjacentRules: true,
    removeEmptyRules: true,
    preserveImportant: true,
    preserveLicense: true,
    preserveCustomProperties: true,
  });

  // Beautify options
  const [beautifyOptions, setBeautifyOptions] = useState<CSSBeautifyOptions>({
    indentType: 'spaces',
    indentSize: 2,
    newlineBetweenRules: true,
    selectorSeparator: 'space',
    bracketStyle: 'same-line',
    propertyCase: 'lowercase',
    alignVendorPrefixes: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();
  const { isProcessing, error, processSync } = useToolProcessor<
    string,
    string
  >();
  const { downloadText } = useDownload();
  const { trackUse, trackError } = useToolTracking('css-minifier');

  // Process CSS
  const processInput = () => {
    if (!input.trim()) {
      setOutput('');
      setStats(null);
      setValidationError('');
      return;
    }

    try {
      const result = processCSS(
        input,
        mode,
        mode === 'minify' ? minifyOptions : beautifyOptions
      );

      if (result.success) {
        setOutput(result.css);
        setStats(result.stats || null);
        setValidationError('');
        trackUse(input, result.css, { success: true });
      } else {
        setValidationError(result.error || 'Failed to process CSS');
        setOutput('');
        setStats(null);
        trackError(
          new Error(result.error || 'Failed to process CSS'),
          input.length
        );
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Invalid CSS');
      setOutput('');
      setStats(null);
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
    }
  };

  // Auto-process on input or option changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input) processInput();
    }, 300);

    return () => clearTimeout(timer);
  }, [input, mode, minifyOptions, beautifyOptions]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.css')) {
      setValidationError('Please upload a CSS file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      setValidationError('');
    };
    reader.onerror = () => {
      setValidationError('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Calculate compression percentage
  const compressionRatio = stats?.compressionRatio || 0;

  // Helper functions to modify options and reset preset
  const updateMinifyOption = (key: keyof CSSMinifyOptions, value: any) => {
    setMinifyOptions((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null); // Reset preset when manually changing options
  };

  const updateBeautifyOption = (key: keyof CSSBeautifyOptions, value: any) => {
    setBeautifyOptions((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null); // Reset preset when manually changing options
  };

  // Preset configurations
  const applyPreset = (preset: 'maximum' | 'safe' | 'pretty') => {
    setActivePreset(preset);

    switch (preset) {
      case 'maximum':
        setMode('minify');
        setMinifyOptions({
          removeComments: true,
          removeWhitespace: true,
          optimizeColors: true,
          optimizeUnits: true,
          mergeShorthand: true,
          removeDuplicateRules: true,
          mergeAdjacentRules: true,
          removeEmptyRules: true,
          mergeMediaQueries: true,
          preserveImportant: false,
          preserveLicense: false,
          preserveCustomProperties: false,
        });
        break;
      case 'safe':
        setMode('minify');
        setMinifyOptions({
          removeComments: true,
          removeWhitespace: true,
          optimizeColors: false,
          optimizeUnits: true,
          mergeShorthand: false,
          removeDuplicateRules: true,
          mergeAdjacentRules: false,
          removeEmptyRules: true,
          preserveImportant: true,
          preserveLicense: true,
          preserveCustomProperties: true,
        });
        break;
      case 'pretty':
        setMode('beautify');
        setBeautifyOptions({
          indentType: 'spaces',
          indentSize: 2,
          newlineBetweenRules: true,
          selectorSeparator: 'newline',
          bracketStyle: 'same-line',
          propertyCase: 'lowercase',
          alignVendorPrefixes: true,
        });
        break;
    }

    // Force immediate processing after preset application
    setTimeout(() => {
      if (input) processInput();
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* Mode selector and actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMode('minify');
              setActivePreset(null); // Reset preset when manually changing mode
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              mode === 'minify'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Minimize2 className="h-4 w-4" />
            {ui.modeMinify || 'Minify'}
          </button>
          <button
            onClick={() => {
              setMode('beautify');
              setActivePreset(null); // Reset preset when manually changing mode
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              mode === 'beautify'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Maximize2 className="h-4 w-4" />
            {ui.modeBeautify || 'Beautify'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            {ui.btnOptions || 'Options'}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showOptions ? 'rotate-180' : ''}`}
            />
          </button>
          {stats && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <BarChart3 className="h-4 w-4" />
              {ui.btnStats || 'Stats'}
              {compressionRatio > 0 && (
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                  -{compressionRatio.toFixed(0)}%
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="mr-2 self-center text-sm text-gray-600 dark:text-gray-400">
          {ui.presetsLabel || 'Presets:'}
        </span>
        <button
          onClick={() => applyPreset('maximum')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'maximum'
              ? 'bg-red-500 text-white ring-2 ring-red-300 dark:ring-red-600'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
          }`}
        >
          <Zap className="h-3 w-3" />
          {ui.presetMaximum || 'Maximum Compression'}
          {activePreset === 'maximum' && <Check className="ml-1 h-3 w-3" />}
        </button>
        <button
          onClick={() => applyPreset('safe')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'safe'
              ? 'bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-600'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
          }`}
        >
          <Check className="h-3 w-3" />
          {ui.presetSafe || 'Safe Optimization'}
          {activePreset === 'safe' && <Check className="ml-1 h-3 w-3" />}
        </button>
        <button
          onClick={() => applyPreset('pretty')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'pretty'
              ? 'bg-purple-500 text-white ring-2 ring-purple-300 dark:ring-purple-600'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
          }`}
        >
          <Palette className="h-3 w-3" />
          {ui.presetPretty || 'Pretty Print'}
          {activePreset === 'pretty' && <Check className="ml-1 h-3 w-3" />}
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          {mode === 'minify' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.removeComments}
                  onChange={(e) =>
                    updateMinifyOption('removeComments', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optRemoveComments || 'Remove comments'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.optimizeColors}
                  onChange={(e) =>
                    updateMinifyOption('optimizeColors', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optOptimizeColors || 'Optimize colors'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.optimizeUnits}
                  onChange={(e) =>
                    updateMinifyOption('optimizeUnits', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optOptimizeUnits || 'Optimize units'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.mergeShorthand}
                  onChange={(e) =>
                    updateMinifyOption('mergeShorthand', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optMergeShorthand || 'Merge shorthand'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.removeDuplicateRules}
                  onChange={(e) =>
                    updateMinifyOption('removeDuplicateRules', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optRemoveDuplicates || 'Remove duplicates'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.mergeAdjacentRules}
                  onChange={(e) =>
                    updateMinifyOption('mergeAdjacentRules', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optMergeAdjacentRules || 'Merge adjacent rules'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.removeEmptyRules}
                  onChange={(e) =>
                    updateMinifyOption('removeEmptyRules', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optRemoveEmptyRules || 'Remove empty rules'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.preserveLicense}
                  onChange={(e) =>
                    updateMinifyOption('preserveLicense', e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                {ui.optPreserveLicense || 'Preserve license comments'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={minifyOptions.preserveCustomProperties}
                  onChange={(e) =>
                    updateMinifyOption(
                      'preserveCustomProperties',
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300"
                />
                {ui.optPreserveCssVariables || 'Preserve CSS variables'}
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {ui.labelIndentation || 'Indentation'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={beautifyOptions.indentType}
                      onChange={(e) =>
                        updateBeautifyOption(
                          'indentType',
                          e.target.value as 'spaces' | 'tabs'
                        )
                      }
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <option value="spaces">{ui.indentSpaces || 'Spaces'}</option>
                      <option value="tabs">{ui.indentTabs || 'Tabs'}</option>
                    </select>
                    <select
                      value={beautifyOptions.indentSize}
                      onChange={(e) =>
                        updateBeautifyOption(
                          'indentSize',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20 rounded-md border border-gray-300 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <option value="2">2</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {ui.labelBracketStyle || 'Bracket style'}
                  </label>
                  <select
                    value={beautifyOptions.bracketStyle}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'bracketStyle',
                        e.target.value as 'same-line' | 'new-line'
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="same-line">{ui.bracketSameLine || 'Same line'}</option>
                    <option value="new-line">{ui.bracketNewLine || 'New line'}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {ui.labelSelectorSeparator || 'Selector separator'}
                  </label>
                  <select
                    value={beautifyOptions.selectorSeparator}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'selectorSeparator',
                        e.target.value as 'newline' | 'space'
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="space">{ui.separatorSpace || 'Space'}</option>
                    <option value="newline">{ui.separatorNewLine || 'New line'}</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.newlineBetweenRules}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'newlineBetweenRules',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.optNewLineBetweenRules || 'New line between rules'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.alignVendorPrefixes}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'alignVendorPrefixes',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.optAlignVendorPrefixes || 'Align vendor prefixes'}
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics panel */}
      {showStats && stats && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="mb-3 flex items-center gap-2 font-medium">
            <BarChart3 className="h-4 w-4" />
            {ui.statsHeading || 'CSS Statistics'}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:grid-cols-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statOriginal || 'Original:'}
              </span>
              <span className="ml-2 font-medium">
                {(stats.originalSize / 1024).toFixed(2)} KB
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statMinified || 'Minified:'}
              </span>
              <span className="ml-2 font-medium">
                {(stats.minifiedSize / 1024).toFixed(2)} KB
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">{ui.statSaved || 'Saved:'}</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                {compressionRatio.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">{ui.statRules || 'Rules:'}</span>
              <span className="ml-2 font-medium">{stats.totalRules}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statSelectors || 'Selectors:'}
              </span>
              <span className="ml-2 font-medium">{stats.totalSelectors}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statDeclarations || 'Declarations:'}
              </span>
              <span className="ml-2 font-medium">
                {stats.totalDeclarations}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statMediaQueries || 'Media queries:'}
              </span>
              <span className="ml-2 font-medium">
                {stats.totalMediaQueries}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {ui.statKeyframes || 'Keyframes:'}
              </span>
              <span className="ml-2 font-medium">{stats.totalKeyframes}</span>
            </div>
          </div>
        </div>
      )}

      {/* Input/Output areas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ui.labelInputCss || 'Input CSS'}
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".css"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Upload className="h-3 w-3" />
                {ui.btnUpload || 'Upload'}
              </button>
              {input && (
                <button
                  onClick={() => {
                    setInput('');
                    setOutput('');
                    setStats(null);
                    setUploadedFileName('');
                    setValidationError('');
                  }}
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  {ui.btnClear || 'Clear'}
                </button>
              )}
            </div>
          </div>
          {uploadedFileName && (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <File className="h-3 w-3" />
              <span>{uploadedFileName}</span>
              <span>({(uploadedFileSize / 1024).toFixed(1)} KB)</span>
            </div>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholderInput || 'Paste your CSS here or upload a file...'}
            className="h-64 w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {ui.labelOutputCss || 'Output CSS'}
            </label>
            <div className="flex gap-2">
              {output && (
                <>
                  <button
                    onClick={() => copy(output)}
                    className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? (ui.btnCopied || 'Copied') : (ui.btnCopy || 'Copy')}
                  </button>
                  <button
                    onClick={() =>
                      downloadText(output, {
                        filename:
                          mode === 'minify' ? 'styles.min.css' : 'styles.css',
                        mimeType: 'text/css',
                      })
                    }
                    className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Download className="h-3 w-3" />
                    {ui.btnDownload || 'Download'}
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={
              validationError ? '' : (ui.placeholderOutput || 'Processed CSS will appear here...')
            }
            className={`h-64 w-full rounded-lg border p-3 font-mono text-sm ${
              validationError
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900'
            }`}
            spellCheck={false}
          />
          {validationError && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {ui.processingLabel || 'Processing CSS...'}
          </span>
        </div>
      )}
    </div>
  );
}
