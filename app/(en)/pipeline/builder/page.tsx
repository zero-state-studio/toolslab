import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Workflow, ChevronRight } from 'lucide-react';
import PipelineBuilder from '@/components/pipeline/PipelineBuilder';

// App page: the indexable entry point is the /pipeline landing.
export const metadata: Metadata = {
  title: 'Pipeline Builder',
  description:
    'Build and run your tool pipeline: chain converters, formatters and hash tools step by step, entirely in your browser.',
  robots: { index: false, follow: true },
};

export default function PipelineBuilderPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-3">
        {/* Breadcrumb back to the landing */}
        <nav className="mb-1.5 flex items-center gap-x-1.5 text-xs">
          <Link
            href="/"
            className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link
            href="/pipeline"
            className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Pipeline
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-white">
            Builder
          </span>
        </nav>

        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
            <Workflow className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Pipeline Builder
          </h1>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
            Beta
          </span>
          <Link
            href="/pipeline"
            className="ml-auto text-xs text-pg-muted transition-colors hover:text-pg-text"
          >
            What is this? →
          </Link>
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
