'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Sparkles,
  FileJson,
  Calendar,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolProcessor } from '@/lib/hooks/useToolProcessor';
import { useDownload } from '@/lib/hooks/useDownload';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import {
  decodeJwt,
  generateSampleJwts,
  JwtDecodeResult,
  JwtDecodeOptions,
} from '@/lib/tools/jwt-decoder';

interface JwtDecoderProps extends BaseToolProps {}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function pemToDer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function JwtDecoder({ categoryColor }: JwtDecoderProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JwtDecodeResult | null>(null);
  const [options, setOptions] = useState<JwtDecodeOptions>({
    validateStructure: true,
    analyzeTime: true,
    provideSuggestions: true,
  });
  const [showOptions, setShowOptions] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    payload: true,
    signature: true,
    timeInfo: true,
    verify: false,
    security: false,
    metadata: false,
  });

  const { copied: copiedHeader, copy: copyToClipboard } = useCopy();
  const [copiedSections, setCopiedSections] = useState<Record<string, boolean>>(
    {}
  );
  const { isProcessing, error, processSync } = useToolProcessor<
    string,
    JwtDecodeResult
  >();
  const { downloadText, downloadJSON } = useDownload();
  const { trackUse, trackCustom, trackError } = useToolTracking('jwt-decoder');

  const [countdown, setCountdown] = useState<{
    text: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
  } | null>(null);

  const [verifyKey, setVerifyKey] = useState('');
  const [verifyResult, setVerifyResult] = useState<'valid' | 'invalid' | 'error' | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const exp = result?.success ? result?.payload?.exp : undefined;
    if (!exp) {
      setCountdown(null);
      return;
    }

    const computeCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = exp - now;

      if (diff <= 0) {
        setCountdown({
          text: `Token scaduto — ${formatDuration(Math.abs(diff))} fa`,
          color: 'gray',
        });
      } else {
        const color: 'green' | 'yellow' | 'red' =
          diff > 3600 ? 'green' : diff > 600 ? 'yellow' : 'red';
        setCountdown({
          text: `Token valido — scade tra ${formatDuration(diff)}`,
          color,
        });
      }
    };

    computeCountdown();
    const id = setInterval(computeCountdown, 1000);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    setVerifyResult(null);
    setVerifyKey('');
  }, [result]);

  // Process JWT token
  const handleDecode = useCallback(() => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    try {
      const decoded = processSync(input, (token) => {
        return decodeJwt(token.trim(), options);
      });
      setResult(decoded);

      // Track successful decoding
      if (decoded.success) {
        trackCustom({
          inputSize: input.length,
          outputSize: JSON.stringify(decoded.payload, null, 2).length,
          success: true,
          algorithm: decoded.header?.alg,
        });
      }
    } catch (err) {
      // Track error
      trackError(
        err instanceof Error ? err : new Error(String(err)),
        input.length
      );
      // Error handled by useToolProcessor
      setResult(null);
    }
  }, [input, options, processSync, trackCustom, trackError]);

  // Auto-decode when input changes
  useMemo(() => {
    const debounceTimer = setTimeout(handleDecode, 500);
    return () => clearTimeout(debounceTimer);
  }, [handleDecode]);

  // Load sample JWT
  const loadSample = useCallback((sampleKey: string) => {
    const samples = generateSampleJwts();
    if (samples[sampleKey]) {
      setInput(samples[sampleKey]);
      setShowSamples(false);
    }
  }, []);

  // Clear all data
  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  // Copy functions for different sections
  const copySection = useCallback(
    async (section: string, content: string) => {
      const success = await copyToClipboard(content);
      if (success) {
        setCopiedSections((prev) => ({ ...prev, [section]: true }));
        setTimeout(() => {
          setCopiedSections((prev) => ({ ...prev, [section]: false }));
        }, 2000);
      }
    },
    [copyToClipboard]
  );

  const copyHeader = useCallback(() => {
    if (result?.header) {
      copySection('header', JSON.stringify(result.header, null, 2));
    }
  }, [result, copySection]);

  const copyPayload = useCallback(() => {
    if (result?.payload) {
      copySection('payload', JSON.stringify(result.payload, null, 2));
    }
  }, [result, copySection]);

  const copySignature = useCallback(() => {
    if (result?.signature) {
      copySection('signature', result.signature);
    }
  }, [result, copySection]);

  // Download functions
  const downloadDecoded = useCallback(() => {
    if (result && result.success) {
      const data = {
        header: result.header,
        payload: result.payload,
        signature: result.signature,
        metadata: result.metadata,
        securityInfo: result.securityInfo,
        timeInfo: result.timeInfo,
      };
      downloadJSON(data, 'decoded-jwt.json');
    }
  }, [result, downloadJSON]);

  const handleVerify = useCallback(async () => {
    if (!result?.success || !result.header?.alg || !result.signature || !verifyKey.trim()) return;

    const alg = result.header.alg as string;
    const parts = input.trim().split('.');
    if (parts.length !== 3) { setVerifyResult('error'); return; }

    const isKnownAlg = /^(HS|RS|ES|PS)(256|384|512)$/.test(alg);
    if (!isKnownAlg) { setVerifyResult('error'); return; }

    setVerifying(true);
    setVerifyResult(null);

    try {

      const [headerB64, payloadB64, sigB64] = parts;
      const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
      const sigBytes = base64UrlToBytes(sigB64);

      let cryptoKey: CryptoKey;
      let valid = false;

      if (/^HS(256|384|512)$/.test(alg)) {
        const bits = alg.replace('HS', '');
        cryptoKey = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(verifyKey),
          { name: 'HMAC', hash: `SHA-${bits}` },
          false,
          ['verify']
        );
        valid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, signedData);

      } else if (/^RS(256|384|512)$/.test(alg)) {
        const bits = alg.replace('RS', '');
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          pemToDer(verifyKey),
          { name: 'RSASSA-PKCS1-v1_5', hash: `SHA-${bits}` },
          false,
          ['verify']
        );
        valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, signedData);

      } else if (/^ES(256|384|512)$/.test(alg)) {
        const bits = alg.replace('ES', '');
        const curveMap: Record<string, string> = { '256': 'P-256', '384': 'P-384', '512': 'P-521' };
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          pemToDer(verifyKey),
          { name: 'ECDSA', namedCurve: curveMap[bits] },
          false,
          ['verify']
        );
        valid = await crypto.subtle.verify(
          { name: 'ECDSA', hash: { name: `SHA-${bits}` } },
          cryptoKey,
          sigBytes,
          signedData
        );

      } else if (/^PS(256|384|512)$/.test(alg)) {
        const bits = alg.replace('PS', '');
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          pemToDer(verifyKey),
          { name: 'RSA-PSS', hash: `SHA-${bits}` },
          false,
          ['verify']
        );
        valid = await crypto.subtle.verify(
          { name: 'RSA-PSS', saltLength: parseInt(bits) / 8 },
          cryptoKey,
          sigBytes,
          signedData
        );
      }

      setVerifyResult(valid ? 'valid' : 'invalid');
    } catch {
      setVerifyResult('error');
    } finally {
      setVerifying(false);
    }
  }, [result, input, verifyKey]);

  // Get status color based on token validity
  const getStatusColor = () => {
    if (!result || !result.success) return 'text-red-600 dark:text-red-400';
    if (result.isExpired) return 'text-red-600 dark:text-red-400';
    if (!result.securityInfo.isSecure)
      return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Get status text
  const getStatusText = () => {
    if (!result || !result.success) return 'Invalid';
    if (result.isExpired) return 'Expired';
    if (!result.securityInfo.isSecure) return 'Insecure';
    return 'Valid';
  };

  // Format timestamp display
  const formatTimeDisplay = (
    timestamp: string | undefined,
    relative: string | undefined
  ) => {
    if (!timestamp) return 'N/A';
    return (
      <div>
        <div className="text-sm text-gray-900 dark:text-white">{timestamp}</div>
        {relative && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ({relative})
          </div>
        )}
      </div>
    );
  };

  const samples = generateSampleJwts();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            JWT Decoder
          </h3>
          {result && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${getStatusColor()}`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  result.success &&
                  !result.isExpired &&
                  result.securityInfo.isSecure
                    ? 'bg-green-500'
                    : result.success && !result.isExpired
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              {getStatusText()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Options
            {showOptions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Options Panel */}
        {showOptions && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
            <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
              Decoding Options
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.validateStructure}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      validateStructure: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Validate Structure
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.analyzeTime}
                  onChange={(e) =>
                    setOptions({ ...options, analyzeTime: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Analyze Time Claims
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.provideSuggestions}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      provideSuggestions: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tool Suggestions
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="jwt-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              JWT Token
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSamples(!showSamples)}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Sparkles className="h-3 w-3" />
                Samples
              </button>
            </div>
          </div>

          {/* Sample JWTs Panel */}
          {showSamples && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sample JWTs
              </h4>
              <div className="space-y-2">
                {Object.keys(samples).map((sampleKey) => (
                  <button
                    key={sampleKey}
                    onClick={() => loadSample(sampleKey)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {sampleKey}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              id="jwt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JWT token here..."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
              rows={4}
              style={{
                borderColor: result?.success === false ? '#ef4444' : undefined,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDecode}
            disabled={!input.trim() || isProcessing}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{ backgroundColor: categoryColor }}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Decoding...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Decode JWT
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear
          </button>

          {result && result.success && (
            <button
              onClick={downloadDecoded}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>

        {/* Live Expiration Countdown */}
        {result?.success && countdown && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
              countdown.color === 'green'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : countdown.color === 'yellow'
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : countdown.color === 'red'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{countdown.text}</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  Decoding Error
                </p>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && result.success && (
          <div className="space-y-4">
            {/* JWT Header Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('header')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Header
                  </span>
                  <span className="text-sm text-gray-500">
                    ({result.metadata.headerSize} chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyHeader();
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {copiedSections.header ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSections.header ? 'Copied!' : 'Copy'}
                  </button>
                  {expandedSections.header ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              {expandedSections.header && result.header && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 text-sm dark:bg-gray-800">
                    <code className="text-gray-900 dark:text-white">
                      {JSON.stringify(result.header, null, 2)}
                    </code>
                  </pre>
                  {result.header.alg && (
                    <div className="mt-3 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Algorithm:{' '}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {result.header.alg}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* JWT Payload Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('payload')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Payload
                  </span>
                  <span className="text-sm text-gray-500">
                    ({result.metadata.payloadSize} chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayload();
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {copiedSections.payload ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSections.payload ? 'Copied!' : 'Copy'}
                  </button>
                  {expandedSections.payload ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              {expandedSections.payload && result.payload && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 text-sm dark:bg-gray-800">
                    <code className="text-gray-900 dark:text-white">
                      {JSON.stringify(result.payload, null, 2)}
                    </code>
                  </pre>

                  {/* Standard Claims Analysis */}
                  {result.claimsAnalysis.standardClaims.length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                        Standard Claims
                      </h5>
                      <div className="space-y-2">
                        {result.claimsAnalysis.standardClaims.map((claim) => (
                          <div
                            key={claim.key}
                            className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                                  {claim.key}
                                </span>
                                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                  {typeof claim.value === 'string'
                                    ? `"${claim.value}"`
                                    : JSON.stringify(claim.value)}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {claim.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Claims */}
                  {result.claimsAnalysis.customClaims.length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                        Custom Claims
                      </h5>
                      <div className="space-y-1">
                        {result.claimsAnalysis.customClaims.map((claim) => (
                          <div
                            key={claim.key}
                            className="flex items-center gap-2"
                          >
                            <span className="font-mono text-sm text-purple-600 dark:text-purple-400">
                              {claim.key}:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {typeof claim.value === 'string'
                                ? `"${claim.value}"`
                                : JSON.stringify(claim.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* JWT Signature Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('signature')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Signature
                  </span>
                  <span className="text-sm text-gray-500">
                    ({result.metadata.signatureSize} chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copySignature();
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {copiedSections.signature ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSections.signature ? 'Copied!' : 'Copy'}
                  </button>
                  {expandedSections.signature ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              {expandedSections.signature && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                  <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                    <code className="break-all font-mono text-sm text-gray-900 dark:text-white">
                      {result.signature || '(empty signature)'}
                    </code>
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      The signature is encoded and cannot be decoded without the
                      signing key. It&lsquo;s used to verify the token&lsquo;s
                      authenticity and integrity.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Verify Signature */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('verify')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Verify Signature
                  </span>
                  {verifyResult === 'valid' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <Check className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                  {verifyResult === 'invalid' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <AlertTriangle className="h-3 w-3" />
                      Invalid
                    </span>
                  )}
                </div>
                {expandedSections.verify ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedSections.verify && (
                <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-600">
                  {/* Privacy notice — always visible */}
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                    <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      🔒 <strong>La tua chiave non lascia mai questo browser.</strong> La verifica
                      avviene interamente in locale tramite la WebCrypto API nativa. Nessun dato
                      viene inviato a server.{' '}
                      <a
                        href="https://github.com/hellotoolslab/toolslab"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        Codice sorgente su GitHub ↗
                      </a>
                    </p>
                  </div>

                  {/* Adaptive key input */}
                  {(() => {
                    const alg = result.header?.alg ?? '';
                    if (alg === 'none') {
                      return (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Token non firmato — nessuna verifica possibile.
                        </p>
                      );
                    }
                    const isHmac = /^HS(256|384|512)$/.test(alg);
                    const isAsymmetric = /^(RS|ES|PS)(256|384|512)$/.test(alg);
                    if (!isHmac && !isAsymmetric) {
                      return (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Algoritmo{' '}
                          <code className="rounded bg-gray-100 px-1 font-mono dark:bg-gray-700">
                            {alg}
                          </code>{' '}
                          non supportato per la verifica.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isHmac ? `Secret Key (${alg})` : `Public Key — PEM (${alg})`}
                          </label>
                          {isHmac ? (
                            <input
                              type="password"
                              value={verifyKey}
                              onChange={(e) => {
                                setVerifyKey(e.target.value);
                                setVerifyResult(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !verifying) handleVerify();
                              }}
                              placeholder="Enter HMAC secret key..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                          ) : (
                            <textarea
                              value={verifyKey}
                              onChange={(e) => {
                                setVerifyKey(e.target.value);
                                setVerifyResult(null);
                              }}
                              placeholder={`-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
                              rows={5}
                              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                          )}
                        </div>

                        <button
                          onClick={handleVerify}
                          disabled={!verifyKey.trim() || verifying}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {verifying ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4" />
                              Verify
                            </>
                          )}
                        </button>

                        {verifyResult && (
                          <div
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                              verifyResult === 'valid'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : verifyResult === 'invalid'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}
                          >
                            {verifyResult === 'valid' && (
                              <>
                                <Check className="h-4 w-4" />
                                Firma valida
                              </>
                            )}
                            {verifyResult === 'invalid' && (
                              <>
                                <AlertTriangle className="h-4 w-4" />
                                Firma non valida
                              </>
                            )}
                            {verifyResult === 'error' && (
                              <>
                                <AlertTriangle className="h-4 w-4" />
                                Chiave non valida o formato errato
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Time Information */}
            {result.timeInfo && Object.keys(result.timeInfo).length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
                <button
                  onClick={() => toggleSection('timeInfo')}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Time Information
                    </span>
                  </div>
                  {expandedSections.timeInfo ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.timeInfo && (
                  <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {result.timeInfo.issuedAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Issued At:
                          </span>
                          {formatTimeDisplay(result.timeInfo.issuedAt, result.timeInfo.age)}
                        </div>
                      )}
                      {result.timeInfo.expiresAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Expires At:
                          </span>
                          {formatTimeDisplay(result.timeInfo.expiresAt, result.timeInfo.timeToExpiry)}
                        </div>
                      )}
                      {result.timeInfo.notBefore && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Not Before:
                          </span>
                          {formatTimeDisplay(result.timeInfo.notBefore, undefined)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Analysis */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('security')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Security Analysis
                  </span>
                  {result.securityInfo.warnings.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <AlertTriangle className="h-3 w-3" />
                      {result.securityInfo.warnings.length}
                    </span>
                  )}
                </div>
                {expandedSections.security ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.security && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Algorithm:{' '}
                      </span>
                      <span
                        className={`font-mono text-sm ${
                          result.securityInfo.isSecure
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {result.securityInfo.algorithm}
                      </span>
                    </div>

                    {result.securityInfo.warnings.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Security Warnings:
                        </span>
                        <ul className="mt-2 space-y-1">
                          {result.securityInfo.warnings.map(
                            (warning, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
                              >
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                {warning}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30">
              <button
                onClick={() => toggleSection('metadata')}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Token Metadata
                  </span>
                </div>
                {expandedSections.metadata ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.metadata && result.metadata && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Total Size:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {result.metadata.totalSize} characters
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Structure:
                      </span>
                      <span
                        className={`ml-2 ${
                          result.metadata.structure === 'valid'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {result.metadata.structure}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Header Size:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {result.metadata.headerSize} chars
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Payload Size:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {result.metadata.payloadSize} chars
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tool Suggestions */}
        {result && result.suggestions && result.suggestions.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <h4 className="mb-2 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
              <Sparkles className="h-4 w-4" />
              Suggestions
            </h4>
            <ul className="space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="text-sm text-blue-800 dark:text-blue-200"
                >
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="mb-2 font-medium text-amber-800 dark:text-amber-200">
                🔍 About JWT Decoding
              </p>
              <div className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <p>
                  • This tool decodes JWT tokens and can verify signatures in-browser
                </p>
                <p>
                  • Signature verification requires the secret key or public key
                </p>
                <p>
                  • Never trust decoded claims without proper signature
                  verification
                </p>
                <p>• Expired tokens should be rejected by your application</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
