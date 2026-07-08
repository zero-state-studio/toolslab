/**
 * Pipeline engine — sequential execution of adapter steps.
 *
 * Runs entirely client-side: each step receives the previous step's output.
 * Execution stops at the first failing step; per-step results (output, error,
 * timing) are always reported so the UI can show exactly where a run stopped.
 */

import { getAdapter, listAdapters } from './adapters';
import type {
  PipelineAdapter,
  PipelineRunResult,
  PipelineStepDef,
  StepResult,
} from './types';

export async function runPipeline(
  steps: PipelineStepDef[],
  input: string
): Promise<PipelineRunResult> {
  const results: StepResult[] = [];
  let current = input;

  for (const step of steps) {
    const adapter = getAdapter(step.toolId);
    const started = performance.now();

    if (!adapter) {
      results.push({
        toolId: step.toolId,
        ok: false,
        error: `Unknown pipeline step: ${step.toolId}`,
        ms: 0,
      });
      return { ok: false, steps: results };
    }

    const withDefaults: Record<string, unknown> = {};
    for (const opt of adapter.options ?? []) {
      withDefaults[opt.key] = opt.default;
    }
    Object.assign(withDefaults, step.options ?? {});

    let result;
    try {
      result = await adapter.run(current, withDefaults);
    } catch (e) {
      result = {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Step crashed',
      };
    }
    const ms = Math.round(performance.now() - started);

    if (!result.ok) {
      results.push({ toolId: step.toolId, ok: false, error: result.error, ms });
      return { ok: false, steps: results };
    }

    results.push({ toolId: step.toolId, ok: true, output: result.output, ms });
    current = result.output;
  }

  return { ok: true, steps: results, output: current };
}

/**
 * Adapters that can consume the output of `prev` (all of them when prev is
 * null). 'any' or an accepts list containing 'text' means "any string".
 */
export function getCompatibleAdapters(
  prev: PipelineAdapter | null
): PipelineAdapter[] {
  const all = listAdapters();
  if (!prev) return all;
  return all.filter(
    (a) =>
      a.accepts === 'any' ||
      a.accepts.includes(prev.produces) ||
      a.accepts.includes('text')
  );
}
