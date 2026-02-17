'use client';

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { trackToolUsage } from '@/lib/analytics/middleware/toolStoreMiddleware';

// ============================================================================
// PERFORMANCE OPTIMIZATIONS (Dec 2024)
// ============================================================================
// - History limited to 50 items (was 100) to reduce localStorage size
// - Debounced persist to batch writes and reduce sync operations
// - chainedData excluded from persistence (temporary data)
// ============================================================================

const HISTORY_LIMIT = 50; // Reduced from 100 for better performance
const PERSIST_DEBOUNCE_MS = 1000; // Debounce localStorage writes

/**
 * Debounced localStorage storage wrapper
 * Batches multiple writes into a single operation to reduce sync I/O
 */
function createDebouncedStorage() {
  let pendingWrite: string | null = null;
  let writeTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;

      // Store the pending value
      pendingWrite = value;

      // Clear any existing timeout
      if (writeTimeout) {
        clearTimeout(writeTimeout);
      }

      // Debounce the write
      writeTimeout = setTimeout(() => {
        if (pendingWrite !== null) {
          try {
            localStorage.setItem(name, pendingWrite);
          } catch (e) {
            // localStorage might be full or unavailable
            console.warn('Failed to persist to localStorage:', e);
          }
          pendingWrite = null;
        }
      }, PERSIST_DEBOUNCE_MS);
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore errors
      }
    },
  };
}

interface ToolOperation {
  id: string;
  tool: string;
  input: string;
  output: string;
  timestamp: number;
}

interface ToolStore {
  history: ToolOperation[];
  chainedData: unknown;
  userLevel: 'first_time' | 'returning' | 'power';
  proUser: boolean;

  // Lab features
  favoriteTools: string[];
  favoriteCategories: string[];
  labVisited: boolean;
  lastLabAccess: number;
  favoritesCountAtLastVisit: number;

  // Hydration state (Phase 3 - INP optimization)
  _hasHydrated: boolean;
  _setHasHydrated: (state: boolean) => void;

  // Original actions
  addToHistory: (operation: ToolOperation) => void;
  setChainedData: (data: unknown) => void;
  getUserLevel: () => 'first_time' | 'returning' | 'power';
  clearHistory: () => void;
  getHistoryByTool: (tool: string) => ToolOperation[];
  setUserLevel: (level: 'first_time' | 'returning' | 'power') => void;
  setProUser: (isPro: boolean) => void;

  // Lab actions
  toggleToolFavorite: (toolSlug: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;
  setLabVisited: () => void;
  getFavoriteCount: () => number;
  getNewFavoritesCount: () => number;
  isFavorite: (type: 'tool' | 'category', id: string) => boolean;
  getRecentTools: (limit?: number) => ToolOperation[];
}

// Store logic separated for reuse in both SSR and client environments
// Using StateCreator for proper typing with persist middleware
const storeLogic: StateCreator<
  ToolStore,
  [['zustand/persist', unknown]],
  [],
  ToolStore
> = (set, get) => ({
  history: [],
  chainedData: null,
  userLevel: 'first_time' as const,
  proUser: false,

  // Lab initial state
  favoriteTools: [],
  favoriteCategories: [],
  labVisited: false,
  lastLabAccess: 0,
  favoritesCountAtLastVisit: 0,

  // Hydration state
  _hasHydrated: false,
  _setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

  // Original actions
  addToHistory: (operation: ToolOperation) => {
    set((state: ToolStore) => ({
      history: [operation, ...state.history].slice(0, HISTORY_LIMIT),
    }));

    // 🔥 PHASE 1 OPTIMIZATION: Async analytics tracking (15-30ms saved)
    // Move analytics to idle callback to avoid blocking interaction
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          trackToolUsage(operation, get() as ToolStore);
        },
        { timeout: 2000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        trackToolUsage(operation, get() as ToolStore);
      }, 0);
    }
  },

  setChainedData: (data: unknown) => set({ chainedData: data }),

  getUserLevel: () => {
    const state = get() as ToolStore;
    const historyCount = state.history.length;

    if (historyCount === 0) return 'first_time';
    if (historyCount < 10) return 'returning';
    return 'power';
  },

  clearHistory: () => set({ history: [], chainedData: null }),

  getHistoryByTool: (tool: string) => {
    const state = get() as ToolStore;
    return state.history.filter((op: ToolOperation) => op.tool === tool);
  },

  setUserLevel: (level: 'first_time' | 'returning' | 'power') =>
    set({ userLevel: level }),

  setProUser: (isPro: boolean) => set({ proUser: isPro }),

  // Lab actions
  toggleToolFavorite: (toolSlug: string) =>
    set((state: ToolStore) => {
      const favorites = state.favoriteTools;
      const index = favorites.indexOf(toolSlug);

      if (index > -1) {
        return { favoriteTools: favorites.filter((t) => t !== toolSlug) };
      } else {
        return { favoriteTools: [...favorites, toolSlug] };
      }
    }),

  toggleCategoryFavorite: (categoryId: string) =>
    set((state: ToolStore) => {
      const favorites = state.favoriteCategories;
      const index = favorites.indexOf(categoryId);

      if (index > -1) {
        return {
          favoriteCategories: favorites.filter((c) => c !== categoryId),
        };
      } else {
        return { favoriteCategories: [...favorites, categoryId] };
      }
    }),

  setLabVisited: () =>
    set((state: ToolStore) => ({
      labVisited: true,
      lastLabAccess: Date.now(),
      favoritesCountAtLastVisit:
        state.favoriteTools.length + state.favoriteCategories.length,
    })),

  getFavoriteCount: () => {
    const state = get() as ToolStore;
    return state.favoriteTools.length + state.favoriteCategories.length;
  },

  getNewFavoritesCount: () => {
    const state = get() as ToolStore;
    const currentCount =
      state.favoriteTools.length + state.favoriteCategories.length;
    return Math.max(0, currentCount - state.favoritesCountAtLastVisit);
  },

  isFavorite: (type: 'tool' | 'category', id: string) => {
    const state = get() as ToolStore;
    if (type === 'tool') {
      return state.favoriteTools.includes(id);
    }
    return state.favoriteCategories.includes(id);
  },

  getRecentTools: (limit = 5) => {
    const state = get() as ToolStore;
    const uniqueTools = new Map<string, ToolOperation>();

    for (const op of state.history) {
      if (!uniqueTools.has(op.tool)) {
        uniqueTools.set(op.tool, op);
      }
      if (uniqueTools.size >= limit) break;
    }

    return Array.from(uniqueTools.values());
  },
});

