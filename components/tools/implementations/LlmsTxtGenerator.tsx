'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Copy, Download, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  LlmsSection,
  generateLlmsTxt,
  llmsTxtStarter,
} from '@/lib/tools/llms-txt-generator';
import { downloadBlob } from '@/lib/tools/image-tools';

interface LlmsTxtGeneratorProps extends BaseToolProps {}

export default function LlmsTxtGenerator({ dictionary }: LlmsTxtGeneratorProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['llms-txt-generator'] || {};
  const labels = {
    hint:
      t.hint ||
      'Build an llms.txt file that points AI crawlers like ChatGPT, Claude and Perplexity to your most important pages.',
    name: t.name || 'Project / site name',
    namePlaceholder: t.namePlaceholder || 'My Project',
    summary: t.summary || 'Summary (blockquote)',
    summaryPlaceholder: t.summaryPlaceholder || 'A short, dense summary of your site',
    details: t.details || 'Details (optional)',
    detailsPlaceholder: t.detailsPlaceholder || 'Extra context for the model…',
    section: t.section || 'Section',
    sectionTitle: t.sectionTitle || 'Section title (e.g. Docs)',
    linkTitle: t.linkTitle || 'Link title',
    url: t.url || 'https://…',
    notes: t.notes || 'Notes (optional)',
    addLink: t.addLink || 'Add link',
    addSection: t.addSection || 'Add section',
    result: t.result || 'llms.txt',
    copy: t.copy || 'Copy',
    copied: t.copied || 'Copied!',
    download: t.download || 'Download llms.txt',
    sample: t.sample || 'Load example',
  };

  const starter = llmsTxtStarter();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [sections, setSections] = useState<LlmsSection[]>([
    { title: '', links: [{ title: '', url: '', notes: '' }] },
  ]);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => generateLlmsTxt({ name, summary, details, sections }).result ?? '',
    [name, summary, details, sections]
  );

  const hasOutput = name.trim().length > 0;

  useEffect(() => {
    if (hasOutput) scrollToResult();
  }, [hasOutput, scrollToResult]);

  const loadSample = () => {
    setName(starter.name);
    setSummary(starter.summary ?? '');
    setDetails(starter.details ?? '');
    setSections(starter.sections);
  };

  const updateSection = (i: number, patch: Partial<LlmsSection>) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const updateLink = (si: number, li: number, patch: Partial<LlmsSection['links'][0]>) =>
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, links: s.links.map((l, lidx) => (lidx === li ? { ...l, ...patch } : l)) }
          : s
      )
    );

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    downloadBlob(new Blob([output], { type: 'text/plain' }), 'llms.txt');
    addToHistory({
      id: crypto.randomUUID(),
      tool: 'llms-txt-generator',
      input: name,
      output,
      timestamp: Date.now(),
    });
  };

  const field =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800';

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={loadSample}>
          <Sparkles className="mr-1 h-3 w-3" />
          {labels.sample}
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-500">{labels.name}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.namePlaceholder}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-500">{labels.summary}</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={labels.summaryPlaceholder}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-500">{labels.details}</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={labels.detailsPlaceholder}
            className={`${field} h-20`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <div
            key={si}
            className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <input
                value={section.title}
                onChange={(e) => updateSection(si, { title: e.target.value })}
                placeholder={labels.sectionTitle}
                className={`${field} font-medium`}
              />
              {sections.length > 1 && (
                <button
                  onClick={() => setSections((p) => p.filter((_, idx) => idx !== si))}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {section.links.map((link, li) => (
              <div key={li} className="flex flex-wrap items-center gap-2 pl-2">
                <input
                  value={link.title}
                  onChange={(e) => updateLink(si, li, { title: e.target.value })}
                  placeholder={labels.linkTitle}
                  className={`${field} flex-1 min-w-[120px]`}
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(si, li, { url: e.target.value })}
                  placeholder={labels.url}
                  className={`${field} flex-1 min-w-[140px]`}
                />
                <input
                  value={link.notes ?? ''}
                  onChange={(e) => updateLink(si, li, { notes: e.target.value })}
                  placeholder={labels.notes}
                  className={`${field} flex-1 min-w-[120px]`}
                />
                {section.links.length > 1 && (
                  <button
                    onClick={() =>
                      updateSection(si, {
                        links: section.links.filter((_, idx) => idx !== li),
                      })
                    }
                    className="shrink-0 text-gray-400 hover:text-red-500"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                updateSection(si, {
                  links: [...section.links, { title: '', url: '', notes: '' }],
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              {labels.addLink}
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSections((p) => [...p, { title: '', links: [{ title: '', url: '', notes: '' }] }])
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          {labels.addSection}
        </Button>
      </div>

      <div ref={resultRef}>
        {hasOutput && (
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{labels.result}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-green-600" />
                      {labels.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      {labels.copy}
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-1 h-3 w-3" />
                  {labels.download}
                </Button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto rounded bg-white p-3 font-mono text-sm dark:bg-gray-900">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
