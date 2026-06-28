/**
 * Repair broken / malformed JSON.
 *
 * Wraps the battle-tested `jsonrepair` library, which fixes the usual
 * suspects: trailing commas, single quotes, unquoted keys, missing commas,
 * comments, Python literals (None/True/False), truncated output and the
 * markdown code-fences LLMs love to wrap JSON in. After repair the result is
 * re-parsed and pretty-printed so the output is guaranteed valid JSON.
 */

import { jsonrepair } from 'jsonrepair';

export interface JsonRepairResult {
  success: boolean;
  result?: string;
  error?: string;
  /** True when the repaired output differs from the input. */
  changed?: boolean;
}

export interface JsonRepairOptions {
  /** Indentation: number of spaces, or 'tab', or 0 for minified. Default 2. */
  indent?: number | 'tab';
}

/** Strip a surrounding ```json … ``` (or plain ```) markdown fence. */
export function stripCodeFence(input: string): string {
  const trimmed = input.trim();
  const fence = /^```(?:json|json5|jsonc)?\s*\n?([\s\S]*?)\n?```$/i;
  const m = trimmed.match(fence);
  return m ? m[1].trim() : input;
}

function indentValue(indent: number | 'tab' | undefined): string | number {
  if (indent === 'tab') return '\t';
  if (typeof indent === 'number') return indent;
  return 2;
}

/**
 * Repair a JSON string and pretty-print the result.
 * Returns a structured result rather than throwing.
 */
export function repairJson(
  input: string,
  options: JsonRepairOptions = {}
): JsonRepairResult {
  if (!input || !input.trim()) {
    return { success: false, error: 'Input required' };
  }

  const source = stripCodeFence(input);

  try {
    const repaired = jsonrepair(source);
    const parsed = JSON.parse(repaired);
    const indent = indentValue(options.indent);
    const result =
      indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return { success: true, result, changed: result !== input.trim() };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Could not repair JSON: ${error.message}`
          : 'Could not repair JSON',
    };
  }
}
