'use client';

import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  withSeo: number;
  fullyTranslated: number;
  withNotes: number;
  byStatus: { status: string; count: number }[];
  bySeoLevel: { seo_level: number; count: number }[];
  langCoverage: Record<string, number>;
  byAction: { action_needed: string; count: number }[];
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  '': { label: 'No action', color: 'bg-green-500', icon: '' },
  'analisi': { label: 'Analisi', color: 'bg-blue-500', icon: '' },
  'fix': { label: 'Fix', color: 'bg-orange-500', icon: '' },
  'big-feature': { label: 'Big Feature', color: 'bg-purple-500', icon: '' },
};

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  const pct = total ? Math.round((value / total) * 100) : null;
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>
        {value}
        {pct !== null && (
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({pct}%)
          </span>
        )}
      </div>
      {total !== undefined && (
        <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = () => {
    fetch('/api/admin-local/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin-local/sync', { method: 'POST' });
      const data = await res.json();
      alert(`Synced ${data.synced} tools`);
      fetchStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <strong>Error:</strong> {error}
        <p className="mt-2 text-sm">
          Make sure the DB is initialized: <code>npx tsx scripts/init-admin-db.ts</code>
        </p>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const langs = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
  ];

  const seoLabels = ['Not set', 'Basic', 'Good', 'Very Good', 'Excellent', 'Perfect'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of all {stats.total} tools
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {syncing ? 'Syncing...' : 'Sync from tools.ts'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tools"
          value={stats.total}
          color="text-gray-900"
        />
        <StatCard
          label="With SEO"
          value={stats.withSeo}
          total={stats.total}
          color="text-blue-600"
        />
        <StatCard
          label="Fully Translated (6/6)"
          value={stats.fullyTranslated}
          total={stats.total}
          color="text-green-600"
        />
        <StatCard
          label="With Notes"
          value={stats.withNotes}
          total={stats.total}
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Level Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">SEO Level Distribution</h2>
          <div className="space-y-3">
            {stats.bySeoLevel.map((item) => {
              const pct = Math.round((item.count / stats.total) * 100);
              return (
                <div key={item.seo_level} className="flex items-center gap-3">
                  <span className="text-sm w-24 text-gray-600">
                    {seoLabels[item.seo_level] || `Level ${item.seo_level}`}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    <div
                      className="bg-blue-500 h-5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {item.count}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language Coverage */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Language Coverage</h2>
          <div className="space-y-3">
            {langs.map((lang) => {
              const count = stats.langCoverage[lang.code] || 0;
              const pct = Math.round((count / stats.total) * 100);
              return (
                <div key={lang.code} className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm w-20 text-gray-600">
                    {lang.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    <div
                      className={`h-5 rounded-full ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {count}/{stats.total}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Needed Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Action Needed</h2>
          <div className="space-y-3">
            {stats.byAction.map((item) => {
              const info = ACTION_LABELS[item.action_needed] || ACTION_LABELS[''];
              const pct = Math.round((item.count / stats.total) * 100);
              return (
                <a
                  key={item.action_needed || 'none'}
                  href={`/admin/tools?filter=action:${item.action_needed || 'none'}`}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${info.color}`}
                  />
                  <span className="text-sm w-24">{info.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                    <div
                      className={`h-5 rounded-full ${info.color}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {item.count}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {pct}%
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/admin/tools"
              className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
            >
              View all tools
            </a>
            <a
              href="/admin/tools?filter=action:analisi"
              className="block px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm text-blue-700"
            >
              Da analizzare ({stats.byAction.find(a => a.action_needed === 'analisi')?.count || 0})
            </a>
            <a
              href="/admin/tools?filter=action:fix"
              className="block px-4 py-3 bg-orange-50 rounded-lg hover:bg-orange-100 text-sm text-orange-700"
            >
              Da fixare ({stats.byAction.find(a => a.action_needed === 'fix')?.count || 0})
            </a>
            <a
              href="/admin/tools?filter=untranslated"
              className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
            >
              Not fully translated ({stats.total - stats.fullyTranslated})
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
