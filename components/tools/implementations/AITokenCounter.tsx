'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calculator,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  BarChart3,
  FileText,
  TrendingDown,
  AlertTriangle,
  Info,
  Upload,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useHydration } from '@/lib/hooks/useHydration';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import {
  AIModel,
  AI_MODELS,
  analyzePrompt,
  compareModels,
  optimizePrompt,
  getPricingUpdateDate,
  type TokenAnalysis,
  type ModelComparison,
  type OptimizationResult,
} from '@/lib/tools/ai-token-counter';

interface AITokenCounterProps extends BaseToolProps {
  dictionary?: any;
}

type ViewMode = 'single' | 'compare' | 'optimize';

interface HistoryItem {
  id: string;
  text: string;
  snippet: string;
  model: AIModel;
  tokens: number;
  timestamp: number;
}

export default function AITokenCounter({ dictionary }: AITokenCounterProps) {
  const ui = dictionary?.tools?.['ai-prompt-token-counter']?.ui ?? {};
  const { copy: copyToClipboard } = useCopy();
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();

  // Main state
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4-turbo');
  const [outputTokenRatio, setOutputTokenRatio] = useState(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  // Analysis results
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);
  const [comparison, setComparison] = useState<ModelComparison[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(
    null
  );

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const saved = localStorage.getItem('ai-token-counter-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 20));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }

    // Load saved input
    try {
      const savedInput = localStorage.getItem('ai-token-counter-input');
      if (savedInput) {
        setInputText(savedInput);
      }
    } catch (e) {
      console.error('Failed to load saved input:', e);
    }
  }, [isHydrated]);

  // Auto-save input
  useEffect(() => {
    if (!isHydrated || !inputText) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem('ai-token-counter-input', inputText);
      } catch (e) {
        console.error('Failed to save input:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputText, isHydrated]);

  // Save history
  useEffect(() => {
    if (!isHydrated || history.length === 0) return;

    try {
      localStorage.setItem('ai-token-counter-history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history, isHydrated]);

  // Analyze text
  useEffect(() => {
    if (!inputText.trim()) {
      setAnalysis(null);
      setComparison([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsProcessing(true);

      try {
        // Single model analysis
        const result = analyzePrompt(
          inputText,
          selectedModel,
          outputTokenRatio
        );
        setAnalysis(result);

        // Multi-model comparison
        if (viewMode === 'compare') {
          const comparisonResult = compareModels(inputText, outputTokenRatio);
          setComparison(comparisonResult);
        }

        // Add to history
        const snippet =
          inputText.length > 50
            ? inputText.substring(0, 50) + '...'
            : inputText;

        setHistory((prev) => {
          const filtered = prev.filter((item) => item.text !== inputText);
          const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            text: inputText,
            snippet,
            model: selectedModel,
            tokens: result.tokens,
            timestamp: Date.now(),
          };
          return [newItem, ...filtered].slice(0, 20);
        });

        // Track in analytics
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'ai-prompt-token-counter',
          input: `${selectedModel}:${inputText.substring(0, 100)}`,
          output: JSON.stringify({
            tokens: result.tokens,
            model: selectedModel,
            cost: result.costEstimate.totalCost,
          }),
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error('Analysis failed:', e);
      } finally {
        setIsProcessing(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText, selectedModel, outputTokenRatio, viewMode, addToHistory]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.match(/\.(txt|md)$/i)) {
        alert('Please upload a .txt or .md file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    },
    []
  );

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.match(/\.(txt|md)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  // Optimize prompt
  const handleOptimize = useCallback(() => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const result = optimizePrompt(inputText, selectedModel);
      setOptimization(result);
      setViewMode('optimize');
    } catch (e) {
      console.error('Optimization failed:', e);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, selectedModel]);

  // Apply optimization
  const handleApplyOptimization = useCallback(() => {
    if (optimization) {
      setInputText(optimization.optimized);
      setOptimization(null);
      setViewMode('single');
    }
  }, [optimization]);

  // Clear all
  const handleClear = useCallback(() => {
    setInputText('');
    setAnalysis(null);
    setComparison([]);
    setOptimization(null);
    if (isHydrated) {
      localStorage.removeItem('ai-token-counter-input');
    }
  }, [isHydrated]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    if (isHydrated) {
      localStorage.removeItem('ai-token-counter-history');
    }
  }, [isHydrated]);

  // Load from history
  const handleLoadHistory = useCallback((item: HistoryItem) => {
    setInputText(item.text);
    setSelectedModel(item.model);
    setShowHistory(false);
  }, []);

  // Copy handler
  const handleCopy = useCallback(
    (text: string, id: string) => {
      copyToClipboard(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    },
    [copyToClipboard]
  );

  // Export results
  const handleExport = useCallback(() => {
    if (!analysis) return;

    const data = {
      text: inputText,
      model: analysis.model.name,
      timestamp: new Date().toISOString(),
      tokenCount: {
        tokens: analysis.tokens,
        characters: analysis.characters,
        words: analysis.words,
        lines: analysis.lines,
      },
      costEstimate: analysis.costEstimate,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
      pricingDate: getPricingUpdateDate(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, inputText]);

  const charCount = inputText.length;
  const wordCount = inputText
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.promptTextInput || 'Prompt / Text Input'}
          </label>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {charCount.toLocaleString()} {ui.characters || 'characters'} ·{' '}
            {wordCount.toLocaleString()} {ui.words || 'words'}
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative"
        >
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={ui.textareaPlaceholder || "Enter your prompt or paste text here...\n\nExample: Write a detailed blog post about machine learning algorithms, including explanations of supervised and unsupervised learning, common algorithms like linear regression and neural networks, and practical applications."}
            className="min-h-[300px] w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            style={{ maxHeight: '600px' }}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              title={ui.uploadFileTitle || 'Upload file'}
              aria-label={ui.uploadFileTitle || 'Upload file'}
            >
              <Upload className="h-4 w-4" />
            </button>
            {inputText && (
              <button
                onClick={handleClear}
                className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                title={ui.clearAllTitle || 'Clear all'}
                aria-label={ui.clearAllTitle || 'Clear all'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Model Selection & Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.aiModelLabel || 'AI Model'}
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {Object.values(AI_MODELS).map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.provider} (
                {(model.contextWindow / 1000).toFixed(0)}k context)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.outputTokenRatioLabel || 'Output Token Ratio:'} {outputTokenRatio.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={outputTokenRatio}
            onChange={(e) => setOutputTokenRatio(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {ui.outputTokenRatioHint || 'Expected output tokens relative to input (for cost estimation)'}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      {analysis && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode('single')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'single'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Calculator className="mr-2 inline h-4 w-4" />
            {ui.tabAnalysis || 'Analysis'}
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'compare'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <BarChart3 className="mr-2 inline h-4 w-4" />
            {ui.tabCompareModels || 'Compare Models'}
          </button>
          <button
            onClick={handleOptimize}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'optimize'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Sparkles className="mr-2 inline h-4 w-4" />
            {ui.tabOptimize || 'Optimize'}
          </button>
        </div>
      )}

      {/* Results Section */}
      {analysis && (
        <div className="space-y-6">
          {/* Single Analysis View */}
          {viewMode === 'single' && (
            <>
              {/* Token Count Card */}
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-800 dark:from-blue-950 dark:to-gray-900">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.tokens.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {ui.statTokens || 'Tokens'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {analysis.characters.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {ui.statCharacters || 'Characters'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {analysis.words.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {ui.statWords || 'Words'}
                    </div>
                  </div>
                </div>

                {/* Context Window Bar */}
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {ui.contextWindowUsage || 'Context Window Usage'}
                    </span>
                    <span className="font-medium">
                      {analysis.percentOfContext.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all ${
                        analysis.percentOfContext > 80
                          ? 'bg-red-500'
                          : analysis.percentOfContext > 50
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100, analysis.percentOfContext)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {analysis.remainingTokens.toLocaleString()} {ui.tokensRemaining || 'tokens remaining'}
                    of {analysis.model.contextWindow.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label={ui.statTokenWordRatio || 'Token/Word Ratio'}
                  value={analysis.tokenToWordRatio.toFixed(2)}
                  icon={<Calculator className="h-5 w-5" />}
                />
                <StatCard
                  label={ui.statLines || 'Lines'}
                  value={analysis.lines.toString()}
                  icon={<FileText className="h-5 w-5" />}
                />
                <StatCard
                  label={ui.statTokenizer || 'Tokenizer'}
                  value={analysis.model.tokenizer}
                  icon={<Info className="h-5 w-5" />}
                />
                <StatCard
                  label={ui.statContextLimit || 'Context Limit'}
                  value={`${(analysis.model.contextWindow / 1000).toFixed(0)}k`}
                  icon={<BarChart3 className="h-5 w-5" />}
                />
              </div>

              {/* Cost Estimation */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <DollarSign className="mr-2 h-5 w-5" />
                  {ui.costEstimation || 'Cost Estimation'}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${analysis.costEstimate.totalCost.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.perRequest || 'Per Request'}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      ${analysis.costEstimate.costPer100Requests.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.per100Requests || 'Per 100 Requests'}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      ${analysis.costEstimate.costPer1000Requests.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.per1000Requests || 'Per 1,000 Requests'}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      ${analysis.costEstimate.costPer10000Requests.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.per10000Requests || 'Per 10,000 Requests'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {ui.pricingAsOf || 'Pricing as of'} {getPricingUpdateDate()} • Input: $
                  {analysis.model.pricing.input}/1M tokens • Output: $
                  {analysis.model.pricing.output}/1M tokens
                </div>
              </div>

              {/* Warnings and Suggestions */}
              {(analysis.warnings.length > 0 ||
                analysis.suggestions.length > 0) && (
                <div className="space-y-4">
                  {analysis.warnings.length > 0 && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                      <div className="flex items-start">
                        <AlertTriangle className="mr-3 h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                            {ui.warnings || 'Warnings'}
                          </h4>
                          <ul className="mt-2 space-y-1 text-sm text-orange-800 dark:text-orange-200">
                            {analysis.warnings.map((warning, idx) => (
                              <li key={idx}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {analysis.suggestions.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                      <div className="flex items-start">
                        <Sparkles className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            {ui.optimizationSuggestions || 'Optimization Suggestions'}
                          </h4>
                          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            {analysis.suggestions.map((suggestion, idx) => (
                              <li key={idx}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Compare View */}
          {viewMode === 'compare' && comparison.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">{ui.tableHeaderModel || 'Model'}</th>
                    <th className="px-4 py-3 text-right">{ui.tableHeaderTokens || 'Tokens'}</th>
                    <th className="px-4 py-3 text-right">{ui.tableHeaderContext || 'Context'}</th>
                    <th className="px-4 py-3 text-right">{ui.tableHeaderUsage || 'Usage %'}</th>
                    <th className="px-4 py-3 text-right">{ui.tableHeaderCost || 'Cost'}</th>
                    <th className="px-4 py-3 text-center">{ui.tableHeaderEfficiency || 'Efficiency'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {comparison.map((comp) => (
                    <tr
                      key={comp.model.id}
                      className={`${
                        comp.model.id === selectedModel
                          ? 'bg-blue-50 dark:bg-blue-950'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{comp.model.name}</div>
                        <div className="text-xs text-gray-500">
                          {comp.model.provider}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {comp.tokenCount.tokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(comp.model.contextWindow / 1000).toFixed(0)}k
                      </td>
                      <td className="px-4 py-3 text-right">
                        {comp.tokenCount.percentOfContext.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ${comp.costEstimate.totalCost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            comp.efficiency === 'best'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : comp.efficiency === 'good'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                : comp.efficiency === 'average'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}
                        >
                          {comp.efficiency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Optimize View */}
          {viewMode === 'optimize' && optimization && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {optimization.tokensSaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.tokensSaved || 'Tokens Saved'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {optimization.percentageReduction.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.reduction || 'Reduction'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {optimization.changes.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ui.optimizations || 'Optimizations'}
                    </div>
                  </div>
                </div>

                {optimization.changes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold">{ui.changesApplied || 'Changes Applied:'}</h4>
                    <ul className="space-y-1 text-sm">
                      {optimization.changes.map((change, idx) => (
                        <li key={idx}>• {change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleApplyOptimization}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    {ui.applyOptimization || 'Apply Optimization'}
                  </button>
                  <button
                    onClick={() => setViewMode('single')}
                    className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {ui.cancel || 'Cancel'}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                    {ui.originalLabel || 'Original ('}
                    {analyzePrompt(optimization.original, selectedModel).tokens}{' '}
                    {ui.tokensUnit || 'tokens)'}
                  </h4>
                  <div className="h-48 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm dark:border-gray-600 dark:bg-gray-800">
                    {optimization.original}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                    {ui.optimizedLabel || 'Optimized ('}
                    {
                      analyzePrompt(optimization.optimized, selectedModel)
                        .tokens
                    }{' '}
                    {ui.tokensUnit || 'tokens)'}
                  </h4>
                  <div className="h-48 overflow-y-auto rounded-lg border border-green-300 bg-green-50 p-3 text-sm dark:border-green-600 dark:bg-green-900">
                    {optimization.optimized}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              {ui.exportJson || 'Export JSON'}
            </button>
            <button
              onClick={() =>
                handleCopy(JSON.stringify(analysis, null, 2), 'analysis')
              }
              className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              {copiedItem === 'analysis' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {ui.copyResults || 'Copy Results'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {isHydrated && history.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              {ui.recentPrompts || 'Recent Prompts'} ({history.length})
            </button>
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="inline h-4 w-4" /> {ui.clearHistory || 'Clear'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  className="dark:hover:bg-gray-750 cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.snippet}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.model} • {item.tokens.toLocaleString()} tokens •{' '}
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </div>
        </div>
        <div className="text-gray-400 dark:text-gray-400">{icon}</div>
      </div>
    </div>
  );
}
