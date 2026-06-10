'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Type,
  Smartphone,
  Monitor,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import AdBanner from '@/components/ads/AdBanner';
import {
  toBold,
  toItalic,
  toBoldItalic,
  toUnderline,
  toStrikethrough,
  toMonospace,
  createBulletList,
  createNumberedList,
  getCharacterInfo,
  textToLines,
  bulletStyles,
  BulletStyle,
  postTemplates,
  PostTemplate,
  LINKEDIN_CHAR_LIMIT,
  LINKEDIN_OPTIMAL_LENGTH,
} from '@/lib/tools/linkedin-post-formatter';

interface LinkedInPostFormatterProps extends BaseToolProps {}

type FormatType =
  | 'bold'
  | 'italic'
  | 'boldItalic'
  | 'underline'
  | 'strikethrough'
  | 'monospace';
type PreviewMode = 'desktop' | 'mobile';

export default function LinkedInPostFormatter({
  categoryColor,
}: LinkedInPostFormatterProps) {
  const [text, setText] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [selectedBulletStyle, setSelectedBulletStyle] =
    useState<BulletStyle>('dot');
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { trackUse } = useToolTracking('linkedin-post-formatter');
  const { copied, copy } = useCopy();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  const charInfo = getCharacterInfo(text);

  // Apply formatting to selected text or entire text
  const applyFormat = useCallback(
    (format: FormatType) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = text.substring(start, end);

      // If no selection, do nothing
      if (start === end) return;

      let formattedText: string;
      switch (format) {
        case 'bold':
          formattedText = toBold(selectedText);
          break;
        case 'italic':
          formattedText = toItalic(selectedText);
          break;
        case 'boldItalic':
          formattedText = toBoldItalic(selectedText);
          break;
        case 'underline':
          formattedText = toUnderline(selectedText);
          break;
        case 'strikethrough':
          formattedText = toStrikethrough(selectedText);
          break;
        case 'monospace':
          formattedText = toMonospace(selectedText);
          break;
        default:
          return;
      }

      const newText =
        text.substring(0, start) + formattedText + text.substring(end);
      setText(newText);

      // Restore focus and selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    },
    [text]
  );

  // Create bullet list from selected lines
  const applyBulletList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Get the lines in selection or use entire text if no selection
    let targetText: string;
    let insertStart: number;
    let insertEnd: number;

    if (start === end) {
      // No selection - use entire text
      targetText = text;
      insertStart = 0;
      insertEnd = text.length;
    } else {
      // Expand selection to full lines
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', end);
      insertStart = lineStart;
      insertEnd = lineEnd === -1 ? text.length : lineEnd;
      targetText = text.substring(insertStart, insertEnd);
    }

    const lines = textToLines(targetText);
    if (lines.length === 0) return;

    const result = createBulletList(lines, selectedBulletStyle);
    if (!result.success || !result.text) return;

    const newText =
      text.substring(0, insertStart) + result.text + text.substring(insertEnd);
    setText(newText);
  }, [text, selectedBulletStyle]);

  // Create numbered list from selected lines
  const applyNumberedList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let targetText: string;
    let insertStart: number;
    let insertEnd: number;

    if (start === end) {
      targetText = text;
      insertStart = 0;
      insertEnd = text.length;
    } else {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', end);
      insertStart = lineStart;
      insertEnd = lineEnd === -1 ? text.length : lineEnd;
      targetText = text.substring(insertStart, insertEnd);
    }

    const lines = textToLines(targetText);
    if (lines.length === 0) return;

    const result = createNumberedList(lines, 'standard');
    if (!result.success || !result.text) return;

    const newText =
      text.substring(0, insertStart) + result.text + text.substring(insertEnd);
    setText(newText);
  }, [text]);

  // Apply template
  const applyTemplate = (templateKey: PostTemplate) => {
    const template = postTemplates[templateKey];
    setText(template.template);
    setShowTemplates(false);
  };

  // Copy text to clipboard
  const handleCopy = async () => {
    if (!text.trim()) return;

    const startTime = Date.now();
    await copy(text);

    addToHistory({
      id: crypto.randomUUID(),
      tool: 'linkedin-post-formatter',
      input: text,
      output: text,
      timestamp: startTime,
    });

    trackUse(text, text, { success: true });
    scrollToResult();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !textareaRef.current ||
        document.activeElement !== textareaRef.current
      )
        return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [applyFormat]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            LinkedIn Post Formatter
          </h3>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          style={{ color: categoryColor }}
        >
          <Sparkles className="h-4 w-4" />
          Templates
        </button>
      </div>

      <div className="space-y-4 p-6">
        {/* Templates Dropdown */}
        {showTemplates && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Start Templates
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {Object.entries(postTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key as PostTemplate)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
            <button
              onClick={() => applyFormat('bold')}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormat('underline')}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormat('strikethrough')}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormat('monospace')}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Monospace"
            >
              <Type className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
            <button
              onClick={applyBulletList}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={applyNumberedList}
              className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <select
              value={selectedBulletStyle}
              onChange={(e) =>
                setSelectedBulletStyle(e.target.value as BulletStyle)
              }
              className="ml-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {Object.entries(bulletStyles).map(([key, symbol]) => (
                <option key={key} value={key}>
                  {symbol} {key}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Select text, then click format</span>
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your LinkedIn Post
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-mono ${
                  charInfo.isOverLimit
                    ? 'text-red-500'
                    : charInfo.isOptimal
                      ? 'text-green-500'
                      : 'text-orange-500'
                }`}
              >
                {charInfo.count}
              </span>
              <span className="text-gray-400">/ {LINKEDIN_CHAR_LIMIT}</span>
              {charInfo.isOptimal && (
                <span className="text-xs text-green-500">(optimal)</span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your LinkedIn post here... Select text and use the formatting buttons above to apply bold, italic, and more."
            className="h-48 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 font-sans text-base text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
            style={{
              borderColor: `${categoryColor}30`,
            }}
            onFocus={(e) => (e.target.style.borderColor = categoryColor)}
            onBlur={(e) => (e.target.style.borderColor = `${categoryColor}30`)}
          />
          {charInfo.isOverLimit && (
            <p className="text-sm text-red-500">
              Text exceeds LinkedIn&apos;s {LINKEDIN_CHAR_LIMIT} character limit
            </p>
          )}
        </div>

        {/* Preview Section */}
        {text.trim() && (
          <div ref={resultRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview
              </label>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`rounded px-3 py-1 text-sm transition-colors ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`rounded px-3 py-1 text-sm transition-colors ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* LinkedIn-style Preview */}
            <div
              className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${
                previewMode === 'mobile' ? 'mx-auto max-w-sm' : ''
              }`}
            >
              {/* Post Header */}
              <div className="flex items-start gap-3 border-b border-gray-100 p-4 dark:border-gray-700">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Your Name
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your Headline • 1st
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Just now • 🌐
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white"
                  style={{ wordBreak: 'break-word' }}
                >
                  {text}
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-around border-t border-gray-100 px-4 py-2 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <span className="text-xs">👍 Like</span>
                <span className="text-xs">💬 Comment</span>
                <span className="text-xs">🔄 Repost</span>
                <span className="text-xs">📤 Send</span>
              </div>
            </div>
          </div>
        )}

        {/* Copy Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCopy}
            disabled={!text.trim()}
            className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            style={{
              backgroundColor: copied ? '#10b981' : categoryColor,
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>

        {/* Ad: mobile only — above tips */}
        <AdBanner
          className="lg:hidden"
          minHeight={100}
          maxHeight={280}
          slot="5833147302"
        />

        {/* Tips */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            💡 Pro Tips
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
            <li>• Select text first, then click a formatting button</li>
            <li>
              • Use keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U
              (underline)
            </li>
            <li>
              • Keep posts under {LINKEDIN_OPTIMAL_LENGTH} chars for optimal
              engagement
            </li>
            <li>• Use bullet points to make content scannable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
