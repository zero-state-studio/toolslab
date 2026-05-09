'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useToolStore } from '@/lib/store/toolStore';
import { WelcomePopup, HelpButton } from '@/components/lab/WelcomePopup';
import { labToasts } from '@/lib/utils/toasts';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { DictionaryProvider } from '@/components/providers/DictionaryProvider';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';
import { trackLabToolSelected } from '@/lib/analytics/helpers/eventHelpers';

// Empty-state view (loaded eagerly: light component used by all visitors)
import LabHubContent from '../../../components/layout/LabHubContent';

// Heavy dashboard surface — only mounted when user has favorites.
const LabSidebar = dynamic(
  () => import('@/components/lab/LabSidebar').then((m) => ({ default: m.LabSidebar })),
  { ssr: false, loading: () => null }
);
const LabToolViewer = dynamic(
  () => import('@/components/lab/LabToolViewer').then((m) => ({ default: m.LabToolViewer })),
  { ssr: false, loading: () => null }
);
const LabOverview = dynamic(
  () => import('@/components/lab/LabOverview').then((m) => ({ default: m.LabOverview })),
  { ssr: false, loading: () => null }
);

interface LocaleLabPageClientProps {
  locale: Locale;
  dictionary: Dictionary;
}

function LabPageContent({ locale }: { locale: Locale }) {
  const { data: t } = useDictionarySectionContext('lab');
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
    setLabVisited();
  }, []); // Run only once on mount

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 py-20">
          <div className="animate-pulse">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <div className="mx-auto mb-4 h-12 w-96 rounded bg-white/20" />
              <div className="w-128 mx-auto mb-8 h-6 rounded bg-white/10" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="duration-500 animate-in fade-in slide-in-from-bottom-3">
            <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              {t?.header?.title || 'My Developer Lab'}
            </h1>
            <p className="text-sm text-purple-100">
              {t?.header?.subtitle ||
                'Your personalized toolkit for maximum productivity'}
            </p>
          </div>
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
          {selectedToolId ? (
            <LabToolViewer
              key={selectedToolId}
              toolId={selectedToolId}
              onBack={handleShowOverview}
            />
          ) : (
            <LabOverview key="overview" onToolSelect={handleToolSelect} />
          )}
        </div>
      </div>

      {/* Welcome popup and help button */}
      <WelcomePopup />
      <HelpButton />
    </div>
  );
}

export function LocaleLabPageClient({
  locale,
  dictionary,
}: LocaleLabPageClientProps) {
  const labSections = ['common', 'lab'];

  return (
    <DictionaryProvider
      locale={locale}
      sections={labSections}
      initialDictionary={dictionary}
    >
      <LabPageContent locale={locale} />
    </DictionaryProvider>
  );
}
