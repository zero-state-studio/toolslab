'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <div className="mb-4 text-8xl">🧪</div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Experiment Not Found
          </h1>
          <p className="text-muted-foreground">
            This laboratory experiment doesn&rsquo;t exist! The page
            you&rsquo;re looking for couldn&rsquo;t be synthesized.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Link>

          <div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
