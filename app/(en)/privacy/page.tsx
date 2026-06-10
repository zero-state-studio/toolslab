import { Metadata } from 'next';
import { Shield, Heart, Lock, Monitor, Globe, Coffee } from 'lucide-react';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Privacy Policy - ToolsLab | Your Data Stays Yours',
  description:
    'ToolsLab respects your privacy. No tracking, no accounts, no data collection. All processing happens locally in your browser.',
  keywords: [
    'privacy policy',
    'data protection',
    'no tracking',
    'developer tools',
    'privacy first',
  ],
  openGraph: {
    title: 'Privacy Policy - ToolsLab',
    description:
      'Your privacy is sacred. We don&apos;t track, profile, or even know who you are.',
    type: 'website',
  },
};

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                Your data stays yours. Always.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="mb-3 flex items-center gap-3">
              <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                TL;DR - The Simple Truth
              </h2>
            </div>
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Your privacy is sacred.</strong> We don&apos;t track you,
              profile you, or even know who you are. ToolsLab works like a
              desktop tool in your browser - everything stays on your device.
            </p>
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
                <strong>Last updated:</strong>{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Zero Data Collection */}
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Zero Personal Data Collection
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  <strong>
                    We don&apos;t collect, store, or process any personal data.
                  </strong>
                  This includes:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>❌ No email or contact information</li>
                  <li>❌ No names, addresses, or identifying information</li>
                  <li>❌ No accounts, registrations, or user profiles</li>
                  <li>❌ No tracking cookies or persistent identifiers</li>
                  <li>
                    ❌ No sensitive data like detailed IPs or fingerprinting
                  </li>
                </ul>
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <p className="text-green-800 dark:text-green-200">
                    <strong>💡 Simply put:</strong> We don&apos;t know who you
                    are, where you&apos;re from, or what you do with our tools.
                    And we like it that way.
                  </p>
                </div>
              </div>
            </section>

            {/* Local Processing */}
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Everything Happens in Your Browser
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  All our developer tools work completely{' '}
                  <strong>client-side</strong>:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>✅ The JSON you format never leaves your browser</li>
                  <li>✅ The Base64 you convert is processed locally</li>
                  <li>✅ The UUIDs you generate are created on your device</li>
                  <li>✅ No data is sent to our servers</li>
                  <li>✅ Works offline too (once the page is loaded)</li>
                </ul>
                <div className="mt-6 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                  <p className="text-purple-800 dark:text-purple-200">
                    <strong>🔧 Think of it:</strong> Like using a desktop tool,
                    but in your browser. We only provide the
                    &ldquo;software&rdquo;, your data never reaches us.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
