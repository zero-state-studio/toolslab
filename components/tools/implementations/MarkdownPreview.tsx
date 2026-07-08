'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  FileText,
  Code,
  Eye,
  Columns2,
  Sun,
  Moon,
  Copy,
  Check,
  Upload,
  BarChart3,
} from 'lucide-react';
import { useToolStore } from '@/lib/store/toolStore';
import {
  parseMarkdown,
  calculateStats,
  exportToHTML,
  exportToPDF,
  downloadFile,
  templates,
  type TemplateName,
} from '@/lib/tools/markdown';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';

const STORAGE_KEY = 'markdown-preview-content';
const THEME_KEY = 'markdown-preview-theme';

type ViewMode = 'split' | 'editor' | 'preview';
type Theme = 'github-light' | 'github-dark';

export default function MarkdownPreview({ dictionary }: { dictionary?: any }) {
  const ui = dictionary?.tools?.['markdown-preview']?.ui ?? {};
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const [content, setContent] = useState('');
  const [html, setHtml] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [theme, setTheme] = useState<Theme>('github-light');
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [lastTrackedContent, setLastTrackedContent] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load saved content and theme on mount
  useEffect(() => {
    if (!isHydrated) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;

    if (saved) {
      setContent(saved);
    } else {
      // Set welcome template
      setContent(templates.readme);
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [isHydrated]);

  // Parse markdown to HTML
  useEffect(() => {
    if (!content.trim()) {
      setHtml('');
      return;
    }

    const result = parseMarkdown(content);
    if (result.success && result.html) {
      setHtml(result.html);
    }
  }, [content]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isHydrated || !content) return;

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, isHydrated]);

  // Save theme preference
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, isHydrated]);

  // Track usage when user stops editing
  const trackUsage = () => {
    if (content.trim() && content !== lastTrackedContent && html) {
      const stats = calculateStats(content);
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'markdown-preview',
        input: content,
        output: `${stats.words} words, ${stats.lines} lines`,
        timestamp: Date.now(),
      });
      setLastTrackedContent(content);
    }
  };

  const handleExportMarkdown = () => {
    trackUsage();
    const blob = new Blob([content], { type: 'text/markdown' });
    downloadFile(blob, 'document.md');
  };

  const handleExportHTML = () => {
    trackUsage();
    const result = exportToHTML(content, html, { theme });
    if (result.success && result.blob) {
      downloadFile(result.blob, 'document.html');
    }
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    trackUsage();

    const result = await exportToPDF(previewRef.current);
    if (result.success && result.blob) {
      downloadFile(result.blob, 'document.pdf');
    }
  };

  const handleCopyHTML = async () => {
    trackUsage();
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleLoadTemplate = (templateName: TemplateName) => {
    setContent(templates[templateName]);
  };

  const stats = content ? calculateStats(content) : null;

  const categoryColor = '#10b981'; // emerald-500 for text category

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {/* View Mode */}
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  style={{
                    backgroundColor:
                      viewMode === 'split' ? categoryColor : 'transparent',
                  }}
                >
                  <Columns2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'editor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('editor')}
                  style={{
                    backgroundColor:
                      viewMode === 'editor' ? categoryColor : 'transparent',
                  }}
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  style={{
                    backgroundColor:
                      viewMode === 'preview' ? categoryColor : 'transparent',
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTheme(
                    theme === 'github-light' ? 'github-dark' : 'github-light'
                  )
                }
              >
                {theme === 'github-light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Stats Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>

              {/* Import */}
              <div>
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                  id="markdown-file-input"
                />
                <label htmlFor="markdown-file-input">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      document.getElementById('markdown-file-input')?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {ui.importBtn || 'Import'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMarkdown}
                disabled={!content}
              >
                <Download className="mr-2 h-4 w-4" />
                MD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHTML}
                disabled={!content}
              >
                <Download className="mr-2 h-4 w-4" />
                HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={!content}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHTML}
                disabled={!content}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Templates - Collapsible */}
          <div className="mt-3 border-t pt-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex w-full items-center justify-between text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>{ui.quickTemplates || 'Quick Templates'}</span>
              <span className="text-xs">{showTemplates ? '▼' : '▶'}</span>
            </button>
            {showTemplates && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(templates) as TemplateName[]).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadTemplate(name)}
                    className="text-xs"
                  >
                    {name.replace(/-/g, ' ')}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Panel */}
      {showStats && stats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4 lg:grid-cols-6">
              <div>
                <p className="text-muted-foreground">{ui.statsWords || 'Words'}</p>
                <p className="font-semibold">{stats.words.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ui.statsCharacters || 'Characters'}</p>
                <p className="font-semibold">
                  {stats.characters.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{ui.statsLines || 'Lines'}</p>
                <p className="font-semibold">{stats.lines.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ui.statsReadingTime || 'Reading Time'}</p>
                <p className="font-semibold">{stats.readingTime} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ui.statsHeadings || 'Headings'}</p>
                <p className="font-semibold">
                  {Object.values(stats.headings).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{ui.statsLinks || 'Links'}</p>
                <p className="font-semibold">{stats.links}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor and Preview */}
      <div
        ref={resultRef}
        className={`grid gap-4 ${
          viewMode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Editor */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={trackUsage}
                placeholder={ui.editorPlaceholder || '# Start writing your markdown here...\n\n## Features\n- GitHub Flavored Markdown\n- Live preview\n- Export to HTML/PDF\n- Auto-save\n\nTry typing some **bold** or *italic* text!'}
                className="h-[600px] resize-none border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  backgroundColor:
                    theme === 'github-dark' ? '#0d1117' : '#ffffff',
                  color: theme === 'github-dark' ? '#e6edf3' : '#24292f',
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <style>{`
                .markdown-preview {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
                  font-size: 16px;
                  line-height: 1.6;
                }
                .markdown-preview h1, .markdown-preview h2, .markdown-preview h3,
                .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
                  margin-top: 24px;
                  margin-bottom: 16px;
                  font-weight: 600;
                  line-height: 1.25;
                }
                .markdown-preview h1 {
                  font-size: 2em;
                  border-bottom: 1px solid ${theme === 'github-dark' ? '#30363d' : '#d0d7de'};
                  padding-bottom: 0.3em;
                }
                .markdown-preview h2 {
                  font-size: 1.5em;
                  border-bottom: 1px solid ${theme === 'github-dark' ? '#30363d' : '#d0d7de'};
                  padding-bottom: 0.3em;
                }
                .markdown-preview h3 { font-size: 1.25em; }
                .markdown-preview h4 { font-size: 1em; }
                .markdown-preview h5 { font-size: 0.875em; }
                .markdown-preview h6 { font-size: 0.85em; color: ${theme === 'github-dark' ? '#8b949e' : '#656d76'}; }
                .markdown-preview a {
                  color: ${theme === 'github-dark' ? '#58a6ff' : '#0969da'};
                  text-decoration: none;
                }
                .markdown-preview a:hover { text-decoration: underline; }
                .markdown-preview code {
                  background-color: ${theme === 'github-dark' ? 'rgba(110,118,129,0.4)' : 'rgba(175,184,193,0.2)'};
                  padding: 0.2em 0.4em;
                  border-radius: 6px;
                  font-size: 85%;
                  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
                }
                .markdown-preview pre {
                  background-color: ${theme === 'github-dark' ? '#161b22' : '#f6f8fa'};
                  padding: 16px;
                  overflow: auto;
                  border-radius: 6px;
                  line-height: 1.45;
                  margin: 0 0 16px 0;
                }
                .markdown-preview pre code {
                  background-color: transparent;
                  padding: 0;
                  border-radius: 0;
                  font-size: 100%;
                }
                .markdown-preview blockquote {
                  padding: 0 1em;
                  border-left: 0.25em solid ${theme === 'github-dark' ? '#30363d' : '#d0d7de'};
                  color: ${theme === 'github-dark' ? '#8b949e' : '#656d76'};
                  margin: 0 0 16px 0;
                }
                .markdown-preview ul, .markdown-preview ol {
                  padding-left: 2em;
                  margin: 0 0 16px 0;
                }
                .markdown-preview li { margin-bottom: 0.25em; }
                .markdown-preview table {
                  border-spacing: 0;
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 16px;
                }
                .markdown-preview table th, .markdown-preview table td {
                  padding: 6px 13px;
                  border: 1px solid ${theme === 'github-dark' ? '#30363d' : '#d0d7de'};
                }
                .markdown-preview table th {
                  font-weight: 600;
                  background-color: ${theme === 'github-dark' ? '#161b22' : '#f6f8fa'};
                }
                .markdown-preview table tr:nth-child(2n) {
                  background-color: ${theme === 'github-dark' ? '#0d1117' : '#f6f8fa'};
                }
                .markdown-preview img {
                  max-width: 100%;
                  height: auto;
                  margin: 16px 0;
                }
                .markdown-preview hr {
                  height: 0.25em;
                  padding: 0;
                  margin: 24px 0;
                  background-color: ${theme === 'github-dark' ? '#30363d' : '#d0d7de'};
                  border: 0;
                }
                .markdown-preview p { margin-bottom: 16px; }
                .markdown-preview del { text-decoration: line-through; }
                .markdown-preview strong { font-weight: 600; }
                .markdown-preview em { font-style: italic; }
              `}</style>
              <div
                ref={previewRef}
                className="markdown-preview h-[600px] max-w-none overflow-auto p-4"
                style={{
                  backgroundColor:
                    theme === 'github-dark' ? '#0d1117' : '#ffffff',
                  color: theme === 'github-dark' ? '#e6edf3' : '#24292f',
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    html ||
                    `<p style="color: #6b7280;">${ui.previewPlaceholder || 'Preview will appear here...'}</p>`,
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>{ui.keyboardShortcutsHeading || 'Keyboard shortcuts:'}</strong>
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>
                <kbd className="rounded bg-muted px-1.5 py-0.5">
                  Ctrl/Cmd + B
                </kbd>{' '}
                - {ui.shortcutBold || 'Bold'}
              </li>
              <li>
                <kbd className="rounded bg-muted px-1.5 py-0.5">
                  Ctrl/Cmd + I
                </kbd>{' '}
                - {ui.shortcutItalic || 'Italic'}
              </li>
              <li>
                <kbd className="rounded bg-muted px-1.5 py-0.5">
                  Ctrl/Cmd + K
                </kbd>{' '}
                - {ui.shortcutLink || 'Link'}
              </li>
            </ul>
            <p className="pt-2">
              <strong>{ui.supportsHeading || 'Supports:'}</strong> {ui.supportsText || 'GitHub Flavored Markdown (GFM), tables, task lists, code blocks, and more.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
