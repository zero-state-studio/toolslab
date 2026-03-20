'use client';

import { Github, Zap, BarChart3, CloudCog, Globe, Shield } from 'lucide-react';
import { trackSocial } from '@/lib/analytics';

const stats = [
  {
    value: '0 Bytes',
    label: 'Your data never leaves your device',
    accent: 'emerald',
    accentClasses: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      valueBg: 'text-emerald-300',
    },
    icon: Shield,
  },
  {
    value: 'Open Source',
    label: 'Community-driven development',
    accent: 'violet',
    accentClasses: {
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      valueBg: 'text-violet-300',
    },
    icon: Github,
    link: 'https://github.com',
  },
  {
    value: '$0 / month',
    label: 'Free forever · No premium tier',
    accent: 'amber',
    accentClasses: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      valueBg: 'text-amber-300',
    },
    icon: Zap,
  },
  {
    value: '6 Languages',
    label: 'EN, IT, ES, FR, DE, PT',
    accent: 'violet',
    accentClasses: {
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      valueBg: 'text-violet-300',
    },
    icon: Globe,
  },
];

const logoRow = [
  { id: 'github', icon: Github, label: 'GitHub', url: 'https://github.com' },
  { id: 'vercel', icon: Zap, label: 'Vercel', url: 'https://vercel.com' },
  {
    id: 'umami',
    icon: BarChart3,
    label: 'Umami',
    url: 'https://umami.is',
  },
  {
    id: 'cloudflare',
    icon: CloudCog,
    label: 'Cloudflare',
    url: 'https://cloudflare.com',
  },
];

export function PoweredBy() {
  return (
    <section className="relative py-20">
      {/* Gradient divider line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="container relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-emerald-400">
              Transparent by design
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Built in the Open
          </h2>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-400">
            No hidden costs. No data collection. No vendor lock-in.
          </p>
        </div>

        {/* 4 stat cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const content = (
              <div
                className={`flex h-full flex-col items-center rounded-2xl border ${stat.accentClasses.border} ${stat.accentClasses.bg} p-6 text-center shadow-card-inset backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:brightness-110`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.05]`}
                >
                  <Icon className={`h-5 w-5 ${stat.accentClasses.text}`} />
                </div>
                <div
                  className={`text-2xl font-bold ${stat.accentClasses.valueBg}`}
                >
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            );

            if (stat.link) {
              return (
                <a
                  key={stat.value}
                  href={stat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocial('github', 'built-in-open')}
                >
                  {content}
                </a>
              );
            }
            return <div key={stat.value}>{content}</div>;
          })}
        </div>

        {/* Logo row — secondary "Powered by" */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-700">
            Powered by
          </span>
          {logoRow.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial(item.id, 'powered-by-logos')}
                className="flex items-center gap-1.5 text-slate-700 transition-colors hover:text-slate-400"
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
