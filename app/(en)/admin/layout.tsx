import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Local-only admin: no SEO/CWV value, uses useSearchParams without Suspense.
// Keep it request-rendered instead of prerendering it at build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
  title: 'Admin - ToolsLab (Local Only)',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.ENABLE_ADMIN !== 'true') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
        <a href="/admin" className="font-bold text-lg">
          ToolsLab Admin
        </a>
        <a
          href="/admin"
          className="text-gray-300 hover:text-white text-sm"
        >
          Dashboard
        </a>
        <a
          href="/admin/tools"
          className="text-gray-300 hover:text-white text-sm"
        >
          Tools
        </a>
        <span className="ml-auto text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
          LOCAL ONLY
        </span>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
