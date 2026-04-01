'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, Link, Smartphone, Rocket, Globe } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';

const benefitKeys = [
  {
    key: 'instantProcessing',
    icon: Zap,
    topBorder: 'from-amber-500/60 via-amber-400/40 to-transparent',
  },
  {
    key: 'zeroDataStorage',
    icon: Shield,
    topBorder: 'from-emerald-500/60 via-emerald-400/40 to-transparent',
    isPrivacy: true,
  },
  {
    key: 'chainTools',
    icon: Link,
    topBorder: 'from-violet-500/60 via-violet-400/40 to-transparent',
  },
  {
    key: 'worksEverywhere',
    icon: Smartphone,
    topBorder: 'from-cyan-500/60 via-cyan-400/40 to-transparent',
  },
  {
    key: 'noSignup',
    icon: Rocket,
    topBorder: 'from-rose-500/60 via-rose-400/40 to-transparent',
  },
  {
    key: 'darkMode',
    icon: Globe,
    topBorder: 'from-indigo-500/60 via-indigo-400/40 to-transparent',
  },
];

interface WhyToolsLabProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export function WhyToolsLab({ locale, dictionary }: WhyToolsLabProps) {
  const defaultTexts = {
    title: 'Why Developers Choose ToolsLab',
    subtitle: 'Six reasons developers use us daily',
    footer: 'Built with ❤️ by developers who understand your needs',
  };

  const texts = {
    title: dictionary?.home?.whyToolsLab?.title || defaultTexts.title,
    subtitle: dictionary?.home?.whyToolsLab?.subtitle || defaultTexts.subtitle,
    footer: dictionary?.home?.whyToolsLab?.footer || defaultTexts.footer,
  };

  return (
    <section className="bg-slate-50/70 py-16 dark:bg-background sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {texts.title.includes('ToolsLab') ? (
              <>
                {texts.title.split('ToolsLab')[0]}
                <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
                  ToolsLab
                </span>
                {texts.title.split('ToolsLab')[1]}
              </>
            ) : (
              texts.title
            )}
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            {texts.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefitKeys.map((benefit, index) => {
            const Icon = benefit.icon;
            const benefitData =
              dictionary?.home?.whyToolsLab?.benefits?.[
                benefit.key as keyof typeof dictionary.home.whyToolsLab.benefits
              ];

            return (
              <motion.div
                key={benefit.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04] dark:hover:shadow-none">
                  {/* Animated top gradient border */}
                  <div
                    className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${benefit.topBorder} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  {/* Privacy badge for zeroDataStorage */}
                  {benefit.isPrivacy && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400">Private</span>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-300 shadow-lg transition-all duration-200 group-hover:scale-110 dark:border-white/[0.08] dark:bg-white/[0.05]">
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-100">
                      {benefitData?.title ||
                        (benefit.key === 'zeroDataStorage'
                          ? 'Zero Data Collection'
                          : benefit.key === 'chainTools'
                            ? 'Chainable Workflows'
                            : benefit.key)}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-400">
                      {benefitData?.description || ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer message */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 dark:text-slate-500">{texts.footer}</p>
        </div>
      </div>
    </section>
  );
}
