'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Code2,
  Zap,
  Shield,
  Users,
  Heart,
  Lightbulb,
  Rocket,
  Star,
  Globe,
  MousePointer,
  Smartphone,
  Moon,
  ArrowRight,
  Coffee,
  Github,
  Twitter,
  Sparkles,
  TrendingUp,
  Eye,
  MousePointerClick,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TLMascot } from '@/components/icons/TLMascot';
import { TypewriterText } from './TypewriterText';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';

interface NewAboutPageProps {
  locale?: string;
  dictionary?: any;
}

const timelineIcons = [Lightbulb, Code2, Rocket, Users, Globe, Star];

const featureConfig = [
  { icon: Zap, hue: 45 },
  { icon: Shield, hue: 145 },
  { icon: Heart, hue: 350 },
  { icon: MousePointer, hue: 220 },
  { icon: Moon, hue: 270 },
  { icon: Smartphone, hue: 175 },
];

const socialLinksConfig = [
  {
    icon: Twitter,
    href: 'https://x.com/tools_lab',
    hue: 210,
  },
  {
    icon: Github,
    href: 'https://github.com/hellotoolslab/toolslab',
    hue: 280,
  },
  {
    icon: Coffee,
    href: 'https://buymeacoffee.com/toolslab',
    hue: 35,
  },
];

function chipStyle(hue: number) {
  return {
    '--cat-bg-light': `oklch(0.92 0.10 ${hue})`,
    '--cat-bg-dark': `oklch(0.30 0.10 ${hue})`,
    '--cat-text-light': `oklch(0.50 0.20 ${hue})`,
    '--cat-text-dark': `oklch(0.85 0.20 ${hue})`,
  } as React.CSSProperties;
}

