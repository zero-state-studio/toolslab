import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToLab,
  labToRgb,
  parseColor,
  getColorValue,
  generateHarmony,
  getContrastRatio,
  checkWCAGCompliance,
  simulateColorBlindness,
  generateTints,
  generateShades,
  mixColors,
  adjustTemperature,
  exportAsCSS,
  exportPalette,
  getTailwindColor,
  getMaterialColor,
  getColorDistance,
  getClosestNamedColor,
  generateGradient,
  isValidColor,
  getColorDescription,
} from '@/lib/tools/color-picker';

describe('Color Picker Tool', () => {
  describe('Color Conversions', () => {
    describe('HEX to RGB', () => {
      it('should convert 6-digit hex to RGB', () => {
        expect(hexToRgb('#FF5733')).toEqual({ r: 255, g: 87, b: 51, a: 1 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
        expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      });

      it('should convert 3-digit hex to RGB', () => {
        expect(hexToRgb('#F53')).toEqual({ r: 255, g: 85, b: 51, a: 1 });
        expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
        expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      });

      it('should handle hex with alpha', () => {
        expect(hexToRgb('#FF5733CC')).toEqual({
          r: 255,
          g: 87,
          b: 51,
          a: 0.8,
        });
      });

      it('should handle hex without #', () => {
        expect(hexToRgb('FF5733')).toEqual({ r: 255, g: 87, b: 51, a: 1 });
      });

      it('should return null for invalid hex', () => {
        expect(hexToRgb('invalid')).toBeNull();
        expect(hexToRgb('#GG5733')).toBeNull();
        expect(hexToRgb('#12345')).toBeNull();
      });
    });

    describe('RGB to HEX', () => {
      it('should convert RGB to hex', () => {
        expect(rgbToHex({ r: 255, g: 87, b: 51 })).toBe('#FF5733');
        expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
        expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
      });

      it('should handle alpha channel', () => {
        expect(rgbToHex({ r: 255, g: 87, b: 51, a: 0.8 })).toBe('#FF5733CC');
      });

      it('should clamp values to valid range', () => {
        expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#FF0080');
      });
    });

    describe('RGB to HSL', () => {
      it('should convert RGB to HSL', () => {
        const hsl = rgbToHsl({ r: 255, g: 87, b: 51 });
        expect(hsl.h).toBeCloseTo(11, 0);
        expect(hsl.s).toBeCloseTo(100, 0);
        expect(hsl.l).toBeCloseTo(60, 0);
      });

      it('should handle grayscale colors', () => {
        const gray = rgbToHsl({ r: 128, g: 128, b: 128 });
        expect(gray.s).toBe(0);
        expect(gray.l).toBeCloseTo(50, 0);
      });
    });

    describe('HSL to RGB', () => {
      it('should convert HSL to RGB', () => {
        const rgb = hslToRgb({ h: 11, s: 100, l: 60 });
        expect(rgb.r).toBeCloseTo(255, -1);
        expect(rgb.g).toBeCloseTo(87, -1);
        expect(rgb.b).toBeCloseTo(51, -1);
      });

      it('should handle grayscale colors', () => {
        const gray = hslToRgb({ h: 0, s: 0, l: 50 });
        expect(gray.r).toBe(gray.g);
        expect(gray.g).toBe(gray.b);
        expect(gray.r).toBeCloseTo(128, 0);
      });
    });

    describe('RGB to HSV', () => {
      it('should convert RGB to HSV', () => {
        const hsv = rgbToHsv({ r: 255, g: 87, b: 51 });
        expect(hsv.h).toBeCloseTo(11, 0);
        expect(hsv.s).toBeCloseTo(80, 0);
        expect(hsv.v).toBeCloseTo(100, 0);
      });
    });

    describe('HSV to RGB', () => {
      it('should convert HSV to RGB', () => {
        const rgb = hsvToRgb({ h: 11, s: 80, v: 100 });
        expect(rgb.r).toBeCloseTo(255, -1);
        expect(rgb.g).toBeCloseTo(87, -1);
        expect(rgb.b).toBeCloseTo(51, -1);
      });
    });

    describe('RGB to CMYK', () => {
      it('should convert RGB to CMYK', () => {
        const cmyk = rgbToCmyk({ r: 255, g: 87, b: 51 });
        expect(cmyk.c).toBe(0);
        expect(cmyk.m).toBeCloseTo(66, 0);
        expect(cmyk.y).toBeCloseTo(80, 0);
        expect(cmyk.k).toBe(0);
      });

      it('should handle black', () => {
        const black = rgbToCmyk({ r: 0, g: 0, b: 0 });
        expect(black.k).toBe(100);
      });
    });

    describe('CMYK to RGB', () => {
      it('should convert CMYK to RGB', () => {
        const rgb = cmykToRgb({ c: 0, m: 66, y: 80, k: 0 });
        expect(rgb.r).toBeCloseTo(255, 0);
        expect(rgb.g).toBeCloseTo(87, 0);
        expect(rgb.b).toBeCloseTo(51, 0);
      });
    });

    describe('RGB to LAB', () => {
      it('should convert RGB to LAB', () => {
        // Ground truth (sRGB D65): RGB(255,87,51) -> LAB(60.2, 62.1, 54.3)
        const lab = rgbToLab({ r: 255, g: 87, b: 51 });
        expect(lab.l).toBeCloseTo(60, -1);
        expect(lab.a).toBeCloseTo(62, -1);
        expect(lab.b).toBeCloseTo(54, -1);
      });
    });

    describe('LAB to RGB', () => {
      it('should convert LAB to RGB', () => {
        // Ground truth (sRGB D65): LAB(60.2, 62.1, 54.3) -> RGB(255,87,51)
        const rgb = labToRgb({ l: 60.2, a: 62.1, b: 54.3 });
        expect(rgb.r).toBeCloseTo(255, -1);
        expect(rgb.g).toBeCloseTo(87, -1);
        expect(rgb.b).toBeCloseTo(51, -1);
      });
    });
  });

  describe('Color Parsing', () => {
    it('should parse hex colors', () => {
      expect(parseColor('#FF5733')).toEqual({ r: 255, g: 87, b: 51, a: 1 });
      expect(parseColor('#F53')).toEqual({ r: 255, g: 85, b: 51, a: 1 });
    });

    it('should parse rgb colors', () => {
      expect(parseColor('rgb(255, 87, 51)')).toEqual({
        r: 255,
        g: 87,
        b: 51,
        a: 1,
      });
      expect(parseColor('rgba(255, 87, 51, 0.5)')).toEqual({
        r: 255,
        g: 87,
        b: 51,
        a: 0.5,
      });
    });

    it('should parse hsl colors', () => {
      const rgb = parseColor('hsl(11, 100%, 60%)');
      expect(rgb?.r).toBeCloseTo(255, -1);
      expect(rgb?.g).toBeCloseTo(87, -1);
      expect(rgb?.b).toBeCloseTo(51, -1);
    });

    it('should parse named colors', () => {
      expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(parseColor('blue')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
      expect(parseColor('cornflowerblue')).toEqual({
        r: 100,
        g: 149,
        b: 237,
        a: 1,
      });
    });

    it('should return null for invalid colors', () => {
      expect(parseColor('invalid')).toBeNull();
      expect(parseColor('notacolor')).toBeNull();
    });
  });

  describe('Color Value', () => {
    it('should get complete color value', () => {
      const color = getColorValue('#FF5733');
      expect(color).not.toBeNull();
      expect(color?.hex).toBe('#FF5733');
      expect(color?.rgb).toEqual({ r: 255, g: 87, b: 51, a: 1 });
      expect(color?.hsl.h).toBeCloseTo(11, -1);
      expect(color?.hsv.s).toBeCloseTo(80, -1);
      expect(color?.cmyk.m).toBeCloseTo(66, -1);
      expect(color?.lab.l).toBeCloseTo(62, -1);
    });

    it('should detect named colors', () => {
      const red = getColorValue('#FF0000');
      expect(red?.name).toBe('red');

      const blue = getColorValue('#0000FF');
      expect(blue?.name).toBe('blue');
    });
  });

  describe('Color Harmony', () => {
    const baseColor = getColorValue('#FF5733')!;

    it('should generate complementary colors', () => {
      const harmony = generateHarmony(baseColor, 'complementary');
      expect(harmony).toHaveLength(2);
      expect(harmony[0]).toBe(baseColor);
      expect(harmony[1].hsl.h).toBeCloseTo((baseColor.hsl.h + 180) % 360, 0);
    });

    it('should generate triadic colors', () => {
      const harmony = generateHarmony(baseColor, 'triadic');
      expect(harmony).toHaveLength(3);
    });

    it('should generate analogous colors', () => {
      const harmony = generateHarmony(baseColor, 'analogous');
      expect(harmony).toHaveLength(3);
    });

    it('should generate split-complementary colors', () => {
      const harmony = generateHarmony(baseColor, 'split-complementary');
      expect(harmony).toHaveLength(3);
    });

    it('should generate tetradic colors', () => {
      const harmony = generateHarmony(baseColor, 'tetradic');
      expect(harmony).toHaveLength(4);
    });

    it('should generate monochromatic colors', () => {
      const harmony = generateHarmony(baseColor, 'monochromatic');
      expect(harmony.length).toBeGreaterThan(1);
      // All should have same hue
      harmony.forEach((color) => {
        expect(color.hsl.h).toBe(baseColor.hsl.h);
      });
    });

    it('should generate custom harmony', () => {
      const harmony = generateHarmony(baseColor, 'custom', [45, 90, 135]);
      expect(harmony).toHaveLength(4);
    });
  });

  describe('WCAG Contrast', () => {
    it('should calculate contrast ratio', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      const ratio = getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should check WCAG compliance', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      const result = checkWCAGCompliance(black, white);

      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.AA.normal).toBe(true);
      expect(result.AA.large).toBe(true);
      expect(result.AAA.normal).toBe(true);
      expect(result.AAA.large).toBe(true);
    });

    it('should fail WCAG for low contrast', () => {
      const lightGray = { r: 200, g: 200, b: 200 };
      const white = { r: 255, g: 255, b: 255 };
      const result = checkWCAGCompliance(lightGray, white);

      expect(result.AA.normal).toBe(false);
      expect(result.AAA.normal).toBe(false);
    });
  });

  describe('Color Blindness Simulation', () => {
    const color = { r: 255, g: 87, b: 51, a: 1 };

    it('should simulate protanopia', () => {
      const simulated = simulateColorBlindness(color, 'protanopia');
      expect(simulated).not.toEqual(color);
      expect(simulated.r).toBeLessThan(color.r);
    });

    it('should simulate deuteranopia', () => {
      const simulated = simulateColorBlindness(color, 'deuteranopia');
      expect(simulated).not.toEqual(color);
    });

    it('should simulate tritanopia', () => {
      const simulated = simulateColorBlindness(color, 'tritanopia');
      expect(simulated).not.toEqual(color);
    });

    it('should not change color for normal vision', () => {
      const simulated = simulateColorBlindness(color, 'normal');
      expect(simulated).toEqual(color);
    });
  });

  describe('Tints and Shades', () => {
    const baseColor = getColorValue('#FF5733')!;

    it('should generate tints', () => {
      const tints = generateTints(baseColor, 5);
      expect(tints).toHaveLength(5);
      tints.forEach((tint) => {
        // Tints should be lighter
        expect(tint.hsl.l).toBeGreaterThan(baseColor.hsl.l);
      });
    });

    it('should generate shades', () => {
      const shades = generateShades(baseColor, 5);
      expect(shades).toHaveLength(5);
      shades.forEach((shade) => {
        // Shades should be darker
        expect(shade.hsl.l).toBeLessThan(baseColor.hsl.l);
      });
    });
  });

  describe('Color Mixing', () => {
    it('should mix two colors', () => {
      const red = getColorValue('#FF0000')!;
      const blue = getColorValue('#0000FF')!;
      const purple = mixColors(red, blue, 0.5);

      expect(purple.rgb.r).toBeCloseTo(128, 0);
      expect(purple.rgb.g).toBe(0);
      expect(purple.rgb.b).toBeCloseTo(128, 0);
    });

    it('should handle different mix ratios', () => {
      const red = getColorValue('#FF0000')!;
      const blue = getColorValue('#0000FF')!;
      const moreRed = mixColors(red, blue, 0.25);
      const moreBlue = mixColors(red, blue, 0.75);

      expect(moreRed.rgb.r).toBeGreaterThan(moreBlue.rgb.r);
      expect(moreBlue.rgb.b).toBeGreaterThan(moreRed.rgb.b);
    });
  });

  describe('Temperature Adjustment', () => {
    const baseColor = getColorValue('#808080')!; // Gray

    it('should make color warmer', () => {
      const warm = adjustTemperature(baseColor, 50);
      expect(warm.rgb.r).toBeGreaterThan(baseColor.rgb.r);
      expect(warm.rgb.b).toBeLessThan(baseColor.rgb.b);
    });

    it('should make color cooler', () => {
      const cool = adjustTemperature(baseColor, -50);
      expect(cool.rgb.r).toBeLessThan(baseColor.rgb.r);
      expect(cool.rgb.b).toBeGreaterThan(baseColor.rgb.b);
    });
  });

  describe('Export Functions', () => {
    const color = getColorValue('#FF5733')!;

    it('should export as CSS', () => {
      expect(exportAsCSS(color, 'hex')).toBe('#FF5733');
      expect(exportAsCSS(color, 'rgb')).toBe('rgb(255, 87, 51)');
      expect(exportAsCSS(color, 'hsl')).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
      expect(exportAsCSS(color, 'css-variable')).toBe(
        '--color-primary: #FF5733;'
      );
      expect(exportAsCSS(color, 'scss')).toBe('$primary-color: #FF5733;');
    });

    it('should export palette as JSON', () => {
      const colors = [color];
      const json = exportPalette(colors, 'json');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].hex).toBe('#FF5733');
    });

    it('should export palette as CSS', () => {
      const colors = [color];
      const css = exportPalette(colors, 'css');
      expect(css).toContain(':root');
      expect(css).toContain('--color-1: #FF5733');
    });

    it('should export palette as Tailwind', () => {
      const colors = [color];
      const tailwind = exportPalette(colors, 'tailwind');
      expect(tailwind).toContain('module.exports');
      expect(tailwind).toContain("'custom-1': '#FF5733'");
    });
  });

  describe('Design System Mapping', () => {
    it('should get Tailwind color', () => {
      const red = getColorValue('#ef4444')!;
      expect(getTailwindColor(red)).toBe('red-500');

      const custom = getColorValue('#123456')!;
      expect(getTailwindColor(custom)).toBeNull();
    });

    it('should get Material Design color', () => {
      const red = getColorValue('#f44336')!;
      expect(getMaterialColor(red)).toBe('red');

      const custom = getColorValue('#123456')!;
      expect(getMaterialColor(custom)).toBeNull();
    });
  });

  describe('Color Distance', () => {
    it('should calculate color distance', () => {
      const red = getColorValue('#FF0000')!;
      const blue = getColorValue('#0000FF')!;
      const distance = getColorDistance(red, blue);
      expect(distance).toBeGreaterThan(0);
    });

    it('should find closest named color', () => {
      const almostRed = getColorValue('#FF0001')!;
      expect(getClosestNamedColor(almostRed)).toBe('red');

      const almostBlue = getColorValue('#0000FE')!;
      expect(getClosestNamedColor(almostBlue)).toBe('blue');
    });
  });

  describe('Gradient Generation', () => {
    it('should generate linear gradient', () => {
      const colors = [getColorValue('#FF0000')!, getColorValue('#0000FF')!];
      const gradient = generateGradient(colors, 'linear', 90);
      expect(gradient).toBe('linear-gradient(90deg, #FF0000, #0000FF)');
    });

    it('should generate radial gradient', () => {
      const colors = [getColorValue('#FF0000')!, getColorValue('#0000FF')!];
      const gradient = generateGradient(colors, 'radial');
      expect(gradient).toBe('radial-gradient(circle, #FF0000, #0000FF)');
    });
  });

  describe('Validation', () => {
    it('should validate color strings', () => {
      expect(isValidColor('#FF5733')).toBe(true);
      expect(isValidColor('rgb(255, 87, 51)')).toBe(true);
      expect(isValidColor('hsl(11, 100%, 60%)')).toBe(true);
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('invalid')).toBe(false);
      expect(isValidColor('#GGGGGG')).toBe(false);
    });
  });

  describe('Color Description', () => {
    it('should describe colors in words', () => {
      const red = getColorValue('#FF0000')!;
      expect(getColorDescription(red)).toContain('red');

      const darkBlue = getColorValue('#000080')!;
      expect(getColorDescription(darkBlue)).toContain('dark');
      expect(getColorDescription(darkBlue)).toContain('blue');

      const gray = getColorValue('#808080')!;
      expect(getColorDescription(gray)).toContain('gray');
    });
  });
});
