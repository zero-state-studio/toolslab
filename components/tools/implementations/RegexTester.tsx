'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Copy,
  Download,
  Check,
  Loader2,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Target,
  AlertTriangle,
  Clock,
  Zap,
  BookOpen,
  Share2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';

interface RegexMatch {
  match: string;
  index: number;
  groups?: (string | undefined)[];
  namedGroups?: Record<string, string>;
}

interface RegexResult {
  isValid: boolean;
  matches: RegexMatch[];
  error?: string;
  executionTime: number;
  totalMatches: number;
  flags: string;
}

interface PresetPattern {
  name: string;
  pattern: string;
  description: string;
  flags?: string;
  testString?: string;
}

interface RegexTesterProps {
  categoryColor: string;
  dictionary?: any;
}

const PRESET_PATTERNS: PresetPattern[] = [
  {
    name: 'Email Address',
    pattern: '^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$',
    description: 'Validates email format',
    flags: 'i',
    testString:
      'Contact us at info@example.com or support@company.co.uk for help',
  },
  {
    name: 'URL',
    pattern: 'https?://[\\w.-]+\\.[a-z]{2,}(?:/[\\w.-]*)*/?',
    description: 'Matches HTTP/HTTPS URLs',
    flags: 'gi',
    testString: 'Visit https://github.com or http://stackoverflow.com for help',
  },
  {
    name: 'US Phone',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    description: 'US phone number formats',
    flags: 'g',
    testString: 'Call +1-555-0123 or (555) 123-4567 for support',
  },
  {
    name: 'IPv4 Address',
    pattern:
      '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    description: 'Matches IPv4 addresses',
    flags: 'g',
    testString: 'Server IPs: 192.168.1.1, 10.0.0.1, 255.255.255.255',
  },
  {
    name: 'Hex Color',
    pattern: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    description: 'Hex color codes',
    flags: 'gi',
    testString: 'Colors: #FF0000, #00ff00, #00F, rgb(255,0,0)',
  },
  {
    name: 'Date (ISO)',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    description: 'YYYY-MM-DD format',
    flags: 'g',
    testString: 'Events on 2024-01-15 and 2024-12-31 are confirmed',
  },
  {
    name: 'Credit Card',
    pattern: '\\b(?:\\d{4}[\\s-]?){3}\\d{4}\\b',
    description: 'Credit card numbers',
    flags: 'g',
    testString: '4532-1234-5678-9012 or 4532123456789012',
  },
  {
    name: 'HTML Tags',
    pattern: '<\\/?[a-zA-Z][^>]*>',
    description: 'HTML opening/closing tags',
    flags: 'g',
    testString:
      '<div class="container"><p>Hello <strong>World</strong></p></div>',
  },
];

const FLAG_OPTIONS = [
  { key: 'g', labelKey: 'flagGlobal', descKey: 'flagDescGlobal', label: 'Global', description: 'Find all matches' },
  { key: 'i', labelKey: 'flagCaseInsensitive', descKey: 'flagDescCaseInsensitive', label: 'Case Insensitive', description: 'Ignore case' },
  { key: 'm', labelKey: 'flagMultiline', descKey: 'flagDescMultiline', label: 'Multiline', description: '^/$ match line breaks' },
  { key: 's', labelKey: 'flagDotall', descKey: 'flagDescDotall', label: 'Dotall', description: '. matches newlines' },
  { key: 'u', labelKey: 'flagUnicode', descKey: 'flagDescUnicode', label: 'Unicode', description: 'Enable unicode support' },
  { key: 'y', labelKey: 'flagSticky', descKey: 'flagDescSticky', label: 'Sticky', description: 'Match from lastIndex' },
];

// ReDoS protection constants
const REGEX_TIMEOUT_MS = 1000; // Maximum execution time
const MAX_PATTERN_LENGTH = 500; // Maximum pattern length
const MAX_TEST_STRING_LENGTH = 100000; // Maximum test string length

/**
 * Detects potentially dangerous ReDoS patterns.
 * These patterns can cause exponential backtracking.
 */
