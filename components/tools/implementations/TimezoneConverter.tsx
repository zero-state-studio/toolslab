'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToolStore } from '@/lib/store/toolStore';
import { BaseToolProps } from '@/lib/types/tools';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import {
  COMMON_TIMEZONES,
  ZoneTime,
  convertTimezone,
  isValidTimeZone,
} from '@/lib/tools/timezone-converter';

interface TimezoneConverterProps extends BaseToolProps {}

function browserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(tz) ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
}

/** "yyyy-MM-ddTHH:mm" for the datetime-local input, in the given zone. */
function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function TimezoneConverter({ dictionary }: TimezoneConverterProps) {
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const t = dictionary?.tools?.['timezone-converter'] || {};
  const labels = {
    hint:
      t.hint ||
      'Pick a time and source zone, then see it instantly in every zone you add — perfect for scheduling meetings.',
    when: t.when || 'Date & time',
    now: t.now || 'Now',
    source: t.source || 'Source timezone',
    targets: t.targets || 'Show in these timezones',
    add: t.add || 'Add timezone',
    convert: t.convert || 'Convert',
    result: t.result || 'Times around the world',
    error: t.error || 'Could not convert — check the date and timezone',
  };

  const [when, setWhen] = useState('');
  const [fromTz, setFromTz] = useState('UTC');
  const [targets, setTargets] = useState<string[]>([
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]);
  const [zones, setZones] = useState<ZoneTime[]>([]);
  const [error, setError] = useState('');

  // Seed defaults on the client only (avoids hydration mismatch from Date/Intl).
  useEffect(() => {
    setWhen(nowLocalInput());
    setFromTz(browserTimeZone());
  }, []);

  useEffect(() => {
    if (zones.length) scrollToResult();
  }, [zones, scrollToResult]);

  const availableToAdd = useMemo(
    () => COMMON_TIMEZONES.filter((z) => !targets.includes(z.value)),
    [targets]
  );

  const handleConvert = useCallback(() => {
    const startTime = Date.now();
    try {
      const r = convertTimezone(when, fromTz, targets);
      setZones(r.zones);
      setError('');
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'timezone-converter',
        input: `${when} ${fromTz} → ${targets.length} zones`,
        output: r.zones.map((z) => `${z.timeZone}: ${z.date} ${z.time}`).join(', '),
        timestamp: startTime,
      });
    } catch (e) {
      setZones([]);
      setError(e instanceof Error ? e.message : labels.error);
    }
  }, [when, fromTz, targets, addToHistory, labels.error]);

  // Auto-convert whenever inputs change and we have a time.
  useEffect(() => {
    if (when) {
      try {
        setZones(convertTimezone(when, fromTz, targets).zones);
        setError('');
      } catch {
        /* ignore during typing */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when, fromTz, targets]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{labels.hint}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-500">{labels.when}</label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <Button variant="outline" size="sm" onClick={() => setWhen(nowLocalInput())}>
              {labels.now}
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-500">{labels.source}</label>
          <select
            value={fromTz}
            onChange={(e) => setFromTz(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {!COMMON_TIMEZONES.some((z) => z.value === fromTz) && (
              <option value={fromTz}>{fromTz}</option>
            )}
            {COMMON_TIMEZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-gray-500">{labels.targets}</label>
          {availableToAdd.length > 0 && (
            <div className="flex items-center gap-1">
              <Plus className="h-3 w-3 text-gray-400" />
              <select
                value=""
                onChange={(e) => e.target.value && setTargets((p) => [...p, e.target.value])}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">{labels.add}</option>
                {availableToAdd.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div ref={resultRef} className="space-y-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {zones.map((z) => {
            const label =
              COMMON_TIMEZONES.find((c) => c.value === z.timeZone)?.label || z.timeZone;
            return (
              <div
                key={z.timeZone}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <Clock className="h-4 w-4 shrink-0 text-violet-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500">
                    {z.offset} · {z.abbreviation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{z.time}</p>
                  <p className="text-xs text-gray-500">
                    {z.weekday} {z.date}
                  </p>
                </div>
                <button
                  onClick={() => setTargets((p) => p.filter((tz) => tz !== z.timeZone))}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Remove timezone"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
