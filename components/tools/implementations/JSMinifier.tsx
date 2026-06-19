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
  Shield,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolProcessor } from '@/lib/hooks/useToolProcessor';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import {
  minifyJS,
  beautifyJS,
  processJS,
  JSMinifyOptions,
  JSBeautifyOptions,
  JSStats,
} from '@/lib/tools/js-minifier';

interface JSMinifierProps extends BaseToolProps {
  dictionary?: any;
}

export default function JSMinifier({
  categoryColor,
  dictionary,
}: JSMinifierProps) {
  const ui = dictionary?.tools?.['js-minifier']?.ui ?? {};
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'minify' | 'beautify'>('minify');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<JSStats | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [activePreset, setActivePreset] = useState<
    'aggressive' | 'standard' | 'safe' | 'pretty' | null
  >(null);

  // Minify options
  const [minifyOptions, setMinifyOptions] = useState<JSMinifyOptions>({
    compressionLevel: 'standard',
    mangle: true,
    mangleProperties: false,
    removeDeadCode: true,
    removeConsole: false,
    preserveLicense: true,
    preserveFunctionNames: false,
    preserveTypeScript: false,
    optimizeNumbers: true,
    optimizeStrings: true,
    inlineFunctions: false,
    generateSourceMap: false,
    jsx: false,
    moduleFormat: 'auto',
  });

  // Beautify options
  const [beautifyOptions, setBeautifyOptions] = useState<JSBeautifyOptions>({
    indentType: 'spaces',
    indentSize: 2,
    braceStyle: 'collapse',
    insertSemicolons: true,
    maxLineLength: 120,
    preserveNewlines: true,
    wrapAttributes: 'auto',
    spaceAfterKeywords: true,
    spaceInParen: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();
  const { isProcessing, error, processSync } = useToolProcessor<
    string,
    string
  >();
  const { downloadText } = useDownload();
  const { trackUse, trackError } = useToolTracking('js-minifier');

  // Process JavaScript
  const processInput = () => {
    if (!input.trim()) {
      setOutput('');
      setStats(null);
      setValidationError('');
      return;
    }

    try {
      const result = processJS(
        input,
        mode,
        mode === 'minify' ? minifyOptions : beautifyOptions
      );

      if (result.success) {
        setOutput(result.js || '');
        setStats(result.stats || null);
        setValidationError('');
        trackUse(input, result.js || '', { success: true });
      } else {
        setValidationError(result.error || 'Failed to process JavaScript');
        setOutput('');
        setStats(null);
        trackError(
          new Error(result.error || 'Failed to process JavaScript'),
          input.length
        );
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Invalid JavaScript'
      );
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

    const validExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    const isValidFile = validExtensions.some((ext) => file.name.endsWith(ext));

    if (!isValidFile) {
      setValidationError('Please upload a JavaScript or TypeScript file');
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
  const compressionRatio = stats?.savedPercentage || 0;

  // Helper functions to modify options and reset preset
  const updateMinifyOption = (key: keyof JSMinifyOptions, value: any) => {
    setMinifyOptions((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null); // Reset preset when manually changing options
  };

  const updateBeautifyOption = (key: keyof JSBeautifyOptions, value: any) => {
    setBeautifyOptions((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null); // Reset preset when manually changing options
  };

  // Preset configurations
  const applyPreset = (
    preset: 'aggressive' | 'standard' | 'safe' | 'pretty'
  ) => {
    setActivePreset(preset);

    switch (preset) {
      case 'aggressive':
        setMode('minify');
        setMinifyOptions({
          compressionLevel: 'aggressive',
          mangle: true,
          mangleProperties: true,
          removeDeadCode: true,
          removeConsole: true,
          preserveLicense: false,
          preserveFunctionNames: false,
          preserveTypeScript: false,
          optimizeNumbers: true,
          optimizeStrings: true,
          inlineFunctions: true,
          generateSourceMap: false,
          jsx: false,
          moduleFormat: 'auto',
        });
        break;
      case 'standard':
        setMode('minify');
        setMinifyOptions({
          compressionLevel: 'standard',
          mangle: true,
          mangleProperties: false,
          removeDeadCode: true,
          removeConsole: false,
          preserveLicense: true,
          preserveFunctionNames: false,
          preserveTypeScript: false,
          optimizeNumbers: true,
          optimizeStrings: true,
          inlineFunctions: false,
          generateSourceMap: false,
          jsx: false,
          moduleFormat: 'auto',
        });
        break;
      case 'safe':
        setMode('minify');
        setMinifyOptions({
          compressionLevel: 'basic',
          mangle: false,
          mangleProperties: false,
          removeDeadCode: false,
          removeConsole: false,
          preserveLicense: true,
          preserveFunctionNames: true,
          preserveTypeScript: true,
          optimizeNumbers: false,
          optimizeStrings: false,
          inlineFunctions: false,
          generateSourceMap: true,
          jsx: false,
          moduleFormat: 'auto',
        });
        break;
      case 'pretty':
        setMode('beautify');
        setBeautifyOptions({
          indentType: 'spaces',
          indentSize: 2,
          braceStyle: 'collapse',
          insertSemicolons: true,
          maxLineLength: 120,
          preserveNewlines: true,
          wrapAttributes: 'auto',
          spaceAfterKeywords: true,
          spaceInParen: false,
        });
        break;
    }

    // Force immediate processing after preset application
    setTimeout(() => {
      if (input) processInput();
    }, 50);
  };

  return (
    <div className="space-y-6">
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
            {ui.minify || 'Minify'}
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
            {ui.beautify || 'Beautify'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            {ui.options || 'Options'}
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
              {ui.stats || 'Stats'}
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
          {ui.presets || 'Presets:'}
        </span>
        <button
          onClick={() => applyPreset('aggressive')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'aggressive'
              ? 'bg-red-500 text-white ring-2 ring-red-300 dark:ring-red-600'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
          }`}
        >
          <Zap className="h-3 w-3" />
          {ui.aggressive || 'Aggressive'}
          {activePreset === 'aggressive' && <Check className="ml-1 h-3 w-3" />}
        </button>
        <button
          onClick={() => applyPreset('standard')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'standard'
              ? 'bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-600'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
          }`}
        >
          <Code2 className="h-3 w-3" />
          {ui.standard || 'Standard'}
          {activePreset === 'standard' && <Check className="ml-1 h-3 w-3" />}
        </button>
        <button
          onClick={() => applyPreset('safe')}
          className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors ${
            activePreset === 'safe'
              ? 'bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-600'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
          }`}
        >
          <Shield className="h-3 w-3" />
          {ui.safe || 'Safe'}
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
          <FileCode className="h-3 w-3" />
          {ui.prettyPrint || 'Pretty Print'}
          {activePreset === 'pretty' && <Check className="ml-1 h-3 w-3" />}
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          {mode === 'minify' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.mangle}
                    onChange={(e) =>
                      updateMinifyOption('mangle', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.mangleVariableNames || 'Mangle variable names'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.mangleProperties}
                    onChange={(e) =>
                      updateMinifyOption('mangleProperties', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.mangleProperties || 'Mangle properties'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.removeDeadCode}
                    onChange={(e) =>
                      updateMinifyOption('removeDeadCode', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.removeDeadCode || 'Remove dead code'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.removeConsole}
                    onChange={(e) =>
                      updateMinifyOption('removeConsole', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.removeConsoleStatements || 'Remove console statements'}
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
                  {ui.preserveLicenseComments || 'Preserve license comments'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.preserveFunctionNames}
                    onChange={(e) =>
                      updateMinifyOption(
                        'preserveFunctionNames',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.preserveFunctionNames || 'Preserve function names'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.optimizeNumbers}
                    onChange={(e) =>
                      updateMinifyOption('optimizeNumbers', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.optimizeNumbers || 'Optimize numbers'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.optimizeStrings}
                    onChange={(e) =>
                      updateMinifyOption('optimizeStrings', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.optimizeStrings || 'Optimize strings'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.inlineFunctions}
                    onChange={(e) =>
                      updateMinifyOption('inlineFunctions', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.inlineSmallFunctions || 'Inline small functions'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.generateSourceMap}
                    onChange={(e) =>
                      updateMinifyOption('generateSourceMap', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.generateSourceMap || 'Generate source map'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.jsx}
                    onChange={(e) =>
                      updateMinifyOption('jsx', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.jsxReactSupport || 'JSX/React support'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={minifyOptions.preserveTypeScript}
                    onChange={(e) =>
                      updateMinifyOption('preserveTypeScript', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.preserveTypeScript || 'Preserve TypeScript'}
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm">
                  {ui.compressionLevel || 'Compression level:'}
                  <select
                    value={minifyOptions.compressionLevel}
                    onChange={(e) =>
                      updateMinifyOption('compressionLevel', e.target.value)
                    }
                    className="ml-2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="basic">{ui.basic || 'Basic'}</option>
                    <option value="standard">
                      {ui.standard || 'Standard'}
                    </option>
                    <option value="advanced">
                      {ui.advanced || 'Advanced'}
                    </option>
                    <option value="aggressive">
                      {ui.aggressive || 'Aggressive'}
                    </option>
                  </select>
                </label>

                <label className="text-sm">
                  {ui.moduleFormat || 'Module format:'}
                  <select
                    value={minifyOptions.moduleFormat}
                    onChange={(e) =>
                      updateMinifyOption('moduleFormat', e.target.value)
                    }
                    className="ml-2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="auto">
                      {ui.autoDetect || 'Auto-detect'}
                    </option>
                    <option value="es6">
                      {ui.es6Modules || 'ES6 Modules'}
                    </option>
                    <option value="commonjs">CommonJS</option>
                    <option value="umd">UMD</option>
                  </select>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.insertSemicolons}
                    onChange={(e) =>
                      updateBeautifyOption('insertSemicolons', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.insertSemicolons || 'Insert semicolons'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.preserveNewlines}
                    onChange={(e) =>
                      updateBeautifyOption('preserveNewlines', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.preserveNewlines || 'Preserve newlines'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.spaceAfterKeywords}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'spaceAfterKeywords',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.spaceAfterKeywords || 'Space after keywords'}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={beautifyOptions.spaceInParen}
                    onChange={(e) =>
                      updateBeautifyOption('spaceInParen', e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  {ui.spaceInParentheses || 'Space in parentheses'}
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm">
                  {ui.indentType || 'Indent type:'}
                  <select
                    value={beautifyOptions.indentType}
                    onChange={(e) =>
                      updateBeautifyOption('indentType', e.target.value)
                    }
                    className="ml-2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="spaces">{ui.spaces || 'Spaces'}</option>
                    <option value="tabs">{ui.tabs || 'Tabs'}</option>
                  </select>
                </label>

                <label className="text-sm">
                  {ui.indentSize || 'Indent size:'}
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={beautifyOptions.indentSize}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'indentSize',
                        parseInt(e.target.value)
                      )
                    }
                    className="ml-2 w-16 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>

                <label className="text-sm">
                  {ui.braceStyle || 'Brace style:'}
                  <select
                    value={beautifyOptions.braceStyle}
                    onChange={(e) =>
                      updateBeautifyOption('braceStyle', e.target.value)
                    }
                    className="ml-2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="collapse">Collapse</option>
                    <option value="expand">Expand</option>
                    <option value="end-expand">End Expand</option>
                    <option value="allman">Allman</option>
                  </select>
                </label>

                <label className="text-sm">
                  {ui.maxLineLength || 'Max line length:'}
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={beautifyOptions.maxLineLength}
                    onChange={(e) =>
                      updateBeautifyOption(
                        'maxLineLength',
                        parseInt(e.target.value)
                      )
                    }
                    className="ml-2 w-20 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics panel */}
      {showStats && stats && (
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.originalSize.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.originalBytes || 'Original bytes'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.minifiedSize.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {mode === 'minify'
                  ? ui.minifiedBytes || 'Minified bytes'
                  : ui.beautifiedBytes || 'Beautified bytes'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.savedPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.sizeReduction || 'Size reduction'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.processingTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.processingTime || 'Processing time'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {stats.totalFunctions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.functions || 'Functions'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {stats.totalClasses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.classes || 'Classes'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {stats.totalVariables}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.variables || 'Variables'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {stats.totalLines}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ui.lines || 'Lines'}
              </div>
            </div>
          </div>

          {stats.optimizationsApplied.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.optimizationsApplied || 'Optimizations Applied:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.optimizationsApplied.map((opt, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.javascriptInput || 'JavaScript Input'}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Upload className="h-4 w-4" />
              {ui.uploadFile || 'Upload File'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".js,.ts,.jsx,.tsx,.mjs,.cjs"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {uploadedFileName && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
            <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {uploadedFileName}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              ({(uploadedFileSize / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            ui.inputPlaceholder || 'Paste your JavaScript code here...'
          }
          className="min-h-[200px] w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />

        {validationError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {validationError}
            </span>
          </div>
        )}
      </div>

      {/* Output section */}
      {output && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'minify'
                ? ui.minifiedJavascript || 'Minified JavaScript'
                : ui.beautifiedJavascript || 'Beautified JavaScript'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copy(output)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? ui.copied || 'Copied!' : ui.copy || 'Copy'}
              </button>
              <button
                onClick={() =>
                  downloadText(output, {
                    filename: `${uploadedFileName || 'javascript'}${
                      mode === 'minify' ? '.min' : '.formatted'
                    }.js`,
                    mimeType: 'application/javascript',
                  })
                }
                className="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600"
              >
                <Download className="h-4 w-4" />
                {ui.download || 'Download'}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={output}
              readOnly
              className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
