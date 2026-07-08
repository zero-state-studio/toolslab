'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Play,
  Loader2,
  Trash2,
  ArrowDown,
  ArrowUp,
  X,
  Check,
  Copy,
  Share2,
  Save,
  ChevronRight,
  Workflow,
  FolderOpen,
  Clock,
} from 'lucide-react';
import { listAdapters, getAdapter } from '@/lib/pipeline/adapters';
import { runPipeline, getCompatibleAdapters } from '@/lib/pipeline/engine';
import { encodePipeline, decodePipeline } from '@/lib/pipeline/url-codec';
import type {
  PipelineAdapter,
  PipelineStepDef,
  PipelineRunResult,
  StepResult,
} from '@/lib/pipeline/types';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolStore } from '@/lib/store/toolStore';
import { trackEngagement } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface UiStep extends PipelineStepDef {
  uid: string;
}

function newUid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Step palette (add-step picker) ──────────────────────────────────────────

function AdapterPalette({
  prev,
  onPick,
  onClose,
}: {
  prev: PipelineAdapter | null;
  onPick: (adapter: PipelineAdapter) => void;
  onClose: () => void;
}) {
  const compatible = getCompatibleAdapters(prev);
  const others = listAdapters().filter((a) => !compatible.includes(a));

  const renderItem = (a: PipelineAdapter, dimmed: boolean) => (
    <button
      key={a.id}
      onClick={() => onPick(a)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-pg-border bg-pg-surface px-3 py-2 text-left transition-colors hover:border-pg-accent/50 hover:bg-pg-surface-hi',
        dimmed && 'opacity-50'
      )}
    >
      <span className="flex-1">
        <span className="block text-[13px] font-medium text-pg-text">
          {a.label}
        </span>
        <span className="block truncate text-[11px] text-pg-dim">
          {a.description}
        </span>
      </span>
      <span className="rounded bg-pg-surface-hi px-1.5 py-0.5 font-mono text-[10px] uppercase text-pg-dim">
        {a.produces}
      </span>
    </button>
  );

  return (
    <div className="rounded-xl border border-pg-border-hi bg-pg-surface p-3 shadow-lg duration-200 animate-in fade-in slide-in-from-top-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-pg-muted">
          Add step
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-pg-dim hover:bg-pg-surface-hi hover:text-pg-text"
          aria-label="Close step picker"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
        {compatible.map((a) => renderItem(a, false))}
        {others.map((a) => renderItem(a, true))}
      </div>
      {others.length > 0 && (
        <p className="mt-2 text-[11px] text-pg-dim">
          Dimmed steps expect a different input type than the previous step
          produces — they may fail on this data.
        </p>
      )}
    </div>
  );
}

// ── Options editor for one step ─────────────────────────────────────────────

