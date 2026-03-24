'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="border-b border-slate-200 py-12 dark:border-white/[0.06]">
          <div className="animate-pulse">
            <div className="mx-auto max-w-4xl px-4">
              <div className="mb-4 h-10 w-64 rounded bg-slate-200 dark:bg-white/[0.06]" />
              <div className="h-5 w-96 rounded bg-slate-200 dark:bg-white/[0.06]" />
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

      {/* Header */}
      <div className="relative border-b border-slate-200 dark:border-white/[0.06]">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-60 w-60 rounded-full bg-amber-500/[0.07] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-slate-500">
              <li>
                <a href="/" className="transition-colors hover:text-slate-900 dark:hover:text-white">Home</a>
              </li>
              <li><span className="text-slate-400">/</span></li>
              <li className="font-medium text-slate-900 dark:text-white">Lab</li>
            </ol>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">🧪</span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                My Developer Lab
              </h1>
              <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                Personal
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your personalized toolkit for maximum productivity
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-9rem)]">
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