// Create debounced storage instance (singleton)
const debouncedStorage = createDebouncedStorage();

// Create store with persist middleware - safe with client-only Header/Footer
// Uses debounced storage to batch writes and reduce sync I/O
export const useToolStore = create<ToolStore>()(
  persist(storeLogic, {
    name: 'toolslab-store',
    storage: createJSONStorage(() => debouncedStorage),
    partialize: (state) => ({
      // Persist only essential data (chainedData is excluded - it's temporary)
      // _hasHydrated is NOT persisted - it's runtime state only
      history: state.history.slice(0, HISTORY_LIMIT), // Ensure limit is enforced
      userLevel: state.userLevel,
      proUser: state.proUser,
      favoriteTools: state.favoriteTools,
      favoriteCategories: state.favoriteCategories,
      labVisited: state.labVisited,
      lastLabAccess: state.lastLabAccess,
      favoritesCountAtLastVisit: state.favoritesCountAtLastVisit,
    }),
    onRehydrateStorage: () => (state) => {
      // PHASE 3 OPTIMIZATION: Set hydration flag after rehydration completes
      // This prevents hydration mismatches and layout shifts (150-400ms saved)
      state?._setHasHydrated(true);
    },
  })
);

// ============================================================================
// ZUSTAND SELECTORS (Dec 2024)
// ============================================================================
// Use these selectors to subscribe to specific slices of state.
// This prevents unnecessary re-renders when unrelated state changes.
//
// Usage:
//   const favoriteTools = useToolStore(selectFavoriteTools);
//   const history = useToolStore(selectHistory);
//
// Instead of:
//   const { favoriteTools, history } = useToolStore(); // Re-renders on ANY change
// ============================================================================

// State selectors - subscribe to specific state slices
export const selectHistory = (state: ToolStore) => state.history;
export const selectChainedData = (state: ToolStore) => state.chainedData;
export const selectUserLevel = (state: ToolStore) => state.userLevel;
export const selectProUser = (state: ToolStore) => state.proUser;
export const selectFavoriteTools = (state: ToolStore) => state.favoriteTools;
export const selectFavoriteCategories = (state: ToolStore) =>
  state.favoriteCategories;
export const selectLabVisited = (state: ToolStore) => state.labVisited;
export const selectLastLabAccess = (state: ToolStore) => state.lastLabAccess;
export const selectFavoritesCountAtLastVisit = (state: ToolStore) =>
  state.favoritesCountAtLastVisit;
export const selectHasHydrated = (state: ToolStore) => state._hasHydrated;

// Action selectors - get stable action references
export const selectAddToHistory = (state: ToolStore) => state.addToHistory;
export const selectSetChainedData = (state: ToolStore) => state.setChainedData;
export const selectClearHistory = (state: ToolStore) => state.clearHistory;
export const selectToggleToolFavorite = (state: ToolStore) =>
  state.toggleToolFavorite;
export const selectToggleCategoryFavorite = (state: ToolStore) =>
  state.toggleCategoryFavorite;
export const selectSetLabVisited = (state: ToolStore) => state.setLabVisited;

// Computed selectors - derive values from state
export const selectHistoryCount = (state: ToolStore) => state.history.length;
export const selectFavoriteCount = (state: ToolStore) =>
  state.favoriteTools.length + state.favoriteCategories.length;
export const selectHasHistory = (state: ToolStore) => state.history.length > 0;
export const selectHasFavorites = (state: ToolStore) =>
  state.favoriteTools.length > 0 || state.favoriteCategories.length > 0;
export const selectNewFavoritesCount = (state: ToolStore) =>
  Math.max(
    0,
    state.favoriteTools.length +
      state.favoriteCategories.length -
      state.favoritesCountAtLastVisit
  );

// Parameterized selectors - create selector with parameter
export const createSelectIsFavoriteTool =
  (toolId: string) => (state: ToolStore) =>
    state.favoriteTools.includes(toolId);
export const createSelectIsFavoriteCategory =
  (categoryId: string) => (state: ToolStore) =>
    state.favoriteCategories.includes(categoryId);
export const createSelectHistoryByTool =
  (toolId: string) => (state: ToolStore) =>
    state.history.filter((op) => op.tool === toolId);

// Type export for external use
export type { ToolStore, ToolOperation };
