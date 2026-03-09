import { Metadata } from 'next';
import { Suspense } from 'react';
import { LabPageClient } from './LabPageClient';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'My Developer Lab - Personal Tool Collection | ToolsLab',
  description:
    'Create your personal developer toolkit with starred favorites. Access JSON formatters, Base64 encoders, hash generators and more in one private workspace. No account required - stored locally.',
  keywords: [
    'personal developer lab',
    'favorite tools collection',
    'developer workspace',
    'tool favorites',
    'JSON formatter favorites',
    'Base64 encoder bookmark',
    'hash generator collection',
    'private tool workspace',
    'localStorage tools',
    'developer productivity',
  ],
  openGraph: {
    title: 'My Developer Lab - Personal Tool Collection | ToolsLab',
    description:
      'Build your personalized developer toolkit by starring your most-used tools. Completely private with localStorage - no account needed.',
    type: 'website',
    url: 'https://toolslab.dev/lab',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Developer Lab - ToolsLab',
    description:
      'Personal toolkit for developers. Star your favorites, build workflows, stay private.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://toolslab.dev/lab',
    languages: generateHreflangAlternates({
      pageType: 'static',
      path: 'lab',
    }),
  },
};

export default async function LabPage() {
  // Load dictionary for English (default locale)
  const labSections = ['common', 'lab'];
  const dict = await getDictionary('en', labSections);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LabPageClient locale="en" dictionary={dict} />
    </Suspense>
  );
}
