'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, X } from 'lucide-react';
import { tools as allTools, getCategoryByTool, type Tool } from '@/lib/tools';
import { getCategoryTheme, catColor } from '@/lib/categoryTheme';
import { cn } from '@/lib/utils';
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function scoreTool(tool: Tool, q: string): number {
  if (!q) return 0;
  const query = q.toLowerCase();
  const name = tool.name.toLowerCase();
  const desc = tool.description.toLowerCase();
  const id = tool.id.toLowerCase();
  let score = 0;
  if (name === query || id === query) score += 1000;
  if (name.startsWith(query)) score += 500;
  if (id.startsWith(query)) score += 400;
  if (name.includes(query)) score += 200;
  if (id.includes(query)) score += 100;
  if (desc.includes(query)) score += 40;
  for (const kw of tool.keywords || []) {
    const k = kw.toLowerCase();
    if (k === query) score += 180;
    else if (k.includes(query)) score += 25;
  }
  return score;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { createHref } = useLocalizedRouter();

  const matches = useMemo(() => {
    const pool = allTools.filter((t) => t.label !== 'coming-soon');
    if (!q.trim()) {
      return pool
        .slice()
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 8);
    }
    const scored = pool
      .map((t) => ({ tool: t, score: scoreTool(t, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.tool);
    return scored;
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      // focus after radix mounts
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (active >= matches.length) setActive(0);
  }, [matches, active]);

  const selectTool = (t: Tool) => {
    onOpenChange(false);
    router.push(createHref(t.route));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = matches[active];
      if (pick) selectTool(pick);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fadeIn"
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-[18vh] z-[101] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl',
            'border border-pg-border-hi bg-pg-surface shadow-2xl data-[state=open]:animate-scaleIn'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Search tools</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to find a tool. Arrow keys to navigate. Enter to open.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-pg-border px-4 py-3">
            <Search className="h-4 w-4 text-pg-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search 120+ tools…"
              className="flex-1 bg-transparent text-[15px] text-pg-text placeholder:text-pg-dim outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-pg-muted hover:bg-pg-surface-hi"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="max-h-[360px] overflow-y-auto p-1.5">
            {matches.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-pg-muted">
                No tools match “{q}”.
              </li>
            )}
            {matches.map((t, i) => {
              const cat = getCategoryByTool(t);
              const theme = getCategoryTheme(cat?.id);
              const isActive = i === active;
              return (
                <li key={t.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => selectTool(t)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-pg-surface-hi' : 'hover:bg-pg-surface-hi/60'
                    )}
                  >
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: catColor(theme.hue, 'bgChip', 'dark'),
                        color: catColor(theme.hue, 'text', 'dark'),
                      }}
                    >
                      <theme.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="flex flex-1 flex-col min-w-0">
                      <span className="truncate text-sm font-semibold text-pg-text">
                        {t.name}
                      </span>
                      <span className="truncate text-xs text-pg-muted">
                        {t.description}
                      </span>
                    </span>
                    <span
                      className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:inline-flex"
                      style={{
                        background: catColor(theme.hue, 'bgChip', 'dark'),
                        color: catColor(theme.hue, 'text', 'dark'),
                      }}
                    >
                      {cat?.name || theme.label}
                    </span>
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-pg-dim" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-pg-border bg-pg-bg-2 px-4 py-2 text-[11px] text-pg-dim">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="pg-kbd">↑</kbd>
                <kbd className="pg-kbd">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="pg-kbd">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="pg-kbd">esc</kbd>
                close
              </span>
            </span>
            <span className="tabular-nums">
              {matches.length} of {allTools.length}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CommandPalette;
