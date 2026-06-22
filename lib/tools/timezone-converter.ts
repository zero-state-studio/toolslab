/**
 * Timezone conversion and meeting-planner helpers.
 *
 * Takes a wall-clock time in a source IANA timezone, resolves it to a single
 * UTC instant, then formats that instant in any number of target zones. All
 * arithmetic is delegated to date-fns-tz so DST is handled correctly.
 */

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface ZoneTime {
  /** IANA timezone, e.g. "America/New_York". */
  timeZone: string;
  /** Formatted date, e.g. "2026-06-21". */
  date: string;
  /** Formatted time, e.g. "14:30". */
  time: string;
  /** Day of week, e.g. "Sun". */
  weekday: string;
  /** UTC offset label, e.g. "GMT-4". */
  offset: string;
  /** Abbreviation when available, e.g. "EDT". */
  abbreviation: string;
}

export interface TimezoneConversion {
  /** The resolved absolute instant, as an ISO-8601 UTC string. */
  instantUtc: string;
  zones: ZoneTime[];
}

/** Curated list of common IANA zones for the picker (label + value). */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];

/** Whether an IANA timezone identifier is valid in this runtime. */
export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Format one absolute instant for one timezone. */
export function describeInstantInZone(instant: Date, timeZone: string): ZoneTime {
  return {
    timeZone,
    date: formatInTimeZone(instant, timeZone, 'yyyy-MM-dd'),
    time: formatInTimeZone(instant, timeZone, 'HH:mm'),
    weekday: formatInTimeZone(instant, timeZone, 'EEE'),
    offset: formatInTimeZone(instant, timeZone, 'O'),
    abbreviation: formatInTimeZone(instant, timeZone, 'zzz'),
  };
}

/**
 * Convert a wall-clock time in `fromTz` into every zone in `toTzs`.
 *
 * @param localDateTime  "yyyy-MM-dd'T'HH:mm" (as produced by datetime-local)
 * @param fromTz         source IANA timezone
 * @param toTzs          target IANA timezones
 */
export function convertTimezone(
  localDateTime: string,
  fromTz: string,
  toTzs: string[]
): TimezoneConversion {
  if (!localDateTime) throw new Error('A date and time is required');
  if (!isValidTimeZone(fromTz)) throw new Error(`Invalid source timezone: ${fromTz}`);

  const instant = fromZonedTime(localDateTime, fromTz);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('Could not parse the given date and time');
  }

  const valid = toTzs.filter(isValidTimeZone);
  return {
    instantUtc: instant.toISOString(),
    zones: valid.map((tz) => describeInstantInZone(instant, tz)),
  };
}
