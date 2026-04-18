import {
  dateToTimestamp,
  timestampToDate,
  convertTimestamp,
  detectInputType,
  validateTimezone,
  getTimezoneInfo,
} from '@/lib/tools/unix-timestamp';

describe('unix-timestamp — timezone conversion (RIC-9)', () => {
  describe('dateToTimestamp — naive input interpreted in selected timezone', () => {
    it('interprets "2024-01-15 10:00:00" as 10:00 in Europe/Rome (UTC+1 winter)', () => {
      // 10:00 Rome (CET, UTC+1) on 2024-01-15 = 09:00 UTC
      // Unix: 2024-01-15T00:00:00Z = 1705276800; +9h = 1705309200
      const r = dateToTimestamp('2024-01-15 10:00:00', {
        timezone: 'Europe/Rome',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T09:00:00.000Z');
      expect(r.metadata?.formats?.seconds).toBe('1705309200');
    });

    it('interprets "2024-01-15 10:00:00" as 10:00 in America/New_York (UTC-5 winter)', () => {
      // 10:00 NY (EST, UTC-5) on 2024-01-15 = 15:00 UTC
      const r = dateToTimestamp('2024-01-15 10:00:00', {
        timezone: 'America/New_York',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T15:00:00.000Z');
    });

    it('interprets "2024-06-15 10:00:00" as 10:00 in Europe/Rome during DST (UTC+2)', () => {
      // 10:00 Rome (CEST, UTC+2) on 2024-06-15 = 08:00 UTC
      const r = dateToTimestamp('2024-06-15 10:00:00', {
        timezone: 'Europe/Rome',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-06-15T08:00:00.000Z');
    });

    it('interprets "2024-06-15 10:00:00" as 10:00 in America/New_York during DST (UTC-4)', () => {
      // 10:00 NY (EDT, UTC-4) on 2024-06-15 = 14:00 UTC
      const r = dateToTimestamp('2024-06-15 10:00:00', {
        timezone: 'America/New_York',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-06-15T14:00:00.000Z');
    });

    it('interprets "2024-01-15 10:00:00" as UTC when timezone is UTC', () => {
      const r = dateToTimestamp('2024-01-15 10:00:00', { timezone: 'UTC' });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T10:00:00.000Z');
    });

    it('handles Asia/Tokyo (UTC+9, no DST)', () => {
      // 18:00 Tokyo on 2024-06-15 = 09:00 UTC
      const r = dateToTimestamp('2024-06-15 18:00:00', {
        timezone: 'Asia/Tokyo',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-06-15T09:00:00.000Z');
    });
  });

  describe('dateToTimestamp — explicit TZ in input is respected', () => {
    it('input with Z suffix ignores timezone option for the instant', () => {
      const r = dateToTimestamp('2024-01-15T10:00:00Z', {
        timezone: 'Europe/Rome',
      });
      expect(r.success).toBe(true);
      // 10:00 UTC regardless of timezone option
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T10:00:00.000Z');
    });

    it('input with explicit +01:00 offset maps to correct UTC', () => {
      const r = dateToTimestamp('2024-01-15T10:00:00+01:00', {
        timezone: 'America/New_York',
      });
      expect(r.success).toBe(true);
      // 10:00 +01 = 09:00 UTC
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T09:00:00.000Z');
    });

    it('input with explicit -05:00 offset maps to correct UTC', () => {
      const r = dateToTimestamp('2024-01-15T10:00:00-05:00', {
        timezone: 'Europe/Rome',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toBe('2024-01-15T15:00:00.000Z');
    });
  });

  describe('dateToTimestamp — DST transitions', () => {
    it('handles US spring-forward boundary (2024-03-10 02:30 does not exist in New_York)', () => {
      // date-fns-tz maps nonexistent local times to the "spring-forward" equivalent.
      // We just assert we get a valid timestamp, not NaN.
      const r = dateToTimestamp('2024-03-10 02:30:00', {
        timezone: 'America/New_York',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toMatch(/^2024-03-10T0[67]:30:00/);
    });

    it('handles US fall-back boundary (2024-11-03 01:30 is ambiguous in New_York)', () => {
      // Ambiguous local time — library picks one instant; must be valid
      const r = dateToTimestamp('2024-11-03 01:30:00', {
        timezone: 'America/New_York',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.formats?.iso).toMatch(/^2024-11-03T0[5-6]:30:00/);
    });

    it('DST-aware offset difference: Rome winter vs summer', () => {
      const winter = dateToTimestamp('2024-01-15 12:00:00', {
        timezone: 'Europe/Rome',
      });
      const summer = dateToTimestamp('2024-07-15 12:00:00', {
        timezone: 'Europe/Rome',
      });
      expect(winter.success && summer.success).toBe(true);
      // Winter: 11:00 UTC; summer: 10:00 UTC. Difference = 3600 s.
      const winterSec = parseInt(winter.metadata!.formats!.seconds);
      const summerSec = parseInt(summer.metadata!.formats!.seconds);
      // Abstract: the local wall-clock 12:00 must correspond to different UTC instants
      // exactly 1 hour apart per day — but these are different days, so verify offset at each date
      // via separate offsets rather than subtraction.
      expect(winter.metadata?.formats?.iso).toBe('2024-01-15T11:00:00.000Z');
      expect(summer.metadata?.formats?.iso).toBe('2024-07-15T10:00:00.000Z');
      expect(Number.isFinite(winterSec) && Number.isFinite(summerSec)).toBe(
        true
      );
    });
  });

  describe('dateToTimestamp — error handling', () => {
    it('returns error on invalid date string', () => {
      const r = dateToTimestamp('not a date', { timezone: 'Europe/Rome' });
      expect(r.success).toBe(false);
      expect(r.error).toBeDefined();
    });

    it('returns error on empty string', () => {
      const r = dateToTimestamp('', { timezone: 'Europe/Rome' });
      expect(r.success).toBe(false);
    });
  });

  describe('metadata timezoneOffset', () => {
    it('exposes timezone offset in metadata for timestamp→date conversion', () => {
      const r = timestampToDate('1705312800', { timezone: 'Europe/Rome' });
      expect(r.success).toBe(true);
      expect(r.metadata?.timezoneOffset).toBeDefined();
      // Rome is UTC+1 (winter) or UTC+2 (summer) — offset computed from "now"
      expect(r.metadata?.timezoneOffset).toMatch(/\+0[12]:00/);
    });

    it('exposes timezone offset in metadata for date→timestamp conversion', () => {
      const r = dateToTimestamp('2024-01-15 10:00:00', {
        timezone: 'Asia/Tokyo',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.timezoneOffset).toBeDefined();
      expect(r.metadata?.timezoneOffset).toMatch(/\+09:00/);
    });
  });

  describe('convertTimestamp — dispatches correctly', () => {
    it('dispatches numeric input to timestamp→date', () => {
      const r = convertTimestamp('1705312800', { timezone: 'Europe/Rome' });
      expect(r.success).toBe(true);
      expect(r.metadata?.inputType).toBe('timestamp');
    });

    it('dispatches date string to date→timestamp', () => {
      const r = convertTimestamp('2024-01-15 10:00:00', {
        timezone: 'Europe/Rome',
      });
      expect(r.success).toBe(true);
      expect(r.metadata?.inputType).toBe('date');
    });
  });

  describe('roundtrip — date → timestamp → date', () => {
    it('preserves instant across conversions for Europe/Rome', () => {
      const original = dateToTimestamp('2024-06-15 14:30:00', {
        timezone: 'Europe/Rome',
      });
      const seconds = original.metadata!.formats!.seconds;
      const back = timestampToDate(seconds, { timezone: 'Europe/Rome' });
      // date→timestamp stores UTC instant
      expect(original.metadata?.formats?.iso).toBe('2024-06-15T12:30:00.000Z');
      // timestamp→date in non-UTC zone renders local wall-clock + offset
      expect(back.metadata?.formats?.iso).toBe(
        '2024-06-15T14:30:00.000+02:00'
      );
      // Underlying instant is identical in both representations
      const originalInstant = new Date(
        original.metadata!.formats!.iso
      ).getTime();
      const backInstant = new Date(back.metadata!.formats!.iso).getTime();
      expect(originalInstant).toBe(backInstant);
    });
  });

  describe('validateTimezone + getTimezoneInfo', () => {
    it('validates common IANA zones', () => {
      expect(validateTimezone('Europe/Rome')).toBe(true);
      expect(validateTimezone('America/New_York')).toBe(true);
      expect(validateTimezone('Asia/Tokyo')).toBe(true);
      expect(validateTimezone('UTC')).toBe(true);
    });

    it('rejects invalid zones and TZ abbreviations', () => {
      expect(validateTimezone('Not/A_Zone')).toBe(false);
      expect(validateTimezone('EST')).toBe(false);
      expect(validateTimezone('PST')).toBe(false);
      expect(validateTimezone('')).toBe(false);
    });

    it('getTimezoneInfo returns offset object for valid zone', () => {
      const info = getTimezoneInfo('Europe/Rome');
      expect(info).not.toBeNull();
      expect(info?.offset).toBeDefined();
      expect(info?.abbreviation).toBe('Rome');
    });

    it('getTimezoneInfo returns null for invalid zone', () => {
      expect(getTimezoneInfo('Not/A_Zone')).toBeNull();
    });
  });

  describe('detectInputType', () => {
    it('detects numeric timestamps', () => {
      expect(detectInputType('1705312800')).toBe('timestamp');
      expect(detectInputType('1705312800000')).toBe('timestamp');
    });

    it('detects date strings', () => {
      expect(detectInputType('2024-01-15 10:00:00')).toBe('date');
      expect(detectInputType('2024-01-15T10:00:00Z')).toBe('date');
    });

    it('rejects invalid input', () => {
      expect(detectInputType('')).toBe('invalid');
      expect(detectInputType('invalid')).toBe('invalid');
    });
  });
});
