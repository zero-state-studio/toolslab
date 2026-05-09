'use client';

import { Zap, Shield, Heart, Github } from 'lucide-react';

const items = [
  {
    icon: Zap,
    title: 'Instant',
    desc: 'No upload, zero wait',
    colorVar: 'var(--pg-accent-3)',
  },
  {
    icon: Shield,
    title: 'Private',
    desc: 'Files never leave your tab',
    colorVar: 'var(--pg-accent-4)',
  },
  {
    icon: Heart,
    title: 'Free forever',
    desc: 'No ads, no paywalls',
    colorVar: 'var(--pg-accent-2)',
  },
  {
    icon: Github,
    title: 'Open source',
    desc: 'MIT licensed · community-driven',
    colorVar: 'var(--pg-accent)',
  },
];

export function PGValueProps() {
  return (
    <section className="pg-container pb-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc, colorVar }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-pg-card border border-pg-border bg-pg-surface p-4"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `color-mix(in oklab, ${colorVar} 22%, transparent)`,
                color: colorVar,
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-pg-text">{title}</div>
              <div className="mt-0.5 text-[13px] text-pg-muted">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PGValueProps;
