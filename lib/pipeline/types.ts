/**
 * Pipeline Workspace — core types (Phase 1)
 *
 * A pipeline is a linear sequence of steps. Each step references a registered
 * adapter (a thin wrapper around the pure functions in lib/tools/*) plus its
 * options. All data flowing between steps is a string; the DataType is a
 * semantic tag used only to suggest compatible next steps.
 */

export type PipelineDataType = 'text' | 'json' | 'csv' | 'xml' | 'yaml' | 'sql';

export interface PipelineStepDef {
  /** Adapter id (e.g. 'base64-encode') */
  toolId: string;
  options?: Record<string, unknown>;
}

/** Shape shared via URL — no local-only fields */
export interface SharedPipeline {
  name: string;
  steps: PipelineStepDef[];
}

/** Shape persisted in the local store */
export interface SavedPipeline extends SharedPipeline {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface AdapterOptionChoice {
  value: string;
  label: string;
}

export interface AdapterOption {
  key: string;
  label: string;
  type: 'select' | 'boolean' | 'text';
  choices?: AdapterOptionChoice[];
  default: unknown;
}

export type AdapterRunResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

export interface PipelineAdapter {
  /** Unique adapter id — also used as step toolId */
  id: string;
  /** Registry tool id (lib/tools.ts) for icons/links back to the tool page */
  toolId: string;
  label: string;
  description: string;
  /** Semantic input types accepted; 'any' or ['text'] = any string */
  accepts: PipelineDataType[] | 'any';
  produces: PipelineDataType;
  options?: AdapterOption[];
  run(input: string, options: Record<string, unknown>): Promise<AdapterRunResult>;
}

export interface StepResult {
  toolId: string;
  ok: boolean;
  output?: string;
  error?: string;
  ms: number;
}

export interface PipelineRunResult {
  ok: boolean;
  steps: StepResult[];
  /** Final output when every step succeeded */
  output?: string;
}