export function NewAboutPage({ locale, dictionary }: NewAboutPageProps) {
  const { createHref } = useLocalizedRouter();

  const t = dictionary?.about || {};
  const hero = t.hero || {};
  const stats = t.stats || {};
  const timeline = t.timeline || {};
  const features = t.features || {};
  const story = t.story || {};
  const social = t.social || {};
  const cta = t.cta || {};

  const timelineSteps = (timeline.steps || []).map(
    (step: any, index: number) => ({
      icon: timelineIcons[index] || Lightbulb,
      title: step.title,
      year: step.year,
      description: step.description,
    })
  );

  const featuresData = (features.items || []).map(
    (item: any, index: number) => ({
      icon: featureConfig[index]?.icon || Zap,
      hue: featureConfig[index]?.hue ?? 270,
      title: item.title,
      description: item.description,
    })
  );

  const socialLinks = (social.links || []).map((link: any, index: number) => ({
    ...socialLinksConfig[index],
    label: link.label,
    description: link.description,
  }));

  // Real metrics from /public/about/metrics_2026.png (May 2026 snapshot)
  const liveStats = [
    {
      icon: Users,
      value: '11.5k',
      label: 'Visitors',
      delta: '+678%',
      trend: 'up' as const,
      hue: 270,
    },
    {
      icon: Eye,
      value: '18.1k',
      label: 'Page views',
      delta: '+361%',
      trend: 'up' as const,
      hue: 220,
    },
    {
      icon: MousePointerClick,
      value: '3K',
      label: 'Google clicks · 28d',
      delta: 'new milestone',
      trend: 'up' as const,
      hue: 45,
    },
    {
      icon: Shield,
      value: '0',
      label: 'Data collected',
      delta: '100% private',
      trend: 'flat' as const,
      hue: 145,
    },
  ];

  return (
    <div className="bg-pg-bg text-pg-text">
      {/* HERO ------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 h-[320px] w-[320px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, var(--pg-accent-2) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 top-32 h-[260px] w-[260px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, var(--pg-accent) 0%, transparent 70%)',
          }}
        />

        <div className="pg-container relative pb-16 pt-20 text-center">
          <motion.div
            className="mb-6 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <TLMascot size={120} />
          </motion.div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pg-border bg-pg-surface px-3 py-1.5 text-[13px] text-pg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-pg-accent-4" />
            {hero.scrollIndicator || 'Independent · open source · 2025—now'}
          </div>

          <motion.h1
            className="mb-4 text-[clamp(40px,7vw,72px)] font-bold leading-[1.02] tracking-[-0.045em]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {hero.title || 'About ToolsLab'}
            <br />
            <span className="pg-headline-gradient">
              built by a dev, for devs.
            </span>
          </motion.h1>

          <div className="mx-auto mb-8 h-8 max-w-[640px] text-[18px] leading-[1.5] text-pg-muted md:text-xl">
            <TypewriterText
              text={hero.subtitle || 'Your developer toolbox, reimagined.'}
              delay={400}
              className="font-light"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              hero.badges?.free || '100% Free',
              hero.badges?.privacy || 'Privacy First',
              hero.badges?.noRegistration || 'No Registration',
            ].map((text) => (
              <Badge
                key={text}
                variant="outline"
                className="border-pg-border bg-pg-surface px-3 py-1.5 text-[13px] font-medium text-pg-text hover:bg-pg-surface-hi"
              >
                <Heart className="mr-1.5 h-3 w-3 text-pg-accent-2" />
                {text}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE METRICS ---------------------------------------------------- */}
      <section className="pg-container py-16">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pg-border bg-pg-surface-hi px-3 py-1 text-[12px] text-pg-muted">
            <TrendingUp className="h-3 w-3 text-pg-accent-4" />
            {stats.subtitle || 'Live numbers · this year'}
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pg-text">
            {stats.title || 'Real growth, no smoke and mirrors.'}
          </h2>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {liveStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-[14px] border border-pg-border bg-pg-surface p-5 transition-colors hover:border-pg-border-hi"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="cat-chip flex h-9 w-9 items-center justify-center rounded-[10px]"
                  style={chipStyle(s.hue)}
                >
                  <s.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    s.trend === 'up'
                      ? 'text-pg-accent-4'
                      : 'text-pg-muted'
                  }`}
                >
                  {s.delta}
                </span>
              </div>
              <div className="text-[28px] font-bold leading-none tracking-[-0.02em] text-pg-text">
                {s.value}
              </div>
              <div className="mt-1 text-[13px] text-pg-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.figure
          className="overflow-hidden rounded-[16px] border border-pg-border bg-pg-surface p-3 md:p-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Image
            src="/about/metrics_2026.png"
            alt="ToolsLab analytics dashboard for 2026 — 11.5k visitors, 13.9k visits, 18.1k views"
            width={1730}
            height={1094}
            className="h-auto w-full rounded-[10px]"
            sizes="(min-width: 1200px) 1120px, 100vw"
          />
          <figcaption className="mt-3 px-1 text-center text-[12px] text-pg-dim">
            Public Umami dashboard · year-to-date
          </figcaption>
        </motion.figure>
      </section>

      {/* MILESTONES ------------------------------------------------------ */}
      <section className="bg-pg-bg-2/50 py-20">
        <div className="pg-container">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pg-border bg-pg-surface px-3 py-1 text-[12px] text-pg-muted">
              <Trophy className="h-3 w-3 text-pg-accent-3" />
              Search Console milestones
            </div>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pg-text">
              From 1.8K to 3K Google clicks · in five weeks.
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] text-[16px] text-pg-muted">
              Every badge below is an automatic Google Search Console
              celebration — concrete proof of organic growth, no paid traffic.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
            <motion.figure
              className="lg:col-span-2 overflow-hidden rounded-[16px] border border-pg-border bg-pg-surface p-3"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Image
                src="/about/gsc_3k.png"
                alt="Google Search Console badge celebrating 3,000 clicks in 28 days"
                width={1316}
                height={1160}
                className="h-auto w-full rounded-[10px]"
                sizes="(min-width: 1024px) 440px, 100vw"
              />
              <figcaption className="mt-3 px-1 text-center text-[12px] text-pg-dim">
                3K clicks · 28-day milestone (May 2026)
              </figcaption>
            </motion.figure>

            <motion.figure
              className="lg:col-span-3 overflow-hidden rounded-[16px] border border-pg-border bg-pg-surface p-3"
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Image
                src="/about/gsc_history.png"
                alt="Search Console history showing milestones from 1.8K to 3K clicks"
                width={1274}
                height={1206}
                className="h-auto w-full rounded-[10px]"
                sizes="(min-width: 1024px) 660px, 100vw"
              />
              <figcaption className="mt-3 px-1 text-center text-[12px] text-pg-dim">
                Five consecutive milestones · April → May 2026
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </section>

      {/* TIMELINE -------------------------------------------------------- */}
      <section className="pg-container py-20">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pg-text">
            {timeline.title || 'The journey'}
          </h2>
          <p className="mx-auto max-w-[620px] text-[16px] text-pg-muted">
            {timeline.subtitle ||
              'From personal frustration to a community resource.'}
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-4xl">
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-pg-accent via-pg-accent-2 to-pg-accent-3 md:block"
          />
          <div className="space-y-10 md:space-y-14">
            {timelineSteps.map((step: any, index: number) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  className={`relative flex flex-col items-stretch md:flex-row md:items-center ${
                    isLeft ? '' : 'md:flex-row-reverse'
                  }`}
                  initial={{ opacity: 0, x: isLeft ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <div
                    className={`w-full md:w-5/12 ${
                      isLeft ? 'md:pr-10' : 'md:pl-10'
                    }`}
                  >
                    <div className="rounded-[14px] border border-pg-border bg-pg-surface p-6 transition-colors hover:border-pg-border-hi">
                      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-pg-surface-hi px-2.5 py-1 text-[11px] font-semibold text-pg-accent">
                        {step.year}
                      </span>
                      <h3 className="mb-2 text-[18px] font-semibold text-pg-text">
                        {step.title}
                      </h3>
                      <p className="text-[14px] leading-relaxed text-pg-muted">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-pg-border bg-pg-surface md:flex">
                    <step.icon
                      className="h-5 w-5 text-pg-accent"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="hidden md:block md:w-5/12" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES -------------------------------------------------------- */}
      <section className="bg-pg-bg-2/50 py-20">
        <div className="pg-container">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pg-text">
              {features.title || 'Why ToolsLab?'}
            </h2>
            <p className="mx-auto max-w-[620px] text-[16px] text-pg-muted">
              {features.subtitle ||
                'Built with developers in mind, optimized for your workflow.'}
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature: any, index: number) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[14px] border border-pg-border bg-pg-surface p-5 transition-colors hover:border-pg-border-hi"
              >
                <span
                  className="cat-chip mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={chipStyle(feature.hue)}
                >
                  <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold text-pg-text">
                  {feature.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-pg-muted">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVELOPER STORY ------------------------------------------------- */}
      <section className="pg-container py-20">
        <motion.div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[20px] border border-pg-border bg-pg-surface p-8 md:p-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, var(--pg-accent) 0%, transparent 70%)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, var(--pg-accent-2) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="mb-6 flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pg-accent to-pg-accent-2 text-white shadow-md">
                <Code2 className="h-8 w-8" />
              </span>
            </div>

            <blockquote className="text-center">
              <p
                className="mb-6 text-[16px] italic leading-relaxed text-pg-muted md:text-[18px]"
                style={{ whiteSpace: 'pre-line' }}
              >
                &ldquo;
                {story.quote ||
                  "Hi, I'm the developer behind ToolsLab. Like you, I was tired of juggling dozens of browser tabs for simple conversions and generations. Every tool on a different site, most filled with ads, some behind paywalls.\n\nSo I built ToolsLab — my personal Swiss Army knife for development. What started as a local project quickly became invaluable to my team, and now I'm thrilled to share it with developers worldwide.\n\nNo catches, no upsells. Just tools that work, built by a developer who uses them every single day."}
                &rdquo;
              </p>

              <footer className="text-center">
                <div className="mb-3 text-[15px] font-semibold text-pg-text">
                  {story.author || '— ToolsLab Creator'}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-pg-border bg-pg-surface-hi text-pg-muted"
                  >
                    {story.badges?.developer || 'Full Stack Developer'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-pg-border bg-pg-surface-hi text-pg-muted"
                  >
                    {story.badges?.enthusiast || 'Open Source Enthusiast'}
                  </Badge>
                </div>
              </footer>
            </blockquote>
          </div>
        </motion.div>
      </section>

      {/* SOCIAL ---------------------------------------------------------- */}
      <section className="bg-pg-bg-2/50 py-20">
        <div className="pg-container">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pg-text">
              {social.title || 'Connect & support'}
            </h2>
            <p className="text-[16px] text-pg-muted">
              {social.subtitle ||
                'Join the community, contribute, or show your appreciation.'}
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
            {socialLinks.map((link: any, index: number) => (
              <motion.a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group flex items-start gap-4 rounded-[14px] border border-pg-border bg-pg-surface p-5 transition-colors hover:border-pg-border-hi"
              >
                <span
                  className="cat-chip flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]"
                  style={chipStyle(link.hue)}
                >
                  <link.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[15px] font-semibold text-pg-text">
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 text-pg-muted transition-transform group-hover:translate-x-0" />
                  </div>
                  <div className="mt-0.5 text-[13px] text-pg-muted">
                    {link.description}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'linear-gradient(135deg, var(--pg-accent) 0%, var(--pg-accent-2) 50%, var(--pg-accent-3) 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='37' cy='37' r='2'/%3E%3Ccircle cx='7' cy='37' r='2'/%3E%3Ccircle cx='37' cy='7' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="pg-container relative py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl"
          >
            <Sparkles className="mx-auto mb-5 h-10 w-10 text-white" />
            <h2 className="mb-4 text-[clamp(30px,4vw,46px)] font-bold leading-[1.1] tracking-[-0.025em] text-white">
              {cta.title || 'Ready to boost your productivity?'}
            </h2>
            <p className="mb-8 text-[17px] leading-relaxed text-white/90">
              {cta.subtitle ||
                "Thousands of developers already made ToolsLab their go-to toolkit. No registration, no costs, just productivity."}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={createHref('/tools')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-white px-7 text-[15px] font-semibold text-pg-text shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Rocket className="h-4 w-4" />
                {cta.buttons?.exploreTools || 'Explore tools'}
              </a>
              <a
                href="https://buymeacoffee.com/toolslab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/40 bg-white/10 px-7 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Coffee className="h-4 w-4" />
                {cta.buttons?.support || 'Support the project'}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
