'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToolStore } from '@/lib/store/toolStore';
import { WelcomePopup, HelpButton } from '@/components/lab/WelcomePopup';
import { labToasts } from '@/lib/utils/toasts';
import { LabSidebar } from '@/components/lab/LabSidebar';
import { LabToolViewer } from '@/components/lab/LabToolViewer';
import { LabOverview } from '@/components/lab/LabOverview';
import { useHydration } from '@/lib/hooks/useHydration';
import { trackLabToolSelected } from '@/lib/analytics/helpers/eventHelpers';
import { trackEngagement } from '@/lib/analytics';

// Import della vista vuota esistente
import LabHubContent from './LabHubContent';

export default function NewLabHubContent() {
  const isHydrated = useHydration();
  const {
    favoriteTools,
    favoriteCategories,
    labVisited,
    getFavoriteCount,
    getRecentTools,
    setLabVisited,
  } = useToolStore();

  const [mounted, setMounted] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration before accessing store

    setLabVisited();
  }, [isHydrated]); // Re-run when hydration completes

  // Track lab page engagement
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    const favoriteCount = getFavoriteCount();
    trackEngagement('lab-page-viewed', {
      favoriteCount,
      hasFavorites: favoriteCount > 0,
    });
  }, [mounted, isHydrated, getFavoriteCount]);

  // Show welcome toast if first visit with favorites
  useEffect(() => {
    const { labVisited } = useToolStore.getState();
    if (
      !labVisited &&
      (favoriteTools.length > 0 || favoriteCategories.length > 0)
    ) {
      setTimeout(() => {
        labToasts.welcomeToLab();
      }, 1000);
    }
  }, [favoriteTools.length, favoriteCategories.length]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-slate-200 py-3 dark:border-white/[0.06]">
          <div className="animate-pulse">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/[0.06]" />
                <div className="h-6 w-24 rounded bg-slate-200 dark:bg-white/[0.06]" />
                <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-slate-200 dark:bg-white/[0.06]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const favoriteCount = getFavoriteCount();
  const isEmpty = favoriteCount === 0;

  // Se non ci sono tool preferiti, mostra la vista vuota esistente
  if (isEmpty) {
    return <LabHubContent />;
  }

  const handleToolSelect = (toolId: string) => {
    setSelectedToolId(toolId);
    trackLabToolSelected(toolId);
  };

  const handleShowOverview = () => {
    setSelectedToolId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Grid Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Compact Header */}
      <div className="relative border-b border-slate-200 dark:border-white/[0.06]">
        <div className="relative mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Breadcrumb inline */}
            <nav aria-label="Breadcrumb" className="mr-1">
              <ol className="flex items-center gap-1.5 text-sm text-slate-500">
                <li>
                  <a href="/" className="transition-colors hover:text-slate-900 dark:hover:text-white">Home</a>
                </li>
                <li><span className="text-slate-400">/</span></li>
              </ol>
            </nav>

            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              My Lab
            </h1>

            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              {favoriteCount} {favoriteCount === 1 ? 'tool' : 'tools'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-6rem)]">
        {/* Sidebar */}
        <LabSidebar
          selectedToolId={selectedToolId}
          onToolSelect={handleToolSelect}
          onShowOverview={handleShowOverview}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedToolId ? (
              <LabToolViewer
                key={selectedToolId}
                toolId={selectedToolId}
                onBack={handleShowOverview}
              />
            ) : (
              <LabOverview key="overview" onToolSelect={handleToolSelect} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Welcome popup and help button */}
      <WelcomePopup />
      <HelpButton />
    </div>
  );
}
