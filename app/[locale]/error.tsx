'use client';

// Each root layout needs its own error boundary; reuse the English one
// (includes the ChunkLoadError auto-reload for stale cached HTML).
export { default } from '@/app/(en)/error';
