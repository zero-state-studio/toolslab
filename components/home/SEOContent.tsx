'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-white/[0.06]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-start justify-between py-4 text-left"
      >
        <span className="font-medium text-slate-900 transition-colors group-hover:text-violet-300 dark:text-white">
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="ml-2 h-5 w-5 flex-shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="ml-2 h-5 w-5 flex-shrink-0 text-slate-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-slate-700 dark:text-slate-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SEOContent() {
  const { data: t } = useDictionarySectionContext('home');
  const seoContent = t?.seoContent;
  const rawFaqs = seoContent?.faqs || [];
  const faqs = Array.isArray(rawFaqs) ? rawFaqs : [];

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {seoContent?.mainTitle ||
              'Free Developer Tools Online — No Install, No Signup, No Data Collection'}
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-400">
            {seoContent?.intro ||
              'ToolsLab brings together 72 essential developer tools in one fast, privacy-focused platform. Process JSON, encode Base64, decode JWT tokens, generate passwords, convert JPG to PDF, create UUIDs, compute SHA-256 hashes, test regular expressions, format SQL, convert CSV to JSON, encode URLs, and much more — all 100% free and client-side.'}
          </p>

          <h3 className="mt-8 text-2xl font-semibold text-slate-900 dark:text-white">
            {seoContent?.builtForDevs?.title ||
              'Built for Developers, by Developers'}
          </h3>

          <p className="mt-4 text-slate-700 dark:text-slate-400">
            {seoContent?.builtForDevs?.description ||
              'Every tool is optimized for speed and accuracy. No server round-trips, no loading spinners, no account walls — just open the tool and start working.'}
          </p>

          {/* Feature grid — glass cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-card-inset backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {seoContent?.features?.lightningFast?.title ||
                  '🚀 Lightning Fast'}
              </h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
                {seoContent?.features?.lightningFast?.description ||
                  'All tools run directly in your browser with no server latency.'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {seoContent?.features?.private?.title || '🔒 100% Private'}
              </h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
                {seoContent?.features?.private?.description ||
                  'Your data never leaves your browser. Zero data collection, zero tracking.'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-card-inset backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {seoContent?.features?.toolChaining?.title ||
                  '🔗 Tool Chaining'}
              </h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
                {seoContent?.features?.toolChaining?.description ||
                  'Connect tools together for complex workflows. JSON → Base64 → URL encode in seconds.'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-card-inset backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {seoContent?.features?.worksEverywhere?.title ||
                  '📱 Works Everywhere'}
              </h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
                {seoContent?.features?.worksEverywhere?.description ||
                  'Responsive design optimized for desktop, tablet, and mobile browsers.'}
              </p>
            </div>
          </div>

          <h3 className="mt-12 text-2xl font-semibold text-slate-900 dark:text-white">
            {seoContent?.title || 'Frequently Asked Questions'}
          </h3>

          <div className="mt-6">
            {faqs.length > 0 &&
              faqs.map((faq: any) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
          </div>

          {/* CTA box — violet/amber gradient */}
          <div className="mt-12 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-amber-500/[0.04] p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {seoContent?.ctaBox?.title ||
                'Ready to supercharge your development workflow?'}
            </h3>
            <p className="mt-2 text-slate-700 dark:text-slate-400">
              {seoContent?.ctaBox?.description ||
                '72 free tools, no signup, no data collection. Open any tool and start immediately.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
