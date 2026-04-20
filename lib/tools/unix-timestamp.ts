import {
  format,
  fromUnixTime,
  getUnixTime,
  parseISO,
  addDays,
  addHours,
  addMinutes,
  subDays,
  subHours,
  subMinutes,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface TimestampConversionOptions {
  timezone?: string;
  unit?: 'seconds' | 'milliseconds';
  outputFormats?: string[];
  includeBatch?: boolean;
  includeRelative?: boolean;
  customFormat?: string;
}

export interface ConversionResult {
  success: boolean;
  result?: string;
  results?: Record<string, any>;
  error?: string;
  metadata?: {
    inputType?: 'timestamp' | 'date';
    timezone?: string;
    timezoneOffset?: string;
    unit?: 'seconds' | 'milliseconds';
    original?: string;
    formats?: Record<string, string>;
    relative?: Record<string, string>;
    batch?: BatchResult[];
  };
}

export interface BatchResult {
  input: string;
  success: boolean;
  result?: Record<string, string>;
  error?: string;
}

export interface RelativeTime {
  past: Record<string, string>;
  future: Record<string, string>;
}

// Common date formats
export const DATE_FORMATS = {
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  iso_simple: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  rfc: "EEE, dd MMM yyyy HH:mm:ss 'GMT'",
  human: "EEEE, MMMM do, yyyy 'at' h:mm:ss a",
  date_only: 'yyyy-MM-dd',
  time_only: 'HH:mm:ss',
  us_format: 'MM/dd/yyyy, h:mm:ss a',
  eu_format: 'dd/MM/yyyy, HH:mm:ss',
  compact: 'yyyyMMdd_HHmmss',
  sql: 'yyyy-MM-dd HH:mm:ss',
  log: 'yyyy-MM-dd HH:mm:ss.SSS',
  cookie: "EEE, dd-MMM-yyyy HH:mm:ss 'GMT'",
  unix_readable: 'EEE MMM dd HH:mm:ss yyyy',
};

// Common timezones
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function detectInputType(
  input: string
): 'timestamp' | 'date' | 'invalid' {
  const trimmed = input.trim();

  // Empty input is invalid
  if (!trimmed) {
    return 'invalid';
  }

  // Check if it's a Unix timestamp (seconds or milliseconds)
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed);
    // Reasonable range for timestamps (1970-2038 for seconds, 1970-2286 for milliseconds)
    if ((num >= 0 && num <= 2147483647) || (num >= 0 && num <= 9999999999999)) {
      return 'timestamp';
    }
  }

  // Check if it's a valid date string
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && trimmed !== 'invalid') {
      return 'date';
    }
  } catch {
    // Ignore
  }

  // Try parsing as ISO date
  try {
    const isoDate = parseISO(trimmed);
    if (!isNaN(isoDate.getTime()) && trimmed !== 'invalid') {
      return 'date';
    }
  } catch {
    // Ignore
  }

  return 'invalid';
}

export function determineTimestampUnit(
  timestamp: number
): 'seconds' | 'milliseconds' {
  // If the timestamp is greater than what would be reasonable for seconds,
  // assume it's milliseconds
  if (timestamp > 9999999999) {
    return 'milliseconds';
  }
  return 'seconds';
}

