/**
 * Pipeline ↔ URL fragment codec.
 *
 * Sharing is a URL: the pipeline definition is JSON → encodeURIComponent →
 * base64url, carried in location.hash so it never reaches the server —
 * consistent with the local-first privacy promise (and free on Vercel).
 */

import type { SharedPipeline, PipelineStepDef } from './types';

function toBase64(s: string): string {
  if (typeof btoa === 'function') return btoa(s);
  return Buffer.from(s, 'binary').toString('base64');
}

function fromBase64(s: string): string {
  if (typeof atob === 'function') return atob(s);
  return Buffer.from(s, 'base64').toString('binary');
}

function toBase64Url(s: string): string {
  return toBase64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  return fromBase64(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

export function encodePipeline(pipeline: SharedPipeline): string {
  const payload: SharedPipeline = {
    name: pipeline.name,
    steps: pipeline.steps.map((s) => ({
      toolId: s.toolId,
      options: s.options ?? {},
    })),
  };
  return toBase64Url(encodeURIComponent(JSON.stringify(payload)));
}

function isValidStep(step: unknown): step is PipelineStepDef {
  if (typeof step !== 'object' || step === null) return false;
  const s = step as Record<string, unknown>;
  if (typeof s.toolId !== 'string' || !s.toolId) return false;
  if (
    s.options !== undefined &&
    (typeof s.options !== 'object' || s.options === null || Array.isArray(s.options))
  ) {
    return false;
  }
  return true;
}

/** Returns null on any malformed/tampered input — never throws. */
export function decodePipeline(encoded: string): SharedPipeline | null {
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(fromBase64Url(encoded));
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const p = parsed as Record<string, unknown>;
    if (typeof p.name !== 'string') return null;
    if (!Array.isArray(p.steps) || p.steps.length === 0) return null;
    if (!p.steps.every(isValidStep)) return null;
    return {
      name: p.name,
      steps: (p.steps as PipelineStepDef[]).map((s) => ({
        toolId: s.toolId,
        options: s.options ?? {},
      })),
    };
  } catch {
    return null;
  }
}
