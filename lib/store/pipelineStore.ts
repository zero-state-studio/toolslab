'use client';

/**
 * Saved pipelines — separate persisted store (own localStorage key) so the
 * critical toolStore stays untouched. Components reading this store must use
 * the useHydration guard, same as toolStore consumers.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedPipeline, SharedPipeline } from '@/lib/pipeline/types';

interface PipelineStore {
  pipelines: SavedPipeline[];
  savePipeline: (pipeline: SharedPipeline, id?: string) => SavedPipeline;
  deletePipeline: (id: string) => void;
  renamePipeline: (id: string, name: string) => void;
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set, get) => ({
      pipelines: [],

      savePipeline: (pipeline, id) => {
        const now = Date.now();
        const existing = id
          ? get().pipelines.find((p) => p.id === id)
          : undefined;

        if (existing) {
          const updated: SavedPipeline = {
            ...existing,
            name: pipeline.name,
            steps: pipeline.steps,
            updatedAt: now,
          };
          set((state) => ({
            pipelines: state.pipelines.map((p) =>
              p.id === existing.id ? updated : p
            ),
          }));
          return updated;
        }

        const created: SavedPipeline = {
          id: crypto.randomUUID(),
          name: pipeline.name,
          steps: pipeline.steps,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ pipelines: [created, ...state.pipelines] }));
        return created;
      },

      deletePipeline: (id) =>
        set((state) => ({
          pipelines: state.pipelines.filter((p) => p.id !== id),
        })),

      renamePipeline: (id, name) =>
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        })),
    }),
    {
      name: 'toolslab-pipelines',
      partialize: (state) => ({ pipelines: state.pipelines }),
    }
  )
);