export function timestampToDate(
  input: string,
  options: TimestampConversionOptions = {}
): ConversionResult {
  try {
    const timestamp = parseInt(input.trim());

    if (isNaN(timestamp)) {
      return {
        success: false,
        error: 'Invalid timestamp format. Please enter a valid Unix timestamp.',
      };
    }

    // Determine unit if not specified
    const unit = options.unit || determineTimestampUnit(timestamp);

    // Convert to Date object
    const date =
      unit === 'seconds' ? fromUnixTime(timestamp) : new Date(timestamp);

    if (isNaN(date.getTime())) {
      return {
        success: false,
        error: 'Invalid timestamp value. Please check your input.',
      };
    }

    const timezone = options.timezone || 'UTC';
    const formats: Record<string, string> = {};

    // Generate all format variations
    for (const [key, formatStr] of Object.entries(DATE_FORMATS)) {
      try {
        if (timezone === 'UTC') {
          // For UTC, use the direct date formatting to get proper Z suffix
          if (key === 'iso') {
            formats[key] = date.toISOString();
          } else if (key === 'iso_simple') {
            formats[key] = date.toISOString().slice(0, 19) + 'Z';
          } else {
            formats[key] = formatInTimeZone(date, timezone, formatStr);
          }
        } else {
          // For other timezones, use formatInTimeZone with offset format
          const offsetFormatStr =
            key === 'iso'
              ? "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
              : key === 'iso_simple'
                ? "yyyy-MM-dd'T'HH:mm:ssxxx"
                : formatStr;
          formats[key] = formatInTimeZone(date, timezone, offsetFormatStr);
        }
      } catch (err) {
        formats[key] = format(date, formatStr);
      }
    }

    // Custom format if provided
    if (options.customFormat) {
      try {
        formats.custom = formatInTimeZone(date, timezone, options.customFormat);
      } catch (err) {
        formats.custom = format(date, options.customFormat);
      }
    }

    // Generate relative times if requested
    let relative: Record<string, string> | undefined;
    if (options.includeRelative) {
      relative = generateRelativeTimes(date, timezone);
    }

    return {
      success: true,
      result: formats.iso,
      metadata: {
        inputType: 'timestamp',
        timezone,
        timezoneOffset: getTimezoneInfo(timezone)?.offset,
        unit,
        original: input,
        formats,
        relative,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Matches ISO-style offsets (Z, +HH:MM, +HHMM) at the end of the string,
// as well as trailing UTC/GMT markers. Used to decide whether the input
// already carries its own timezone information.
const EXPLICIT_TZ_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2}|\s(?:UTC|GMT))$/i;

function hasExplicitTimezone(input: string): boolean {
  return EXPLICIT_TZ_SUFFIX.test(input.trim());
}

export function dateToTimestamp(
  input: string,
  options: TimestampConversionOptions = {}
): ConversionResult {
  try {
    const timezone = options.timezone || 'UTC';
    const trimmed = input.trim();
    const hasTz = hasExplicitTimezone(trimmed);
    let utcDate: Date;

    if (hasTz) {
      // Input carries its own TZ info — parse as absolute. Selected timezone
      // only affects the display formats downstream, not the instant itself.
      try {
        utcDate = parseISO(trimmed);
        if (isNaN(utcDate.getTime())) {
          utcDate = new Date(trimmed);
        }
      } catch {
        utcDate = new Date(trimmed);
      }
    } else {
      // Input is a naive wall-clock time — interpret it as being in `timezone`.
      // Normalise "2024-01-15 10:00:00" to ISO-like "2024-01-15T10:00:00"
      // so date-fns-tz's fromZonedTime can parse it.
      const normalised = trimmed.replace(' ', 'T');
      try {
        utcDate = fromZonedTime(normalised, timezone);
        if (isNaN(utcDate.getTime())) {
          throw new Error('Invalid parse');
        }
      } catch {
        // Fallback: let Date constructor parse (assumes browser local TZ),
        // then re-interpret the wall-clock fields in the selected timezone.
        const fallback = new Date(trimmed);
        if (isNaN(fallback.getTime())) {
          utcDate = fallback;
        } else {
          const isoWall =
            `${fallback.getFullYear()}-` +
            `${String(fallback.getMonth() + 1).padStart(2, '0')}-` +
            `${String(fallback.getDate()).padStart(2, '0')}T` +
            `${String(fallback.getHours()).padStart(2, '0')}:` +
            `${String(fallback.getMinutes()).padStart(2, '0')}:` +
            `${String(fallback.getSeconds()).padStart(2, '0')}`;
          try {
            utcDate = fromZonedTime(isoWall, timezone);
          } catch {
            utcDate = fallback;
          }
        }
      }
    }

    if (isNaN(utcDate.getTime())) {
      return {
        success: false,
        error: 'Invalid date format. Please enter a valid date string.',
      };
    }

    const unit = options.unit || 'seconds';
    const timestamp =
      unit === 'seconds' ? getUnixTime(utcDate) : utcDate.getTime();

    // Generate different timestamp formats
    const formats: Record<string, string> = {
      seconds: getUnixTime(utcDate).toString(),
      milliseconds: utcDate.getTime().toString(),
      iso: utcDate.toISOString(),
      utc_string: utcDate.toUTCString(),
    };

    // Generate relative times if requested
    let relative: Record<string, string> | undefined;
    if (options.includeRelative) {
      relative = generateRelativeTimes(utcDate, 'UTC');
    }

    return {
      success: true,
      result: timestamp.toString(),
      metadata: {
        inputType: 'date',
        timezone,
        timezoneOffset: getTimezoneInfo(timezone)?.offset,
        unit,
        original: input,
        formats,
        relative,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert date: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function convertTimestamp(
  input: string,
  options: TimestampConversionOptions = {}
): ConversionResult {
  const inputType = detectInputType(input);

  if (inputType === 'invalid') {
    return {
      success: false,
      error:
        'Invalid input format. Please enter a valid Unix timestamp or date string.',
    };
  }

  if (inputType === 'timestamp') {
    return timestampToDate(input, options);
  } else {
    return dateToTimestamp(input, options);
  }
}

export function batchConvert(
  inputs: string[],
  options: TimestampConversionOptions = {}
): ConversionResult {
  const results: BatchResult[] = [];

  for (const input of inputs) {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      results.push({
        input,
        success: false,
        error: 'Empty input',
      });
      continue;
    }

    const result = convertTimestamp(trimmedInput, options);
    results.push({
      input,
      success: result.success,
      result: result.metadata?.formats,
      error: result.error,
    });
  }

  const successCount = results.filter((r) => r.success).length;

  return {
    success: successCount > 0,
    result: `Processed ${results.length} items, ${successCount} successful`,
    metadata: {
      batch: results,
    },
  };
}

export function generateRelativeTimes(
  date: Date,
  timezone: string = 'UTC'
): Record<string, string> {
  const now = new Date();
  const relative: Record<string, string> = {};

  try {
    // Past times
    relative.one_hour_ago = formatInTimeZone(
      subHours(date, 1),
      timezone,
      DATE_FORMATS.iso
    );
    relative.one_day_ago = formatInTimeZone(
      subDays(date, 1),
      timezone,
      DATE_FORMATS.iso
    );
    relative.one_week_ago = formatInTimeZone(
      subDays(date, 7),
      timezone,
      DATE_FORMATS.iso
    );

    // Future times
    relative.one_hour_later = formatInTimeZone(
      addHours(date, 1),
      timezone,
      DATE_FORMATS.iso
    );
    relative.one_day_later = formatInTimeZone(
      addDays(date, 1),
      timezone,
      DATE_FORMATS.iso
    );
    relative.one_week_later = formatInTimeZone(
      addDays(date, 7),
      timezone,
      DATE_FORMATS.iso
    );

    // Time difference from now
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.abs(Math.floor(diffMs / 1000));
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs > 0) {
      if (diffDays > 0) {
        relative.from_now = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        relative.from_now = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        relative.from_now = `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      } else {
        relative.from_now = `in ${diffSeconds} second${diffSeconds !== 1 ? 's' : ''}`;
      }
    } else {
      if (diffDays > 0) {
        relative.from_now = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        relative.from_now = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        relative.from_now = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else {
        relative.from_now = `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
      }
    }
  } catch (error) {
    // If any relative time calculation fails, just skip it
  }

  return relative;
}

export function generateCodeExamples(
  timestamp: string,
  date: Date,
  timezone: string = 'UTC'
): Record<string, string> {
  const unixTimestamp = getUnixTime(date);
  const milliseconds = date.getTime();

  return {
    javascript: `// Convert Unix timestamp to Date
const timestamp = ${unixTimestamp};
const date = new Date(timestamp * 1000);
console.log(date.toISOString()); // ${date.toISOString()}

// Convert Date to Unix timestamp
const now = new Date();
const unixTime = Math.floor(now.getTime() / 1000);`,

    python: `# Convert Unix timestamp to datetime
import datetime
timestamp = ${unixTimestamp}
date = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
print(date.isoformat())  # ${date.toISOString()}

# Convert datetime to Unix timestamp
import time
unix_time = int(time.time())`,

    php: `<?php
// Convert Unix timestamp to DateTime
$timestamp = ${unixTimestamp};
$date = new DateTime('@' . $timestamp);
$date->setTimezone(new DateTimeZone('${timezone}'));
echo $date->format('c');  // ${date.toISOString()}

// Convert DateTime to Unix timestamp
$unix_time = time();
?>`,

    java: `// Convert Unix timestamp to Date
long timestamp = ${unixTimestamp}L;
Date date = new Date(timestamp * 1000);
System.out.println(date.toInstant().toString()); // ${date.toISOString()}

// Convert Date to Unix timestamp
long unixTime = System.currentTimeMillis() / 1000;`,

    csharp: `// Convert Unix timestamp to DateTime
long timestamp = ${unixTimestamp};
DateTime date = DateTimeOffset.FromUnixTimeSeconds(timestamp).DateTime;
Console.WriteLine(date.ToString("yyyy-MM-ddTHH:mm:ssZ")); // ${date.toISOString()}

// Convert DateTime to Unix timestamp
long unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();`,

    go: `// Convert Unix timestamp to time.Time
package main
import (
    "fmt"
    "time"
)

func main() {
    timestamp := int64(${unixTimestamp})
    date := time.Unix(timestamp, 0).UTC()
    fmt.Println(date.Format(time.RFC3339)) // ${date.toISOString()}

    // Convert time.Time to Unix timestamp
    unixTime := time.Now().Unix()
}`,

    ruby: `# Convert Unix timestamp to Time
timestamp = ${unixTimestamp}
date = Time.at(timestamp).utc
puts date.iso8601  # ${date.toISOString()}

# Convert Time to Unix timestamp
unix_time = Time.now.to_i`,

    rust: `// Convert Unix timestamp to DateTime
use chrono::{DateTime, Utc, TimeZone};

let timestamp = ${unixTimestamp};
let date = Utc.timestamp(timestamp, 0);
println!("{}", date.to_rfc3339()); // ${date.toISOString()}

// Convert DateTime to Unix timestamp
let unix_time = Utc::now().timestamp();`,
  };
}

export function validateTimezone(timezone: string): boolean {
  // Empty timezone is invalid
  if (!timezone) {
    return false;
  }

  // Reject common invalid timezone abbreviations
  const invalidAbbreviations = [
    'EST',
    'PST',
    'CST',
    'MST',
    'EDT',
    'PDT',
    'CDT',
    'MDT',
  ];
  if (invalidAbbreviations.includes(timezone)) {
    return false;
  }

  try {
    // Try to format a date with the timezone
    formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
    return true;
  } catch {
    return false;
  }
}

export function getCurrentTimestamp(
  unit: 'seconds' | 'milliseconds' = 'seconds'
): string {
  const now = new Date();
  return unit === 'seconds'
    ? getUnixTime(now).toString()
    : now.getTime().toString();
}

export function getTimezoneInfo(
  timezone: string
): { offset: string; abbreviation: string } | null {
  if (!validateTimezone(timezone)) {
    return null;
  }

  try {
    const now = new Date();

    // Use Intl.DateTimeFormat to get proper timezone offset
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((part) => part.type === 'timeZoneName');
    const offset = offsetPart?.value || '+00:00';

    // Get abbreviation (simplified)
    const abbreviation = timezone.split('/').pop() || timezone;

    return { offset, abbreviation };
  } catch {
    return null;
  }
}
