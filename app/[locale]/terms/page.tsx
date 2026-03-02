import { Metadata } from 'next';
import {
  FileText,
  Heart,
  Shield,
  Zap,
  Coffee,
  Github,
  AlertTriangle,
} from 'lucide-react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { Locale, locales } from '@/lib/i18n/config';

export const revalidate = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  const terms = dict.terms || {};
  const meta = terms.meta || {};

  return {
    title: meta.title || 'Terms of Service - ToolsLab',
    description: meta.description || 'Terms of service for ToolsLab.',
    keywords: [
      'terms of service',
      'developer tools',
      'free tools',
      'conditions',
      'toolslab',
    ],
    openGraph: {
      title: meta.ogTitle || 'Terms of Service - ToolsLab',
      description: meta.ogDescription || 'Terms of service for ToolsLab.',
      type: 'website',
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const dict = await getDictionary(params.locale);
  const terms = dict.terms || {};
  const header = terms.header || {};
  const sections = terms.sections || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm dark:bg-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {header.title || 'Terms of Service'}
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                {header.subtitle || 'Simple rules for our free developer tools'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="mb-3 flex items-center gap-3">
              <Heart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                {header.tldrTitle || 'TL;DR - The Essentials'}
              </h2>
            </div>
            <p
              className="text-indigo-800 dark:text-indigo-200"
              dangerouslySetInnerHTML={{
                __html:
                  header.tldrText ||
                  '<strong>ToolsLab is free, forever.</strong> Use our tools responsibly.',
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
            {/* Last Updated */}
            <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>{terms.lastUpdated || 'Last updated'}:</strong>{' '}
                {new Date().toLocaleDateString(params.locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Free Service */}
            {sections.freeService && (
              <section className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sections.freeService.title}
                  </h2>
                </div>

                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: sections.freeService.intro,
                    }}
                  />
                  <ul className="list-disc space-y-2 pl-6">
                    {sections.freeService.points && (
                      <>
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `✅ ${sections.freeService.points.noCost}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `✅ ${sections.freeService.points.noAccount}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `✅ ${sections.freeService.points.noFreemium}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `✅ ${sections.freeService.points.noLimits}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `✅ ${sections.freeService.points.openSource}`,
                          }}
                        />
                      </>
                    )}
                  </ul>
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <p
                      className="text-red-800 dark:text-red-200"
                      dangerouslySetInnerHTML={{
                        __html: sections.freeService.promise,
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* No Warranties */}
            {sections.warranties && (
              <section className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sections.warranties.title}
                  </h2>
                </div>

                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20">
                    <p className="mb-4 font-semibold text-orange-800 dark:text-orange-200">
                      {sections.warranties.disclaimer}
                    </p>
                    <p
                      className="text-orange-700 dark:text-orange-300"
                      dangerouslySetInnerHTML={{
                        __html: sections.warranties.disclaimerText,
                      }}
                    />
                  </div>
                  <p>{sections.warranties.intro}</p>
                  <ul className="list-disc space-y-2 pl-6">
                    {sections.warranties.points && (
                      <>
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `🔧 ${sections.warranties.points.functionality}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `📊 ${sections.warranties.points.accuracy}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `🐛 ${sections.warranties.points.bugs}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `💾 ${sections.warranties.points.dataLoss}`,
                          }}
                        />
                        <li
                          dangerouslySetInnerHTML={{
                            __html: `🔒 ${sections.warranties.points.security}`,
                          }}
                        />
                      </>
                    )}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
