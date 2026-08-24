import {
  isImageFile,
  clampQuality,
  imageExtension,
  mimeForFormat,
  buildOutputName,
  computeResizeDimensions,
  clampToMax,
} from '@/lib/tools/image-tools';

describe('isImageFile', () => {
  it('accepts by mime type', () => {
    expect(isImageFile(new File([''], 'a.png', { type: 'image/png' }))).toBe(true);
  });
  it('accepts by extension when type missing', () => {
    expect(isImageFile(new File([''], 'photo.JPEG', { type: '' }))).toBe(true);
  });
  it('rejects non-images', () => {
    expect(isImageFile(new File([''], 'a.txt', { type: 'text/plain' }))).toBe(false);
  });
});

describe('clampQuality', () => {
  it('keeps in-range values', () => {
    expect(clampQuality(0.7)).toBe(0.7);
  });
  it('clamps high and low', () => {
    expect(clampQuality(2)).toBe(1);
    expect(clampQuality(0)).toBe(0.05);
  });
  it('defaults to 0.8 on NaN', () => {
    expect(clampQuality(NaN)).toBe(0.8);
  });
});

describe('imageExtension & mimeForFormat', () => {
  it('maps jpeg to jpg', () => {
    expect(imageExtension('jpeg')).toBe('jpg');
  });
  it('keeps png and webp', () => {
    expect(imageExtension('png')).toBe('png');
    expect(imageExtension('webp')).toBe('webp');
  });
  it('builds mime', () => {
    expect(mimeForFormat('webp')).toBe('image/webp');
  });
});

describe('buildOutputName', () => {
  it('swaps extension and adds suffix', () => {
    expect(buildOutputName('photo.jpg', 'resized', 'webp')).toBe('photo-resized.webp');
  });
  it('jpeg → jpg', () => {
    expect(buildOutputName('a.png', 'compressed', 'jpeg')).toBe('a-compressed.jpg');
  });
  it('falls back to image for empty base', () => {
    expect(buildOutputName('', 'resized', 'png')).toBe('image-resized.png');
  });
});

describe('computeResizeDimensions', () => {
  it('applies a uniform scale', () => {
    expect(computeResizeDimensions(1000, 500, { scale: 0.5 })).toEqual({
      width: 500,
      height: 250,
    });
  });
  it('width only, keep aspect', () => {
    expect(computeResizeDimensions(1000, 500, { width: 400, keepAspect: true })).toEqual(
      { width: 400, height: 200 }
    );
  });
  it('height only, keep aspect', () => {
    expect(computeResizeDimensions(1000, 500, { height: 100, keepAspect: true })).toEqual(
      { width: 200, height: 100 }
    );
  });
  it('width only, ignore aspect keeps source height', () => {
    expect(computeResizeDimensions(1000, 500, { width: 400, keepAspect: false })).toEqual(
      { width: 400, height: 500 }
    );
  });
  it('both dims with keepAspect fits inside the box', () => {
    expect(
      computeResizeDimensions(1000, 500, { width: 400, height: 400, keepAspect: true })
    ).toEqual({ width: 400, height: 200 });
  });
  it('both dims without keepAspect stretches exactly', () => {
    expect(
      computeResizeDimensions(1000, 500, { width: 400, height: 400, keepAspect: false })
    ).toEqual({ width: 400, height: 400 });
  });
  it('no options returns source size', () => {
    expect(computeResizeDimensions(800, 600, {})).toEqual({ width: 800, height: 600 });
  });
  it('never returns below 1px', () => {
    expect(computeResizeDimensions(1000, 500, { scale: 0.0001 })).toEqual({
      width: 1,
      height: 1,
    });
  });
});

describe('clampToMax', () => {
  it('leaves small images unchanged', () => {
    expect(clampToMax(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
  it('caps the largest side and keeps aspect', () => {
    expect(clampToMax(4000, 2000, 2000)).toEqual({ width: 2000, height: 1000 });
  });
  it('no max is a no-op', () => {
    expect(clampToMax(5000, 5000)).toEqual({ width: 5000, height: 5000 });
  });
});
