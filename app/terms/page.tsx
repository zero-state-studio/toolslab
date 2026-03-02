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

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Terms of Service - ToolsLab | Free Developer Tools',
  description:
    'Terms of service for ToolsLab - 100% free developer tools with no registration required. Simple, fair terms for our community.',
  keywords: [
    'terms of service',
    'developer tools',
    'free tools',
    'conditions',
    'toolslab',
  ],
  openGraph: {
    title: 'Terms of Service - ToolsLab',
    description:
      'Simple and fair terms for using ToolsLab&apos;s free developer tools.',
    type: 'website',
  },
};

export default function TermsPage() {
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
                Terms of Service
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                Simple rules for our free developer tools
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="mb-3 flex items-center gap-3">
              <Heart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                TL;DR - The Essentials
              </h2>
            </div>
            <p className="text-indigo-800 dark:text-indigo-200">
              <strong>ToolsLab is free, forever.</strong> Use our tools
              responsibly, don&apos;t do illegal stuff, and remember we
              don&apos;t offer warranties. We&apos;re developers helping other
              developers.
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

            {/* Free Service */}
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  100% Free Service
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  <strong>
                    ToolsLab is and will always remain completely free:
                  </strong>
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    ✅ <strong>No cost:</strong> All tools are free, forever
                  </li>
                  <li>
                    ✅ <strong>No account required:</strong> Never, for any
                    reason
                  </li>
                  <li>
                    ✅ <strong>No freemium:</strong> No &ldquo;Pro&rdquo; or
                    premium versions exist
                  </li>
                  <li>
                    ✅ <strong>No artificial limits:</strong> Use the tools as
                    much as you want
                  </li>
                  <li>
                    ✅ <strong>Open source:</strong> Code is available on GitHub
                  </li>
                </ul>
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-red-800 dark:text-red-200">
                    <strong>💝 Our promise:</strong> ToolsLab was born from
                    developer passion for developers. It will never become paid.
                  </p>
                </div>
              </div>
            </section>

            {/* No Warranties */}
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Limitation of Warranties
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20">
                  <p className="mb-4 font-semibold text-orange-800 dark:text-orange-200">
                    ⚠️ IMPORTANT DISCLAIMER
                  </p>
                  <p className="text-orange-700 dark:text-orange-300">
                    ToolsLab tools are provided{' '}
                    <strong>&ldquo;AS IS&rdquo;</strong>, without warranties of
                    any kind.
                  </p>
                </div>
                <p>This means:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    🔧 <strong>Functionality:</strong> We don&apos;t guarantee
                    tools are always perfect
                  </li>
                  <li>
                    📊 <strong>Accuracy:</strong> Always verify results,
                    especially for critical use
                  </li>
                  <li>
                    🐛 <strong>Bugs:</strong> There might be errors or
                    unexpected behavior
                  </li>
                  <li>
                    💾 <strong>Data loss:</strong> Processed data might be lost
                  </li>
                  <li>
                    🔒 <strong>Security:</strong> Don&apos;t input sensitive
                    data (even though it stays local)
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
