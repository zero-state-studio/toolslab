'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { formatFileSize, downloadBlob } from '@/lib/tools/image-tools';
import {
  ExifGroup,
  GpsCoordinates,
  readExif,
  stripExif,
  groupExifData,
  extractGps,
  mapsUrl,
  countFields,
} from '@/lib/tools/exif-viewer';

interface ExifViewerProps extends BaseToolProps {}

export default function ExifViewer({ dictionary }: ExifViewerProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['exif-viewer'] || {};
  const labels = {
    hint:
      t.hint ||
      'See the hidden metadata in your photos — camera, settings, date and GPS location — then strip it before you share. Nothing is uploaded.',
    drop: t.drop || 'Drop a photo here or click to upload',
    reading: t.reading || 'Reading metadata…',
    metadata: t.metadata || 'Metadata',
    noData: t.noData || 'No EXIF metadata found — this image is already clean.',
    gpsWarning: t.gpsWarning || 'This photo reveals where it was taken:',
    viewMap: t.viewMap || 'View on map',
    strip: t.strip || 'Remove all metadata',
    stripping: t.stripping || 'Removing…',
    cleaned: t.cleaned || 'Metadata removed',
    cleanedNote: t.cleanedNote || 'Download the clean copy — it has no EXIF, GPS or camera data.',
    download: t.download || 'Download clean photo',
    onlyImage: t.onlyImage || 'Only image files are supported',
    fields: t.fields || 'fields',
  };

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [groups, setGroups] = useState<ExifGroup[] | null>(null);
  const [gps, setGps] = useState<GpsCoordinates | null>(null);
  const [reading, setReading] = useState(false);
  const [stripping, setStripping] = useState(false);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
    };
  }, [previewUrl, cleanedUrl]);

  useEffect(() => {
    if (groups) scrollToResult();
  }, [groups, scrollToResult]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) {
        setError(labels.onlyImage);
        return;
      }
      setError('');
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setCleanedUrl(null);
      setCleanedBlob(null);
      setReading(true);
      const startTime = Date.now();
      try {
        const data = await readExif(f);
        const grouped = groupExifData(data);
        setGroups(grouped);
        setGps(extractGps(data));
        addToHistory({
          id: crypto.randomUUID(),
          tool: 'exif-viewer',
          input: `${f.name} ${formatFileSize(f.size)}`,
          output: `${countFields(grouped)} metadata fields`,
          timestamp: startTime,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read metadata');
        setGroups([]);
      } finally {
        setReading(false);
      }
    },
    [labels.onlyImage, addToHistory]
  );

  const handleStrip = async () => {
    if (!file) return;
    setStripping(true);
    try {
      const blob = await stripExif(file);
      setCleanedBlob(blob);
      setCleanedUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove metadata');
    } finally {
      setStripping(false);
    }
  };

  const cleanName = file
    ? file.name.replace(/(\.[^.]+)$/, '-clean$1')
    : 'clean.jpg';

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-5 text-center transition hover:border-violet-400 dark:border-gray-600"
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{labels.drop}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {file && previewUrl && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={file.name}
            className="h-16 w-16 rounded object-contain bg-gray-50 dark:bg-gray-900"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
      )}

      {reading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {labels.reading}
        </div>
      )}

      <div ref={resultRef} className="space-y-4">
        {gps && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>
              {labels.gpsWarning} {gps.latitude}, {gps.longitude}
            </span>
            <a
              href={mapsUrl(gps)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              {labels.viewMap}
            </a>
          </div>
        )}

        {groups && groups.length === 0 && !reading && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {labels.noData}
          </div>
        )}

        {groups && groups.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Fingerprint className="h-4 w-4 text-violet-500" />
                {labels.metadata}
                <span className="text-xs font-normal text-gray-500">
                  ({countFields(groups)} {labels.fields})
                </span>
              </h3>
              <Button onClick={handleStrip} disabled={stripping} size="sm">
                {stripping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {labels.stripping}
                  </>
                ) : (
                  labels.strip
                )}
              </Button>
            </div>

            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {group.title}
                  </p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                    {group.fields.map((f) => (
                      <div key={f.label} className="flex justify-between gap-2 text-sm">
                        <dt className="shrink-0 text-gray-500">{f.label}</dt>
                        <dd className="truncate text-right font-medium">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}

        {cleanedUrl && cleanedBlob && (
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              {labels.cleaned}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{labels.cleanedNote}</p>
            <Button
              variant="outline"
              onClick={() => downloadBlob(cleanedBlob, cleanName)}
            >
              <Download className="mr-2 h-4 w-4" />
              {labels.download}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
