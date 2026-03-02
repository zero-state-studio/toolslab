import { Metadata } from 'next';
import { Suspense } from 'react';
import { NewAboutPage } from '@/components/about/NewAboutPage';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'About ToolsLab - The Story of Your Developer Toolbox',
  description:
    'Discover how ToolsLab evolved from a personal project to a trusted toolkit for thousands of developers worldwide. Free forever, no strings attached.',
  keywords: [
    'about toolslab',
    'developer tools story',
    'free developer tools',
    'privacy first tools',
    'independent developer',
    'toolslab mission',
    'developer productivity',
    'swiss army knife for developers',
  ],
  openGraph: {
    title: 'About ToolsLab - The Story of Your Developer Toolbox',
    description:
      'From personal frustration to community resource. Discover the story behind the trusted toolkit for developers worldwide.',
    type: 'website',
    url: 'https://toolslab.dev/about',
    siteName: 'ToolsLab',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About ToolsLab - The Story of Your Developer Toolbox',
    description:
      'From personal frustration to community resource. Discover the story behind the trusted toolkit for developers worldwide.',
  },
  alternates: {
    canonical: 'https://toolslab.dev/about',
    languages: generateHreflangAlternates({
      pageType: 'static',
      path: 'about',
    }),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AboutPage() {
  const dict = await getDictionary('en');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="animate-pulse space-y-8 px-4 py-16">
            <div className="mx-auto h-12 w-96 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mx-auto h-96 max-w-4xl rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      }
    >
      <NewAboutPage locale="en" dictionary={dict} />
    </Suspense>
  );
}
