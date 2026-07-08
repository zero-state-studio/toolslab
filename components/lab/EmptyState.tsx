'use client';

import { Star, Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDictionarySectionContext } from '@/components/providers/DictionaryProvider';

export function EmptyState() {
  const { data: t } = useDictionarySectionContext('lab');
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md duration-500 animate-in fade-in slide-in-from-bottom-3">
        {/* Empty Beaker Animation */}
        <div className="relative mb-8 animate-lab-experiment">
          <div className="mb-4 text-8xl">🧪</div>
        </div>

        {/* Main Message */}
        <div className="delay-300 duration-500 animate-in fade-in fill-mode-backwards">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            {t?.empty?.title || 'Your Lab is Empty!'}
          </h2>
          <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-400">
            {t?.empty?.description ||
              'Start by marking your favorite tools and categories with a'}{' '}
            <Star className="mx-1 inline h-4 w-4 fill-amber-500 text-amber-500" />
            {t?.empty?.toAddThem || 'to add them here.'}
          </p>
        </div>

        {/* Action Button */}
        <div className="delay-500 duration-500 animate-in fade-in zoom-in-95 fill-mode-backwards">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-6 py-3',
              'bg-gradient-to-r from-violet-500 to-purple-600',
              'font-medium text-white',
              'hover:from-violet-600 hover:to-purple-700',
              'transform transition-all hover:scale-105',
              'shadow-lg hover:shadow-xl'
            )}
          >
            <Search className="h-5 w-5" />
            {t?.empty?.exploreTools || 'Explore Tools'}
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-4 delay-700 duration-500 animate-in fade-in fill-mode-backwards dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t?.empty?.proTips || 'Pro Tips:'}
          </h3>
          <ul className="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 flex-shrink-0 fill-amber-500 text-amber-500" />
              <span>
                {t?.empty?.tip1 ||
                  'Click the star on any tool card to add it to your Lab'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 flex-shrink-0 fill-amber-500 text-amber-500" />
              <span>
                {t?.empty?.tip2 ||
                  'Mark entire categories as favorites for quick access'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0 text-base font-medium text-violet-500">
                🔒
              </span>
              <span>
                {t?.empty?.tip3 ||
                  'Everything stays private in your browser - no accounts needed'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