function detectReDoSPattern(pattern: string): string | null {
  // Patterns that commonly cause ReDoS:
  // 1. Nested quantifiers: (a+)+ or (a*)*
  // 2. Overlapping alternations with quantifiers: (a|a)+
  // 3. Repetition with optional elements: (a+b?)+

  // Check for nested quantifiers
  const nestedQuantifierPattern = /\([^)]*[+*][^)]*\)[+*]/;
  if (nestedQuantifierPattern.test(pattern)) {
    return 'Pattern contains nested quantifiers which may cause performance issues';
  }

  // Check for overlapping alternations
  const overlappingAltPattern = /\(([^|)]+)\|(\1)[^)]*\)[+*]/;
  if (overlappingAltPattern.test(pattern)) {
    return 'Pattern contains overlapping alternations which may cause performance issues';
  }

  // Check for complex repetitions that can backtrack
  const complexRepetition = /(\.\*|\.\+){2,}/;
  if (complexRepetition.test(pattern)) {
    return 'Pattern contains multiple consecutive wildcards which may cause performance issues';
  }

  return null;
}

/**
 * Executes a regex with timeout protection.
 * Uses a simple iteration-based timeout check.
 */
function executeRegexWithTimeout(
  regex: RegExp,
  testStr: string,
  timeoutMs: number
): { matches: RegexMatch[]; timedOut: boolean; error?: string } {
  const matches: RegexMatch[] = [];
  const startTime = performance.now();

  try {
    if (regex.global) {
      let match;
      let iterations = 0;
      const maxIterations = 10000; // Safety limit

      while ((match = regex.exec(testStr)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        });

        // Prevent infinite loop for zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        iterations++;

        // Check timeout periodically
        if (iterations % 100 === 0) {
          if (performance.now() - startTime > timeoutMs) {
            return {
              matches,
              timedOut: true,
              error: `Regex execution timed out after ${timeoutMs}ms. Consider simplifying your pattern.`,
            };
          }
        }

        // Safety limit
        if (iterations >= maxIterations) {
          return {
            matches,
            timedOut: true,
            error: `Too many iterations (>${maxIterations}). Pattern may be too complex.`,
          };
        }
      }
    } else {
      const match = regex.exec(testStr);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        });
      }
    }

    return { matches, timedOut: false };
  } catch (error) {
    return {
      matches: [],
      timedOut: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default function RegexTester({ categoryColor, dictionary }: RegexTesterProps) {
  const ui = dictionary?.tools?.['regex-tester']?.ui ?? {};
  const { downloadJSON } = useDownload();
  const { trackUse, trackCustom, trackError } = useToolTracking('regex-tester');
  const isFirstMount = useRef(true);
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [testString, setTestString] = useState(
    'Contact us at info@example.com or support@company.co.uk'
  );
  const [flags, setFlags] = useState('gi');
  const [result, setResult] = useState<RegexResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [replaceString, setReplaceString] = useState('');
  const [replacementResult, setReplacementResult] = useState('');
  const [viewMode, setViewMode] = useState<'matches' | 'replace' | 'explain'>(
    'matches'
  );

  // Debounced regex testing with ReDoS protection
  const testRegex = useCallback(
    (pattern: string, testStr: string, flags: string) => {
      const debouncedTest = debounce(
        (pattern: string, testStr: string, flags: string) => {
          if (!pattern.trim()) {
            setResult(null);
            return;
          }

          setIsProcessing(true);
          const startTime = performance.now();

          try {
            // Input validation for ReDoS protection
            if (pattern.length > MAX_PATTERN_LENGTH) {
              throw new Error(
                `Pattern too long (max ${MAX_PATTERN_LENGTH} characters). Please use a shorter pattern.`
              );
            }

            if (testStr.length > MAX_TEST_STRING_LENGTH) {
              throw new Error(
                `Test string too long (max ${MAX_TEST_STRING_LENGTH} characters). Please use a shorter string.`
              );
            }

            // Check for potentially dangerous ReDoS patterns
            const redosWarning = detectReDoSPattern(pattern);
            if (redosWarning) {
              // Continue with warning but use strict timeout
              console.warn('ReDoS warning:', redosWarning);
            }

            const regex = new RegExp(pattern, flags);

            // Execute with timeout protection
            const execResult = executeRegexWithTimeout(
              regex,
              testStr,
              REGEX_TIMEOUT_MS
            );

            if (execResult.error && execResult.timedOut) {
              throw new Error(execResult.error);
            }

            const matches = execResult.matches;
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);

            setResult({
              isValid: true,
              matches,
              executionTime,
              totalMatches: matches.length,
              flags,
            });

            // Track successful regex test (but not on first mount)
            if (!isFirstMount.current) {
              trackCustom({
                inputSize: pattern.length,
                outputSize: JSON.stringify(matches).length,
                success: true,
                matchCount: matches.length,
                flags,
              });
            }

            // Generate replacement preview if replace string is provided
            if (replaceString) {
              try {
                // Create fresh regex for replacement (reset lastIndex)
                const replaceRegex = new RegExp(pattern, flags);
                const replaced = testStr.replace(replaceRegex, replaceString);
                setReplacementResult(replaced);
              } catch (err) {
                setReplacementResult(
                  'Error in replacement: ' + (err as Error).message
                );
              }
            }

            setShowResults(true);
          } catch (err) {
            const endTime = performance.now();
            setResult({
              isValid: false,
              matches: [],
              error: (err as Error).message,
              executionTime: Math.round(endTime - startTime),
              totalMatches: 0,
              flags,
            });

            // Track error
            trackError(
              err instanceof Error ? err : new Error(String(err)),
              pattern.length
            );

            setShowResults(true);
          } finally {
            setIsProcessing(false);
          }
        },
        300
      );

      debouncedTest(pattern, testStr, flags);
    },
    [replaceString, trackCustom, trackError]
  );

  // Debounce function
  function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
  ): T {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  useEffect(() => {
    testRegex(pattern, testString, flags);

    // Mark that the first mount has completed
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
  }, [pattern, testString, flags, testRegex]);

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESET_PATTERNS.find((p) => p.name === presetName);
    if (preset) {
      setPattern(preset.pattern);
      setFlags(preset.flags || 'g');
      if (preset.testString) {
        setTestString(preset.testString);
      }
      setSelectedPreset(presetName);
      setShowPresets(false);
    }
  };

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    const params = new URLSearchParams();
    params.set('pattern', pattern);
    params.set('flags', flags);
    params.set('test', testString.substring(0, 500)); // Limit URL length

    const shareUrl = `${window.location.origin}/tools/regex-tester?${params.toString()}`;
    handleCopy(shareUrl);
  };

  const exportMatches = async () => {
    if (!result || result.matches.length === 0) return;

    const data = {
      pattern,
      flags,
      testString,
      matches: result.matches.map((match, index) => ({
        index: index + 1,
        match: match.match,
        position: match.index,
        groups: match.groups,
        namedGroups: match.namedGroups,
      })),
      totalMatches: result.totalMatches,
      executionTime: result.executionTime,
    };

    try {
      await downloadJSON(data, 'regex-matches.json');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const highlightMatches = useMemo(() => {
    if (!result || !result.isValid || result.matches.length === 0) {
      return testString;
    }

    let highlighted = '';
    let lastIndex = 0;

    result.matches.forEach((match, index) => {
      // Add text before match
      highlighted += escapeHtml(testString.slice(lastIndex, match.index));

      // Add highlighted match
      const colorIndex = index % 4;
      const colors = [
        'bg-yellow-200 dark:bg-yellow-800',
        'bg-blue-200 dark:bg-blue-800',
        'bg-green-200 dark:bg-green-800',
        'bg-purple-200 dark:bg-purple-800',
      ];
      highlighted += `<span class="${colors[colorIndex]} px-1 rounded font-semibold" title="Match ${index + 1} at position ${match.index}">${escapeHtml(match.match)}</span>`;

      lastIndex = match.index + match.match.length;
    });

    // Add remaining text
    highlighted += escapeHtml(testString.slice(lastIndex));
    return highlighted;
  }, [result, testString]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ui.heading || 'Regex Tester & Debugger'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <BookOpen className="h-4 w-4" />
            {ui.presetsButton || 'Presets'}
          </button>
          <button
            onClick={handleShare}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title={ui.shareRegexTitle || 'Share regex'}
            aria-label={ui.shareRegexTitle || 'Share regex'}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Preset Patterns */}
        {showPresets && (
          <div className="animate-slideIn rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900">
            <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
              {ui.patternPresetsHeading || 'Pattern Presets'}
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {PRESET_PATTERNS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.name)}
                  className={`rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                    selectedPreset === preset.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preset.description}
                  </div>
                  <code className="mt-1 block font-mono text-xs text-gray-600 dark:text-gray-300">
                    {preset.pattern}
                  </code>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.labelPattern || 'Regular Expression Pattern'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={ui.placeholderPattern || 'Enter regex pattern...'}
              className="w-full rounded-lg border-2 bg-gray-50 px-4 py-3 pr-32 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
              style={{
                borderColor:
                  result?.isValid === false ? '#ef4444' : `${categoryColor}30`,
              }}
              onFocus={(e) => (e.target.style.borderColor = categoryColor)}
              onBlur={(e) =>
                (e.target.style.borderColor =
                  result?.isValid === false ? '#ef4444' : `${categoryColor}30`)
              }
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {/* Match Status Indicator */}
              {result && result.isValid && (
                <div className="flex items-center gap-1">
                  {result.matches.length > 0 ? (
                    <div title={`${result.matches.length} matches found`}>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div title={ui.noMatchesHeading || 'No matches found'}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
              )}
              <div className="text-sm text-gray-400">/{flags}</div>
            </div>
          </div>
          {result && !result.isValid && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" />
              {result.error}
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.labelFlags || 'Flags'}
          </label>
          <div className="flex flex-wrap gap-2">
            {FLAG_OPTIONS.map((flag) => (
              <button
                key={flag.key}
                onClick={() => toggleFlag(flag.key)}
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  flags.includes(flag.key)
                    ? 'text-white'
                    : 'border-2 hover:shadow-md'
                }`}
                style={
                  flags.includes(flag.key)
                    ? { backgroundColor: categoryColor }
                    : { borderColor: categoryColor, color: categoryColor }
                }
                title={ui[flag.descKey] || flag.description}
              >
                {flag.key} - {ui[flag.labelKey] || flag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test String */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {ui.labelTestString || 'Test String'}
          </label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder={ui.placeholderTestString || 'Enter text to test against the regex pattern...'}
            className="h-32 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
            style={{ borderColor: `${categoryColor}30` }}
            onFocus={(e) => (e.target.style.borderColor = categoryColor)}
            onBlur={(e) => (e.target.style.borderColor = `${categoryColor}30`)}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{testString.length} {ui.characters || 'characters'}</span>
            {result && result.isValid && (
              <div className="flex items-center gap-4">
                <span
                  className={`flex items-center gap-1 ${
                    result.matches.length > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.matches.length > 0 ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {result.totalMatches} match
                  {result.totalMatches === 1 ? '' : 'es'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.executionTime}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Tabs */}
        {result && result.isValid && (
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
            {[
              { key: 'matches', labelKey: 'tabMatches', label: 'Matches', icon: Target },
              { key: 'replace', labelKey: 'tabReplace', label: 'Replace', icon: RefreshCw },
              { key: 'explain', labelKey: 'tabExplain', label: 'Explain', icon: BookOpen },
            ].map(({ key, labelKey, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setViewMode(key as 'matches' | 'replace' | 'explain')
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {ui[labelKey] || label}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {showResults && result && (
          <div className="animate-slideIn space-y-4">
            {/* Match Status Banner */}
            {result.isValid && (
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${
                  result.matches.length > 0
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                {result.matches.length > 0 ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">
                        {ui.matchSuccess || 'Pattern matched successfully!'}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Found {result.totalMatches} match
                        {result.totalMatches === 1 ? '' : 'es'} in{' '}
                        {result.executionTime}ms
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-200">
                        {ui.noMatchesHeading || 'No matches found'}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        The pattern doesn&apos;t match any text in the input
                        string (executed in {result.executionTime}ms)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Matches View */}
            {viewMode === 'matches' && result.isValid && (
              <>
                {/* Highlighted Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ui.labelHighlightedMatches || 'Highlighted Matches'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(testString)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                        {ui.copyText || 'Copy Text'}
                      </button>
                      <button
                        onClick={exportMatches}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Download className="h-3 w-3" />
                        {ui.exportButton || 'Export'}
                      </button>
                    </div>
                  </div>
                  <div
                    className="min-h-32 w-full rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm leading-relaxed dark:bg-gray-900"
                    style={{ borderColor: `${categoryColor}30` }}
                    dangerouslySetInnerHTML={{ __html: highlightMatches }}
                  />
                </div>

                {/* Match Details */}
                {result.matches.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ui.labelMatchDetails || 'Match Details'} ({result.totalMatches} matches)
                    </label>
                    <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600">
                      {result.matches.map((match, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-100 p-3 last:border-b-0 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                              Match {index + 1}: &quot;{match.match}&quot;
                            </span>
                            <span className="text-xs text-gray-500">
                              Position {match.index}
                            </span>
                          </div>
                          {match.groups && match.groups.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {ui.groupsLabel || 'Groups:'}
                              </div>
                              <div className="mt-1 space-y-1">
                                {match.groups.map((group, groupIndex) => (
                                  <div key={groupIndex} className="text-xs">
                                    <span className="text-gray-500">
                                      Group {groupIndex + 1}:
                                    </span>{' '}
                                    <span className="font-mono text-gray-900 dark:text-white">
                                      {group || ui.groupEmpty || '(empty)'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {match.namedGroups &&
                            Object.keys(match.namedGroups).length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {ui.namedGroupsLabel || 'Named Groups:'}
                                </div>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(match.namedGroups).map(
                                    ([name, value]) => (
                                      <div key={name} className="text-xs">
                                        <span className="text-gray-500">
                                          {name}:
                                        </span>{' '}
                                        <span className="font-mono text-gray-900 dark:text-white">
                                          {value}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Replace View */}
            {viewMode === 'replace' && result.isValid && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ui.labelReplacementString || 'Replacement String'}
                  </label>
                  <input
                    type="text"
                    value={replaceString}
                    onChange={(e) => setReplaceString(e.target.value)}
                    placeholder={ui.placeholderReplacement || 'Enter replacement text (use $1, $2 for groups)...'}
                    className="w-full rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
                    style={{ borderColor: `${categoryColor}30` }}
                  />
                  <div className="text-xs text-gray-500">
                    {ui.replacementHint || 'Use $1, $2, etc. to reference capture groups, or $& for the full match'}
                  </div>
                </div>

                {replacementResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {ui.labelResultAfterReplacement || 'Result After Replacement'}
                      </label>
                      <button
                        onClick={() => handleCopy(replacementResult)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                        {ui.copyResult || 'Copy Result'}
                      </button>
                    </div>
                    <pre
                      className="w-full rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 dark:bg-gray-900 dark:text-white"
                      style={{ borderColor: `${categoryColor}30` }}
                    >
                      {replacementResult}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Explain View */}
            {viewMode === 'explain' && result.isValid && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">
                    {ui.patternExplanationHeading || 'Pattern Explanation'}
                  </h4>
                  <div className="mt-2 space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <div>
                      <strong>{ui.explainPattern || 'Pattern:'}</strong>{' '}
                      <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">
                        {pattern}
                      </code>
                    </div>
                    <div>
                      <strong>{ui.explainFlags || 'Flags:'}</strong> {flags || ui.flagsNone || 'none'}
                    </div>
                    <div>
                      <strong>{ui.explainPerformance || 'Performance:'}</strong> Found {result.totalMatches}{' '}
                      matches in {result.executionTime}ms
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {ui.commonPatternsHeading || 'Common Regex Patterns'}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <code>\d</code> = digit (0-9)
                    </div>
                    <div>
                      <code>\w</code> = word character (a-z, A-Z, 0-9, _)
                    </div>
                    <div>
                      <code>\s</code> = whitespace
                    </div>
                    <div>
                      <code>.</code> = any character
                    </div>
                    <div>
                      <code>+</code> = one or more
                    </div>
                    <div>
                      <code>*</code> = zero or more
                    </div>
                    <div>
                      <code>?</code> = zero or one
                    </div>
                    <div>
                      <code>^</code> = start of string
                    </div>
                    <div>
                      <code>$</code> = end of string
                    </div>
                    <div>
                      <code>[]</code> = character set
                    </div>
                    <div>
                      <code>()</code> = capturing group
                    </div>
                    <div>
                      <code>(?:)</code> = non-capturing group
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ui.testingPattern || 'Testing pattern...'}
          </div>
        )}
      </div>
    </div>
  );
}
