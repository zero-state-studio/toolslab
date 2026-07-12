'use client';

import { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

interface WelcomePopupProps {
  isOpen?: boolean;
  onClose?: () => void;
  triggeredByHelp?: boolean;
}

export function WelcomePopup({
  isOpen: controlledIsOpen,
  onClose,
  triggeredByHelp = false,
}: WelcomePopupProps) {
  const isHydrated = useHydration();
  const { labVisited, setLabVisited } = useToolStore();
  const { data: t } = useDictionarySectionContext('lab');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    } else if (!labVisited && !triggeredByHelp) {
      setIsOpen(true);
    }
  }, [isHydrated, controlledIsOpen, labVisited, triggeredByHelp]);

  const handleClose = () => {
    setIsOpen(false);
    if (!labVisited) {
      setLabVisited();
    }
    onClose?.();
  };

  const handleDontShowAgain = () => {
    setLabVisited();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={handleClose}
        />

        {/* Popup */}
        <div
          className={cn(
            'relative w-full max-w-lg bg-white dark:bg-gray-900',
            'overflow-hidden rounded-2xl shadow-2xl',
            'duration-300 animate-in fade-in zoom-in-95'
          )}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="text-4xl">🧪</div>
              <h2 className="text-2xl font-bold">
                {t?.welcome?.title || 'Welcome to Your Lab!'}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            <p className="text-gray-600 dark:text-gray-300">
              {t?.welcome?.description ||
                'This is your personal workspace where you can access your favorite tools and categories quickly.'}
            </p>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm">
                <span className="font-semibold">
                  {t?.welcome?.howItWorks || 'How it works:'}
                </span>{' '}
                {t?.welcome?.howItWorksDescription ||
                  'Mark any tool or category with a ⭐ to add it here.'}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-start gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <p className="mb-1 text-sm font-semibold">
                    {t?.welcome?.privacyTitle || 'Privacy First'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t?.welcome?.privacyDescription ||
                      "We don't know who you are, nor do we care. All your preferences stay in your browser's local storage. No accounts, no tracking, just tools."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className={cn(
                'flex-1 rounded-lg px-4 py-2.5 font-medium',
                'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
                'hover:from-violet-600 hover:to-purple-700',
                'transition-all hover:shadow-lg'
              )}
            >
              {t?.welcome?.gotIt || 'Got it!'}
            </button>

            {!triggeredByHelp && (
              <button
                onClick={handleDontShowAgain}
                className={cn(
                  'rounded-lg px-4 py-2.5 font-medium',
                  'border border-gray-300 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'transition-colors'
                )}
              >
                {t?.welcome?.dontShowAgain || "Don't show again"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function HelpButton() {
  const [showPopup, setShowPopup] = useState(false);
  const { data: t } = useDictionarySectionContext('lab');

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'h-12 w-12 rounded-full',
          'bg-gradient-to-r from-violet-500 to-purple-600',
          'text-white shadow-lg',
          'flex items-center justify-center',
          'transition-[transform,box-shadow] hover:scale-110 hover:shadow-xl active:scale-95'
        )}
        title={t?.helpButton?.title || 'About The Lab'}
        aria-label={t?.helpButton?.ariaLabel || 'About The Lab'}
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <WelcomePopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        triggeredByHelp={true}
      />
    </>
  );
}
