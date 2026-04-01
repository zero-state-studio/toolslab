'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface MetricConfig {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  duration: number;
  accent: 'violet' | 'emerald' | 'amber';
}

const metricsConfig: MetricConfig[] = [
  {
    value: 72,
    suffix: '',
    label: 'Free tools available',
    duration: 1200,
    accent: 'violet',
  },
  {
    value: 100,
    suffix: '%',
    label: 'Client-side processing',
    duration: 1500,
    accent: 'emerald',
  },
  {
    value: 6,
    suffix: '',
    label: 'Languages supported',
    duration: 800,
    accent: 'amber',
  },
  {
    value: 0,
    suffix: '',
    label: 'Bytes of data collected',
    duration: 600,
    accent: 'emerald',
  },
];

const accentColors = {
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
};

function AnimatedCounter({
  value,
  duration,
  suffix,
  accent,
}: {
  value: number;
  duration: number;
  suffix: string;
  accent: 'violet' | 'emerald' | 'amber';
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * value);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, isInView]);

  return (
    <span ref={ref} className={`tabular-nums ${accentColors[accent]}`}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function TrustMetrics() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50/70 py-16 dark:border-white/[0.06] dark:bg-background">
      {/* Subtle technical grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            72 Free Developer Tools.{' '}
            <span className="text-emerald-400">100% Private.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            Real numbers — no invented stats
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {metricsConfig.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none">
                <div className="text-4xl font-bold sm:text-5xl">
                  <AnimatedCounter
                    value={metric.value}
                    duration={metric.duration}
                    suffix={metric.suffix}
                    accent={metric.accent}
                  />
                </div>
                <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-400">
                  {metric.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mono trust line */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-xs text-slate-600">
          <span>SSL Encrypted</span>
          <span>·</span>
          <span>GDPR Compliant</span>
          <span>·</span>
          <span>No cookies sold</span>
          <span>·</span>
          <span>Open Source</span>
        </div>
      </div>
    </section>
  );
}
