'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import {
  Timestamp,
  parseTimeToSeconds,
  formatSecondsToTime,
  generateYouTubeLink,
  generateChaptersFormat,
  parseChaptersFormat,
  isValidYouTubeUrl,
  extractVideoId,
  formatDuration,
} from '@/lib/tools/youtube-timestamp-generator';

interface YouTubeTimestampGeneratorProps {
  dictionary?: any;
  toolText?: {
    title?: string;
    description?: string;
    placeholder?: string;
    videoUrlPlaceholder?: string;
    addTimestamp?: string;
    time?: string;
    label?: string;
    labelPlaceholder?: string;
    timestamps?: string;
    noTimestamps?: string;
    generateChapters?: string;
    importChapters?: string;
    copyChapters?: string;
    copyLinks?: string;
    clear?: string;
    delete?: string;
    edit?: string;
    save?: string;
    cancel?: string;
    chaptersFormat?: string;
    linksFormat?: string;
    videoUrl?: string;
    optional?: string;
    invalidTime?: string;
    invalidUrl?: string;
    chaptersOutput?: string;
    linksOutput?: string;
    copied?: string;
    importPlaceholder?: string;
    importButton?: string;
    convertTime?: string;
    seconds?: string;
    formatted?: string;
    convert?: string;
  };
}

