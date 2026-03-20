'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Check, Sparkles, Search } from 'lucide-react';
import Link from 'next/link';
import { formatJson } from '@/lib/tools/json-formatter';
import { useLocale } from '@/hooks/useLocale';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

const sampleJson = `{"user":{"id":1,"name":"John Doe","email":"john@example.com","roles":["admin","user"],"settings":{"theme":"dark","notifications":true}}}`;

export function InteractiveDemo() {
  const { createHref } = useLocale();
  const { data: t } = useDictionarySectionContext('home');
  const demo = t?.interactiveDemo;
  const { data: commonT } = useDictionarySectionContext('common');

  const [isFormatted, setIsFormatted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ value: any; path: string }>
  >([]);
  const [hasSearched, setHasSearched] = useState(false);

  const formattedJson = formatJson(sampleJson).result || '';

  const searchJsonKey = () => {
    setHasSearched(true);
    if (!formattedJson || !searchKey.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = JSON.parse(formattedJson);
      const results: Array<{ value: any; path: string }> = [];
      const findAllKeys = (
        obj: any,
        key: string,
        path: string[] = []
      ): void => {
        if (
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          key in obj
        ) {
          results.push({
            value: obj[key],
            path: [...path, `['${key}']`].join(''),
          });
        }
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              findAllKeys(obj[i], key, [...path, `[${i}]`]);
            }
          } else {
            for (const [k, v] of Object.entries(obj)) {
              if (k !== key) findAllKeys(v, key, [...path, `['${k}']`]);
            }
          }
        }
      };
      findAllKeys(data, searchKey);
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    }
  };

  const handleFormat = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsFormatted(true);
      setIsAnimating(false);
    }, 500);
  };

  const handleReset = () => {
    setIsFormatted(false);
    setCopied(false);
    setSearchKey('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isFormatted ? formattedJson : sampleJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">
              Interactive Demo
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {demo?.title || 'See It In Action'}
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            {demo?.subtitle || 'Try our JSON formatter right here, right now'}
          </p>
        </div>

        {/* macOS-style demo frame */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none">
          {/* macOS titlebar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              {/* Traffic light dots */}
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-slate-600">
                json-formatter.demo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    {commonT?.messages?.copied || 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {demo?.copyButton || 'Copy'}
                  </>
                )}
              </button>
              {isFormatted && (
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-[#0d0d12] p-4 text-sm">
                <code className="text-slate-300">
                  <motion.div
                    animate={isAnimating ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isFormatted ? (
                      <div className="space-y-1">
                        {formattedJson
                          .split('\n')
                          .map((line: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                            >
                              {line}
                            </motion.div>
                          ))}
                      </div>
                    ) : (
                      <div className="break-all">{sampleJson}</div>
                    )}
                  </motion.div>
                </code>
              </pre>

              {/* Format button overlay */}
              {!isFormatted && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d12]/60 backdrop-blur-sm">
                  <motion.button
                    onClick={handleFormat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all hover:shadow-[0_0_32px_rgba(139,92,246,0.5)]"
                  >
                    <Sparkles className="h-5 w-5" />
                    {demo?.action || 'Format JSON'}
                  </motion.button>
                </div>
              )}
            </div>

            {/* Key Search Section */}
            {isFormatted && (
              <div className="mt-6 space-y-4">
                <div className="border-t border-slate-200 pt-4 dark:border-white/[0.06]">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    🔍 Try Key Search
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <label htmlFor="demo-key-search" className="sr-only">
                        Search for JSON key
                      </label>
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="demo-key-search"
                        type="text"
                        value={searchKey}
                        onChange={(e) => setSearchKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchJsonKey()}
                        placeholder="Search for key (e.g. 'user', 'name', 'settings')..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:placeholder-slate-600"
                        suppressHydrationWarning
                      />
                    </div>
                    <button
                      onClick={searchJsonKey}
                      disabled={!searchKey.trim()}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {hasSearched && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none">
                    {searchResults.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-emerald-400">
                          Found {searchResults.length} result
                          {searchResults.length !== 1 ? 's' : ''}:
                        </div>
                        {searchResults.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                          >
                            <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                              Path:{' '}
                              <code className="rounded bg-slate-100 px-1 text-violet-600 dark:bg-white/[0.06] dark:text-violet-300">
                                {result.path}
                              </code>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-400">
                              Value:{' '}
                              <code className="rounded bg-violet-100 px-1 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                                {typeof result.value === 'string'
                                  ? `"${result.value}"`
                                  : JSON.stringify(result.value)}
                              </code>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : searchKey.trim() ? (
                      <div className="text-center text-slate-500">
                        <div className="mb-2 text-2xl">🔍</div>
                        <div>
                          No results found for key &quot;{searchKey}&quot;
                        </div>
                        <div className="mt-2 text-xs">
                          Try searching for &quot;user&quot;, &quot;name&quot;,
                          or &quot;settings&quot;
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {isFormatted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-300">
                      JSON formatted successfully!
                    </p>
                    <p className="text-sm text-emerald-400/70">
                      Your JSON is now properly formatted and readable
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* CTA footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
            <p className="text-sm text-slate-500">
              Like what you see? Try the full-featured JSON formatter
            </p>
            <Link
              href={createHref('/tools/json-formatter')}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-violet-400"
            >
              {demo?.viewTool || 'Try Full JSON Formatter'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
