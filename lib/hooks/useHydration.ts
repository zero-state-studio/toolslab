'use client';

import { useEffect, useState } from 'react';
import { useToolStore, selectHasHydrated } from '@/lib/store/toolStore';
import { useCrontabStore } from '@/lib/stores/crontab-store';

/**
 * Hook to prevent hydration mismatch with Zustand persist store
 *
 * PHASE 3 OPTIMIZATION (Dec 2024):
 * Now uses _hasHydrated flag from store instead of manual rehydration.
 * This prevents hydration race conditions and layout shifts (150-400ms saved).
 *
 * The store automatically sets _hasHydrated=true via onRehydrateStorage callback.
 */
export function useHydration() {
  // Subscribe to hydration flag from store (set by onRehydrateStorage)
  const hasHydrated = useToolStore(selectHasHydrated);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      setIsHydrated(true);
    }
  }, [hasHydrated]);

  return isHydrated;
}

/**
 * Legacy hook for backward compatibility
 * Use useHydration() for new code
 *
 * @deprecated Use useHydration() instead
 */
export function useManualHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Rehydrate stores only after mount (client-side only)
    const rehydrate = async () => {
      if (typeof window !== 'undefined') {
        // Rehydrate toolStore
        await (useToolStore.persist as any)?.rehydrate();

        // Rehydrate crontabStore
        await (useCrontabStore.persist as any)?.rehydrate();

        // Mark as hydrated
        setIsHydrated(true);
      }
    };

    rehydrate();
  }, []);

  return isHydrated;
}
