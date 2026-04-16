'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

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
}

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  '': { label: 'None', className: 'bg-gray-100 text-gray-500' },
  'analisi': { label: 'Analisi', className: 'bg-blue-100 text-blue-700' },
  'fix': { label: 'Fix', className: 'bg-orange-100 text-orange-700' },
  'big-feature': { label: 'Big Feature', className: 'bg-purple-100 text-purple-700' },
};

const SEO_COLORS = [
  'bg-gray-200 text-gray-600',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-emerald-100 text-emerald-800',
];

const SEO_LABELS = ['Not set', 'Basic', 'Good', 'Very Good', 'Excellent', 'Perfect'];

function LangDots({ tool }: { tool: AdminTool }) {
  const langs = [
    { key: 'lang_en', flag: '🇬🇧' },
    { key: 'lang_it', flag: '🇮🇹' },
    { key: 'lang_es', flag: '🇪🇸' },
    { key: 'lang_fr', flag: '🇫🇷' },
    { key: 'lang_de', flag: '🇩🇪' },
    { key: 'lang_pt', flag: '🇵🇹' },
  ] as const;

  const count = langs.filter(
    (l) => tool[l.key as keyof AdminTool] === 1
  ).length;

  return (
    <div className="flex items-center gap-0.5" title={`${count}/6 languages`}>
      {langs.map((l) => {
        const active = tool[l.key as keyof AdminTool] === 1;
        return (
          <span
            key={l.key}
            className={`text-xs ${active ? '' : 'grayscale opacity-30'}`}
          >
            {l.flag}
          </span>
        );
      })}
    </div>
  );
}

export default function AdminToolsPage() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seoFilter, setSeoFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'seo_level' | 'search_volume' | 'last_updated'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-local/tools')
      .then((r) => r.json())
      .then((data) => {
        setTools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Apply URL filter params
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (!filter) return;

    if (filter.startsWith('seo_level:')) {
      setSeoFilter(filter.split(':')[1]);
    } else if (filter === 'untranslated') {
      setLangFilter('incomplete');
    } else if (filter.startsWith('status:')) {
      setStatusFilter(filter.split(':')[1]);
    } else if (filter.startsWith('action:')) {
      const val = filter.split(':')[1];
      setActionFilter(val === 'none' ? 'none' : val);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...tools];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (seoFilter !== 'all') {
      result = result.filter((t) => t.seo_level === Number(seoFilter));
    }

    if (actionFilter !== 'all') {
      if (actionFilter === 'none') {
        result = result.filter((t) => !t.action_needed);
      } else {
        result = result.filter((t) => t.action_needed === actionFilter);
      }
    }

    if (langFilter === 'incomplete') {
      result = result.filter(
        (t) =>
          !(
            t.lang_en &&
            t.lang_it &&
            t.lang_es &&
            t.lang_fr &&
            t.lang_de &&
            t.lang_pt
          )
      );
    } else if (langFilter === 'complete') {
      result = result.filter(
        (t) =>
          t.lang_en &&
          t.lang_it &&
          t.lang_es &&
          t.lang_fr &&
          t.lang_de &&
          t.lang_pt
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [tools, search, statusFilter, seoFilter, langFilter, actionFilter, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortArrow = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Tools{' '}
          <span className="text-gray-400 font-normal text-lg">
            ({filtered.length}/{tools.length})
          </span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="needs-work">Needs Work</option>
          <option value="deprecated">Deprecated</option>
        </select>
        <select
          value={seoFilter}
          onChange={(e) => setSeoFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="all">All SEO</option>
          {SEO_LABELS.map((label, i) => (
            <option key={i} value={i}>
              {label} ({i})
            </option>
          ))}
        </select>
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="all">All Languages</option>
          <option value="complete">Fully Translated</option>
          <option value="incomplete">Missing Translations</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="all">All Actions</option>
          <option value="none">No Action</option>
          <option value="analisi">Analisi</option>
          <option value="fix">Fix</option>
          <option value="big-feature">Big Feature</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Icon</th>
              <th
                className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Name <SortArrow col="name" />
              </th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th
                className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                onClick={() => handleSort('seo_level')}
              >
                SEO <SortArrow col="seo_level" />
              </th>
              <th className="text-left px-4 py-3 font-medium">Languages</th>
              <th
                className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                onClick={() => handleSort('search_volume')}
              >
                Volume <SortArrow col="search_volume" />
              </th>
              <th className="text-left px-4 py-3 font-medium">Notes</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tool) => (
              <tr
                key={tool.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-lg">{tool.icon}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tool.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : tool.status === 'needs-work'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tool.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {tool.action_needed ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLES[tool.action_needed]?.className || 'bg-gray-100 text-gray-500'}`}
                    >
                      {ACTION_STYLES[tool.action_needed]?.label || tool.action_needed}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEO_COLORS[tool.seo_level]}`}
                  >
                    {SEO_LABELS[tool.seo_level]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <LangDots tool={tool} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {tool.search_volume.toLocaleString()}
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="text-xs text-gray-500 truncate block">
                    {tool.notes || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/admin/tools/${tool.id}`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No tools match your filters
          </div>
        )}
      </div>
    </div>
  );
}