export default function YouTubeTimestampGenerator({
  dictionary,
  toolText,
}: YouTubeTimestampGeneratorProps) {
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();

  // State
  const [videoUrl, setVideoUrl] = useState('');
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [newTime, setNewTime] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [timeError, setTimeError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [chaptersOutput, setChaptersOutput] = useState('');
  const [linksOutput, setLinksOutput] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [copied, setCopied] = useState<'chapters' | 'links' | null>(null);

  // Time converter state
  const [converterInput, setConverterInput] = useState('');
  const [converterSeconds, setConverterSeconds] = useState<number | null>(null);
  const [converterFormatted, setConverterFormatted] = useState('');

  // Resolve per-tool translations: dictionary prop (runtime i18n) takes priority,
  // toolText is kept as a harmless fallback for legacy callers.
  const t = dictionary?.tools?.['youtube-timestamp-generator'] || toolText || {};

  // Labels with fallbacks
  const labels = {
    title: t.title || 'YouTube Timestamp Generator',
    description:
      t.description ||
      'Create timestamps for YouTube videos with chapters format',
    placeholder: t.placeholder || '00:00',
    videoUrlPlaceholder:
      t.videoUrlPlaceholder || 'https://www.youtube.com/watch?v=...',
    addTimestamp: t.addTimestamp || 'Add Timestamp',
    time: t.time || 'Time',
    label: t.label || 'Label',
    labelPlaceholder: t.labelPlaceholder || 'Chapter title...',
    timestamps: t.timestamps || 'Timestamps',
    noTimestamps:
      t.noTimestamps || 'No timestamps yet. Add your first one!',
    generateChapters: t.generateChapters || 'Generate Chapters',
    importChapters: t.importChapters || 'Import Chapters',
    copyChapters: t.copyChapters || 'Copy Chapters',
    copyLinks: t.copyLinks || 'Copy with Links',
    clear: t.clear || 'Clear All',
    delete: t.delete || 'Delete',
    edit: t.edit || 'Edit',
    save: t.save || 'Save',
    cancel: t.cancel || 'Cancel',
    chaptersFormat: t.chaptersFormat || 'YouTube Chapters Format',
    linksFormat: t.linksFormat || 'Timestamps with Links',
    videoUrl: t.videoUrl || 'YouTube Video URL',
    optional: t.optional || '(optional)',
    invalidTime: t.invalidTime || 'Invalid time format',
    invalidUrl: t.invalidUrl || 'Invalid YouTube URL',
    chaptersOutput: t.chaptersOutput || 'Chapters Output',
    linksOutput: t.linksOutput || 'Links Output',
    copied: t.copied || 'Copied!',
    importPlaceholder:
      t.importPlaceholder || 'Paste chapters here (one per line)...',
    importButton: t.importButton || 'Import',
    convertTime: t.convertTime || 'Time Converter',
    seconds: t.seconds || 'Seconds',
    formatted: t.formatted || 'Formatted',
    convert: t.convert || 'Convert',
    actions: t.actions || 'Actions',
    converterPlaceholder: t.converterPlaceholder || '00:00 or 90',
    converterHint: t.converterHint || 'MM:SS, HH:MM:SS, or seconds',
  };

  // Validate YouTube URL when it changes
  useEffect(() => {
    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      setUrlError(labels.invalidUrl);
    } else {
      setUrlError('');
    }
  }, [videoUrl, labels.invalidUrl]);

  // Generate outputs when timestamps change
  useEffect(() => {
    if (timestamps.length > 0) {
      const chapters = generateChaptersFormat(timestamps);
      setChaptersOutput(chapters);

      // Generate links if video URL is provided
      if (videoUrl && isValidYouTubeUrl(videoUrl)) {
        const sorted = [...timestamps].sort((a, b) => a.time - b.time);
        const links = sorted
          .map((ts) => {
            const time = formatSecondsToTime(ts.time);
            const link = generateYouTubeLink(videoUrl, ts.time);
            return `${time} ${ts.label}\n${link}`;
          })
          .join('\n\n');
        setLinksOutput(links);
      } else {
        setLinksOutput('');
      }
    } else {
      setChaptersOutput('');
      setLinksOutput('');
    }
  }, [timestamps, videoUrl]);

  // Add timestamp
  const handleAddTimestamp = useCallback(() => {
    if (!newTime.trim()) {
      setTimeError(labels.invalidTime);
      return;
    }

    const result = parseTimeToSeconds(newTime);
    if (!result.success || result.seconds === undefined) {
      setTimeError(result.error || labels.invalidTime);
      return;
    }

    const timestamp: Timestamp = {
      id: crypto.randomUUID(),
      time: result.seconds,
      label: newLabel.trim() || `Chapter ${timestamps.length + 1}`,
    };

    const startTime = Date.now();
    setTimestamps((prev) => [...prev, timestamp]);
    setNewTime('');
    setNewLabel('');
    setTimeError('');

    // Track usage
    if (isHydrated) {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'youtube-timestamp-generator',
        input: `${newTime} - ${timestamp.label}`,
        output: formatSecondsToTime(result.seconds),
        timestamp: startTime,
      });
    }
  }, [
    newTime,
    newLabel,
    timestamps.length,
    isHydrated,
    addToHistory,
    labels.invalidTime,
  ]);

  // Delete timestamp
  const handleDeleteTimestamp = useCallback((id: string) => {
    setTimestamps((prev) => prev.filter((ts) => ts.id !== id));
  }, []);

  // Start editing
  const handleStartEdit = useCallback((ts: Timestamp) => {
    setEditingId(ts.id);
    setEditTime(formatSecondsToTime(ts.time));
    setEditLabel(ts.label);
  }, []);

  // Save edit
  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;

    const result = parseTimeToSeconds(editTime);
    if (!result.success || result.seconds === undefined) {
      return;
    }

    setTimestamps((prev) =>
      prev.map((ts) =>
        ts.id === editingId
          ? {
              ...ts,
              time: result.seconds!,
              label: editLabel.trim() || ts.label,
            }
          : ts
      )
    );
    setEditingId(null);
    setEditTime('');
    setEditLabel('');
  }, [editingId, editTime, editLabel]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTime('');
    setEditLabel('');
  }, []);

  // Import chapters
  const handleImport = useCallback(() => {
    if (!importText.trim()) return;

    const imported = parseChaptersFormat(importText);
    if (imported.length > 0) {
      setTimestamps((prev) => [...prev, ...imported]);
      setImportText('');
      setShowImport(false);
    }
  }, [importText]);

  // Clear all
  const handleClear = useCallback(() => {
    setTimestamps([]);
    setChaptersOutput('');
    setLinksOutput('');
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(
    async (text: string, type: 'chapters' | 'links') => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    []
  );

  // Time converter
  const handleConvert = useCallback(() => {
    if (!converterInput.trim()) return;

    // Try parsing as time string first
    const result = parseTimeToSeconds(converterInput);
    if (result.success && result.seconds !== undefined) {
      setConverterSeconds(result.seconds);
      setConverterFormatted(formatSecondsToTime(result.seconds));
    }
  }, [converterInput]);

  // Handle Enter key for adding timestamp
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddTimestamp();
      }
    },
    [handleAddTimestamp]
  );

  return (
    <div className="space-y-4">
      {/* Video URL Input */}
      <div className="space-y-2">
        <Label htmlFor="videoUrl">
          {labels.videoUrl}{' '}
          <span className="text-sm text-muted-foreground">
            {labels.optional}
          </span>
        </Label>
        <Input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={labels.videoUrlPlaceholder}
          className={urlError ? 'border-red-500' : ''}
        />
        {urlError && <p className="text-sm text-red-500">{urlError}</p>}
        {videoUrl && !urlError && extractVideoId(videoUrl) && (
          <p className="text-sm text-green-600">
            Video ID: {extractVideoId(videoUrl)}
          </p>
        )}
      </div>

      {/* Add Timestamp Form */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-4 sm:grid-cols-[150px_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="newTime">{labels.time}</Label>
            <Input
              id="newTime"
              value={newTime}
              onChange={(e) => {
                setNewTime(e.target.value);
                setTimeError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder={labels.placeholder}
              className={timeError ? 'border-red-500' : ''}
            />
            {timeError && <p className="text-xs text-red-500">{timeError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newLabel">{labels.label}</Label>
            <Input
              id="newLabel"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={labels.labelPlaceholder}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddTimestamp}>{labels.addTimestamp}</Button>
          </div>
        </div>
      </div>

      {/* Timestamps List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{labels.timestamps}</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(!showImport)}
            >
              {labels.importChapters}
            </Button>
            {timestamps.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                {labels.clear}
              </Button>
            )}
          </div>
        </div>

        {/* Import Section */}
        {showImport && (
          <div className="space-y-2 rounded-lg border p-4">
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={labels.importPlaceholder}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImport}>
                {labels.importButton}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImport(false)}
              >
                {labels.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Timestamps Table */}
        {timestamps.length === 0 ? (
          <div className="rounded-lg border p-5 text-center text-muted-foreground">
            {labels.noTimestamps}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-32 px-4 py-2 text-left text-sm font-medium">
                    {labels.time}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    {labels.label}
                  </th>
                  <th className="w-32 px-4 py-2 text-right text-sm font-medium">
                    {labels.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...timestamps]
                  .sort((a, b) => a.time - b.time)
                  .map((ts) => (
                    <tr key={ts.id} className="border-t">
                      {editingId === ts.id ? (
                        <>
                          <td className="px-4 py-2">
                            <Input
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="h-8"
                            />
                          </td>
                          <td className="space-x-1 px-4 py-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                            >
                              {labels.save}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              {labels.cancel}
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-mono text-sm">
                            {formatSecondsToTime(ts.time)}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({ts.time}s)
                            </span>
                          </td>
                          <td className="px-4 py-2">{ts.label}</td>
                          <td className="space-x-1 px-4 py-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(ts)}
                            >
                              {labels.edit}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteTimestamp(ts.id)}
                            >
                              {labels.delete}
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Output Section */}
      {timestamps.length > 0 && (
        <div className="space-y-4">
          {/* Chapters Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{labels.chaptersFormat}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(chaptersOutput, 'chapters')}
              >
                {copied === 'chapters' ? labels.copied : labels.copyChapters}
              </Button>
            </div>
            <Textarea
              value={chaptersOutput}
              readOnly
              rows={Math.min(timestamps.length + 1, 10)}
              className="font-mono text-sm"
            />
          </div>

          {/* Links Format */}
          {linksOutput && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{labels.linksFormat}</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(linksOutput, 'links')}
                >
                  {copied === 'links' ? labels.copied : labels.copyLinks}
                </Button>
              </div>
              <Textarea
                value={linksOutput}
                readOnly
                rows={Math.min(timestamps.length * 2 + 1, 15)}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Time Converter */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <Label className="mb-3 block">{labels.convertTime}</Label>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-1">
            <Input
              value={converterInput}
              onChange={(e) => setConverterInput(e.target.value)}
              placeholder={labels.converterPlaceholder}
              onKeyPress={(e) => e.key === 'Enter' && handleConvert()}
            />
            <p className="text-xs text-muted-foreground">
              {labels.converterHint}
            </p>
          </div>
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={handleConvert}>
              {labels.convert}
            </Button>
          </div>
          <div className="space-y-1">
            {converterSeconds !== null && (
              <>
                <div className="rounded bg-muted p-2 font-mono text-sm">
                  {converterSeconds}s = {converterFormatted}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(converterSeconds)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
