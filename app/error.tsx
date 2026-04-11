'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError happens when the browser has cached old HTML pointing to
    // chunk hashes that no longer exist after a new deploy. Auto-reload forces
    // the browser to fetch the new HTML and new chunk references.
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      window.location.reload();
    }
  }, [error]);

  if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
    return null; // Reloading, nothing to render
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
