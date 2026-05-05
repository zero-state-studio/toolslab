'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUmamiSessionTracker } from '@/lib/analytics/umami/UmamiSessionTracker';
import { EventNormalizer } from '@/lib/analytics/core/EventNormalizer';

/**
 * Manually fires Umami pageview events on every Next.js App Router navigation.
 *
 * Why manual: the Umami SDK is loaded with `data-auto-track="true"` +
 * `data-auto-pageview="false"` (see UmamiProvider). Auto-track stays ON so the
 * SDK initialises its PerformanceObservers (LCP/INP/CLS/FCP/TTFB) and patches
 * history.pushState to flush vitals on SPA navigation. Auto-pageview is OFF so
 * the SDK never emits its own pageview events — avoiding the
 * "Visits=N, Views=0" race we hit with deferred SDK load.
 *
 * This component:
 *  - waits for `window.umami.track` to be available
 *  - fires `umami.track()` (no args) once per unique pathname+searchParams
 *  - dedupes via a ref to avoid double-firing on remounts
 *  - increments the local SessionTracker counter (used for session.end metadata)
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedKey = useRef<string>('');

  useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() ?? ''}`;
    if (lastTrackedKey.current === key) return;
    lastTrackedKey.current = key;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 50 * 100ms = 5s wait
    const fire = () => {
      if (cancelled) return;
      const umami = (window as any).umami;
      if (typeof umami?.track === 'function') {
        try {
          umami.track();
          if (process.env.NODE_ENV === 'development') {
            const pageInfo = EventNormalizer.getCurrentPageInfo();
            console.log('📊 Manual pageview fired:', pageInfo);
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Manual pageview error:', err);
          }
        }
        try {
          getUmamiSessionTracker()?.incrementPageView();
        } catch {
          // ignore
        }
        return;
      }

      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Umami SDK never became ready — pageview dropped');
        }
        return;
      }
      setTimeout(fire, 100);
    };

    fire();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
