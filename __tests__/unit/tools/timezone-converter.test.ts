import {
  convertTimezone,
  describeInstantInZone,
  isValidTimeZone,
  COMMON_TIMEZONES,
} from '@/lib/tools/timezone-converter';

describe('Timezone Converter', () => {
  describe('isValidTimeZone', () => {
    it('accepts valid IANA zones', () => {
      expect(isValidTimeZone('America/New_York')).toBe(true);
      expect(isValidTimeZone('UTC')).toBe(true);
      expect(isValidTimeZone('Asia/Tokyo')).toBe(true);
    });

    it('rejects invalid or empty zones', () => {
      expect(isValidTimeZone('Mars/Olympus')).toBe(false);
      expect(isValidTimeZone('')).toBe(false);
    });
  });

  describe('convertTimezone', () => {
    it('converts a New York time to Tokyo and London', () => {
      // 2026-06-21 12:00 in New York (EDT, GMT-4) == 16:00 UTC
      const r = convertTimezone('2026-06-21T12:00', 'America/New_York', [
        'UTC',
        'Asia/Tokyo',
        'Europe/London',
      ]);
      expect(r.instantUtc).toBe('2026-06-21T16:00:00.000Z');
      const byZone = Object.fromEntries(r.zones.map((z) => [z.timeZone, z]));
      expect(byZone['UTC'].time).toBe('16:00');
      // Tokyo is UTC+9 → 01:00 next day
      expect(byZone['Asia/Tokyo'].time).toBe('01:00');
      expect(byZone['Asia/Tokyo'].date).toBe('2026-06-22');
      // London in summer is BST (UTC+1) → 17:00
      expect(byZone['Europe/London'].time).toBe('17:00');
    });

    it('handles DST correctly (winter date)', () => {
      // 2026-01-15 12:00 New York (EST, GMT-5) == 17:00 UTC
      const r = convertTimezone('2026-01-15T12:00', 'America/New_York', ['UTC']);
      expect(r.instantUtc).toBe('2026-01-15T17:00:00.000Z');
    });

    it('drops invalid target zones', () => {
      const r = convertTimezone('2026-06-21T12:00', 'UTC', ['Asia/Tokyo', 'Bad/Zone']);
      expect(r.zones).toHaveLength(1);
      expect(r.zones[0].timeZone).toBe('Asia/Tokyo');
    });

    it('throws on empty input', () => {
      expect(() => convertTimezone('', 'UTC', ['UTC'])).toThrow();
    });

    it('throws on invalid source timezone', () => {
      expect(() => convertTimezone('2026-06-21T12:00', 'Bad/Zone', ['UTC'])).toThrow(
        /Invalid source timezone/
      );
    });
  });

  describe('describeInstantInZone', () => {
    it('formats an instant for a zone', () => {
      const z = describeInstantInZone(new Date('2026-06-21T16:00:00.000Z'), 'UTC');
      expect(z.date).toBe('2026-06-21');
      expect(z.time).toBe('16:00');
      expect(z.weekday).toBe('Sun');
    });
  });

  describe('COMMON_TIMEZONES', () => {
    it('only contains valid zones', () => {
      for (const { value } of COMMON_TIMEZONES) {
        expect(isValidTimeZone(value)).toBe(true);
      }
    });
  });
});
