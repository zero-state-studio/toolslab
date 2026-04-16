'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AdminTool {
  id: string;
  name: string;
  icon: string;
  categories: string;
  search_volume: number;
  seo_level: number;
  seo_notes: string;
  optimizations: string;
  action_needed: string;
  lang_en: number;
  lang_it: number;
  lang_es: number;
  lang_fr: number;
  lang_de: number;
  lang_pt: number;
  notes: string;
  status: string;
  last_updated: string;
  created_at: string;
}

const SEO_LABELS = ['Not set', 'Basic', 'Good', 'Very Good', 'Excellent', 'Perfect'];

const LANGS = [
  { key: 'lang_en', label: 'English', flag: '🇬🇧' },
  { key: 'lang_it', label: 'Italiano', flag: '🇮🇹' },
  { key: 'lang_es', label: 'Español', flag: '🇪🇸' },
  { key: 'lang_fr', label: 'Français', flag: '🇫🇷' },
  { key: 'lang_de', label: 'Deutsch', flag: '🇩🇪' },
  { key: 'lang_pt', label: 'Português', flag: '🇵🇹' },
] as const;

export default function AdminToolEditPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.id as string;

  const [tool, setTool] = useState<AdminTool | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin-local/tools/${toolId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Tool not found');
        return r.json();
      })
      .then(setTool)
      .catch((e) => setError(e.message));
  }, [toolId]);

  const handleSave = async () => {
    if (!tool) return;
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch(`/api/admin-local/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo_level: tool.seo_level,
          seo_notes: tool.seo_notes,
          optimizations: tool.optimizations,
          action_needed: tool.action_needed,
          lang_en: tool.lang_en,
          lang_it: tool.lang_it,
          lang_es: tool.lang_es,
          lang_fr: tool.lang_fr,
          lang_de: tool.lang_de,
          lang_pt: tool.lang_pt,
          notes: tool.notes,
          status: tool.status,
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      const updated = await res.json();
      setTool(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (error && !tool) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!tool) return <div className="text-gray-500">Loading...</div>;

  const update = (field: keyof AdminTool, value: string | number) => {
    setTool({ ...tool, [field]: value });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/tools')}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <span className="text-2xl">{tool.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <span className="text-sm text-gray-400">{tool.id}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status & SEO Level */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Status, Action & SEO</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={tool.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="needs-work">Needs Work</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Action Needed
              </label>
              <select
                value={tool.action_needed}
                onChange={(e) => update('action_needed', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">None</option>
                <option value="analisi">Analisi</option>
                <option value="fix">Fix</option>
                <option value="big-feature">Big Feature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                SEO Level
              </label>
              <select
                value={tool.seo_level}
                onChange={(e) => update('seo_level', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {SEO_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {i} - {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              SEO Notes
            </label>
            <textarea
              value={tool.seo_notes}
              onChange={(e) => update('seo_notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Added meta description, optimized H1, added schema markup..."
            />
          </div>
        </div>

        {/* Optimizations */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Optimizations Done</h2>
          <textarea
            value={tool.optimizations}
            onChange={(e) => update('optimizations', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Added lazy loading, optimized bundle size, added keyboard shortcuts..."
          />
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">
            Language Coverage{' '}
            <span className="text-gray-400 font-normal">
              (
              {LANGS.filter(
                (l) => tool[l.key as keyof AdminTool] === 1
              ).length}
              /6)
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {LANGS.map((lang) => {
              const active =
                tool[lang.key as keyof AdminTool] === 1;
              return (
                <label
                  key={lang.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      update(
                        lang.key as keyof AdminTool,
                        e.target.checked ? 1 : 0
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-sm">{lang.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Notes</h2>
          <textarea
            value={tool.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="General notes about this tool..."
          />
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-xl border p-5 text-sm text-gray-500">
          <div className="flex gap-6">
            <span>
              Categories:{' '}
              {JSON.parse(tool.categories || '[]').join(', ') || '—'}
            </span>
            <span>
              Search Volume: {tool.search_volume.toLocaleString()}
            </span>
            <span>Last updated: {tool.last_updated || '—'}</span>
            <span>Created: {tool.created_at || '—'}</span>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center gap-3 sticky bottom-4 bg-white rounded-xl shadow-lg border p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">
              Saved!
            </span>
          )}
          {error && (
            <span className="text-red-600 text-sm">{error}</span>
          )}
          <a
            href={`/tools/${tool.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            View tool page ↗
          </a>
        </div>
      </div>
    </div>
  );
}
