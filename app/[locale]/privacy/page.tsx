import { Metadata } from 'next';
import { Shield, Heart, Lock, Monitor, Globe, Coffee } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { Locale, locales } from '@/lib/i18n/config';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  const privacy = dict.privacy || {};
  const meta = privacy.meta || {};

  return {
    title: meta.title || 'Privacy Policy - ToolsLab',
    description: meta.description || 'Privacy policy for ToolsLab.',
    keywords: [
      'privacy policy',
      'data protection',
      'no tracking',
      'developer tools',
      'privacy first',
    ],
    openGraph: {
      title: meta.ogTitle || 'Privacy Policy - ToolsLab',
      description: meta.ogDescription || 'Your privacy is sacred.',
      type: 'website',
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const dict = await getDictionary(params.locale);
  const privacy = dict.privacy || {};
  const header = privacy.header || {};
  const sections = privacy.sections || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm dark:bg-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {header.title || 'Privacy Policy'}
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                {header.subtitle || 'Your data stays yours. Always.'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="mb-3 flex items-center gap-3">
              <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {header.tldrTitle || 'TL;DR - The Simple Truth'}
              </h2>
            </div>
            <p
              className="text-blue-800 dark:text-blue-200"
              dangerouslySetInnerHTML={{
                __html:
                  header.tldrText ||
                  "<strong>Your privacy is sacred.</strong> We don't track you.",
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
                <strong>{privacy.lastUpdated || 'Last updated'}:</strong>{' '}
                {new Date().toLocaleDateString(params.locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Zero Data Collection */}
            {sections.zeroData && (
              <section className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sections.zeroData.title}
                  </h2>
                </div>

                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: sections.zeroData.intro,
                    }}
                  />
                  <ul className="list-disc space-y-2 pl-6">
                    {sections.zeroData.points && (
                      <>
                        <li>❌ {sections.zeroData.points.noEmail}</li>
                        <li>❌ {sections.zeroData.points.noNames}</li>
                        <li>❌ {sections.zeroData.points.noAccounts}</li>
                        <li>❌ {sections.zeroData.points.noCookies}</li>
                        <li>❌ {sections.zeroData.points.noSensitive}</li>
                      </>
                    )}
                  </ul>
                  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p
                      className="text-green-800 dark:text-green-200"
                      dangerouslySetInnerHTML={{
                        __html: sections.zeroData.summary,
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Local Processing */}
            {sections.localProcessing && (
              <section className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sections.localProcessing.title}
                  </h2>
                </div>

                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: sections.localProcessing.intro,
                    }}
                  />
                  <ul className="list-disc space-y-2 pl-6">
                    {sections.localProcessing.points && (
                      <>
                        <li>✅ {sections.localProcessing.points.json}</li>
                        <li>✅ {sections.localProcessing.points.base64}</li>
                        <li>✅ {sections.localProcessing.points.uuid}</li>
                        <li>✅ {sections.localProcessing.points.noServers}</li>
                        <li>✅ {sections.localProcessing.points.offline}</li>
                      </>
                    )}
                  </ul>
                  <div className="mt-6 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                    <p
                      className="text-purple-800 dark:text-purple-200"
                      dangerouslySetInnerHTML={{
                        __html: sections.localProcessing.summary,
                      }}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