function StepOptions({
  adapter,
  values,
  onChange,
}: {
  adapter: PipelineAdapter;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  if (!adapter.options?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      {adapter.options.map((opt) => {
        const value = values[opt.key] ?? opt.default;
        if (opt.type === 'boolean') {
          return (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-1.5 text-[12px] text-pg-muted"
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(opt.key, e.target.checked)}
                className="rounded accent-[var(--pg-accent)]"
              />
              {opt.label}
            </label>
          );
        }
        if (opt.type === 'select') {
          return (
            <label
              key={opt.key}
              className="flex items-center gap-1.5 text-[12px] text-pg-muted"
            >
              {opt.label}
              <select
                value={String(value)}
                onChange={(e) => onChange(opt.key, e.target.value)}
                className="rounded border border-pg-border bg-pg-surface px-2 py-1 text-[12px] text-pg-text"
              >
                {opt.choices?.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <label
            key={opt.key}
            className="flex items-center gap-1.5 text-[12px] text-pg-muted"
          >
            {opt.label}
            <input
              type="text"
              value={String(value ?? '')}
              onChange={(e) => onChange(opt.key, e.target.value)}
              className="w-32 rounded border border-pg-border bg-pg-surface px-2 py-1 text-[12px] text-pg-text"
            />
          </label>
        );
      })}
    </div>
  );
}

// ── Main builder ────────────────────────────────────────────────────────────

export default function PipelineBuilder() {
  const isHydrated = useHydration();
  const { pipelines, savePipeline, deletePipeline } = usePipelineStore();
  const { addToHistory } = useToolStore();
  const { copied, copy } = useCopy();

  const [name, setName] = useState('Untitled pipeline');
  const [steps, setSteps] = useState<UiStep[]>([]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pickerAt, setPickerAt] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const loadedFromUrl = useRef(false);

  const safePipelines = isHydrated ? pipelines : [];

  // Load a shared pipeline from the URL fragment (#<encoded>) on mount and
  // whenever the hash changes (e.g. clicking an example pipeline link on the
  // landing content below the builder).
  useEffect(() => {
    const loadFromHash = (isInitial: boolean) => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const shared = decodePipeline(hash);
      if (shared) {
        setName(shared.name);
        setSteps(shared.steps.map((s) => ({ ...s, uid: newUid() })));
        setResult(null);
        setSavedId(null);
        if (isInitial) {
          trackEngagement('pipeline-opened-shared', {
            steps: shared.steps.length,
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          trackEngagement('pipeline-example-loaded', {
            steps: shared.steps.length,
          });
        }
      }
    };

    if (!loadedFromUrl.current) {
      loadedFromUrl.current = true;
      loadFromHash(true);
    }
    const onHashChange = () => loadFromHash(false);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const adapterAt = useCallback(
    (index: number): PipelineAdapter | null =>
      index < 0 ? null : (getAdapter(steps[index]?.toolId) ?? null),
    [steps]
  );

  const addStep = (index: number, adapter: PipelineAdapter) => {
    const step: UiStep = { toolId: adapter.id, options: {}, uid: newUid() };
    setSteps((prev) => {
      const next = [...prev];
      next.splice(index, 0, step);
      return next;
    });
    setPickerAt(null);
    setResult(null);
  };

  const removeStep = (uid: string) => {
    setSteps((prev) => prev.filter((s) => s.uid !== uid));
    setResult(null);
  };

  const moveStep = (uid: string, dir: -1 | 1) => {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setResult(null);
  };

  const setStepOption = (uid: string, key: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.uid === uid ? { ...s, options: { ...s.options, [key]: value } } : s
      )
    );
  };

  const handleRun = async () => {
    if (!steps.length || isRunning) return;
    setIsRunning(true);
    setResult(null);
    const startTime = Date.now();
    try {
      const res = await runPipeline(
        steps.map(({ toolId, options }) => ({ toolId, options })),
        input
      );
      setResult(res);
      if (res.ok) {
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'pipeline',
          input: `${steps.length} steps: ${steps.map((s) => s.toolId).join(' → ')}`,
          output: (res.output ?? '').slice(0, 500),
          timestamp: startTime,
        });
      }
      trackEngagement('pipeline-run', {
        steps: steps.length,
        ok: res.ok,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    const saved = savePipeline(
      { name, steps: steps.map(({ toolId, options }) => ({ toolId, options })) },
      savedId ?? undefined
    );
    setSavedId(saved.id);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
    trackEngagement('pipeline-saved', { steps: steps.length });
  };

  const handleShare = async () => {
    const encoded = encodePipeline({
      name,
      steps: steps.map(({ toolId, options }) => ({ toolId, options })),
    });
    const url = `${window.location.origin}/pipeline#${encoded}`;
    window.history.replaceState(null, '', `#${encoded}`);
    await copy(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1500);
    trackEngagement('pipeline-shared', { steps: steps.length });
  };

  const loadSaved = (id: string) => {
    const p = safePipelines.find((x) => x.id === id);
    if (!p) return;
    setName(p.name);
    setSavedId(p.id);
    setSteps(p.steps.map((s) => ({ ...s, uid: newUid() })));
    setResult(null);
  };

  const canRun = steps.length > 0 && !isRunning;
  const finalOutput = result?.ok ? result.output : undefined;

  const stepResults = useMemo(() => {
    const map = new Map<number, StepResult>();
    result?.steps.forEach((r, i) => map.set(i, r));
    return map;
  }, [result]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ── Builder column ── */}
      <div className="space-y-4 lg:col-span-8">
        {/* Name + actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Pipeline name"
            className="min-w-0 flex-1 rounded-lg border border-pg-border bg-pg-surface px-3 py-2 text-[15px] font-semibold text-pg-text focus:border-pg-accent/60 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={!steps.length}
            className="flex items-center gap-1.5 rounded-lg border border-pg-border bg-pg-surface px-3 py-2 text-[13px] font-medium text-pg-text transition-colors hover:border-pg-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {justSaved ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {justSaved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleShare}
            disabled={!steps.length}
            className="flex items-center gap-1.5 rounded-lg border border-pg-border bg-pg-surface px-3 py-2 text-[13px] font-medium text-pg-text transition-colors hover:border-pg-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {shareCopied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {shareCopied ? 'Link copied' : 'Share'}
          </button>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-pg-border bg-pg-surface p-4">
          <label
            htmlFor="pipeline-input"
            className="mb-2 block text-[13px] font-semibold text-pg-text"
          >
            Input
          </label>
          <textarea
            id="pipeline-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              'Paste your data here — e.g. CSV:\nname,age\nAda,36\nAlan,41'
            }
            spellCheck={false}
            className="h-36 w-full resize-y rounded-lg border border-pg-border bg-pg-bg px-3 py-2 font-mono text-[13px] text-pg-text placeholder-pg-dim focus:border-pg-accent/60 focus:outline-none"
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => {
            const adapter = getAdapter(step.toolId);
            const res = stepResults.get(i);
            return (
              <div key={step.uid}>
                <div
                  className={cn(
                    'rounded-xl border bg-pg-surface p-3 duration-200 animate-in fade-in',
                    res
                      ? res.ok
                        ? 'border-emerald-500/40'
                        : 'border-red-500/50'
                      : 'border-pg-border'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pg-surface-hi font-mono text-[11px] text-pg-muted">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[14px] font-medium text-pg-text">
                      {adapter?.label ?? step.toolId}
                    </span>
                    {res && (
                      <span
                        className={cn(
                          'font-mono text-[11px]',
                          res.ok ? 'text-emerald-500' : 'text-red-500'
                        )}
                      >
                        {res.ok ? `${res.ms}ms` : 'failed'}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveStep(step.uid, -1)}
                        disabled={i === 0}
                        className="rounded p-1 text-pg-dim hover:bg-pg-surface-hi hover:text-pg-text disabled:opacity-30"
                        aria-label="Move step up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveStep(step.uid, 1)}
                        disabled={i === steps.length - 1}
                        className="rounded p-1 text-pg-dim hover:bg-pg-surface-hi hover:text-pg-text disabled:opacity-30"
                        aria-label="Move step down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeStep(step.uid)}
                        className="rounded p-1 text-pg-dim hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Remove step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {adapter && (
                    <StepOptions
                      adapter={adapter}
                      values={step.options ?? {}}
                      onChange={(key, value) => setStepOption(step.uid, key, value)}
                    />
                  )}

                  {res && !res.ok && (
                    <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
                      {res.error}
                    </p>
                  )}
                  {res?.ok && res.output !== undefined && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-pg-bg px-3 py-2 font-mono text-[12px] text-pg-muted">
                      {res.output.length > 2000
                        ? `${res.output.slice(0, 2000)}…`
                        : res.output}
                    </pre>
                  )}
                </div>

                <div className="flex justify-center py-1">
                  <ChevronRight className="h-4 w-4 rotate-90 text-pg-dim" />
                </div>
              </div>
            );
          })}

          {/* Add step at end */}
          {pickerAt !== null ? (
            <AdapterPalette
              prev={adapterAt(steps.length - 1)}
              onPick={(a) => addStep(steps.length, a)}
              onClose={() => setPickerAt(null)}
            />
          ) : (
            <button
              onClick={() => setPickerAt(steps.length)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-pg-border-hi bg-pg-surface/50 px-3 py-3 text-[13px] font-medium text-pg-muted transition-colors hover:border-pg-accent/50 hover:text-pg-text"
            >
              <Plus className="h-4 w-4" />
              {steps.length === 0 ? 'Add first step' : 'Add step'}
            </button>
          )}
        </div>

        {/* Run */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="flex items-center gap-2 rounded-lg bg-[color:var(--pg-accent)] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running…' : 'Run pipeline'}
          </button>
          {result && (
            <span
              className={cn(
                'text-[13px]',
                result.ok ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {result.ok
                ? `Completed ${result.steps.length} steps`
                : `Stopped at step ${result.steps.length}`}
            </span>
          )}
        </div>

        {/* Final output */}
        {finalOutput !== undefined && (
          <div className="rounded-xl border border-pg-border bg-pg-surface p-4 duration-300 animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-pg-text">
                Output
              </span>
              <button
                onClick={() => copy(finalOutput)}
                className="flex items-center gap-1.5 rounded-lg border border-pg-border px-2.5 py-1 text-[12px] text-pg-muted transition-colors hover:border-pg-accent/50 hover:text-pg-text"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-pg-bg px-3 py-2 font-mono text-[13px] text-pg-text">
              {finalOutput}
            </pre>
          </div>
        )}
      </div>

      {/* ── Saved pipelines column ── */}
      <aside className="lg:col-span-4">
        <div className="rounded-xl border border-pg-border bg-pg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-pg-text">
            <FolderOpen className="h-4 w-4 text-pg-muted" />
            Saved pipelines
          </h2>
          {safePipelines.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-pg-dim">
              Nothing saved yet. Build a pipeline and hit{' '}
              <span className="font-medium text-pg-muted">Save</span> — it stays
              in your browser, nothing is uploaded.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {safePipelines.map((p) => (
                <li
                  key={p.id}
                  className="group flex items-center gap-2 rounded-lg border border-pg-border bg-pg-bg px-3 py-2"
                >
                  <button
                    onClick={() => loadSaved(p.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[13px] font-medium text-pg-text group-hover:text-[color:var(--pg-accent)]">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-pg-dim">
                      <Workflow className="h-3 w-3" />
                      {p.steps.length} steps
                      <Clock className="ml-1 h-3 w-3" />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => deletePipeline(p.id)}
                    className="rounded p-1 text-pg-dim opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    aria-label={`Delete pipeline ${p.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-pg-border bg-pg-surface p-4">
          <h3 className="mb-2 text-[13px] font-semibold text-pg-text">
            How it works
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-[12px] leading-relaxed text-pg-muted">
            <li>Paste your data in the input box</li>
            <li>Add steps — each one feeds the next</li>
            <li>Run, inspect every intermediate output</li>
            <li>Save it locally or share it as a link</li>
          </ol>
          <p className="mt-2 text-[11px] text-pg-dim">
            Everything runs in your browser. Shared links carry only the
            pipeline definition — never your data.
          </p>
        </div>
      </aside>
    </div>
  );
}
