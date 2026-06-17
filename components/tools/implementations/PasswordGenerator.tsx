'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Shield,
  Key,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { trackToolUse, trackEngagement } from '@/lib/analytics';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';

interface PasswordGeneratorProps extends BaseToolProps {}

export default function PasswordGenerator({
  categoryColor,
  dictionary,
}: PasswordGeneratorProps) {
  const ui = dictionary?.tools?.['password-generator']?.ui ?? {};
  const { addToHistory } = useToolStore();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [includePronounceable, setIncludePronounceable] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [strength, setStrength] = useState(0);
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const similarChars = 'il1Lo0O';

  const generatePassword = useCallback(() => {
    const startTime = Date.now();

    let chars = '';

    if (includePronounceable) {
      // Generate pronounceable password
      const consonants = 'bcdfghjklmnpqrstvwxyz';
      const vowels = 'aeiou';
      let newPassword = '';

      for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
          const char =
            consonants[Math.floor(Math.random() * consonants.length)];
          newPassword +=
            i % 4 === 0 && includeUppercase ? char.toUpperCase() : char;
        } else {
          newPassword += vowels[Math.floor(Math.random() * vowels.length)];
        }

        if (includeNumbers && i % 5 === 4) {
          newPassword =
            newPassword.slice(0, -1) + Math.floor(Math.random() * 10);
        }
      }

      const finalPassword = newPassword.slice(0, length);
      setPassword(finalPassword);

      // Track password generation
      trackToolUse('password-generator', 'generate', {
        length,
        type: 'pronounceable',
        strength: strength,
        success: true,
      });

      // Analytics auto-tracking (NEVER log the real password)
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'password-generator',
        input: `length=${length}, type=pronounceable, uppercase=${includeUppercase}, numbers=${includeNumbers}`,
        output: `length=${finalPassword.length}, generated`,
        timestamp: startTime,
      });

      // Add to history
      setPasswordHistory((prev) => [finalPassword, ...prev.slice(0, 9)]);
      return;
    }

    if (includeUppercase) chars += uppercaseChars;
    if (includeLowercase) chars += lowercaseChars;
    if (includeNumbers) chars += numberChars;
    if (includeSymbols) chars += symbolChars;

    if (excludeSimilar) {
      chars = chars
        .split('')
        .filter((char) => !similarChars.includes(char))
        .join('');
    }

    if (!chars) {
      setPassword('');

      // Track error - no character types selected
      trackToolUse('password-generator', 'generate', {
        success: false,
        error: 'no_character_types_selected',
      });
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      newPassword += chars[array[i] % chars.length];
    }

    // Ensure at least one character from each selected type
    const ensureTypes = [];
    if (includeUppercase) ensureTypes.push(uppercaseChars);
    if (includeLowercase) ensureTypes.push(lowercaseChars);
    if (includeNumbers) ensureTypes.push(numberChars);
    if (includeSymbols) ensureTypes.push(symbolChars);

    const passwordArray = newPassword.split('');
    ensureTypes.forEach((typeChars, index) => {
      if (index < length) {
        const randomChar =
          typeChars[Math.floor(Math.random() * typeChars.length)];
        const randomPos = Math.floor(Math.random() * length);
        passwordArray[randomPos] = randomChar;
      }
    });

    const finalPassword = passwordArray.join('');
    setPassword(finalPassword);

    // Calculate strength for the generated password
    let passwordStrength = 0;
    if (finalPassword.length >= 8) passwordStrength += 20;
    if (finalPassword.length >= 12) passwordStrength += 20;
    if (finalPassword.length >= 16) passwordStrength += 20;
    if (/[a-z]/.test(finalPassword)) passwordStrength += 10;
    if (/[A-Z]/.test(finalPassword)) passwordStrength += 10;
    if (/[0-9]/.test(finalPassword)) passwordStrength += 10;
    if (/[^a-zA-Z0-9]/.test(finalPassword)) passwordStrength += 10;

    // Track successful password generation
    const endTime = Date.now();
    trackToolUse('password-generator', 'generate', {
      length,
      type: 'standard',
      options: {
        uppercase: includeUppercase,
        lowercase: includeLowercase,
        numbers: includeNumbers,
        symbols: includeSymbols,
        excludeSimilar,
        pronounceable: includePronounceable,
      },
      strength: Math.min(100, passwordStrength),
      generation_time_ms: endTime - startTime,
      success: true,
    });

    // Analytics auto-tracking (NEVER log the real password)
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'password-generator',
      input: `length=${length}, type=standard, uppercase=${includeUppercase}, lowercase=${includeLowercase}, numbers=${includeNumbers}, symbols=${includeSymbols}, excludeSimilar=${excludeSimilar}`,
      output: `length=${finalPassword.length}, generated`,
      timestamp: startTime,
    });

    // Add to history
    setPasswordHistory((prev) => [finalPassword, ...prev.slice(0, 9)]);
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    includePronounceable,
    trackToolUse,
    addToHistory,
  ]);

  const calculateStrength = useCallback(() => {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;

    // Character diversity
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;

    setStrength(Math.min(100, score));
  }, [password]);

  useEffect(() => {
    generatePassword();
  }, []);

  useEffect(() => {
    if (password) {
      calculateStrength();
    }
  }, [password, calculateStrength]);

  const getStrengthColor = () => {
    if (strength < 30) return '#ef4444';
    if (strength < 60) return '#f59e0b';
    if (strength < 80) return '#eab308';
    return '#22c55e';
  };

  const getStrengthText = () => {
    if (strength < 30) return ui.strengthWeak || 'Weak';
    if (strength < 60) return ui.strengthFair || 'Fair';
    if (strength < 80) return ui.strengthGood || 'Good';
    return ui.strengthStrong || 'Strong';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Track successful copy action
      trackToolUse('password-generator', 'copy', {
        password_length: password.length,
        success: true,
      });
    } catch (err) {
      console.error('Failed to copy:', err);

      // Track failed copy action
      trackToolUse('password-generator', 'copy', {
        success: false,
        error: 'clipboard_access_failed',
      });
    }
  };

  const handleCopyFromHistory = async (pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);

      // Track successful history copy action
      trackToolUse('password-generator', 'copy-from-history', {
        password_length: pwd.length,
        success: true,
      });
    } catch (err) {
      console.error('Failed to copy:', err);

      // Track failed history copy action
      trackToolUse('password-generator', 'copy-from-history', {
        success: false,
        error: 'clipboard_access_failed',
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ui.heading || 'Password Generator'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: getStrengthColor() }} />
          <span
            className="text-sm font-medium"
            style={{ color: getStrengthColor() }}
          >
            {getStrengthText()}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Generated Password Display */}
        <div className="relative">
          <div
            className="rounded-lg border-2 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800"
            style={{ borderColor: `${categoryColor}30` }}
          >
            <div className="flex items-center justify-between gap-4">
              <code className="flex-1 break-all font-mono text-sm text-gray-900 dark:text-white sm:text-lg md:text-xl">
                {password || ui.clickToGenerate || 'Click generate to create password'}
              </code>
              <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!password}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700 sm:p-2"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                  ) : (
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
                <button
                  onClick={generatePassword}
                  className="rounded-lg p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 sm:p-2"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Strength Meter */}
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${strength}%`,
                  backgroundColor: getStrengthColor(),
                }}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Length Slider */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {ui.passwordLength || 'Password Length'}
              </label>
              <span className="rounded bg-gray-100 px-2 py-1 text-sm font-medium dark:bg-gray-700">
                {length}
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="64"
              value={length}
              onChange={(e) => {
                const newLength = parseInt(e.target.value);
                setLength(newLength);

                // Track length change
                trackEngagement('password-generator-option-changed', {
                  option: 'length',
                  value: newLength,
                  previous_value: length,
                });
              }}
              className="w-full"
              style={{ accentColor: categoryColor }}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>4</span>
              <span>16</span>
              <span>32</span>
              <span>48</span>
              <span>64</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setIncludeUppercase(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'include_uppercase',
                    value: newValue,
                    previous_value: includeUppercase,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.uppercase || 'Uppercase (A-Z)'}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setIncludeLowercase(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'include_lowercase',
                    value: newValue,
                    previous_value: includeLowercase,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.lowercase || 'Lowercase (a-z)'}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setIncludeNumbers(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'include_numbers',
                    value: newValue,
                    previous_value: includeNumbers,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.numbers || 'Numbers (0-9)'}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setIncludeSymbols(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'include_symbols',
                    value: newValue,
                    previous_value: includeSymbols,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.symbols || 'Symbols (!@#$%)'}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={excludeSimilar}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setExcludeSimilar(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'exclude_similar',
                    value: newValue,
                    previous_value: excludeSimilar,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.excludeSimilar || 'Exclude Similar'}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:p-3">
              <input
                type="checkbox"
                checked={includePronounceable}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setIncludePronounceable(newValue);

                  // Track option change
                  trackEngagement('password-generator-option-changed', {
                    option: 'include_pronounceable',
                    value: newValue,
                    previous_value: includePronounceable,
                  });
                }}
                className="rounded"
                style={{ accentColor: categoryColor }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {ui.pronounceable || 'Pronounceable'}
              </span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generatePassword}
            className="flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white transition-all hover:scale-105 active:scale-95 sm:px-8 sm:py-3"
            style={{
              backgroundColor: categoryColor,
              boxShadow: `0 4px 12px ${categoryColor}40`,
            }}
          >
            <Zap className="h-4 w-4" />
            {ui.generateButton || 'Generate New Password'}
          </button>
        </div>

        {/* Password History */}
        {passwordHistory.length > 1 && (
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <RefreshCw className="h-4 w-4" />
                <span>Recent passwords ({passwordHistory.length})</span>
              </div>
            </summary>
            <div className="mt-3 space-y-2">
              {passwordHistory.slice(1).map((pwd, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 rounded-lg bg-gray-50 p-2 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <code className="flex-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {pwd}
                  </code>
                  <button
                    onClick={() => handleCopyFromHistory(pwd)}
                    className="p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Security Warning */}
        {strength < 60 && password && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {ui.securityWarning || 'Consider using a longer password with mixed character types for better security.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
