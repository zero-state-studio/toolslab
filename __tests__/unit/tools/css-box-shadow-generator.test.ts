import {
  hexToRgba,
  clampOpacity,
  shadowLayerToCSS,
  generateBoxShadowCSS,
  defaultLayer,
  BoxShadowLayer,
  BOX_SHADOW_PRESETS,
} from '@/lib/tools/css-box-shadow-generator';

const layer = (over: Partial<BoxShadowLayer> = {}): BoxShadowLayer => ({
  ...defaultLayer(),
  ...over,
});

describe('clampOpacity', () => {
  it('keeps values in range', () => {
    expect(clampOpacity(0.5)).toBe(0.5);
  });
  it('clamps above 1 and below 0', () => {
    expect(clampOpacity(2)).toBe(1);
    expect(clampOpacity(-1)).toBe(0);
  });
  it('rounds to 2 decimals', () => {
    expect(clampOpacity(0.256)).toBe(0.26);
  });
  it('falls back to 1 on NaN', () => {
    expect(clampOpacity(NaN)).toBe(1);
  });
});

describe('hexToRgba', () => {
  it('converts 6-digit hex', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });
  it('expands 3-digit hex', () => {
    expect(hexToRgba('#0f0', 1)).toBe('rgba(0, 255, 0, 1)');
  });
  it('tolerates missing hash', () => {
    expect(hexToRgba('0000ff', 0.8)).toBe('rgba(0, 0, 255, 0.8)');
  });
  it('falls back to black on invalid hex', () => {
    expect(hexToRgba('nope', 0.3)).toBe('rgba(0, 0, 0, 0.3)');
  });
  it('clamps opacity', () => {
    expect(hexToRgba('#000000', 5)).toBe('rgba(0, 0, 0, 1)');
  });
});

describe('shadowLayerToCSS', () => {
  it('renders a basic shadow', () => {
    expect(
      shadowLayerToCSS(
        layer({ offsetX: 2, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.25 })
      )
    ).toBe('2px 2px 4px 0px rgba(0, 0, 0, 0.25)');
  });
  it('prefixes inset', () => {
    expect(
      shadowLayerToCSS(layer({ inset: true, offsetX: 0, offsetY: 2, blur: 6, spread: 0 }))
    ).toBe('inset 0px 2px 6px 0px rgba(0, 0, 0, 0.25)');
  });
  it('handles negative offsets and spread', () => {
    expect(
      shadowLayerToCSS(layer({ offsetX: -3, offsetY: -5, blur: 10, spread: -2 }))
    ).toContain('-3px -5px 10px -2px');
  });
});

describe('generateBoxShadowCSS', () => {
  it('builds a single-layer declaration', () => {
    const r = generateBoxShadowCSS([
      layer({ offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.25 }),
    ]);
    expect(r.success).toBe(true);
    expect(r.value).toBe('0px 4px 12px 0px rgba(0, 0, 0, 0.25)');
    expect(r.declaration).toBe(
      'box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.25);'
    );
  });

  it('comma-joins multiple layers', () => {
    const r = generateBoxShadowCSS([
      layer({ offsetY: 1, blur: 2 }),
      layer({ offsetY: 8, blur: 24, spread: -4 }),
    ]);
    expect(r.value?.match(/rgba\(/g)).toHaveLength(2);
    expect(r.value?.split('), ')).toHaveLength(2);
  });

  it('errors on empty layers', () => {
    expect(generateBoxShadowCSS([]).success).toBe(false);
  });
});

describe('presets', () => {
  it('every preset generates valid CSS', () => {
    for (const p of BOX_SHADOW_PRESETS) {
      const r = generateBoxShadowCSS(p.layers);
      expect(r.success).toBe(true);
      expect(r.declaration).toMatch(/^box-shadow: .+;$/);
    }
  });

  it('includes an inset preset', () => {
    const inset = BOX_SHADOW_PRESETS.find((p) => p.name === 'Inset');
    expect(generateBoxShadowCSS(inset!.layers).value).toContain('inset');
  });
});
