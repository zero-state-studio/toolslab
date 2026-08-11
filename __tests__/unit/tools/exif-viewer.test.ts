import {
  formatExifValue,
  extractGps,
  hasGps,
  mapsUrl,
  groupExifData,
  countFields,
} from '@/lib/tools/exif-viewer';

const SAMPLE = {
  Make: 'Apple',
  Model: 'iPhone 14 Pro',
  FNumber: 1.78,
  ISO: 100,
  FocalLength: 6.86,
  DateTimeOriginal: new Date('2026-06-21T10:30:00Z'),
  latitude: 45.4642035,
  longitude: 9.189982,
  ImageWidth: 4032,
  ImageHeight: 3024,
  SomethingWeird: 'custom',
};

describe('EXIF Viewer', () => {
  describe('formatExifValue', () => {
    it('formats dates', () => {
      expect(formatExifValue(new Date('2026-06-21T10:30:00Z'))).toBe('2026-06-21 10:30:00');
    });
    it('formats numbers and rounds', () => {
      expect(formatExifValue(1.78)).toBe('1.78');
      expect(formatExifValue(6.8666666)).toBe('6.866667');
    });
    it('joins arrays', () => {
      expect(formatExifValue([1, 2, 3])).toBe('1, 2, 3');
    });
    it('returns empty for null/undefined', () => {
      expect(formatExifValue(null)).toBe('');
      expect(formatExifValue(undefined)).toBe('');
    });
  });

  describe('extractGps / hasGps', () => {
    it('extracts valid coordinates', () => {
      expect(extractGps(SAMPLE)).toEqual({ latitude: 45.464204, longitude: 9.189982 });
      expect(hasGps(SAMPLE)).toBe(true);
    });
    it('returns null when no GPS', () => {
      expect(extractGps({ Make: 'Canon' })).toBeNull();
      expect(hasGps({ Make: 'Canon' })).toBe(false);
    });
    it('ignores NaN coordinates', () => {
      expect(extractGps({ latitude: NaN, longitude: 9 })).toBeNull();
    });
  });

  describe('mapsUrl', () => {
    it('builds a maps link', () => {
      expect(mapsUrl({ latitude: 45.46, longitude: 9.19 })).toBe(
        'https://www.google.com/maps?q=45.46,9.19'
      );
    });
  });

  describe('groupExifData', () => {
    it('groups known keys into sections', () => {
      const groups = groupExifData(SAMPLE);
      const titles = groups.map((g) => g.title);
      expect(titles).toContain('Camera');
      expect(titles).toContain('Exposure');
      expect(titles).toContain('Location');
      expect(titles).toContain('Other');
    });

    it('puts camera fields in the Camera group', () => {
      const camera = groupExifData(SAMPLE).find((g) => g.title === 'Camera')!;
      expect(camera.fields.map((f) => f.label)).toEqual(['Make', 'Model']);
    });

    it('collects unknown keys under Other', () => {
      const other = groupExifData(SAMPLE).find((g) => g.title === 'Other')!;
      expect(other.fields.some((f) => f.label === 'SomethingWeird')).toBe(true);
    });

    it('omits empty groups', () => {
      const groups = groupExifData({ Make: 'Canon' });
      expect(groups.every((g) => g.fields.length > 0)).toBe(true);
      expect(groups.find((g) => g.title === 'Location')).toBeUndefined();
    });

    it('skips null/empty values', () => {
      const groups = groupExifData({ Make: 'Canon', Model: '', Software: null });
      const camera = groups.find((g) => g.title === 'Camera')!;
      expect(camera.fields.map((f) => f.label)).toEqual(['Make']);
    });
  });

  describe('countFields', () => {
    it('counts across groups', () => {
      expect(countFields(groupExifData(SAMPLE))).toBeGreaterThan(5);
      expect(countFields([])).toBe(0);
    });
  });
});
