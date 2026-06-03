'use client';

import { useState, useCallback, type CSSProperties } from 'react';
import {
  AlertCircle,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/lib/hooks/useCopy';
import { useDownload } from '@/lib/hooks/useDownload';
import type {
  ToolFrameProps,
  ToolFrameOptionsProps,
  ToolFrameOutputProps,
  ToolFrameSectionProps,
} from './types';

function ToolFrameRoot({
  title,
  subtitle,
  icon,
  categoryColor,
  primaryAction,
  secondaryActions,
  error,
  loading,
  loadingMessage,
  className,
  children,
}: ToolFrameProps) {
  const accentStyle: CSSProperties | undefined = categoryColor
    ? ({ ['--tool-accent' as string]: categoryColor } as CSSProperties)
    : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      style={accentStyle}
    >
      {categoryColor ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: `linear-gradient(to right, ${categoryColor}, ${categoryColor}33)`,
          }}
        />
      ) : null}
      <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center"
              style={categoryColor ? { color: categoryColor } : undefined}
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {secondaryActions && secondaryActions.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryActions.map((action, idx) => (
              <Button
                key={`${action.label}-${idx}`}
                variant={action.variant ?? 'outline'}
                size="sm"
                onClick={action.onClick}
                aria-label={action.label}
              >
                {action.icon ? (
                  <span className="mr-1.5 inline-flex">{action.icon}</span>
                ) : null}
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </header>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p className="leading-snug">{error}</p>
        </div>
      ) : null}

      <div className="relative space-y-6 p-6">
        {children}

        {primaryAction ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-medium text-white transition-all',
                'hover:scale-[1.02] active:scale-95',
                'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100'
              )}
              style={{
                backgroundColor: categoryColor || 'var(--pg-accent)',
                boxShadow: categoryColor
                  ? `0 4px 12px ${categoryColor}40`
                  : '0 4px 12px rgb(124 58 237 / 0.25)',
              }}
              aria-keyshortcuts={primaryAction.shortcut}
            >
              {primaryAction.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : primaryAction.icon ? (
                primaryAction.icon
              ) : null}
              <span>{primaryAction.label}</span>
              {primaryAction.shortcut ? (
                <kbd className="ml-1 hidden rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/80 sm:inline-block">
                  {primaryAction.shortcut}
                </kbd>
              ) : null}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm dark:bg-gray-900/70"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3 text-gray-700 dark:text-gray-200">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={categoryColor ? { color: categoryColor } : undefined}
                aria-hidden="true"
              />
              {loadingMessage ? (
                <p className="text-sm">{loadingMessage}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToolFrameSection({
  title,
  description,
  className,
  children,
}: ToolFrameSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      {title ? (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function ToolFrameOptions({
  label = 'Options',
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: ToolFrameOptionsProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = useCallback(() => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [open, isControlled, onOpenChange]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/60"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ToolFrameOutput({
  title = 'Result',
  value,
  copyText,
  downloadText: downloadValue,
  downloadFilename = 'output.txt',
  onRegenerate,
  customActions,
  emptyState,
  show,
  children,
  className,
}: ToolFrameOutputProps) {
  const { copied, copy } = useCopy();
  const { downloadText: doDownload } = useDownload();

  const visible =
    show ?? Boolean(value || (Array.isArray(children) ? children.length : children));

  const textForCopy = copyText ?? value;
  const textForDownload = downloadValue ?? value;

  const handleCopy = useCallback(async () => {
    if (!textForCopy) return;
    await copy(textForCopy);
  }, [copy, textForCopy]);

  const handleDownload = useCallback(async () => {
    if (!textForDownload) return;
    try {
      await doDownload(textForDownload, {
        filename: downloadFilename,
        mimeType: 'text/plain',
        timestamp: true,
      });
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [doDownload, textForDownload, downloadFilename]);

  if (!visible) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-gray-900/30',
          className
        )}
      >
        {emptyState ?? (
          <>
            <Sparkles
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Run the tool to see your result here.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <section className={cn('space-y-3', className)} aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {textForCopy ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          ) : null}
          {textForDownload ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              aria-label="Download as file"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          ) : null}
          {onRegenerate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              aria-label="Regenerate"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
          ) : null}
          {customActions?.map((action, idx) => (
            <Button
              key={`${action.label}-${idx}`}
              variant={action.variant ?? 'outline'}
              size="sm"
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.icon ? (
                <span className="mr-1.5 inline-flex">{action.icon}</span>
              ) : null}
              {action.label}
            </Button>
          ))}
        </div>
      </header>
      {children ? <div>{children}</div> : null}
    </section>
  );
}

export const ToolFrame = Object.assign(ToolFrameRoot, {
  Section: ToolFrameSection,
  Options: ToolFrameOptions,
  Output: ToolFrameOutput,
});

export type { ToolFrameProps } from './types';
