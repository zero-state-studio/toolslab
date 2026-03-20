'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { tools } from '@/lib/tools';
import { useLocale } from '@/hooks/useLocale';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';
import { useState, useEffect } from 'react';

// Fix: sort by searchVolume instead of using label === 'popular' (always empty)
const popularTools = tools
  .filter((t) => t.label !== 'coming-soon')
  .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
  .slice(0, 8);

export function FooterCTA() {
  const { createHref } = useLocale();
  const { data: t } = useDictionarySectionContext('home');
  const cta = t?.footerCTA;

  // Generate particles only on client to avoid hydration mismatch
  const [particles, setParticles] = useState<
    Array<{
      left: number;
      xRange: number;
      duration: number;
      delay: number;
      isViolet: boolean;
    }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        left: Math.random() * 100,
        xRange: Math.random() * 100 - 50,
        duration: Math.random() * 5 + 5,
        delay: Math.random() * 5,
        isViolet: i < 9, // 70% violet, 30% amber
      }))
    );
  }, []);

  return (
    <section className="relative overflow-hidden border-t border-slate-200 bg-background py-16 dark:border-white/[0.06] sm:py-20">
      {/* Dual glow accents */}
      <div className="bg-violet-600/8 pointer-events-none absolute -left-32 top-0 h-[400px] w-[400px] rounded-full blur-3xl" />
      <div className="bg-amber-500/6 pointer-events-none absolute -right-32 top-0 h-[400px] w-[400px] rounded-full blur-3xl" />

      {/* Floating particles — 70% violet, 30% amber */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className={`absolute h-1.5 w-1.5 rounded-full ${
              particle.isViolet ? 'bg-violet-400/15' : 'bg-amber-400/15'
            }`}
            animate={{
              y: [-20, -120],
              x: [0, particle.xRange],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
            style={{
              left: `${particle.left}%`,
              bottom: 0,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-violet-500/20 to-amber-500/20 px-4 py-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="bg-gradient-to-r from-violet-300 to-amber-300 bg-clip-text font-mono text-xs font-medium uppercase tracking-widest text-transparent">
                {cta?.subtitle || 'Free forever · No signup · Open source'}
              </span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Start Building,{' '}
              <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
                Right Now
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-slate-400">
              {cta?.description ||
                '72 free developer tools — open any one and start immediately. No account, no waiting.'}
            </p>
          </motion.div>

          {/* Popular tools chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12"
          >
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-slate-600">
              Most-searched tools:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={createHref(tool.route)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-violet-400 hover:text-violet-600 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400 dark:shadow-none dark:hover:border-violet-500/30 dark:hover:text-violet-300 dark:hover:shadow-none"
                >
                  <span>{tool.icon}</span>
                  {tool.name}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <Link
              href={createHref('/tools')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-4 text-lg font-bold text-white shadow-[0_0_32px_rgba(139,92,246,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_0_48px_rgba(139,92,246,0.45)]"
            >
              {cta?.button || 'Explore All 72 Tools'}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-sm text-slate-600">
              No signup · Free forever ·{' '}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-violet-400"
              >
                Open source ↗
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
