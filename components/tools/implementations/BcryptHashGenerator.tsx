'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Check,
  X,
  Play,
  Shield,
  Key,
  Clock,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  generateBcryptHash,
  verifyBcryptHash,
  parseBcryptHash,
  getBcryptInfo,
  estimateHashingTime,
  generateSamplePasswords,
} from '@/lib/tools/bcrypt-hash-generator';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BcryptHashGeneratorProps {
  categoryColor: string;
  dictionary?: any;
}

export default function BcryptHashGenerator({
  categoryColor,
  dictionary,
}: BcryptHashGeneratorProps) {
  const ui = dictionary?.tools?.['bcrypt-hash-generator']?.ui ?? {};
  // Generate tab state
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(10);
  const [generatedHash, setGeneratedHash] = useState('');
  const [generatedSalt, setGeneratedSalt] = useState('');
  const [hashTime, setHashTime] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Verify tab state
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyTime, setVerifyTime] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Parse tab state
  const [parseHash, setParseHash] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    version?: string;
    rounds?: number;
    salt?: string;
    hash?: string;
  } | null>(null);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  // Hooks
  const { copied, copy } = useCopy();
  const { trackUse, trackError } = useToolTracking('bcrypt-hash-generator');
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // Bcrypt info
  const bcryptInfo = getBcryptInfo();
  const estimatedTime = estimateHashingTime(rounds);

  // Scroll to result when hash is generated
  useEffect(() => {
    if (generatedHash) {
      scrollToResult();
    }
  }, [generatedHash, scrollToResult]);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateBcryptHash(password, { rounds });

      if (result.success && result.hash) {
        setGeneratedHash(result.hash);
        setGeneratedSalt(result.salt || '');
        setHashTime(result.timeTaken || null);
        trackUse(password, result.hash, { success: true });
      } else {
        setError(result.error || 'Failed to generate hash');
        setGeneratedHash('');
        setGeneratedSalt('');
        setHashTime(null);
        trackError(
          new Error(result.error || 'Generation failed'),
          password.length
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMsg);
      setGeneratedHash('');
      trackError(
        err instanceof Error ? err : new Error(errorMsg),
        password.length
      );
    } finally {
      setIsGenerating(false);
    }
  }, [password, rounds, trackUse, trackError]);

  // Handle verify
  const handleVerify = useCallback(async () => {
    if (!verifyPassword.trim()) {
      setError('Please enter a password to verify');
      return;
    }
    if (!verifyHash.trim()) {
      setError('Please enter a hash to verify against');
      return;
    }

    setError(null);
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const result = await verifyBcryptHash(verifyPassword, verifyHash);

      if (result.success) {
        setVerifyResult(result.isMatch || false);
        setVerifyTime(result.timeTaken || null);
        trackUse(verifyPassword, String(result.isMatch), { success: true });
      } else {
        setError(result.error || 'Failed to verify hash');
        setVerifyResult(null);
        setVerifyTime(null);
        trackError(
          new Error(result.error || 'Verification failed'),
          verifyPassword.length
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Verification failed';
      setError(errorMsg);
      setVerifyResult(null);
      trackError(
        err instanceof Error ? err : new Error(errorMsg),
        verifyPassword.length
      );
    } finally {
      setIsVerifying(false);
    }
  }, [verifyPassword, verifyHash, trackUse, trackError]);

  // Handle parse
  const handleParse = useCallback(() => {
    if (!parseHash.trim()) {
      setError('Please enter a hash to parse');
      return;
    }

    setError(null);
    const result = parseBcryptHash(parseHash);

    if (result.success) {
      setParsedResult({
        version: result.version,
        rounds: result.rounds,
        salt: result.salt,
        hash: result.hash,
      });
    } else {
      setError(result.error || 'Invalid hash format');
      setParsedResult(null);
    }
  }, [parseHash]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (generatedHash) {
      await copy(generatedHash);
    }
  }, [generatedHash, copy]);

  // Handle clear
  const handleClear = useCallback(() => {
    setPassword('');
    setGeneratedHash('');
    setGeneratedSalt('');
    setHashTime(null);
    setError(null);
  }, []);

  // Load example
  const handleExample = useCallback((examplePassword: string) => {
    setPassword(examplePassword);
    setGeneratedHash('');
    setGeneratedSalt('');
    setHashTime(null);
    setError(null);
  }, []);

  // Sample passwords
  const samplePasswords = generateSamplePasswords();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {ui.tabGenerate || 'Generate'}
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {ui.tabVerify || 'Verify'}
          </TabsTrigger>
          <TabsTrigger value="parse" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {ui.tabParse || 'Parse'}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          {/* Error display */}
          {error && activeTab === 'generate' && (
            <Alert className="border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100">
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">{ui.labelPassword || 'Password'}</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={ui.placeholderPassword || 'Enter password to hash...'}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {password.length} {ui.infoCharacters || 'characters (max'} {bcryptInfo.maxPasswordLength}{' '}
              {ui.infoBytesUsed || 'bytes used by bcrypt)'}
            </p>
          </div>

          {/* Cost Factor (Rounds) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{ui.labelCostFactor || 'Cost Factor (Rounds):'} {rounds}</Label>
              <span className="text-sm text-muted-foreground">
                ~{estimatedTime}{ui.suffixMsEstimated || 'ms estimated'}
              </span>
            </div>
            <Slider
              value={[rounds]}
              onValueChange={(value) => setRounds(value[0])}
              min={bcryptInfo.minRounds}
              max={bcryptInfo.maxRounds}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{ui.sliderFastest || '4 (Fastest)'}</span>
              <span>{ui.sliderRecommended || '10 (Recommended)'}</span>
              <span>{ui.sliderMostSecure || '12 (Most Secure)'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!password.trim() || isGenerating}
              className="flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? (ui.btnGenerating || 'Generating...') : (ui.btnGenerateHash || 'Generate Hash')}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!password && !generatedHash}
            >
              <X className="mr-2 h-4 w-4" />
              {ui.btnClear || 'Clear'}
            </Button>
          </div>

          {/* Generated Hash Output */}
          {generatedHash && (
            <div ref={resultRef} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{ui.labelGeneratedHash || 'Generated Hash'}</Label>
                  <div className="flex items-center gap-2">
                    {hashTime !== null && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {hashTime}ms
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      title={ui.tooltipCopy || 'Copy to clipboard'}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedHash}
                  readOnly
                  className="min-h-[80px] bg-muted/50 font-mono text-sm"
                />
              </div>

              {/* Hash Breakdown */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-3 font-semibold">{ui.headingHashBreakdown || 'Hash Breakdown'}</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ui.labelVersion || 'Version:'}</span>
                    <code className="font-mono">$2a$ (bcrypt)</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ui.labelCostFactorShort || 'Cost Factor:'}</span>
                    <code className="font-mono">{rounds} {ui.suffixRounds || 'rounds'}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ui.labelSalt22 || 'Salt (22 chars):'}
                    </span>
                    <code className="truncate font-mono text-xs">
                      {generatedSalt.substring(7, 29)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ui.labelTotalLength || 'Total Length:'}</span>
                    <code className="font-mono">
                      {generatedHash.length} {ui.suffixChars || 'chars'}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sample Passwords */}
          <div className="space-y-3">
            <Label>{ui.labelSamplePasswords || 'Sample Passwords'}</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(samplePasswords).map(([label, pwd]) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExample(pwd)}
                  className="h-auto justify-start py-2 text-left"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {pwd.length > 25 ? pwd.substring(0, 25) + '...' : pwd}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Verify Tab */}
        <TabsContent value="verify" className="space-y-4">
          {/* Error display */}
          {error && activeTab === 'verify' && (
            <Alert className="border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100">
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Password to verify */}
          <div className="space-y-2">
            <Label htmlFor="verify-password">{ui.labelPasswordToVerify || 'Password to Verify'}</Label>
            <Input
              id="verify-password"
              type="text"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder={ui.placeholderVerifyPassword || 'Enter password...'}
              className="font-mono"
            />
          </div>

          {/* Hash to verify against */}
          <div className="space-y-2">
            <Label htmlFor="verify-hash">{ui.labelBcryptHash || 'Bcrypt Hash'}</Label>
            <Textarea
              id="verify-hash"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder={ui.placeholderVerifyHash || 'Enter bcrypt hash (e.g., $2a$10$...)...'}
              className="min-h-[80px] font-mono text-sm"
            />
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={
              !verifyPassword.trim() || !verifyHash.trim() || isVerifying
            }
          >
            {isVerifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            {isVerifying ? (ui.btnVerifying || 'Verifying...') : (ui.btnVerifyPassword || 'Verify Password')}
          </Button>

          {/* Verification Result */}
          {verifyResult !== null && (
            <Alert
              className={
                verifyResult
                  ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                  : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
              }
            >
              {verifyResult ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {verifyResult
                    ? (ui.resultMatch || 'Password matches the hash!')
                    : (ui.resultNoMatch || 'Password does NOT match the hash.')}
                </span>
                {verifyTime !== null && (
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {verifyTime}ms
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Parse Tab */}
        <TabsContent value="parse" className="space-y-4">
          {/* Error display */}
          {error && activeTab === 'parse' && (
            <Alert className="border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100">
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Hash to parse */}
          <div className="space-y-2">
            <Label htmlFor="parse-hash">{ui.labelBcryptHashToParse || 'Bcrypt Hash to Parse'}</Label>
            <Textarea
              id="parse-hash"
              value={parseHash}
              onChange={(e) => setParseHash(e.target.value)}
              placeholder={ui.placeholderParseHash || 'Enter bcrypt hash (e.g., $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)...'}
              className="min-h-[80px] font-mono text-sm"
            />
          </div>

          {/* Parse Button */}
          <Button onClick={handleParse} disabled={!parseHash.trim()}>
            <Info className="mr-2 h-4 w-4" />
            {ui.btnParseHash || 'Parse Hash'}
          </Button>

          {/* Parsed Result */}
          {parsedResult && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-3 font-semibold">{ui.headingParsedComponents || 'Parsed Hash Components'}</h4>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ui.labelVersion || 'Version:'}</span>
                  <code className="font-mono">${parsedResult.version}$</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ui.labelCostFactorShort || 'Cost Factor:'}</span>
                  <code className="font-mono">
                    {parsedResult.rounds} {ui.suffixRounds || 'rounds'} (2^{parsedResult.rounds} ={' '}
                    {Math.pow(2, parsedResult.rounds || 0).toLocaleString()}{' '}
                    {ui.suffixIterations || 'iterations'})
                  </code>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    {ui.labelSalt22 || 'Salt (22 chars):'}
                  </span>
                  <code className="break-all rounded bg-muted p-2 font-mono text-xs">
                    {parsedResult.salt}
                  </code>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    {ui.labelHash31 || 'Hash (31 chars):'}
                  </span>
                  <code className="break-all rounded bg-muted p-2 font-mono text-xs">
                    {parsedResult.hash}
                  </code>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold">{ui.headingAboutBcrypt || 'About Bcrypt'}</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Bcrypt</strong>{' '}
            {ui.aboutBcryptDesc || 'is a password-hashing function designed by Niels Provos and David Mazières, based on the Blowfish cipher.'}
          </li>
          <li>
            <strong>Cost Factor:</strong>{' '}
            {ui.aboutCostFactor || 'Determines the computational cost. Each increment doubles the time required (2^rounds iterations).'}
          </li>
          <li>
            <strong>Salt:</strong>{' '}
            {ui.aboutSalt || 'A random 128-bit value automatically generated and embedded in the hash, preventing rainbow table attacks.'}
          </li>
          <li>
            <strong>Max Length:</strong>{' '}
            {ui.aboutMaxLength || 'Bcrypt truncates passwords at 72 bytes. Longer passwords are not more secure.'}
          </li>
          <li>
            <strong>Hash Format:</strong>{' '}
            <code className="text-xs">$2a$rounds$salt(22)hash(31)</code> = 60{' '}
            {ui.aboutHashFormat || 'characters total.'}
          </li>
        </ul>
      </div>
    </div>
  );
}
