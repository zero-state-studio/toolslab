import {
  isHeicFile,
  heicTargetMime,
  heicTargetExtension,
  buildHeicOutputName,
  clampHeicQuality,
} from '@/lib/tools/heic-to-jpg';

describe('HEIC to JPG', () => {
  describe('isHeicFile', () => {
    it('detects by .heic extension (empty type)', () => {
      expect(isHeicFile({ name: 'IMG_1234.HEIC', type: '' })).toBe(true);
      expect(isHeicFile({ name: 'photo.heic' })).toBe(true);
    });

    it('detects by .heif extension', () => {
      expect(isHeicFile({ name: 'photo.heif', type: '' })).toBe(true);
    });

    it('detects by MIME type', () => {
      expect(isHeicFile({ name: 'noext', type: 'image/heic' })).toBe(true);
      expect(isHeicFile({ name: 'x', type: 'image/heif-sequence' })).toBe(true);
    });

    it('rejects non-HEIC files', () => {
      expect(isHeicFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false);
      expect(isHeicFile({ name: 'photo.png', type: 'image/png' })).toBe(false);
      expect(isHeicFile({ name: 'doc.pdf', type: 'application/pdf' })).toBe(false);
    });

    it('is case-insensitive on extension and type', () => {
      expect(isHeicFile({ name: 'A.HeIc', type: 'IMAGE/HEIC' })).toBe(true);
    });
  });

  describe('heicTargetMime', () => {
    it('maps targets to MIME', () => {
      expect(heicTargetMime('jpeg')).toBe('image/jpeg');
      expect(heicTargetMime('png')).toBe('image/png');
    });
  });

  describe('heicTargetExtension', () => {
    it('maps targets to extensions', () => {
      expect(heicTargetExtension('jpeg')).toBe('jpg');
      expect(heicTargetExtension('png')).toBe('png');
    });
  });

  describe('buildHeicOutputName', () => {
    it('swaps the extension for the target', () => {
      expect(buildHeicOutputName('IMG_1234.HEIC', 'jpeg')).toBe('IMG_1234.jpg');
      expect(buildHeicOutputName('photo.heif', 'png')).toBe('photo.png');
    });

    it('falls back to "image" when name has no base', () => {
      expect(buildHeicOutputName('.heic', 'jpeg')).toBe('image.jpg');
    });

    it('handles names without extension', () => {
      expect(buildHeicOutputName('photo', 'jpeg')).toBe('photo.jpg');
    });

    it('preserves dots in the base name', () => {
      expect(buildHeicOutputName('my.photo.v2.heic', 'png')).toBe('my.photo.v2.png');
    });
  });

  describe('clampHeicQuality', () => {
    it('keeps valid values', () => {
      expect(clampHeicQuality(0.5)).toBe(0.5);
    });

    it('clamps out-of-range values', () => {
      expect(clampHeicQuality(2)).toBe(1);
      expect(clampHeicQuality(-1)).toBe(0.1);
    });

    it('defaults on NaN', () => {
      expect(clampHeicQuality(NaN)).toBe(0.9);
    });
  });
});
