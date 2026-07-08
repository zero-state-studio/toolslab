import { Metadata } from 'next';
import { Suspense } from 'react';
import { Workflow } from 'lucide-react';
import PipelineBuilder from '@/components/pipeline/PipelineBuilder';

// Phase 1: intentionally noindex — the builder earns indexing after the UX
// proves itself. SEO tool pages are unaffected (see PHASE1_PIPELINE_WORKSPACE.md).
export const metadata: Metadata = {
  title: 'Pipeline Builder - Chain Dev Tools Together',
  description:
    'Chain ToolsLab tools into reusable pipelines: convert, transform and hash data in sequence. Runs 100% in your browser — save locally, share as a link.',
  robots: { index: false, follow: true },
};

export default function PipelinePage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-4">
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
              <Workflow className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Pipeline Builder
            </h1>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
              Beta
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chain tools together: each step transforms the output of the
            previous one. Your data never leaves the browser.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[400px] animate-pulse rounded-xl bg-pg-surface" />
          }
        >
          <PipelineBuilder />
        </Suspense>
      </div>
    </div>
  );
}
