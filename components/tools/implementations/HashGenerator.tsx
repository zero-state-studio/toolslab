'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Shield,
  Hash,
  Upload,
  AlertTriangle,
  FileText,
  List,
  Type,
} from 'lucide-react';
import { useMultiCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps, HashAlgorithm } from '@/lib/types/tools';
import {
  generateHash,
  generateAllHashes,
  generateHmac,
  generateAllHmacs,
  hashFileAllAlgorithms,
  bulkHash,
  formatHash,
  formatAllHashesForCopy,
  detectHashType,
  getAlgorithmInfo,
  formatFileSize,
  ALL_ALGORITHMS,
  HMAC_ALGORITHMS,
  type OutputFormat,
  type HashMode,
  type InputMode,
  type SaltPosition,
  type BulkHashResult,
} from '@/lib/tools/hash-generator';

interface HashGeneratorProps extends BaseToolProps {}

export default function HashGenerator({
  categoryColor,
  dictionary,
}: HashGeneratorProps) {
  // UI strings from i18n, with English fallbacks
  const t = dictionary?.ui || {};
  const txt = (key: string, fallback: string) => t[key] || fallback;

  // ─── State ──────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [salt, setSalt] = useState('');
  const [saltPosition, setSaltPosition] = useState<SaltPosition>('prepend');
  const [compareMode, setCompareMode] = useState(false);
  const [compareHash, setCompareHash] = useState('');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [hashMode, setHashMode] = useState<HashMode>('hash');
  const [hmacKey, setHmacKey] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [copiedAll, setCopiedAll] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [isFileHashing, setIsFileHashing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkHashResult[]>([]);

  // Hooks
  const { copy, isCopied } = useMultiCopy<string>();
  const { trackCustom, trackError } = useToolTracking('hash-generator');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });
  const { addToHistory } = useToolStore();

  // ─── Computed ─────────────────────────────────────────────────────────

  const algorithms = useMemo(
    () => (hashMode === 'hmac' ? HMAC_ALGORITHMS : ALL_ALGORITHMS),
    [hashMode]
  );

  const detectedTypes = useMemo(() => {
    if (!compareHash.trim()) return [];
    return detectHashType(compareHash);
  }, [compareHash]);

  const primaryAlgoInfo = useMemo(
    () => getAlgorithmInfo(algorithm),
    [algorithm]
  );

  // ─── Text Hash Generation ────────────────────────────────────────────

  const generateTextHashes = useCallback(async () => {
    if (!input) {
      setHashes({});
      return;
    }

    if (hashMode === 'hmac' && !hmacKey) {
      setHashes({});
      return;
    }

    try {
      const startTime = Date.now();
      let result: Record<string, string>;

      if (hashMode === 'hmac') {
        const hmacResult = await generateAllHmacs(input, hmacKey);
        result = hmacResult.success ? hmacResult.hashes : {};
      } else {
        const hashResult = await generateAllHashes(input, salt || undefined, saltPosition);
        result = hashResult.success ? hashResult.hashes : {};
      }

      setHashes(result);

      // Track usage
      const primaryHash = hashMode === 'hmac'
        ? result[`HMAC-${algorithm}`]
        : result[algorithm];

      if (primaryHash) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'hash-generator',
          input,
          output: primaryHash,
          timestamp: startTime,
        });
        trackCustom({
          inputSize: input.length,
          outputSize: primaryHash.length,
          success: true,
          algorithm,
          hashMode,
          hasSalt: !!salt,
        });
      }
    } catch (err) {
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
      setHashes({});
    }
  }, [input, salt, saltPosition, algorithm, hashMode, hmacKey, addToHistory, trackCustom, trackError]);

  useEffect(() => {
    if (inputMode === 'text') {
      generateTextHashes();
    }
  }, [inputMode, generateTextHashes]);

  // Scroll to result when hashes change
  useEffect(() => {
    if (Object.keys(hashes).length > 0) {
      scrollToResult();
    }
  }, [hashes, scrollToResult]);

  // ─── File Hashing ────────────────────────────────────────────────────

  const handleFileHash = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setIsFileHashing(true);
      setFileProgress(0);
      setHashes({});

      try {
        const startTime = Date.now();
        const result = await hashFileAllAlgorithms(file, setFileProgress);

        if (result.success) {
          setHashes(result.hashes);
          const primaryHash = result.hashes[algorithm];
          if (primaryHash) {
            addToHistory({
              id: crypto.randomUUID(),
              tool: 'hash-generator',
              input: `[File] ${file.name} (${formatFileSize(file.size)})`,
              output: primaryHash,
              timestamp: startTime,
            });
          }
        }
      } catch (err) {
        trackError(
          err instanceof Error ? err : new Error(String(err)),
          file.size
        );
      } finally {
        setIsFileHashing(false);
      }
    },
    [algorithm, addToHistory, trackError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileHash(file);
    },
    [handleFileHash]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileHash(file);
    },
    [handleFileHash]
  );

  // ─── Bulk Hashing ───────────────────────────────────────────────────

  const handleBulkHash = useCallback(async () => {
    if (!bulkInput.trim()) {
      setBulkResults([]);
      return;
    }

    const lines = bulkInput.split('\n');
    const results = await bulkHash(lines, algorithm);
    setBulkResults(results);

    if (results.length > 0) {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'hash-generator',
        input: `[Bulk] ${results.length} inputs`,
        output: results.map((r) => r.hash).join('\n'),
        timestamp: Date.now(),
      });
    }
  }, [bulkInput, algorithm, addToHistory]);

  useEffect(() => {
    if (inputMode === 'bulk') {
      handleBulkHash();
    }
  }, [inputMode, handleBulkHash]);

  // Scroll for bulk results
  useEffect(() => {
    if (bulkResults.length > 0) {
      scrollToResult();
    }
  }, [bulkResults, scrollToResult]);

  // ─── Compare ─────────────────────────────────────────────────────────

  const handleCompare = () => {
    const key =
      hashMode === 'hmac' ? `HMAC-${algorithm}` : algorithm;
    if (compareHash && hashes[key]) {
      const formatted = formatHash(hashes[key], outputFormat);
      setIsMatch(
        compareHash.trim().toLowerCase() === formatted.toLowerCase()
      );
    }
  };

  // ─── Copy All ────────────────────────────────────────────────────────

  const handleCopyAll = async () => {
    const text = formatAllHashesForCopy(hashes, outputFormat);
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // ─── Format Helper ───────────────────────────────────────────────────

  const fmt = (hash: string) => formatHash(hash, outputFormat);

  // ─── Reset when changing mode ────────────────────────────────────────

  useEffect(() => {
    if (hashMode === 'hmac' && !HMAC_ALGORITHMS.includes(algorithm)) {
      setAlgorithm('SHA-256');
    }
  }, [hashMode, algorithm]);

  // ─── Render ──────────────────────────────────────────────────────────

  const hasResults =
    inputMode === 'bulk' ? bulkResults.length > 0 : Object.keys(hashes).length > 0;

  const primaryKey = hashMode === 'hmac' ? `HMAC-${algorithm}` : algorithm;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {dictionary?.title || 'Hash Generator'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Hash / HMAC toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setHashMode('hash')}
              className={`px-3 py-1 text-sm transition-colors ${
                hashMode === 'hash'
                  ? 'bg-gray-200 font-medium dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {txt('hashMode', 'Hash')}
            </button>
            <button
              onClick={() => setHashMode('hmac')}
              className={`px-3 py-1 text-sm transition-colors ${
                hashMode === 'hmac'
                  ? 'bg-gray-200 font-medium dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {txt('hmacMode', 'HMAC')}
            </button>
          </div>
          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              compareMode
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {txt('compareMode', 'Compare')}
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Input Mode Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
          {(
            [
              { mode: 'text' as InputMode, icon: Type, label: txt('textTab', 'Text') },
              { mode: 'file' as InputMode, icon: Upload, label: txt('fileTab', 'File') },
              { mode: 'bulk' as InputMode, icon: List, label: txt('bulkTab', 'Bulk') },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => {
                setInputMode(mode);
                setHashes({});
                setBulkResults([]);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                inputMode === mode
                  ? 'bg-white shadow-sm dark:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Text Input ─────────────────────────────────────────── */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {txt('textToHash', 'Text to Hash')}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dictionary?.placeholder || 'Enter text to hash...'}
              className="h-32 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
              style={{ borderColor: `${categoryColor}30` }}
              onFocus={(e) => (e.target.style.borderColor = categoryColor)}
              onBlur={(e) =>
                (e.target.style.borderColor = `${categoryColor}30`)
              }
            />
            <div className="text-sm text-gray-500">
              {input.length} {txt('characters', 'characters')}
            </div>
          </div>
        )}

        {/* ── File Input ─────────────────────────────────────────── */}
        {inputMode === 'file' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload
              className="mb-3 h-10 w-10 text-gray-400"
              style={isDragOver ? { color: categoryColor } : undefined}
            />
            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragOver
                ? txt('dropFileActive', 'Drop your file here...')
                : txt('dropFileHere', 'Drop file here or click to select')}
            </p>
            <p className="text-xs text-gray-500">
              {txt('supportedAnyFile', 'Any file type supported')}
            </p>
          </div>
        )}

        {/* File info & progress */}
        {inputMode === 'file' && selectedFile && (
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            {isFileHashing && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${fileProgress}%`,
                      backgroundColor: categoryColor,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {txt('fileHashing', 'Hashing file...')} {fileProgress}%
                </p>
              </div>
            )}
            {!isFileHashing && Object.keys(hashes).length > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {txt('fileHashComplete', 'Hashing complete')}
              </p>
            )}
          </div>
        )}

        {/* ── Bulk Input ─────────────────────────────────────────── */}
        {inputMode === 'bulk' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {txt('bulkTab', 'Bulk')} ({bulkInput.split('\n').filter((l) => l.trim()).length} {txt('bulkInputs', 'inputs')})
            </label>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={txt('bulkPlaceholder', 'Enter one text per line...')}
              className="h-40 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
              style={{ borderColor: `${categoryColor}30` }}
              onFocus={(e) => (e.target.style.borderColor = categoryColor)}
              onBlur={(e) =>
                (e.target.style.borderColor = `${categoryColor}30`)
              }
            />
          </div>
        )}

        {/* ── Options Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3">
          {/* Algorithm */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {txt('algorithm', 'Algorithm')}
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {algorithms.map((algo) => (
                <option key={algo} value={algo}>
                  {algo}
                </option>
              ))}
            </select>
          </div>

          {/* Output Format */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {txt('outputFormat', 'Format')}
            </label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              {(
                [
                  { fmt: 'hex' as OutputFormat, label: txt('hexLower', 'hex') },
                  { fmt: 'hex-upper' as OutputFormat, label: txt('hexUpper', 'HEX') },
                  { fmt: 'base64' as OutputFormat, label: txt('base64', 'Base64') },
                ] as const
              ).map(({ fmt: f, label }) => (
                <button
                  key={f}
                  onClick={() => setOutputFormat(f)}
                  className={`flex-1 px-2 py-2 text-sm transition-colors ${
                    outputFormat === f
                      ? 'bg-gray-200 font-medium dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* HMAC Key (only in HMAC mode) */}
          {hashMode === 'hmac' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {txt('hmacKey', 'HMAC Key')}
              </label>
              <input
                type="text"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder={txt('hmacKeyPlaceholder', 'Enter secret key...')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          ) : inputMode === 'text' ? (
            /* Salt (only in hash mode + text input) */
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {txt('saltOptional', 'Salt (Optional)')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  placeholder={txt('saltPlaceholder', 'Add salt to hash')}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {salt && (
                  <select
                    value={saltPosition}
                    onChange={(e) =>
                      setSaltPosition(e.target.value as SaltPosition)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="prepend">{txt('prepend', 'Prepend')}</option>
                    <option value="append">{txt('append', 'Append')}</option>
                  </select>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Security Warning for insecure algorithms */}
        {primaryAlgoInfo && !primaryAlgoInfo.secure && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {txt('securityWarning', 'Security Warning')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {primaryAlgoInfo.warning}
              </p>
            </div>
          </div>
        )}

        {/* Compare Mode */}
        {compareMode && hasResults && inputMode !== 'bulk' && (
          <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {txt('compareWith', 'Compare with Hash')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={compareHash}
                onChange={(e) => {
                  setCompareHash(e.target.value);
                  setIsMatch(null);
                }}
                placeholder={txt(
                  'comparePlaceholder',
                  'Paste hash to compare...'
                )}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleCompare}
                className="rounded-lg px-4 py-2 font-medium text-white transition-all hover:scale-105"
                style={{ backgroundColor: categoryColor }}
              >
                {txt('compareButton', 'Compare')}
              </button>
            </div>
            {/* Auto-detect type */}
            {detectedTypes.length > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {txt('detectedType', 'Detected type')}:{' '}
                {detectedTypes.map((d) => d.algorithm).join(', ')}
              </p>
            )}
            {isMatch !== null && (
              <div
                className={`text-sm font-medium ${isMatch ? 'text-green-600' : 'text-red-600'}`}
              >
                {isMatch
                  ? `\u2713 ${txt('hashesMatch', 'Hashes match!')}`
                  : `\u2717 ${txt('hashesNoMatch', 'Hashes do not match')}`}
              </div>
            )}
          </div>
        )}

        {/* ── Hash Results (Text & File mode) ────────────────────── */}
        <div ref={resultRef}>
          {inputMode !== 'bulk' && Object.keys(hashes).length > 0 && (
            <div className="animate-slideIn space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {txt('generatedHashes', 'Generated Hashes')}
                </label>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {copiedAll ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedAll
                    ? txt('copiedAll', 'Copied!')
                    : txt('copyAll', 'Copy All')}
                </button>
              </div>

              {/* Primary Hash */}
              {hashes[primaryKey] && (
                <div
                  className="rounded-lg border-2 p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
                  style={{ borderColor: categoryColor }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {primaryKey}
                      </span>
                      {primaryAlgoInfo && !primaryAlgoInfo.secure && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <button
                      onClick={() =>
                        copy(fmt(hashes[primaryKey]), primaryKey)
                      }
                      className="rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {isCopied(primaryKey) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <code className="block break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                    {fmt(hashes[primaryKey])}
                  </code>
                </div>
              )}

              {/* Other Hashes */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <Hash className="h-4 w-4" />
                    <span>
                      {txt('showOtherAlgorithms', 'Show other algorithms')}
                    </span>
                  </div>
                </summary>
                <div className="mt-3 space-y-2">
                  {Object.entries(hashes).map(([algo, hash]) => {
                    if (algo === primaryKey) return null;
                    const info = getAlgorithmInfo(
                      algo.replace('HMAC-', '') as string
                    );
                    return (
                      <div
                        key={algo}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {algo}
                            </span>
                            {info && !info.secure && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <button
                            onClick={() => copy(fmt(hash), algo)}
                            className="rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {isCopied(algo) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <code className="block break-all font-mono text-xs text-gray-600 dark:text-gray-400">
                          {fmt(hash)}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}

          {/* ── Bulk Results ──────────────────────────────────────── */}
          {inputMode === 'bulk' && bulkResults.length > 0 && (
            <div className="animate-slideIn space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {txt('bulkResults', 'Results')} ({bulkResults.length})
                </label>
                <button
                  onClick={async () => {
                    const text = bulkResults
                      .map((r) => `${r.input}\t${fmt(r.hash)}`)
                      .join('\n');
                    await navigator.clipboard.writeText(text);
                    setCopiedAll(true);
                    setTimeout(() => setCopiedAll(false), 2000);
                  }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {copiedAll ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedAll
                    ? txt('copiedAll', 'Copied!')
                    : txt('copyAll', 'Copy All')}
                </button>
              </div>
              <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                {bulkResults.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded p-2 font-mono text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="min-w-0 flex-shrink-0 truncate text-gray-500" style={{ maxWidth: '30%' }}>
                      {result.input}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">
                      →
                    </span>
                    <span className="min-w-0 flex-1 break-all text-gray-700 dark:text-gray-300">
                      {fmt(result.hash)}
                    </span>
                    <button
                      onClick={() => copy(fmt(result.hash), `bulk-${i}`)}
                      className="flex-shrink-0 rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {isCopied(`bulk-${i}`) ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {hashMode === 'hmac'
              ? txt(
                  'hmacInfoText',
                  'HMAC (Hash-based Message Authentication Code) uses a secret key to produce an authenticated hash. Used for API signatures, webhook verification, and message authentication.'
                )
              : txt(
                  'infoText',
                  "Cryptographic hash functions produce a fixed-size output from any input. The same input always produces the same hash, but it's computationally infeasible to reverse."
                )}
          </p>
        </div>
      </div>
    </div>
  );
}
